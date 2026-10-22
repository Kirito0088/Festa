import { CATEGORY_LABELS, type Category } from "../constants";
import { allocateByWeights, formatMoney, sumMoney, toMinor } from "../money";
import type { Proposal, ProposedChange } from "./proposal";

/**
 * Festa's offline concierge. When the AI provider is unavailable it still
 * handles the most common requests — a new budget or a new guest count —
 * with deterministic arithmetic, and says plainly what it cannot do.
 */

export type FallbackItem = {
  id: string;
  name: string;
  category: string;
  estimated: number;
  actual: number | null;
  paid: number;
};

export type FallbackContext = {
  currency: string;
  budget: number;
  guestCount: number;
  items: readonly FallbackItem[];
};

export type FallbackReply = { reply: string; proposal: Proposal | null };

type AmountMention = { value: number; index: number; explicit: boolean };

const MULTIPLIERS: Array<[RegExp, number]> = [
  [/^(crores?|cr)$/i, 10_000_000],
  [/^(lakhs?|lacs?|l)$/i, 100_000],
  [/^(millions?|m|mn)$/i, 1_000_000],
  [/^(thousand|k)$/i, 1_000],
];

const AMOUNT_PATTERN =
  /(₹|\$|€|£|\brs\.?|\binr|\busd|\beur|\bgbp)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|l|millions?|mn|m|thousand|k)?\b/gi;

/** Finds money-like amounts: "₹1,60,000", "1.6 lakh", "2L", "160k", "$5,000". */
export function findAmounts(message: string): AmountMention[] {
  const mentions: AmountMention[] = [];
  for (const match of message.matchAll(AMOUNT_PATTERN)) {
    const [, symbol, digits, unit] = match;
    const base = Number(digits.replaceAll(",", ""));
    if (!Number.isFinite(base)) continue;
    const multiplier = unit ? (MULTIPLIERS.find(([pattern]) => pattern.test(unit))?.[1] ?? 1) : 1;
    mentions.push({
      value: Math.round(base * multiplier * 100) / 100,
      index: match.index ?? 0,
      explicit: Boolean(symbol || unit || digits.includes(",")),
    });
  }
  return mentions;
}

/** Picks the target budget: the amount after "to", else the last plausible amount. */
export function pickTargetAmount(message: string): number | null {
  const mentions = findAmounts(message).filter((m) => m.explicit || m.value >= 1000);
  if (mentions.length === 0) return null;
  const toIndex = message.toLowerCase().lastIndexOf(" to ");
  const afterTo = toIndex >= 0 ? mentions.find((m) => m.index > toIndex) : undefined;
  return (afterTo ?? mentions[mentions.length - 1]).value;
}

function pickGuestCount(message: string): number | null {
  const match = /(\d{1,6})\s*(guests?|people|pax|persons?|attendees)/i.exec(message);
  if (!match) return null;
  const count = Number(match[1]);
  return count >= 1 ? count : null;
}

const MAX_ITEM_CHANGES = 11;

export function rescaleBudget(newBudget: number, ctx: FallbackContext): FallbackReply {
  const fmt = (amount: number) => formatMoney(amount, ctx.currency);
  const locked = ctx.items.filter((item) => item.actual !== null);
  const flexible = ctx.items.filter((item) => item.actual === null && item.estimated > 0);
  const lockedTotal = sumMoney(locked.map((item) => item.actual ?? 0));
  const flexibleTotal = sumMoney(flexible.map((item) => item.estimated));
  const target = Math.max(0, newBudget - lockedTotal);

  const changes: ProposedChange[] = [
    {
      type: "set_event_budget",
      amount: newBudget,
      reason: `New total budget of ${fmt(newBudget)}.`,
    },
  ];

  if (toMinor(flexibleTotal) <= toMinor(target)) {
    return {
      reply: `Your current plan already fits within ${fmt(newBudget)}: confirmed costs are ${fmt(lockedTotal)} and open estimates add up to ${fmt(flexibleTotal)}. I've only proposed updating the total, so you keep ${fmt(target - flexibleTotal)} of headroom.`,
      proposal: { title: `Set the budget to ${fmt(newBudget)}`, changes },
    };
  }

  const allocations = allocateByWeights(
    target,
    flexible.map((item) => item.estimated),
  );
  const reductions = flexible
    .map((item, index) => ({
      item,
      // Never propose an estimate below what has already been paid.
      estimated: Math.max(allocations[index], item.paid),
    }))
    .filter(({ item, estimated }) => toMinor(estimated) !== toMinor(item.estimated))
    .sort((a, b) => b.item.estimated - b.estimated - (a.item.estimated - a.estimated));

  for (const { item, estimated } of reductions.slice(0, MAX_ITEM_CHANGES)) {
    changes.push({
      type: "update_budget_item",
      itemId: item.id,
      estimated,
      reason: `Scaled from ${fmt(item.estimated)} to keep proportions.`,
    });
  }

  const cut = flexibleTotal > 0 ? Math.round((1 - target / flexibleTotal) * 100) : 0;
  const biggest = [...flexible]
    .sort((a, b) => b.estimated - a.estimated)
    .slice(0, 2)
    .map((item) => CATEGORY_LABELS[item.category as Category] ?? item.category);

  const tradeOff = biggest.length
    ? ` The biggest savings come from ${biggest.join(" and ").toLowerCase()}; if you'd rather protect those, trim the guest list or decor instead and I'll rebalance.`
    : "";

  return {
    reply: `To fit ${fmt(newBudget)}, I kept the ${locked.length} cost${locked.length === 1 ? "" : "s"} you've already confirmed (${fmt(lockedTotal)}) and scaled the remaining estimates down by about ${cut}%, keeping their proportions.${tradeOff}${
      reductions.length > MAX_ITEM_CHANGES
        ? ` I've listed the ${MAX_ITEM_CHANGES} largest adjustments; adjust the rest in Budget Studio.`
        : ""
    }`,
    proposal: { title: `Fit the plan to ${fmt(newBudget)}`, changes },
  };
}

export function fallbackConcierge(message: string, ctx: FallbackContext): FallbackReply {
  const lower = message.toLowerCase();

  if (/(budget|spend|afford|cut|reduce|lower|increase|raise|dropped|down to|up to)/.test(lower)) {
    const target = pickTargetAmount(message);
    if (target !== null && target > 0) return rescaleBudget(target, ctx);
  }

  const guests = pickGuestCount(message);
  if (guests !== null && guests !== ctx.guestCount) {
    const changes: ProposedChange[] = [
      { type: "set_guest_count", count: guests, reason: `Update the headcount to ${guests}.` },
    ];
    const catering = ctx.items.filter((item) => item.category === "catering" && item.actual === null);
    for (const item of catering) {
      const scaled = Math.round((item.estimated * guests) / Math.max(1, ctx.guestCount));
      changes.push({
        type: "update_budget_item",
        itemId: item.id,
        estimated: scaled,
        reason: "Catering is usually priced per guest, so it scales with the headcount.",
      });
    }
    return {
      reply: `I can update the headcount to ${guests}. Catering is usually priced per plate, so I've scaled open catering estimates in proportion. Venue capacity and seating may also need a check.`,
      proposal: { title: `Plan for ${guests} guests`, changes },
    };
  }

  return {
    reply:
      'The AI concierge is unavailable right now, so I\'m running in offline mode. I can still rebalance the plan for a new budget ("Our budget is now ₹1,60,000") or a new guest count ("We\'re expecting 80 guests"). Everything else in Festa works as usual.',
    proposal: null,
  };
}
