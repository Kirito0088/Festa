import { BudgetStudio } from "@/components/budget/budget-studio";
import { EventSection } from "@/components/events/event-section";

export default function BudgetPage({ params }: PageProps<"/events/[eventId]/budget">) {
  return (
    <EventSection params={params}>
      <BudgetStudio />
    </EventSection>
  );
}
