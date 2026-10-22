import { VendorDesk } from "@/components/vendors/vendor-desk";
import { EventSection } from "@/components/events/event-section";

export default function VendorsPage({ params }: PageProps<"/events/[eventId]/vendors">) {
  return (
    <EventSection params={params}>
      <VendorDesk />
    </EventSection>
  );
}
