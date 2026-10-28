import { describe, expect, it } from "vitest";
import { daySchedule, isScheduleTime, scheduleSortKey } from "@/lib/plan/run-sheet";

describe("daySchedule", () => {
  it("builds an evening run sheet in order, from setup to pack-up", () => {
    const sheet = daySchedule({
      type: "engagement",
      activities: ["Speeches", "Ring ceremony", "Photo booth"],
      guestCount: 120,
    });
    const titles = sheet.map((item) => item.title);
    expect(titles[0]).toMatch(/setup/i);
    expect(titles).toContain("Ring ceremony");
    expect(titles).toContain("Speeches");
    expect(titles.at(-1)).toMatch(/pack up/i);
    // Activities follow the planner's natural order, not the order they were ticked.
    expect(titles.indexOf("Ring ceremony")).toBeLessThan(titles.indexOf("Speeches"));
    // Times only move forward.
    const times = sheet.map((item) => item.time);
    expect(times.toSorted((a, b) => scheduleSortKey(a).localeCompare(scheduleSortKey(b)))).toEqual(times);
    expect(times.every(isScheduleTime)).toBe(true);
    // Evening celebrations welcome guests in the evening.
    expect(sheet.find((item) => /guests arrive/i.test(item.title))?.time).toBe("18:00");
  });

  it("keeps all-day touches as notes rather than time slots", () => {
    const sheet = daySchedule({ type: "birthday", activities: ["Photo booth"], guestCount: 40 });
    expect(sheet.some((item) => item.title === "Photo booth")).toBe(false);
    expect(sheet.find((item) => /guests arrive/i.test(item.title))?.notes).toMatch(/photo booth/i);
  });

  it("adds a meal sized for the guest list", () => {
    const sheet = daySchedule({ type: "wedding", activities: ["Pheras", "Reception"], guestCount: 250 });
    const meal = sheet.find((item) => /dinner/i.test(item.title));
    expect(meal?.notes).toMatch(/3 serving counters/);
  });

  it("starts daytime celebrations in the morning and leaves pre-wedding days out", () => {
    expect(daySchedule({ type: "baby-shower", activities: [], guestCount: 30 })[0].time < "12:00").toBe(true);
    const wedding = daySchedule({
      type: "wedding",
      activities: ["Mehendi", "Haldi", "Pheras"],
      guestCount: 100,
    });
    expect(wedding.some((item) => item.title === "Mehendi" || item.title === "Haldi")).toBe(false);
  });

  it("handles empty activities gracefully with core schedule and appropriate meal", () => {
    const eveningSheet = daySchedule({ type: "anniversary", activities: [], guestCount: 50 });
    expect(eveningSheet.some((i) => /dinner is served/i.test(i.title))).toBe(true);
    expect(eveningSheet.some((i) => /guests arrive/i.test(i.title))).toBe(true);

    const communitySheet = daySchedule({ type: "community", activities: [], guestCount: 150 });
    expect(communitySheet.some((i) => /lunch is served/i.test(i.title))).toBe(true);
    expect(communitySheet.find((i) => /lunch/i.test(i.title))?.notes).toMatch(/2 serving counters/);
  });

  it("does not insert duplicate dinner when dinner is already an explicit activity", () => {
    const sheet = daySchedule({
      type: "corporate",
      activities: ["Keynote", "Awards", "Dinner", "Networking"],
      guestCount: 200,
    });
    const dinnerOccurrences = sheet.filter((i) => /dinner/i.test(i.title));
    expect(dinnerOccurrences).toHaveLength(1);
  });

  it("calculates buffet serving counters accurately based on guest count scale", () => {
    const single = daySchedule({ type: "birthday", activities: [], guestCount: 1 });
    expect(single.find((i) => /dinner/i.test(i.title))?.notes).toMatch(/1 serving counter\./);

    const hundred = daySchedule({ type: "birthday", activities: [], guestCount: 100 });
    expect(hundred.find((i) => /dinner/i.test(i.title))?.notes).toMatch(/1 serving counter\./);

    const hundredOne = daySchedule({ type: "birthday", activities: [], guestCount: 101 });
    expect(hundredOne.find((i) => /dinner/i.test(i.title))?.notes).toMatch(/2 serving counters\./);

    const large = daySchedule({ type: "birthday", activities: [], guestCount: 550 });
    expect(large.find((i) => /dinner/i.test(i.title))?.notes).toMatch(/6 serving counters\./);
  });
});

describe("isScheduleTime", () => {
  it("accepts 24-hour HH:MM only", () => {
    expect(isScheduleTime("09:30")).toBe(true);
    expect(isScheduleTime("23:59")).toBe(true);
    expect(isScheduleTime("24:00")).toBe(false);
    expect(isScheduleTime("9:30")).toBe(false);
    expect(isScheduleTime("09:60")).toBe(false);
  });
});

describe("scheduleSortKey", () => {
  it("keeps after-midnight items at the end of the night", () => {
    const times = ["00:30", "18:00", "23:45", "04:59", "05:00"];
    expect(times.toSorted((a, b) => scheduleSortKey(a).localeCompare(scheduleSortKey(b)))).toEqual([
      "05:00",
      "18:00",
      "23:45",
      "00:30",
      "04:59",
    ]);
  });
});
