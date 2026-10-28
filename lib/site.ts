/** The public origin, for canonical URLs, Open Graph images and the sitemap. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SITE_NAME = "Festa";
export const SITE_TAGLINE = "Plan the celebration, not the spreadsheet";
export const SITE_DESCRIPTION =
  "Festa is an AI celebration planner for weddings, engagements, birthdays and community events. A few answers become a plan you can follow: a budget that adds up, a dated checklist with a day-of run sheet, vendors to call, inspiration, and a concierge for when plans change.";

// Browsers read a backslash as a slash and drop tabs and newlines, so
// "/\evil.example" and "/<tab>/evil.example" both lead to another site.
const UNSAFE_PATH = /[\u0000-\u001f\u007f\\]/;

/**
 * Validates and sanitizes a post-sign-in redirect path to guarantee same-site navigation.
 * Refuses protocol-relative URLs (`//`), open redirects, control characters, backslashes, and loops back to `/sign-in`.
 *
 * @param value - Candidate URL or path string.
 * @returns Safe internal path (defaults to `/events`).
 */
export function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || UNSAFE_PATH.test(value)) return "/events";
  if (/^\/sign-in(?:[/?#]|$)/.test(value)) return "/events";
  return value;
}
