import { describe, expect, it } from "vitest";
import { contrastRatio, inkFromPalette, INK } from "@/lib/color";

describe("contrastRatio", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  it("is symmetric and accepts shorthand hex", () => {
    expect(contrastRatio("#fff", "#262a47")).toBeCloseTo(contrastRatio("#262a47", "#ffffff"), 5);
  });
});

describe("inkFromPalette", () => {
  it("picks the first palette colour that reads as text on the card", () => {
    // Marigold is too light for text; vermilion passes.
    expect(inkFromPalette(["#E9A238", "#C2452D", "#5E7458"])).toBe("#C2452D");
  });

  it("falls back to ink when nothing in the palette is dark enough", () => {
    expect(inkFromPalette(["#F8F6F1", "#E9C7C3", "#E9A238"])).toBe(INK);
    expect(inkFromPalette([])).toBe(INK);
  });

  it("skips values that are not hex colours", () => {
    expect(inkFromPalette(["red", "#5E7458"])).toBe("#5E7458");
  });
});
