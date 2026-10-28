import { describe, expect, it } from "vitest";
import { googleCalendarUrl, googleMapsSearchUrl } from "@/lib/google";

describe("googleCalendarUrl", () => {
  it("builds an all-day calendar event URL with start and end dates", () => {
    const url = googleCalendarUrl({
      title: "Book caterer and schedule tasting",
      date: "2027-02-14",
      details: "Ask about vegetarian tasting options for 120 guests",
      location: "Heritage Property, Jaipur",
    });

    expect(url).toContain("https://calendar.google.com/calendar/render?");
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("text=Book+caterer+and+schedule+tasting");
    expect(url).toContain("dates=20270214%2F20270215");
    expect(url).toContain("location=Heritage+Property%2C+Jaipur");
  });

  it("handles optional fields gracefully", () => {
    const url = googleCalendarUrl({
      title: "Confirm DJ",
      date: "2027-03-01",
    });

    expect(url).toContain("dates=20270301%2F20270302");
    expect(url).not.toContain("details=");
    expect(url).not.toContain("location=");
  });

  it("throws on malformed date string", () => {
    expect(() =>
      googleCalendarUrl({
        title: "Bad date",
        date: "not-a-date",
      }),
    ).toThrow(/Invalid date/i);
  });
});

describe("googleMapsSearchUrl", () => {
  it("builds a search URL for vendor or venue queries", () => {
    const url = googleMapsSearchUrl("Florists in Jaipur");
    expect(url).toBe("https://www.google.com/maps/search/?api=1&query=Florists+in+Jaipur");
  });

  it("escapes special characters correctly", () => {
    const url = googleMapsSearchUrl("Meera & Kabir's Mandap (Jaipur)");
    expect(url).toContain("api=1");
    expect(url).toContain("query=Meera+%26+Kabir%27s+Mandap+%28Jaipur%29");
  });
});
