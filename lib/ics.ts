import { shiftIsoDate } from "./dates";

/**
 * A standard iCalendar (RFC 5545) file of task reminders, which Google,
 * Apple and Outlook calendars all import. Each task becomes an all-day
 * event on its due date with an alert at 18:00 the evening before.
 */
export function remindersCalendar(input: {
  eventName: string;
  tasks: readonly { id: string; title: string; due: string; notes: string }[];
  now: Date;
}): string {
  const stamp = input.now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Festa//Celebration reminders//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(`${input.eventName} reminders`)}`,
  ];
  for (const task of input.tasks) {
    const description = [task.notes, `From your Festa plan for ${input.eventName}.`]
      .filter(Boolean)
      .join("\n\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${task.id}@festa`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(task.due)}`,
      `DTEND;VALUE=DATE:${compact(shiftIsoDate(task.due, 1))}`,
      `SUMMARY:${escapeText(task.title)}`,
      `DESCRIPTION:${escapeText(description)}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      // Six hours before midnight on the due date: 18:00 the evening before.
      "TRIGGER:-PT6H",
      `DESCRIPTION:${escapeText(`Due tomorrow: ${task.title}`)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

function compact(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

/** RFC 5545 text escaping: backslash, comma, semicolon and newlines. */
function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r?\n/g, "\\n");
}

/** Folds a content line to at most 75 octets, continuing with a leading space. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  for (const char of line) {
    const limit = parts.length === 0 ? 75 : 74; // continuation lines start with a space
    if (encoder.encode(current + char).length > limit) {
      parts.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.join("\r\n ");
}
