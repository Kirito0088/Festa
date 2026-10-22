import { describe, expect, it } from "vitest";
import { remindersCalendar } from "@/lib/ics";

const now = new Date("2026-10-22T08:30:00Z");

describe("remindersCalendar", () => {
  it("writes one all-day event per task with an alert the evening before", () => {
    const ics = remindersCalendar({
      eventName: "Meera & Kabir's Engagement",
      tasks: [{ id: "t1", title: "Book the caterer", due: "2026-11-06", notes: "" }],
      now,
    });
    const lines = ics.split("\r\n");
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("VERSION:2.0");
    expect(lines).toContain("BEGIN:VEVENT");
    expect(lines).toContain("UID:t1@festa");
    expect(lines).toContain("DTSTAMP:20261022T083000Z");
    expect(lines).toContain("DTSTART;VALUE=DATE:20261106");
    expect(lines).toContain("DTEND;VALUE=DATE:20261107");
    expect(lines).toContain("SUMMARY:Book the caterer");
    expect(lines).toContain("BEGIN:VALARM");
    expect(lines).toContain("TRIGGER:-PT6H");
    expect(lines.at(-2)).toBe("END:VCALENDAR");
    expect(ics.endsWith("\r\n")).toBe(true);
  });

  it("escapes text and folds long lines", () => {
    const ics = remindersCalendar({
      eventName: "Party, with; semicolons",
      tasks: [
        {
          id: "t2",
          title: "Pick songs, games; and \\ snacks",
          due: "2026-12-01",
          notes: "Line one\nLine two " + "x".repeat(120),
        },
      ],
      now,
    });
    expect(ics).toContain("SUMMARY:Pick songs\\, games\\; and \\\\ snacks");
    expect(ics).toContain("Line one\\nLine two");
    for (const line of ics.split("\r\n"))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });

  it("returns a valid empty calendar when nothing is dated", () => {
    const ics = remindersCalendar({ eventName: "Quiet", tasks: [], now });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).not.toContain("BEGIN:VEVENT");
  });
});
