import type { Metadata } from "next";
import { CelebrationWizard } from "@/components/events/wizard/celebration-wizard";

export const metadata: Metadata = { title: "New celebration" };

export default function NewEventPage() {
  return <CelebrationWizard />;
}
