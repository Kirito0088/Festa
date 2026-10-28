import { describe, expect, it } from "vitest";
import {
  fallbackConcierge,
  findAmounts,
  pickTargetAmount,
  type FallbackContext,
} from "@/lib/concierge/fallback";
import { previewProposal } from "@/lib/concierge/preview";
import {
  normalizeProposal,
  parseConciergeResponse,
  type ProposedChange,
  type RawChange,
} from "@/lib/concierge/proposal";
import { sumMoney } from "@/lib/money";

describe("amount parsing", () => {
  it("reads Indian and international formats", () => {
    expect(findAmounts("₹1,60,000").map((m) => m.value)).toEqual([160_000]);
    expect(findAmounts("1.6 lakh").map((m) => m.value)).toEqual([160_000]);
    expect(findAmounts("2L budget").map((m) => m.value)).toEqual([200_000]);
    expect(findAmounts("about 160k").map((m) => m.value)).toEqual([160_000]);
    expect(findAmounts("$5,000").map((m) => m.value)).toEqual([5_000]);
    expect(findAmounts("1.2 crore").map((m) => m.value)).toEqual([12_000_000]);
  });

  it("picks the new amount in a 'from X to Y' sentence", () => {
    expect(
      pickTargetAmount("My budget has dropped from ₹2,00,000 to ₹1,60,000. Help me adjust the plan."),
    ).toBe(160_000);
    expect(pickTargetAmount("Cut the budget to 1.5 lakh")).toBe(150_000);
    expect(pickTargetAmount("we have 120 guests")).toBeNull();
  });
});

const ctx: FallbackContext = {
  currency: "INR",
  budget: 200_000,
  guestCount: 120,
  items: [
    { id: "venue", name: "Venue hire", category: "venue", estimated: 42_000, actual: 46_000, paid: 20_000 },
    { id: "food", name: "Catering", category: "catering", estimated: 66_000, actual: null, paid: 0 },
    { id: "decor", name: "Decor", category: "decor", estimated: 28_000, actual: null, paid: 10_000 },
    {
      id: "photo",
      name: "Photography",
      category: "photography",
      estimated: 20_000,
      actual: 18_000,
      paid: 18_000,
    },
    { id: "music", name: "Music", category: "entertainment", estimated: 14_000, actual: null, paid: 0 },
    { id: "buffer", name: "Contingency", category: "other", estimated: 30_000, actual: null, paid: 0 },
  ],
};

describe("fallbackConcierge", () => {
  it("rebalances the plan to fit a lower budget, keeping confirmed costs", () => {
    const { proposal, reply } = fallbackConcierge("Our budget dropped from ₹2,00,000 to ₹1,60,000", ctx);
    expect(proposal).not.toBeNull();
    const changes = proposal!.changes;
    expect(changes[0]).toMatchObject({ type: "set_event_budget", amount: 160_000 });

    const updates = new Map(
      changes
        .filter(
          (c): c is Extract<ProposedChange, { type: "update_budget_item" }> =>
            c.type === "update_budget_item",
        )
        .map((c) => [c.itemId, c.estimated]),
    );
    // Confirmed lines (with an actual cost) are never touched.
    expect(updates.has("venue")).toBe(false);
    expect(updates.has("photo")).toBe(false);
    // Nothing drops below what has already been paid.
    expect(updates.get("decor") ?? 28_000).toBeGreaterThanOrEqual(10_000);

    const preview = previewProposal(changes, {
      budget: ctx.budget,
      guestCount: ctx.guestCount,
      items: ctx.items,
    });
    expect(preview.budgetAfter).toBe(160_000);
    expect(preview.after.committed).toBeLessThanOrEqual(160_000);
    expect(preview.after.isOverBudget).toBe(false);
    expect(reply).toMatch(/₹1,60,000/);
  });

  it("only updates the total when the plan already fits", () => {
    const { proposal } = fallbackConcierge("Increase the budget to ₹3,00,000", ctx);
    expect(proposal?.changes).toEqual([
      expect.objectContaining({ type: "set_event_budget", amount: 300_000 }),
    ]);
  });

  it("scales catering with a new guest count", () => {
    const { proposal } = fallbackConcierge("We're now expecting 60 guests", ctx);
    expect(proposal?.changes).toContainEqual(expect.objectContaining({ type: "set_guest_count", count: 60 }));
    expect(proposal?.changes).toContainEqual(
      expect.objectContaining({ type: "update_budget_item", itemId: "food", estimated: 33_000 }),
    );
  });

  it("explains its limits for other requests", () => {
    const result = fallbackConcierge("Write a poem for the invitation", ctx);
    expect(result.proposal).toBeNull();
    expect(result.reply).toMatch(/offline mode/);
  });

  it("produces exact allocations", () => {
    const { proposal } = fallbackConcierge("budget is now 1,59,999", ctx);
    const preview = previewProposal(proposal!.changes, {
      budget: ctx.budget,
      guestCount: 120,
      items: ctx.items,
    });
    expect(sumMoney([preview.after.committed])).toBeLessThanOrEqual(159_999);
  });
});

