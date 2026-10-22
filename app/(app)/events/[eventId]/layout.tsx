import { Suspense } from "react";
import { ChromeSkeleton, EventChrome } from "@/components/events/event-workspace";

// The header and nav stay mounted while switching tabs; each section page
// resolves its own params inside a Suspense boundary (see EventSection).
export default function EventLayout({ children, params }: LayoutProps<"/events/[eventId]">) {
  return (
    <>
      <Suspense fallback={<ChromeSkeleton />}>
        {params.then(({ eventId }) => (
          <EventChrome eventId={eventId} />
        ))}
      </Suspense>
      <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-6">{children}</div>
    </>
  );
}
