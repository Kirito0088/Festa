import { DEFAULT_MODELS } from "../../lib/ai/groq";
import type { PlanInput } from "../../lib/plan/template";
import type { Doc } from "../_generated/dataModel";
import { env } from "../_generated/server";

export function toPlanInput(event: Doc<"events">): PlanInput {
  return {
    type: event.type,
    name: event.name,
    date: event.date,
    city: event.city,
    venue: event.venue,
    guestCount: event.guestCount,
    budget: event.budget,
    currency: event.currency,
    styles: event.styles,
    atmosphere: event.atmosphere,
    foodPreferences: event.foodPreferences,
    activities: event.activities,
    notes: event.notes,
  };
}

export function groqModels(): string[] {
  const models = [env.GROQ_MODEL ?? DEFAULT_MODELS[0], env.GROQ_FALLBACK_MODEL ?? DEFAULT_MODELS[1]];
  return [...new Set(models.filter(Boolean))];
}
