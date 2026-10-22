"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { Field, fieldAria } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  ACTIVITY_OPTIONS,
  CURRENCIES,
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  FOOD_OPTIONS,
  LIMITS,
  STYLE_OPTIONS,
} from "@/lib/constants";
import { isIsoDate } from "@/lib/dates";
import { errorMessage } from "@/lib/errors";
import { useEventContext } from "./event-context";

const schema = z.object({
  name: z.string().trim().min(2, "Give your celebration a name.").max(LIMITS.nameMax),
  type: z.enum(EVENT_TYPES),
  date: z.string().refine(isIsoDate, "Choose a valid date."),
  city: z.string().trim().max(LIMITS.shortTextMax),
  venue: z.string().trim().max(LIMITS.shortTextMax),
  budget: z
    .number({ error: "Enter a budget." })
    .positive("Budget must be more than zero.")
    .max(LIMITS.moneyMax),
  currency: z.enum(CURRENCIES),
  guestCount: z
    .number({ error: "Enter a guest count." })
    .int("Use a whole number.")
    .min(1)
    .max(LIMITS.guestsMax),
  styles: z.array(z.string()).max(6),
  atmosphere: z.string().trim().max(LIMITS.shortTextMax),
  foodPreferences: z.array(z.string()).max(12),
  activities: z.array(z.string()).max(12),
  notes: z.string().trim().max(LIMITS.longTextMax),
});

type Values = z.infer<typeof schema>;

function valuesFrom(event: Doc<"events">): Values {
  return {
    name: event.name,
    type: event.type,
    date: event.date,
    city: event.city,
    venue: event.venue,
    budget: event.budget,
    currency: event.currency as Values["currency"],
    guestCount: event.guestCount,
    styles: event.styles,
    atmosphere: event.atmosphere,
    foodPreferences: event.foodPreferences,
    activities: event.activities,
    notes: event.notes,
  };
}

export function EventSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { event } = useEventContext();
  const update = useMutation(api.events.update);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: valuesFrom(event) });
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  // Load the latest saved values each time the sheet opens.
  useEffect(() => {
    if (open) reset(valuesFrom(event));
  }, [open, event, reset]);

  const type = useWatch({ control, name: "type" }) ?? event.type;
  const activityOptions = [...new Set([...ACTIVITY_OPTIONS[type], ...event.activities])];

  const onSubmit = handleSubmit(async (values) => {
    try {
      await update({ eventId: event._id, ...values });
      toast.success("Details saved.");
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0">
        <SheetHeader>
          <SheetTitle>Celebration details</SheetTitle>
          <SheetDescription>Changing the date moves every event-relative deadline with it.</SheetDescription>
        </SheetHeader>
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="grid flex-1 gap-5 overflow-y-auto px-6 py-5">
            <Field id="settings-name" label="Name" error={errors.name?.message}>
              <Input {...fieldAria("settings-name", errors.name?.message)} {...register("name")} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="settings-type" label="Occasion">
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="settings-type" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {EVENT_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field id="settings-date" label="Date" error={errors.date?.message}>
                <Input
                  type="date"
                  {...fieldAria("settings-date", errors.date?.message)}
                  {...register("date")}
                />
              </Field>
              <Field id="settings-city" label="City" optional>
                <Input {...fieldAria("settings-city")} {...register("city")} />
              </Field>
              <Field id="settings-venue" label="Venue" optional>
                <Input {...fieldAria("settings-venue")} {...register("venue")} />
              </Field>
              <Field id="settings-budget" label="Budget" error={errors.budget?.message}>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  {...fieldAria("settings-budget", errors.budget?.message)}
                  {...register("budget", { valueAsNumber: true })}
                />
              </Field>
              <Field id="settings-currency" label="Currency">
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="settings-currency" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((code) => (
                          <SelectItem key={code} value={code}>
                            {code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field id="settings-guests" label="Guests" error={errors.guestCount?.message}>
                <Input
                  type="number"
                  inputMode="numeric"
                  {...fieldAria("settings-guests", errors.guestCount?.message)}
                  {...register("guestCount", { valueAsNumber: true })}
                />
              </Field>
            </div>
            <Field id="settings-atmosphere" label="Atmosphere" optional>
              <Input {...fieldAria("settings-atmosphere")} {...register("atmosphere")} />
            </Field>
            <Controller
              control={control}
              name="styles"
              render={({ field }) => (
                <div className="grid gap-2.5">
                  <p className="text-[0.8125rem] font-medium">Styles</p>
                  <ChipGroup
                    label="Styles"
                    options={STYLE_OPTIONS}
                    value={field.value ?? []}
                    onChange={field.onChange}
                  />
                </div>
              )}
            />
            <Controller
              control={control}
              name="foodPreferences"
              render={({ field }) => (
                <div className="grid gap-2.5">
                  <p className="text-[0.8125rem] font-medium">Food</p>
                  <ChipGroup
                    label="Food"
                    options={FOOD_OPTIONS}
                    value={field.value ?? []}
                    onChange={field.onChange}
                  />
                </div>
              )}
            />
            <Controller
              control={control}
              name="activities"
              render={({ field }) => (
                <div className="grid gap-2.5">
                  <p className="text-[0.8125rem] font-medium">Moments</p>
                  <ChipGroup
                    label="Moments"
                    options={activityOptions}
                    value={field.value ?? []}
                    onChange={field.onChange}
                  />
                </div>
              )}
            />
            <Field id="settings-notes" label="Additional requirements" optional error={errors.notes?.message}>
              <Textarea
                rows={4}
                {...fieldAria("settings-notes", errors.notes?.message)}
                {...register("notes")}
              />
            </Field>
          </div>
          <SheetFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
              Save changes
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
