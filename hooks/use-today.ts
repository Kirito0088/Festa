"use client";

import { useSyncExternalStore } from "react";
import { toIsoDate } from "@/lib/dates";

function subscribe(onChange: () => void): () => void {
  // Re-check every minute so the countdown rolls over at midnight.
  const timer = window.setInterval(onChange, 60_000);
  window.addEventListener("focus", onChange);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", onChange);
  };
}

/**
 * The user's local calendar date (`YYYY-MM-DD`), or `null` during server
 * rendering. Dates are computed in the browser so they follow the user's
 * time zone and never cause hydration mismatches.
 */
export function useToday(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => toIsoDate(new Date()),
    () => null,
  );
}

/** Today's date for mutations that accept a client "today". */
export function currentIsoDate(): string {
  return toIsoDate(new Date());
}
