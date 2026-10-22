/** The public origin, for canonical URLs, Open Graph images and the sitemap. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SITE_NAME = "Festa";
export const SITE_TAGLINE = "Plan the celebration, not the spreadsheet";
export const SITE_DESCRIPTION =
  "Festa is an AI celebration planner for weddings, engagements, birthdays and community events. A few answers become a plan you can follow: a budget that adds up, a dated checklist with a day-of run sheet, vendors to call, inspiration, and a concierge for when plans change.";

// Browsers read a backslash as a slash and drop tabs and newlines, so
// "/\evil.example" and "/<tab>/evil.example" both lead to another site.
// eslint-disable-next-line no-control-regex -- control characters are what it rejects
const UNSAFE_PATH = /[\u0000-\u001f\u007f\\]/;

/**
 * Where to go after signing in. Only same-site paths are allowed, so a
 * crafted link can't send anyone elsewhere. The sign-in page itself is
 * refused too, since the form would wait there forever.
 */
export function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || UNSAFE_PATH.test(value)) return "/events";
  if (/^\/sign-in(?:[/?#]|$)/.test(value)) return "/events";
  return value;
}
