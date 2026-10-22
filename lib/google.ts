import { parseIsoDate, shiftIsoDate } from "./dates";

/**
 * Keyless Google integrations: Calendar "add event" templates and Maps
 * search URLs. Neither needs an API key or a paid plan.
 */

function compactDate(isoDate: string): string {
  parseIsoDate(isoDate); // throws on malformed input
  return isoDate.replaceAll("-", "");
}

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

export function googleMapsSearchUrl(query: string): string {
  const params = new URLSearchParams({ api: "1", query });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}
