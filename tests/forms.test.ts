import { describe, expect, it } from "vitest";
import { wizardSchema, type WizardValues } from "@/components/events/wizard/wizard-schema";
import { scheduleSchema } from "@/components/timeline/schedule-schema";
import { shiftIsoDate, toIsoDate } from "@/lib/dates";

const today = toIsoDate(new Date());

const valid: WizardValues = {
  type: "engagement",
  name: "Meera & Kabir's Engagement",
  date: shiftIsoDate(today, 60),
  city: "Jaipur",
  venue: "Heritage property",
  budget: 200_000,
  currency: "INR",
  guestCount: 120,
  styles: ["Traditional"],
  atmosphere: "Warm",
  foodPreferences: ["Vegetarian"],
  activities: ["Ring ceremony"],
  notes: "",
  useAI: true,
};

function firstError(result: ReturnType<typeof wizardSchema.safeParse>, field: string) {
  return result.success ? undefined : result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("wizardSchema", () => {
  it("accepts a complete brief", () => {
    expect(wizardSchema.safeParse(valid).success).toBe(true);
  });

  it("explains each problem in plain words", () => {
    expect(firstError(wizardSchema.safeParse({ ...valid, name: " " }), "name")).toBe(
      "Give your celebration a name.",
    );
    expect(firstError(wizardSchema.safeParse({ ...valid, date: shiftIsoDate(today, -1) }), "date")).toBe(
      "Choose today or a future date.",
    );
    expect(firstError(wizardSchema.safeParse({ ...valid, date: "soon" }), "date")).toBe("Choose a date.");
    expect(firstError(wizardSchema.safeParse({ ...valid, budget: 0 }), "budget")).toBe(
      "Budget must be more than zero.",
    );
    expect(firstError(wizardSchema.safeParse({ ...valid, budget: Number.NaN }), "budget")).toBe(
      "Enter a budget.",
    );
    expect(firstError(wizardSchema.safeParse({ ...valid, guestCount: 12.5 }), "guestCount")).toBe(
      "Use a whole number.",
    );
    expect(firstError(wizardSchema.safeParse({ ...valid, guestCount: 0 }), "guestCount")).toBe(
      "At least one guest.",
    );
    expect(firstError(wizardSchema.safeParse({ ...valid, styles: Array(7).fill("x") }), "styles")).toBe(
      "Choose up to 6 styles.",
    );
  });

  it("accepts today as the date and trims text", () => {
    const parsed = wizardSchema.parse({ ...valid, date: today, name: "  Diya's 30th  " });
    expect(parsed.name).toBe("Diya's 30th");
  });
});

describe("scheduleSchema", () => {
  it("needs a 24-hour time and a title", () => {
    expect(scheduleSchema.safeParse({ time: "18:30", title: "Couple's entry", notes: "" }).success).toBe(
      true,
    );
    const bad = scheduleSchema.safeParse({ time: "", title: "  ", notes: "" });
    expect(bad.success).toBe(false);
    const messages = bad.success ? [] : bad.error.issues.map((issue) => issue.message);
    expect(messages).toContain("Choose a time, such as 18:30.");
    expect(messages).toContain("Say what happens at this time.");
  });
});
