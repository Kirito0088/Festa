import { describe, expect, it } from "vitest";
import {
  clampOffsetDays,
  countdownTo,
  deadlineState,
  describeOffset,
  formatIsoDate,
  isIsoDate,
  resolveDueDate,
  shiftIsoDate,
} from "@/lib/dates";
import { googleCalendarUrl, googleMapsSearchUrl } from "@/lib/google";

describe("isIsoDate", () => {
  it("accepts real calendar dates only", () => {
    expect(isIsoDate("2027-02-14")).toBe(true);
    expect(isIsoDate("2027-02-30")).toBe(false);
    expect(isIsoDate("14/02/2027")).toBe(false);
    expect(isIsoDate("")).toBe(false);
  });
});

describe("resolveDueDate", () => {
  it("measures relative deadlines back from the event", () => {
    expect(resolveDueDate({ dueMode: "relative", offsetDays: 30 }, "2027-03-01")).toBe("2027-01-30");
    expect(resolveDueDate({ dueMode: "relative", offsetDays: 0 }, "2027-03-01")).toBe("2027-03-01");
  });

  it("moves relative deadlines when the event date changes", () => {
    const task = { dueMode: "relative" as const, offsetDays: 7 };
    expect(resolveDueDate(task, "2027-03-01")).toBe("2027-02-22");
    expect(resolveDueDate(task, "2027-04-01")).toBe("2027-03-25");
  });

  it("returns fixed dates as-is and null when there is no deadline", () => {
    expect(resolveDueDate({ dueMode: "fixed", dueDate: "2027-01-05" }, "2027-03-01")).toBe("2027-01-05");
    expect(resolveDueDate({ dueMode: "none" }, "2027-03-01")).toBeNull();
  });

  it("crosses month and leap-year boundaries correctly", () => {
    expect(shiftIsoDate("2028-03-01", -1)).toBe("2028-02-29");
  });
});

describe("clampOffsetDays", () => {
  it("never schedules a generated task before today", () => {
    // Event in 20 days: a task ideally due 90 days before is due today.
    expect(clampOffsetDays(90, "2027-01-21", "2027-01-01")).toBe(20);
    expect(clampOffsetDays(7, "2027-01-21", "2027-01-01")).toBe(7);
  });

  it("handles past events and negative input", () => {
    expect(clampOffsetDays(30, "2026-12-01", "2027-01-01")).toBe(0);
    expect(clampOffsetDays(-5, "2027-12-01", "2027-01-01")).toBe(0);
  });
});

describe("deadlineState", () => {
  const today = "2027-01-10";
  it("classifies deadlines", () => {
    expect(deadlineState("2027-01-09", today, false)).toBe("overdue");
    expect(deadlineState("2027-01-10", today, false)).toBe("today");
    expect(deadlineState("2027-01-15", today, false)).toBe("soon");
    expect(deadlineState("2027-02-15", today, false)).toBe("upcoming");
    expect(deadlineState(null, today, false)).toBe("none");
    expect(deadlineState("2027-01-01", today, true)).toBe("done");
  });
});

describe("countdownTo", () => {
  it("counts calendar days", () => {
    expect(countdownTo("2027-01-31", "2027-01-01")).toMatchObject({ days: 30, weeks: 4, isPast: false });
    expect(countdownTo("2027-01-01", "2027-01-01").isToday).toBe(true);
    expect(countdownTo("2026-12-25", "2027-01-01").isPast).toBe(true);
  });
});

describe("describeOffset", () => {
  it("uses natural units", () => {
    expect(describeOffset(0)).toBe("On the day");
    expect(describeOffset(1)).toBe("1 day before");
    expect(describeOffset(14)).toBe("2 weeks before");
    expect(describeOffset(90)).toBe("3 months before");
    expect(describeOffset(10)).toBe("10 days before");
  });
});

describe("Google links", () => {
  it("builds an all-day Google Calendar template", () => {
    const url = new URL(googleCalendarUrl({ title: "Sangeet", date: "2027-02-13", location: "Jaipur" }));
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("dates")).toBe("20270213/20270214");
    expect(url.searchParams.get("location")).toBe("Jaipur");
  });

  it("builds a keyless Maps search link", () => {
    expect(googleMapsSearchUrl("Heritage property, Jaipur")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Heritage+property%2C+Jaipur",
    );
  });
});

describe("formatIsoDate", () => {
  it("formats each pattern", () => {
    expect(formatIsoDate("2027-01-05")).toBe("5 January 2027");
    expect(formatIsoDate("2027-01-05", "short")).toBe("5 Jan");
    expect(formatIsoDate("2027-01-05", "weekday")).toBe("Tue, 5 Jan 2027");
    expect(formatIsoDate("2027-01-05", "invitation")).toBe("Tuesday, 5 January 2027");
  });
});
