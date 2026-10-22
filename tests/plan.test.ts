import { describe, expect, it } from "vitest";
import { blueprintSchema, parseBlueprint } from "@/lib/ai/blueprint";
import { EVENT_TYPES } from "@/lib/constants";
import { daysBetween } from "@/lib/dates";
import { sumMoney } from "@/lib/money";
import { materializePlan } from "@/lib/plan/materialize";
import { templateBlueprint, type PlanInput } from "@/lib/plan/template";

const base: PlanInput = {
  type: "birthday",
  name: "Ananya turns 30",
  date: "2027-03-20",
  city: "Bengaluru",
  venue: "Restaurant",
  guestCount: 60,
  budget: 150_000,
  currency: "INR",
  styles: ["Playful"],
  atmosphere: "Fun, lots of dancing",
  foodPreferences: ["Vegan"],
  activities: ["Cake cutting", "DJ night"],
  notes: "",
};

describe("templateBlueprint", () => {
  it.each(EVENT_TYPES)("produces a valid plan for %s", (type) => {
    const blueprint = templateBlueprint({ ...base, type });
    expect(blueprintSchema.safeParse(blueprint).success).toBe(true);
    // The template's shares always add up to 100%.
    expect(blueprint.budget.reduce((total, line) => total + line.percent, 0)).toBe(100);
    // And it survives the same validation path as AI output.
    expect(() => parseBlueprint(JSON.stringify(blueprint))).not.toThrow();
  });

  it("reflects the brief", () => {
    const blueprint = templateBlueprint(base);
    expect(blueprint.concept.title).toContain("Bengaluru");
    expect(blueprint.tasks.some((task) => task.title.includes("dj night"))).toBe(true);
    expect(blueprint.tasks.some((task) => task.title.includes("Vegan"))).toBe(true);
  });

  it("adds weather and crowd risks when relevant", () => {
    const blueprint = templateBlueprint({ ...base, venue: "Garden or lawn", guestCount: 400 });
    const risks = blueprint.risks.map((r) => r.risk).join(" ");
    expect(risks).toMatch(/Rain or heat/);
    expect(risks).toMatch(/Crowding/);
  });
});

describe("materializePlan", () => {
  it("turns shares into amounts that add up to the exact budget", () => {
    for (const budget of [150_000, 2_000_000, 123_457, 9_999.5]) {
      const plan = materializePlan(templateBlueprint(base), { budget, date: base.date }, "2026-10-20");
      expect(sumMoney(plan.budgetItems.map((item) => item.estimated))).toBe(budget);
    }
  });

  it("orders tasks earliest-first and never before today", () => {
    const today = "2027-03-01"; // 19 days before the event
    const plan = materializePlan(templateBlueprint(base), base, today);
    const offsets = plan.tasks.map((task) => task.offsetDays);
    expect([...offsets].sort((a, b) => b - a)).toEqual(offsets);
    expect(Math.max(...offsets)).toBeLessThanOrEqual(daysBetween(today, base.date));
  });
});
