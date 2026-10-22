import { z } from "zod";
import { CURRENCIES, EVENT_TYPES, LIMITS } from "@/lib/constants";
import { daysBetween, isIsoDate, toIsoDate } from "@/lib/dates";

const shorterThan = (max: number) => `Keep this under ${max} characters.`;

export const wizardSchema = z.object({
  type: z.enum(EVENT_TYPES, { error: "Choose what you're celebrating." }),
  name: z
    .string()
    .trim()
    .min(2, "Give your celebration a name.")
    .max(LIMITS.nameMax, `Keep the name under ${LIMITS.nameMax} characters.`),
  date: z
    .string()
    .refine(isIsoDate, "Choose a date.")
    .refine(
      (value) => !isIsoDate(value) || daysBetween(toIsoDate(new Date()), value) >= 0,
      "Choose today or a future date.",
    ),
  city: z.string().trim().max(LIMITS.shortTextMax, shorterThan(LIMITS.shortTextMax)),
  venue: z.string().trim().max(LIMITS.shortTextMax, shorterThan(LIMITS.shortTextMax)),
  budget: z
    .number({ error: "Enter a budget." })
    .positive("Budget must be more than zero.")
    .max(LIMITS.moneyMax, "That budget is too large."),
  currency: z.enum(CURRENCIES),
  guestCount: z
    .number({ error: "Enter how many guests you expect." })
    .int("Use a whole number.")
    .min(1, "At least one guest.")
    .max(LIMITS.guestsMax, "That's more guests than Festa supports."),
  styles: z.array(z.string()).max(6, "Choose up to 6 styles."),
  atmosphere: z.string().trim().max(LIMITS.shortTextMax, shorterThan(LIMITS.shortTextMax)),
  foodPreferences: z.array(z.string()).max(12),
  activities: z.array(z.string()).max(12),
  notes: z.string().trim().max(LIMITS.longTextMax, shorterThan(LIMITS.longTextMax)),
  useAI: z.boolean(),
});

export type WizardValues = z.infer<typeof wizardSchema>;

export type WizardStep = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  fields: (keyof WizardValues)[];
  optional: boolean;
};

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: "occasion",
    eyebrow: "The occasion",
    title: "What are we celebrating?",
    description: "Festa splits the budget and writes the checklist differently for each kind of celebration.",
    fields: ["type"],
    optional: false,
  },
  {
    id: "basics",
    eyebrow: "The basics",
    title: "Give it a name and a date.",
    description: "Every deadline counts back from this day. Change it later and they all move with it.",
    fields: ["name", "date"],
    optional: false,
  },
  {
    id: "place",
    eyebrow: "The place",
    title: "Where will it happen?",
    description: "A city and the kind of venue you have in mind. Skip if you're not sure yet.",
    fields: ["city", "venue"],
    optional: true,
  },
  {
    id: "scale",
    eyebrow: "Budget & guests",
    title: "How big is the celebration?",
    description: "A rough number is fine. Festa does the sums itself; the AI never touches your money.",
    fields: ["budget", "currency", "guestCount"],
    optional: false,
  },
  {
    id: "style",
    eyebrow: "Style",
    title: "How should it feel?",
    description: "Pick a few styles, then describe the mood the way you'd tell a friend.",
    fields: ["styles", "atmosphere"],
    optional: true,
  },
  {
    id: "food",
    eyebrow: "Food",
    title: "What should be on the table?",
    description:
      "Note who eats what and how you'd like it served. Festa turns it into a brief for your caterer.",
    fields: ["foodPreferences"],
    optional: true,
  },
  {
    id: "moments",
    eyebrow: "Moments",
    title: "Which moments matter most?",
    description:
      "Each moment you pick becomes tasks on your timeline. Anything else Festa should know goes in the notes.",
    fields: ["activities", "notes"],
    optional: true,
  },
  {
    id: "review",
    eyebrow: "Review",
    title: "Ready for a first draft?",
    description: "Check the details. Festa drafts the plan, and you can change any part of it afterwards.",
    fields: ["useAI"],
    optional: false,
  },
];
