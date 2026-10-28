import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { fieldAria } from "@/components/ui/field";
import { contrastRatio, inkFromPalette } from "@/lib/color";

describe("accessibility: field and form control ARIA", () => {
  it("links error descriptions via aria-describedby and marks invalid state", () => {
    const errorAria = fieldAria("event-budget", "Budget must be greater than zero");
    expect(errorAria).toEqual({
      id: "event-budget",
      "aria-invalid": true,
      "aria-describedby": "event-budget-error",
    });
  });

  it("links hint descriptions when no error is present", () => {
    const hintAria = fieldAria("event-date", undefined, true);
    expect(hintAria).toEqual({
      id: "event-date",
      "aria-invalid": undefined,
      "aria-describedby": "event-date-hint",
    });
  });

  it("omits describedby and invalid states when neither hint nor error exists", () => {
    const cleanAria = fieldAria("event-name", undefined, false);
    expect(cleanAria).toEqual({
      id: "event-name",
      "aria-invalid": undefined,
      "aria-describedby": undefined,
    });
  });

  it("prioritizes error description over hint description", () => {
    const bothAria = fieldAria("guest-count", "Whole numbers only", true);
    expect(bothAria).toEqual({
      id: "guest-count",
      "aria-invalid": true,
      "aria-describedby": "guest-count-error",
    });
  });
});

describe("accessibility: WCAG 2.1 AA contrast verification", () => {
  const ivory = "#F8F6F1";
  const ink = "#262A47";
  const marigoldStrong = "#8A5A12";
  const sageStrong = "#56694F";
  const blushStrong = "#A4534A";
  const danger = "#A63D2A";
  const charcoal = "#20211F";

  it("verifies contrast ratio extremes and inkFromPalette fallback", () => {
    const blackWhiteRatio = contrastRatio("#000000", "#FFFFFF");
    expect(blackWhiteRatio).toBeGreaterThan(20); // 21:1

    // Returns first color with >= 4.5:1 on card
    const selected = inkFromPalette(["#FFFF00", "#E9A23C", "#262A47"]);
    expect(selected).toBe("#262A47");

    // Falls back to INK default if none qualify
    const fallback = inkFromPalette(["#FFFFFE", "#FAFAFA"]);
    expect(fallback).toBe("#262a47");
  });

  it("proves primary ink text exceeds WCAG AAA (7:1) on ivory background", () => {
    const ratio = contrastRatio(ink, ivory);
    expect(ratio).toBeGreaterThan(10); // Specifically ~13:1
  });

  it("proves charcoal text exceeds WCAG AAA on ivory background", () => {
    const ratio = contrastRatio(charcoal, ivory);
    expect(ratio).toBeGreaterThan(12);
  });

  it("proves strong status accents meet WCAG AA (4.5:1) for body text on ivory", () => {
    expect(contrastRatio(marigoldStrong, ivory)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(sageStrong, ivory)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(blushStrong, ivory)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(danger, ivory)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("accessibility: landmarks and skip link contracts", () => {
  const root = resolve(import.meta.dirname, "..");

  it("ensures the skip link in root layout targets an existing main id", () => {
    const rootLayout = readFileSync(resolve(root, "app/layout.tsx"), "utf-8");
    expect(rootLayout).toMatch(/<a[^>]+href="#main"[^>]*>[\s\S]*Skip to content[\s\S]*<\/a>/);
    expect(rootLayout).toMatch(/lang="en"/);
  });

  it('ensures every major entrypoint provides <main id="main">', () => {
    const files = [
      "app/page.tsx",
      "app/sign-in/page.tsx",
      "components/layout/app-shell.tsx",
      "app/error.tsx",
      "app/not-found.tsx",
    ];

    for (const relPath of files) {
      const content = readFileSync(resolve(root, relPath), "utf-8");
      expect(content, `${relPath} must contain <main id="main">`).toMatch(/<main[^>]+id="main"/);
    }
  });

  it("ensures focus-visible styling is defined globally", () => {
    const css = readFileSync(resolve(root, "app/globals.css"), "utf-8");
    expect(css).toMatch(/:focus-visible\s*\{/);
    expect(css).toMatch(/outline:\s*2px solid var\(--ring\)/);
  });

  it("ensures prefers-reduced-motion media query zeroes animations", () => {
    const css = readFileSync(resolve(root, "app/globals.css"), "utf-8");
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(css).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
  });
});
