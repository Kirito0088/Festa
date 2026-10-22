import { InspirationBoard } from "@/components/moodboard/inspiration-board";
import { EventSection } from "@/components/events/event-section";

export default function InspirationPage({ params }: PageProps<"/events/[eventId]/inspiration">) {
  return (
    <EventSection params={params}>
      <InspirationBoard />
    </EventSection>
  );
}
