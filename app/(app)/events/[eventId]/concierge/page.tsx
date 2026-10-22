import { ConciergeChat } from "@/components/concierge/concierge-chat";
import { EventSection } from "@/components/events/event-section";

export default function ConciergePage({ params }: PageProps<"/events/[eventId]/concierge">) {
  return (
    <EventSection params={params}>
      <ConciergeChat />
    </EventSection>
  );
}
