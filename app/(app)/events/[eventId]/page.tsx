import { Overview } from "@/components/dashboard/overview";
import { EventSection } from "@/components/events/event-section";

export default function EventOverviewPage({ params }: PageProps<"/events/[eventId]">) {
  return (
    <EventSection params={params}>
      <Overview />
    </EventSection>
  );
}
