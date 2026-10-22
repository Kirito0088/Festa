import { BlueprintView } from "@/components/events/blueprint-view";
import { EventSection } from "@/components/events/event-section";

export default function PlanPage({ params }: PageProps<"/events/[eventId]/plan">) {
  return (
    <EventSection params={params}>
      <BlueprintView />
    </EventSection>
  );
}
