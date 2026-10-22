"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { SearchX } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
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

  if (data === undefined) return <ChromeSkeleton />;
  if (data === null) return null;

  return (
    <EventProvider value={data}>
      <EventHeader />
      <EventNav eventId={data.event._id} />
    </EventProvider>
  );
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
