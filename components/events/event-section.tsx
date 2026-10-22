import { Suspense, type ReactNode } from "react";
import { EventGate, SectionSkeleton } from "./event-workspace";

/**
 * Wraps an event section page. Resolving `params` inside this boundary keeps
 * the page's static shell (the skeleton) available for instant navigation.
 */
export function EventSection({
  params,
  children,
}: {
  params: Promise<{ eventId: string }>;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<SectionSkeleton />}>
      {params.then(({ eventId }) => (
        <EventGate eventId={eventId}>{children}</EventGate>
      ))}
    </Suspense>
  );
}
