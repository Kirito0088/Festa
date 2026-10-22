import { ACTIVITY_OPTIONS, type EventType } from "../constants";
import type { PlanInput } from "./template";

export type ScheduleEntry = { time: string; title: string; notes: string };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** A 24-hour "HH:MM" time of day. */
export function isScheduleTime(value: string): boolean {
  return TIME.test(value);
}

/** When guests arrive, in minutes after midnight. */
const WELCOME_AT: Record<EventType, number> = {
  wedding: 18 * 60,
  engagement: 18 * 60,
  anniversary: 19 * 60,
  birthday: 17 * 60,
  "baby-shower": 11 * 60,
  community: 10 * 60,
  corporate: 18 * 60,
  other: 18 * 60,
};

const DAYTIME: ReadonlySet<EventType> = new Set(["baby-shower", "community"]);

/** Minutes each activity usually takes on the day. */
const DURATION: Record<string, number> = {
  Baraat: 60,
  Pheras: 90,
  Reception: 120,
  "DJ night": 90,
  "Ring ceremony": 30,
  "Live music": 60,
  "Couple's entry": 15,
  Speeches: 20,
  Toasts: 20,
  "Cake cutting": 20,
  Games: 45,
  Slideshow: 15,
  Dinner: 60,
  "Dance floor": 60,
  "Godh bharai": 45,
  "Welcome address": 15,
  "Cultural performances": 60,
  Workshops: 90,
  "Prize distribution": 30,
  Keynote: 30,
  Awards: 45,
  "Team games": 60,
  Networking: 45,
};

/** Things that run alongside everything else rather than taking a slot. */
const ALL_DAY = new Set(["Photo booth", "Wishes wall", "Dessert table", "Food stalls"]);

/** Held on earlier days, so they are not part of the main day's sheet. */
const OTHER_DAYS = new Set(["Mehendi", "Haldi", "Sangeet"]);

function clock(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}

/**
 * A run sheet for the day itself: setup, the guests' arrival, each chosen
 * activity in its natural order, a meal sized for the guest list, the
 * send-off and pack-up. Deterministic, so it works without AI and the user
 * can edit every line afterwards.
 */
export function daySchedule(input: Pick<PlanInput, "type" | "activities" | "guestCount">): ScheduleEntry[] {
  const welcome = WELCOME_AT[input.type];
  const known = ACTIVITY_OPTIONS[input.type];
  const chosen = input.activities
    .filter((activity) => !OTHER_DAYS.has(activity))
    .toSorted((a, b) => {
      const rank = (name: string) => (known.includes(name) ? known.indexOf(name) : known.length);
      return rank(a) - rank(b);
    });
  const running = chosen.filter((activity) => ALL_DAY.has(activity));
  const timed = chosen.filter((activity) => !ALL_DAY.has(activity));

  const counters = Math.max(1, Math.ceil(input.guestCount / 100));
  const mealName = DAYTIME.has(input.type) ? "Lunch is served" : "Dinner is served";
  const mealNote = `For ${input.guestCount} guests, plan ${counters} serving ${counters === 1 ? "counter" : "counters"}.`;
  const hasMeal = timed.includes("Dinner");
  // The meal goes after roughly two thirds of the programme.
  const mealAfter = Math.ceil(timed.length * (2 / 3));

  const sheet: ScheduleEntry[] = [
    {
      time: clock(welcome - 180),
      title: "Vendor setup and decor",
      notes: "Decorators, caterers and the sound team arrive. Keep one person on point to let them in.",
    },
    {
      time: clock(welcome - 60),
      title: "Final walkthrough with the venue",
      notes: "Check seating, lighting, power backups and the order of the day with every vendor.",
    },
    {
      time: clock(welcome),
      title: "Guests arrive",
      notes: running.length
        ? `${running.join(", ")} open from the start.`
        : "Someone at the entrance to welcome guests and point the way.",
    },
  ];

  let at = welcome + 30;
  timed.forEach((activity, index) => {
    sheet.push({
      time: clock(at),
      title: activity,
      notes: activity === "Dinner" ? mealNote : "",
    });
    at += DURATION[activity] ?? 30;
    if (!hasMeal && index + 1 === mealAfter) {
      sheet.push({ time: clock(at), title: mealName, notes: mealNote });
      at += 60;
    }
  });
  if (!hasMeal && timed.length === 0) {
    sheet.push({ time: clock(at), title: mealName, notes: mealNote });
    at += 60;
  }

  sheet.push(
    {
      time: clock(at),
      title: "Thank-yous and send-off",
      notes: "A few words of thanks, and return gifts if you're giving them.",
    },
    {
      time: clock(at + 45),
      title: "Pack up and settle vendor balances",
      notes: "Collect rented items and pay outstanding balances against the budget ledger.",
    },
  );
  return sheet;
}

/** Sort key for a run sheet: times before 05:00 belong to the same late night. */
export function scheduleSortKey(time: string): string {
  return time < "05:00" ? `2${time}` : `1${time}`;
}
