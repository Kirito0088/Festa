import { SmartTimeline } from "@/components/timeline/smart-timeline";
import { EventSection } from "@/components/events/event-section";

export default function TimelinePage({ params }: PageProps<"/events/[eventId]/timeline">) {
  return (
    <EventSection params={params}>
      <SmartTimeline />
    </EventSection>
  );
}
