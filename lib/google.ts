import { parseIsoDate, shiftIsoDate } from "./dates";

/**
 * Keyless Google integrations: Calendar "add event" templates and Maps
 * search URLs. Neither needs an API key or a paid plan.
 */

function compactDate(isoDate: string): string {
  parseIsoDate(isoDate); // throws on malformed input
  return isoDate.replaceAll("-", "");
}

/**
 * Builds a direct Google Calendar event creation URL without requiring OAuth credentials or API keys.
 *
 * @param input - Event title, date, optional details, and location.
 * @returns Fully formatted Google Calendar web URL.
 */
export function googleCalendarUrl(input: {
  title: string;
  date: string;
  details?: string;
  location?: string;
}): string {
  const start = compactDate(input.date);
  const end = compactDate(shiftIsoDate(input.date, 1));
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${start}/${end}`,
  });
  if (input.details) params.set("details", input.details);
  if (input.location) params.set("location", input.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Builds a universal Google Maps search URL without requiring Maps API keys.
 *
 * @param query - Address, venue name, or search query.
 * @returns Standard Google Maps universal search URL.
 */
export function googleMapsSearchUrl(query: string): string {
  const params = new URLSearchParams({ api: "1", query });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}
