import { z } from "zod";
import { CATEGORIES, LIMITS, PRIORITIES } from "../constants";

/**
 * Shape the model must return for a celebration blueprint. Money is never
 * requested as an amount: the model proposes percentages and the app turns
 * them into currency deterministically.
 */
export const blueprintSchema = z.object({
  concept: z.object({
    title: z.string(),
    tagline: z.string(),
    summary: z.string(),
    theme: z.string(),
  }),
  palette: z.array(z.object({ name: z.string(), hex: z.string() })),
  budget: z.array(
    z.object({
      category: z.enum(CATEGORIES),
      label: z.string(),
      percent: z.number(),
      note: z.string(),
    }),
  ),
  tasks: z.array(
    z.object({
      title: z.string(),
      category: z.enum(CATEGORIES),
      priority: z.enum(PRIORITIES),
      daysBeforeEvent: z.number().int(),
      note: z.string(),
    }),
  ),
  vendors: z.array(
    z.object({
      category: z.enum(CATEGORIES),
      title: z.string(),
      why: z.string(),
      bookByDaysBefore: z.number().int(),
    }),
  ),
  decor: z.array(z.string()),
  food: z.array(z.string()),
  entertainment: z.array(z.string()),
  risks: z.array(z.object({ risk: z.string(), mitigation: z.string() })),
  recommendations: z.array(z.string()),
});

export type Blueprint = z.infer<typeof blueprintSchema>;

export class BlueprintValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlueprintValidationError";
  }
}

const HEX = /^#?([0-9a-f]{6})$/i;

function clean(text: string, max: number): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > max ? `${collapsed.slice(0, max - 1).trimEnd()}…` : collapsed;
}

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function cleanList(items: string[], max: number): string[] {
  return uniqueBy(items.map((item) => clean(item, 200)).filter(Boolean), (item) => item.toLowerCase()).slice(
    0,
    max,
  );
}

function clampDays(days: number): number {
  if (!Number.isFinite(days)) return 0;
  return Math.min(LIMITS.offsetDaysMax, Math.max(0, Math.round(days)));
}

/**
 * Sanitizes and normalizes a schema-valid blueprint: trims text, drops malformed colors and
 * non-positive shares, de-duplicates entities, caps list sizes, and clamps task deadlines.
 *
 * @param raw - Validated blueprint from LLM output.
 * @returns Cleaned, constrained blueprint ready for database storage.
 * @throws {BlueprintValidationError} When insufficient valid content survives normalization.
 */
export function normalizeBlueprint(raw: Blueprint): Blueprint {
  const palette = uniqueBy(
    raw.palette.flatMap((swatch) => {
      const match = HEX.exec(swatch.hex.trim());
      if (!match) return [];
      return [{ name: clean(swatch.name, 40) || "Accent", hex: `#${match[1].toUpperCase()}` }];
    }),
    (swatch) => swatch.hex,
  ).slice(0, 6);

  const budget = uniqueBy(
    raw.budget
      .filter((line) => Number.isFinite(line.percent) && line.percent > 0)
      .map((line) => ({
        category: line.category,
        label: clean(line.label, 80),
        percent: Math.min(100, line.percent),
        note: clean(line.note, 240),
      }))
      .filter((line) => line.label),
    (line) => `${line.category}:${line.label.toLowerCase()}`,
  ).slice(0, 14);

  const tasks = uniqueBy(
    raw.tasks
      .map((task) => ({
        title: clean(task.title, 120),
        category: task.category,
        priority: task.priority,
        daysBeforeEvent: clampDays(task.daysBeforeEvent),
        note: clean(task.note, 240),
      }))
      .filter((task) => task.title),
    (task) => task.title.toLowerCase(),
  ).slice(0, 40);

  const vendors = uniqueBy(
    raw.vendors
      .map((vendor) => ({
        category: vendor.category,
        title: clean(vendor.title, 80),
        why: clean(vendor.why, 240),
        bookByDaysBefore: clampDays(vendor.bookByDaysBefore),
      }))
      .filter((vendor) => vendor.title),
    (vendor) => vendor.title.toLowerCase(),
  ).slice(0, 12);

  const risks = uniqueBy(
    raw.risks
      .map((r) => ({ risk: clean(r.risk, 160), mitigation: clean(r.mitigation, 240) }))
      .filter((r) => r.risk && r.mitigation),
    (r) => r.risk.toLowerCase(),
  ).slice(0, 6);

  const concept = {
    title: clean(raw.concept.title, 100),
    tagline: clean(raw.concept.tagline, 160),
    summary: clean(raw.concept.summary, 700),
    theme: clean(raw.concept.theme, 80),
  };

  if (!concept.title) throw new BlueprintValidationError("Blueprint has no concept title");
  if (budget.length < 3) throw new BlueprintValidationError("Blueprint has fewer than 3 budget lines");
  if (tasks.length < 5) throw new BlueprintValidationError("Blueprint has fewer than 5 tasks");

  return {
    concept,
    palette,
    budget,
    tasks,
    vendors,
    decor: cleanList(raw.decor, 8),
    food: cleanList(raw.food, 8),
    entertainment: cleanList(raw.entertainment, 8),
    risks,
    recommendations: cleanList(raw.recommendations, 8),
  };
}

/** Parses model output text into a normalized blueprint, or throws. */
export function parseBlueprint(text: string): Blueprint {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new BlueprintValidationError("Model returned malformed JSON");
  }
  const result = blueprintSchema.safeParse(data);
  if (!result.success) {
    throw new BlueprintValidationError(
      `Model output did not match the blueprint schema: ${result.error.issues[0]?.message ?? "unknown issue"}`,
    );
  }
  return normalizeBlueprint(result.data);
}
