import type { Metadata } from "next";
import { EventsList } from "@/components/events/events-list";

export const metadata: Metadata = { title: "Your celebrations" };

export default function EventsPage() {
  return <EventsList />;
}
