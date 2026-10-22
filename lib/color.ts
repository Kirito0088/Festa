/** Fountain-pen ink, the brand's text colour (matches `--ink`). */
export const INK = "#262a47";

/** The card surface the palette ink is measured against (matches `--card`). */
const CARD = "#fffefb";

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function channels(hex: string): [number, number, number] {
  const value = hex.slice(1);
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [number, number, number];
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two hex colours. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The first palette colour dark enough to set text in on a card (AA, 4.5:1),
 * so stamps and accents wear the celebration's own colours. Falls back to ink.
 */
export function inkFromPalette(palette: readonly string[]): string {
  return palette.find((hex) => HEX.test(hex) && contrastRatio(hex, CARD) >= 4.5) ?? INK;
}
