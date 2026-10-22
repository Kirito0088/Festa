"use client";

import { useConvexAuth, useQueries, useQuery } from "convex/react";
import { SearchX } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { RECENT_ACTIVITY_LIMIT } from "@/lib/constants";
import { EventProvider } from "./event-context";
import { EventHeader } from "./event-header";
import { EventNav } from "./event-nav";

/**
 * Header and section nav for the open celebration. Lives in the event layout,
 * so it stays mounted while switching tabs. Renders nothing for a missing
 * event; the section below shows the not-found state.
 */
export function EventChrome({ eventId }: { eventId: string }) {
  const data = useEvent(eventId);

  return (
    <>
      <WarmSections eventId={eventId} />
      {data === undefined ? (
        <ChromeSkeleton />
      ) : data === null ? null : (
        <EventProvider value={data}>
          <EventHeader />
          <EventNav eventId={data.event._id} />
        </EventProvider>
      )}
    </>
  );
}

/**
 * Subscribes to every section's data as soon as the event route opens, in
 * parallel with the event itself. A section's `useQuery` with the same args
 * then returns the cached result on mount, so switching tabs never waits on
 * the network. Kept in its own component so live updates don't re-render the
 * chrome. Errors (a bad id, someone else's event) come back as values and are
 * ignored; EventGate shows the not-found state.
 */
function WarmSections({ eventId }: { eventId: string }) {
  const { isAuthenticated } = useConvexAuth();
  const queries = useMemo((): Parameters<typeof useQueries>[0] => {
    if (!isAuthenticated) return {};
    const args = { eventId: eventId as Id<"events"> };
    return {
      budget: { query: api.budget.list, args },
      tasks: { query: api.tasks.list, args },
      vendors: { query: api.vendors.list, args },
      activity: { query: api.activity.recent, args: { ...args, limit: RECENT_ACTIVITY_LIMIT } },
      moodboard: { query: api.moodboard.list, args },
      concierge: { query: api.concierge.list, args },
      schedule: { query: api.schedule.list, args },
    };
  }, [eventId, isAuthenticated]);
  useQueries(queries);

  // Fetch the lazily loaded settings form once the page is idle.
  useEffect(() => {
    const preload = () => void import("./event-settings-dialog");
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(preload, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(preload, 1500);
    return () => window.clearTimeout(id);
  }, []);

  return null;
}

/**
 * Provides the open celebration to a section page. Shares the chrome's query
 * subscription, so it adds no extra round trip.
 */
export function EventGate({ eventId, children }: { eventId: string; children: ReactNode }) {
  const data = useEvent(eventId);

  if (data === undefined) return <SectionSkeleton />;

  if (data === null) {
    return (
      <div className="py-8">
        <EmptyState
          icon={SearchX}
          title="We couldn't find that celebration"
          description="It may have been deleted, or it belongs to a different account."
          action={
            <Button asChild>
              <Link href="/events">Back to your celebrations</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return <EventProvider value={data}>{children}</EventProvider>;
}

/** `undefined` until auth settles and the event loads. */
function useEvent(eventId: string) {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(api.events.get, isAuthenticated ? { eventId } : "skip");
}

export function ChromeSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6" aria-hidden="true">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-5 h-14 w-3/4 max-w-xl" />
      <Skeleton className="mt-4 h-4 w-64" />
      <Skeleton className="mt-8 h-10 w-full max-w-2xl rounded-full" />
    </div>
  );
}

export function SectionSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3" aria-busy="true" aria-label="Loading celebration">
      <Skeleton className="h-44 md:col-span-2" />
      <Skeleton className="h-44" />
      <Skeleton className="h-60" />
      <Skeleton className="h-60 md:col-span-2" />
    </div>
  );
}