const raw = (overrides: Partial<RawChange>): RawChange => ({
  type: "set_event_budget",
  targetId: null,
  category: null,
  label: null,
  amount: null,
  priority: null,
  daysBeforeEvent: null,
  reason: "because",
  ...overrides,
});

describe("normalizeProposal", () => {
  const ids = { budgetItemIds: new Set(["item1"]), taskIds: new Set(["task1"]) };

  it("drops changes that reference unknown records or invalid values", () => {
    const proposal = normalizeProposal(
      {
        title: "Adjust",
        changes: [
          raw({ type: "update_budget_item", targetId: "someone-elses-item", amount: 100 }),
          raw({ type: "update_budget_item", targetId: "item1", amount: -50 }),
          raw({ type: "set_event_budget", amount: Number.POSITIVE_INFINITY }),
          raw({ type: "set_guest_count", amount: 0 }),
          raw({ type: "update_task", targetId: "task1" }),
          raw({ type: "add_task", label: "Book DJ", category: "entertainment", daysBeforeEvent: 30 }),
        ],
      },
      ids,
    );
    expect(proposal?.changes).toEqual([
      expect.objectContaining({ type: "add_task", title: "Book DJ", priority: "medium", offsetDays: 30 }),
    ]);
  });

  it("de-duplicates repeated changes and caps their number", () => {
    const changes = Array.from({ length: 20 }, (_, i) =>
      raw({ type: "add_budget_item", label: `Item ${i % 15}`, category: "decor", amount: 100 }),
    );
    const proposal = normalizeProposal({ title: "Many", changes }, ids);
    expect(proposal?.changes).toHaveLength(12);
  });

  it("returns null when nothing valid remains", () => {
    expect(normalizeProposal({ title: "x", changes: [raw({ amount: null })] }, ids)).toBeNull();
    expect(normalizeProposal(null, ids)).toBeNull();
  });
});

describe("parseConciergeResponse", () => {
  it("validates the model's JSON", () => {
    expect(parseConciergeResponse('{"reply":"Sure","proposal":null}')).toEqual({
      reply: "Sure",
      proposal: null,
    });
    expect(() => parseConciergeResponse("{oops")).toThrow(/malformed/);
    expect(() => parseConciergeResponse('{"reply":"  ","proposal":null}')).toThrow(/empty/);
    expect(() =>
      parseConciergeResponse(
        '{"reply":"x","proposal":{"title":"t","changes":[{"type":"delete_everything"}]}}',
      ),
    ).toThrow();
  });
});

describe("previewProposal", () => {
  it("previews adding a budget item and tasks without breaking calculations", () => {
    const changes: ProposedChange[] = [
      {
        type: "set_event_budget",
        amount: 150_000,
        reason: "Budget adjustment",
      },
      {
        type: "set_guest_count",
        count: 75,
        reason: "More RSVPs",
      },
      {
        type: "update_budget_item",
        itemId: "i1",
        estimated: 35_000,
        reason: "Venue pricing change",
      },
      {
        type: "add_budget_item",
        name: "Late night snacks",
        category: "catering",
        estimated: 12_000,
        reason: "For dancing",
      },
      {
        type: "add_task",
        title: "Order midnight chai",
        category: "catering",
        priority: "medium",
        offsetDays: 2,
        reason: "Warm drinks",
      },
      {
        type: "update_task",
        taskId: "task1",
        priority: "high",
        offsetDays: 5,
        reason: "Earlier deadline",
      },
    ];

    const preview = previewProposal(changes, {
      budget: 100_000,
      guestCount: 50,
      items: [{ id: "i1", category: "venue", estimated: 30_000, actual: null, paid: 0 }],
    });

    expect(preview.after.committed).toBe(47_000);
    expect(preview.budgetAfter).toBe(150_000);
    expect(preview.guestsAfter).toBe(75);
  });
});
