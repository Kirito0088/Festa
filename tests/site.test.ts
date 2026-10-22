import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/site";

describe("safeNext", () => {
  it("keeps same-site paths", () => {
    expect(safeNext("/events/abc/budget")).toBe("/events/abc/budget");
    expect(safeNext("/events?tab=done#top")).toBe("/events?tab=done#top");
  });

  it("falls back to the plans list when there is nowhere to go", () => {
    expect(safeNext(null)).toBe("/events");
    expect(safeNext("")).toBe("/events");
  });

  it("refuses anything that leads to another site", () => {
    for (const value of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "/\t/evil.example",
      "/\n/evil.example",
      "javascript:alert(1)",
    ]) {
      expect(safeNext(value)).toBe("/events");
    }
  });

  it("never sends a signed-in user back to the sign-in page", () => {
    expect(safeNext("/sign-in")).toBe("/events");
    expect(safeNext("/sign-in?mode=sign-up")).toBe("/events");
    expect(safeNext("/sign-in-help")).toBe("/sign-in-help");
  });
});
