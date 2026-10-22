"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { currentIsoDate } from "@/hooks/use-today";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import { errorMessage } from "@/lib/errors";
import { spring } from "@/lib/motion";
import { WIZARD_STEPS, wizardSchema, type WizardValues } from "./wizard-schema";
import {
  BasicsStep,
  FoodStep,
  MomentsStep,
  OccasionStep,
  PlaceStep,
  ReviewStep,
  ScaleStep,
  StyleStep,
} from "./wizard-steps";

const STEP_VIEWS = {
  occasion: OccasionStep,
  basics: BasicsStep,
  place: PlaceStep,
  scale: ScaleStep,
  style: StyleStep,
  food: FoodStep,
  moments: MomentsStep,
  review: ReviewStep,
} as const;

export function CelebrationWizard() {
  const router = useRouter();
  const createEvent = useMutation(api.events.create);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const form = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      date: "",
      city: "",
      venue: "",
      currency: DEFAULT_CURRENCY,
      guestCount: 100,
      styles: [],
      atmosphere: "",
      foodPreferences: [],
      activities: [],
      notes: "",
      useAI: true,
    },
  });

  const step = WIZARD_STEPS[stepIndex];
  const StepView = STEP_VIEWS[step.id as keyof typeof STEP_VIEWS];
  const isLast = stepIndex === WIZARD_STEPS.length - 1;

  function goTo(index: number) {
    setDirection(index > stepIndex ? 1 : -1);
    setStepIndex(index);
    // Move focus to the new question for keyboard and screen-reader users.
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  async function next() {
    const valid = await form.trigger(step.fields);
    if (valid) goTo(stepIndex + 1);
  }

  // If a skipped step holds invalid input, take the user straight to it.
  function onInvalid(errors: Partial<Record<keyof WizardValues, unknown>>) {
    const index = WIZARD_STEPS.findIndex((s) => s.fields.some((field) => field in errors));
    if (index >= 0) goTo(index);
  }

  async function submit(values: WizardValues) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { useAI, ...fields } = values;
      const eventId = await createEvent({ ...fields, useAI, today: currentIsoDate() });
      toast.success("Celebration created. Drafting your blueprint…");
      // Land on the event's title, not on the section below its header,
      // which is where Next would scroll from the long review step.
      window.scrollTo({ top: 0 });
      router.push(`/events/${eventId}`, { scroll: false });
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't create the celebration. Please try again."));
      setSubmitting(false);
    }
  }

  return (
    <FormProvider {...form}>
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-center justify-between">
          <Link href="/events" className="text-[0.875rem] text-muted-foreground hover:text-foreground">
            Cancel
          </Link>
          <p className="tabular text-[0.8125rem] text-muted-foreground" aria-live="polite">
            Step {stepIndex + 1} of {WIZARD_STEPS.length}
          </p>
        </div>

        <div className="mt-4 flex gap-1.5" aria-hidden="true">
          {WIZARD_STEPS.map((s, index) => (
            <span key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-[#e6e0d5]">
              <motion.span
                className="block h-full rounded-full bg-charcoal"
                initial={false}
                animate={{ scaleX: index <= stepIndex ? 1 : 0 }}
                style={{ originX: 0 }}
                transition={spring.default}
              />
            </span>
          ))}
        </div>

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (isLast) void form.handleSubmit(submit, onInvalid)();
            else void next();
          }}
          className="mt-10"
        >
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.section
              key={step.id}
              custom={direction}
              initial={{ opacity: 0, x: 24 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 * direction }}
              transition={spring.default}
              aria-labelledby={`step-${step.id}`}
            >
              <p className="type-eyebrow">{step.eyebrow}</p>
              <h1
                id={`step-${step.id}`}
                ref={headingRef}
                tabIndex={-1}
                className="type-display mt-3 text-[2.5rem] outline-none sm:text-[3.25rem]"
              >
                {step.title}
              </h1>
              <p className="mt-3 max-w-lg text-[0.9375rem] leading-relaxed text-muted-foreground">
                {step.description}
              </p>
              <div className="mt-9">
                <StepView />
              </div>
            </motion.section>
          </AnimatePresence>

          <div className="mt-12 flex items-center justify-between gap-3 border-t border-border pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => goTo(stepIndex - 1)}
              disabled={stepIndex === 0 || submitting}
              className={stepIndex === 0 ? "invisible" : undefined}
            >
              <ArrowLeft aria-hidden="true" /> Back
            </Button>
            <div className="flex items-center gap-2">
              {step.optional && (
                <Button type="button" variant="ghost" onClick={() => goTo(stepIndex + 1)}>
                  Skip
                </Button>
              )}
              <Button type="submit" size="lg" disabled={submitting}>
                {isLast ? (
                  <>
                    {submitting ? (
                      <Loader2 className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkles aria-hidden="true" />
                    )}
                    {submitting ? "Creating…" : "Create my plan"}
                  </>
                ) : (
                  <>
                    Continue <ArrowRight aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
