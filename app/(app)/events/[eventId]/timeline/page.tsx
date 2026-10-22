import { EventSection } from "@/components/events/event-section";
import { DaySchedule } from "@/components/timeline/day-schedule";
import { SmartTimeline } from "@/components/timeline/smart-timeline";

export default function TimelinePage({ params }: PageProps<"/events/[eventId]/timeline">) {
  return (
    <EventSection params={params}>
      <div className="grid grid-cols-1 gap-8">
        <SmartTimeline />
        <DaySchedule />
      </div>
    </EventSection>
  );
}
