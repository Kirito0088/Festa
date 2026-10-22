"use client";

import { createContext, useContext } from "react";
import type { Doc } from "@/convex/_generated/dataModel";

export type EventContextValue = {
  event: Doc<"events">;
  blueprint: Doc<"blueprints"> | null;
};

const EventContext = createContext<EventContextValue | null>(null);

export const EventProvider = EventContext.Provider;

/** The celebration currently open in the workspace. */
export function useEventContext(): EventContextValue {
  const value = useContext(EventContext);
  if (!value) throw new Error("useEventContext must be used inside an event workspace");
  return value;
}
