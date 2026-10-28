import { z } from "zod";
import { CATEGORIES, LIMITS, PRIORITIES, type Category, type Priority } from "../constants";

/**
 * The concierge never edits data directly. It returns a reply plus an
 * optional proposal made of the change types below. Proposals are validated
 * here, shown to the user, and only applied through backend mutations after
 * the user approves them. There is deliberately no "delete" change type.
 */

export const CHANGE_TYPES = [
  "set_event_budget",
  "set_guest_count",
  "update_budget_item",
  "add_budget_item",
  "add_task",
  "update_task",
] as const;

/** Flat, nullable shape that is easy for models to fill reliably. */
export const rawChangeSchema = z.object({
  type: z.enum(CHANGE_TYPES),
  targetId: z.string().nullable(),
  category: z.enum(CATEGORIES).nullable(),
  label: z.string().nullable(),
  amount: z.number().nullable(),
  priority: z.enum(PRIORITIES).nullable(),
  daysBeforeEvent: z.number().int().nullable(),
  reason: z.string(),
});

export const conciergeResponseSchema = z.object({
  reply: z.string(),
  proposal: z
    .object({
      title: z.string(),
      changes: z.array(rawChangeSchema),
    })
    .nullable(),
});

export type RawChange = z.infer<typeof rawChangeSchema>;
export type ConciergeResponse = z.infer<typeof conciergeResponseSchema>;

export type ProposedChange =
  | { type: "set_event_budget"; amount: number; reason: string }
  | { type: "set_guest_count"; count: number; reason: string }
  | { type: "update_budget_item"; itemId: string; estimated: number; reason: string }
  | { type: "add_budget_item"; category: Category; name: string; estimated: number; reason: string }
  | {
      type: "add_task";
      title: string;
      category: Category;
      priority: Priority;
      offsetDays: number;
      reason: string;
    }
  | {
      type: "update_task";
      taskId: string;
      priority: Priority | null;
      offsetDays: number | null;
      reason: string;
    };

export type Proposal = { title: string; changes: ProposedChange[] };

export type ProposalContext = {
  budgetItemIds: ReadonlySet<string>;
  taskIds: ReadonlySet<string>;
};

const MAX_CHANGES = 12;

function text(value: string | null, max: number): string {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function money(value: number | null): number | null {
  if (value === null || !Number.isFinite(value) || value < 0 || value > LIMITS.moneyMax) return null;
  return Math.round(value * 100) / 100;
}

function offset(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.min(LIMITS.offsetDaysMax, Math.max(0, Math.round(value)));
}

/**
 * Converts one raw change suggested by the AI into a strictly validated change, or `null` to drop it.
 *
 * @param raw - Unverified change object from LLM output.
 * @param ctx - Context containing known valid budgetItemIds and taskIds.
 * @returns Fully validated ProposedChange, or null if invalid or references missing records.
 */
export function normalizeChange(raw: RawChange, ctx: ProposalContext): ProposedChange | null {
  const reason = text(raw.reason, 280);
  switch (raw.type) {
    case "set_event_budget": {
      const amount = money(raw.amount);
      return amount === null || amount === 0 ? null : { type: raw.type, amount, reason };
    }
    case "set_guest_count": {
      const count = raw.amount === null ? null : Math.round(raw.amount);
      if (count === null || !Number.isFinite(count) || count < 1 || count > LIMITS.guestsMax) return null;
      return { type: raw.type, count, reason };
    }
    case "update_budget_item": {
      const estimated = money(raw.amount);
      if (!raw.targetId || !ctx.budgetItemIds.has(raw.targetId) || estimated === null) return null;
      return { type: raw.type, itemId: raw.targetId, estimated, reason };
    }
    case "add_budget_item": {
      const estimated = money(raw.amount);
      const name = text(raw.label, LIMITS.nameMax);
      if (!name || !raw.category || estimated === null) return null;
      return { type: raw.type, category: raw.category, name, estimated, reason };
    }
    case "add_task": {
      const title = text(raw.label, LIMITS.nameMax);
      const offsetDays = offset(raw.daysBeforeEvent);
      if (!title || !raw.category || offsetDays === null) return null;
      return {
        type: raw.type,
        title,
        category: raw.category,
        priority: raw.priority ?? "medium",
        offsetDays,
        reason,
      };
    }
    case "update_task": {
      if (!raw.targetId || !ctx.taskIds.has(raw.targetId)) return null;
      const offsetDays = offset(raw.daysBeforeEvent);
      if (raw.priority === null && offsetDays === null) return null;
      return { type: raw.type, taskId: raw.targetId, priority: raw.priority, offsetDays, reason };
    }
  }
}

function changeKey(change: ProposedChange): string {
  switch (change.type) {
    case "set_event_budget":
    case "set_guest_count":
      return change.type;
    case "update_budget_item":
      return `${change.type}:${change.itemId}`;
    case "update_task":
      return `${change.type}:${change.taskId}`;
    case "add_budget_item":
      return `${change.type}:${change.name.toLowerCase()}`;
    case "add_task":
      return `${change.type}:${change.title.toLowerCase()}`;
  }
}

/**
 * Validates a model proposal against the event's real records. Unknown IDs,
 * negative money and malformed values are dropped; duplicates keep the last
 * suggestion. Returns `null` when nothing valid remains.
 *
 * @param raw - Raw proposal from LLM output.
 * @param ctx - Context containing known budgetItemIds and taskIds.
 * @returns Sanitized Proposal with deduplicated, valid changes, or null.
 */
export function normalizeProposal(raw: ConciergeResponse["proposal"], ctx: ProposalContext): Proposal | null {
  if (!raw) return null;
  const byKey = new Map<string, ProposedChange>();
  for (const change of raw.changes) {
    const normalized = normalizeChange(change, ctx);
    if (normalized) byKey.set(changeKey(normalized), normalized);
  }
  const changes = [...byKey.values()].slice(0, MAX_CHANGES);
  if (changes.length === 0) return null;
  return { title: text(raw.title, 120) || "Suggested changes", changes };
}

/**
 * Parses and schema-validates raw text output from the Concierge LLM.
 *
 * @param textValue - Raw JSON string from the LLM.
 * @returns Validated ConciergeResponse object.
 * @throws Error if the string is malformed JSON or fails schema validation.
 */
export function parseConciergeResponse(textValue: string): ConciergeResponse {
  let data: unknown;
  try {
    data = JSON.parse(textValue);
  } catch {
    throw new Error("Model returned malformed JSON");
  }
  const parsed = conciergeResponseSchema.parse(data);
  const reply = parsed.reply.trim();
  if (!reply) throw new Error("Model returned an empty reply");
  return { ...parsed, reply: reply.slice(0, 4000) };
}
