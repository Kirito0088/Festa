"use client";

import { cn } from "cn";
import { Baby, Building2, Cake, Gem, Heart, Sparkles, Users, Wine, type LucideIcon } from "lucide-react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { ChipGroup } from "@/components/ui/chip";
import { Field, fieldAria } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ACTIVITY_OPTIONS,
  CURRENCIES,
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  FOOD_OPTIONS,
  STYLE_OPTIONS,
  VENUE_OPTIONS,
  type EventType,
} from "@/lib/constants";
import { formatIsoDate, isIsoDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { WizardValues } from "./wizard-schema";

const TYPE_ICONS: Record<EventType, LucideIcon> = {
  wedding: Heart,
  engagement: Gem,
  birthday: Cake,
  anniversary: Wine,
  "baby-shower": Baby,
  community: Users,
  corporate: Building2,
  other: Sparkles,
};

export function OccasionStep() {
  const {
    control,
    formState: { errors },
  } = useFormContext<WizardValues>();
  return (
    <Controller
      control={control}
      name="type"
      render={({ field }) => (
        <div>
          <div role="radiogroup" aria-label="Occasion" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {EVENT_TYPES.map((type) => {
              const Icon = TYPE_ICONS[type];
              const selected = field.value === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => field.onChange(type)}
                  className={cn(
                    "flex cursor-pointer flex-col items-start gap-6 rounded-2xl border p-4 text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.98] motion-reduce:active:scale-100",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-[#cfc6b6]",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span className="text-[0.9375rem] font-medium">{EVENT_TYPE_LABELS[type]}</span>
                </button>
              );
            })}
          </div>
          {errors.type && (
            <p role="alert" className="mt-3 text-[0.8125rem] text-danger">
              {errors.type.message}
            </p>
          )}
        </div>
      )}
    />
  );
}

export function BasicsStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<WizardValues>();
  return (
    <div className="grid gap-6">
      <Field id="name" label="Celebration name" error={errors.name?.message}>
        <Input
          placeholder="e.g. Meera & Kabir's Engagement"
          autoComplete="off"
          {...fieldAria("name", errors.name?.message)}
          {...register("name")}
        />
      </Field>
      <Field id="date" label="Date" error={errors.date?.message}>
        <Input
          type="date"
          className="max-w-xs"
          {...fieldAria("date", errors.date?.message)}
          {...register("date")}
        />
      </Field>
    </div>
  );
}

export function PlaceStep() {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<WizardValues>();
  const venue = useWatch({ control, name: "venue" });
  return (
    <div className="grid gap-6">
      <Field id="city" label="City" optional error={errors.city?.message}>
        <Input
          placeholder="e.g. Jaipur"
          autoComplete="address-level2"
          {...fieldAria("city", errors.city?.message)}
          {...register("city")}
        />
      </Field>
      <div className="grid gap-3">
        <p className="text-[0.8125rem] font-medium" id="venue-label">
          Venue preference <span className="font-normal text-muted-foreground">Optional</span>
        </p>
        <div role="group" aria-labelledby="venue-label" className="flex flex-wrap gap-2">
          {VENUE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={venue === option}
              onClick={() => setValue("venue", venue === option ? "" : option, { shouldDirty: true })}
              className={cn(
                "h-10 cursor-pointer rounded-full border px-4 text-[0.875rem] transition-colors",
                venue === option
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-[#cfc6b6]",
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <Input
          aria-label="Or describe the venue"
          placeholder="Or describe it: a rooftop, a family home…"
          {...register("venue")}
        />
      </div>
    </div>
  );
}

const BUDGET_PRESETS: Record<string, number[]> = {
  INR: [100000, 200000, 500000, 1000000, 2500000],
  USD: [2000, 5000, 10000, 25000, 50000],
};

export function ScaleStep() {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<WizardValues>();
  const currency = useWatch({ control, name: "currency" });
  const budget = useWatch({ control, name: "budget" });
  const presets = BUDGET_PRESETS[currency] ?? BUDGET_PRESETS.USD;

  return (
    <div className="grid gap-7">
      <div className="grid gap-3 sm:grid-cols-[1fr_9rem] sm:items-start">
        <Field id="budget" label="Total budget" error={errors.budget?.message}>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder="200000"
            {...fieldAria("budget", errors.budget?.message)}
            {...register("budget", { valueAsNumber: true })}
          />
        </Field>
        <Field id="currency" label="Currency">
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="currency" className="w-full">
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
      </div>
      <div className="-mt-3 flex flex-wrap gap-2" role="group" aria-label="Budget presets">
        {presets.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => setValue("budget", amount, { shouldValidate: true, shouldDirty: true })}
            className={cn(
              "tabular h-8 cursor-pointer rounded-full border px-3 text-[0.8125rem] transition-colors",
              budget === amount
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-[#cfc6b6]",
            )}
          >
            {formatMoney(amount, currency, { compact: true })}
          </button>
        ))}
      </div>
      <Field
        id="guestCount"
        label="Guests"
        error={errors.guestCount?.message}
        hint="An estimate is fine. You can change it later."
      >
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          className="max-w-xs"
          {...fieldAria("guestCount", errors.guestCount?.message, true)}
          {...register("guestCount", { valueAsNumber: true })}
        />
      </Field>
    </div>
  );
}

export function StyleStep() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<WizardValues>();
  return (
    <div className="grid gap-7">
      <Controller
        control={control}
        name="styles"
        render={({ field }) => (
          <div className="grid gap-3">
            <p className="text-[0.8125rem] font-medium">Styles</p>
            <ChipGroup label="Styles" options={STYLE_OPTIONS} value={field.value} onChange={field.onChange} />
            {errors.styles && <p className="text-[0.8125rem] text-danger">{errors.styles.message}</p>}
          </div>
        )}
      />
      <Field
        id="atmosphere"
        label="Atmosphere"
        optional
        hint="In a few words: calm and intimate, a big festive party…"
      >
        <Input
          placeholder="Warm, festive and family-first"
          {...fieldAria("atmosphere", errors.atmosphere?.message, true)}
          {...register("atmosphere")}
        />
      </Field>
    </div>
  );
}

export function FoodStep() {
  const { control } = useFormContext<WizardValues>();
  return (
    <Controller
      control={control}
      name="foodPreferences"
      render={({ field }) => (
        <ChipGroup
          label="Food preferences"
          options={FOOD_OPTIONS}
          value={field.value}
          onChange={field.onChange}
        />
      )}
    />
  );
}

export function MomentsStep() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<WizardValues>();
  const type = useWatch({ control, name: "type" });
  return (
    <div className="grid gap-7">
      <Controller
        control={control}
        name="activities"
        render={({ field }) => (
          <ChipGroup
            label="Activities"
            options={ACTIVITY_OPTIONS[type ?? "other"]}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Field
        id="notes"
        label="Anything else?"
        optional
        error={errors.notes?.message}
        hint="Accessibility needs, family traditions, must-haves, things to avoid."
      >
        <Textarea
          rows={4}
          placeholder="Grandparents attending: keep seating close to the stage."
          {...fieldAria("notes", errors.notes?.message, true)}
          {...register("notes")}
        />
      </Field>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-t border-border py-3 first:border-t-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export function ReviewStep() {
  const { control } = useFormContext<WizardValues>();
  const values = useWatch({ control });
  const list = (items?: string[]) => (items && items.length ? items.join(", ") : "—");
  return (
    <div className="grid gap-6">
      <dl className="surface px-5 py-2 text-[0.875rem]">
        <ReviewRow label="Occasion" value={values.type ? EVENT_TYPE_LABELS[values.type] : "—"} />
        <ReviewRow label="Name" value={values.name || "—"} />
        <ReviewRow
          label="Date"
          value={values.date && isIsoDate(values.date) ? formatIsoDate(values.date) : "—"}
        />
        <ReviewRow label="Place" value={[values.venue, values.city].filter(Boolean).join(", ") || "—"} />
        <ReviewRow
          label="Budget"
          value={
            typeof values.budget === "number" && Number.isFinite(values.budget)
              ? formatMoney(values.budget, values.currency ?? "INR")
              : "—"
          }
        />
        <ReviewRow label="Guests" value={values.guestCount ? String(values.guestCount) : "—"} />
        <ReviewRow label="Style" value={list(values.styles)} />
        <ReviewRow label="Food" value={list(values.foodPreferences)} />
        <ReviewRow label="Moments" value={list(values.activities)} />
      </dl>
      <Controller
        control={control}
        name="useAI"
        render={({ field }) => (
          <label className="surface flex cursor-pointer items-start justify-between gap-4 p-5">
            <span>
              <span className="flex items-center gap-2 text-[0.9375rem] font-medium">
                <Sparkles className="size-4 text-sage-strong" aria-hidden="true" />
                Generate with AI
              </span>
              <span className="mt-1 block text-[0.8125rem] leading-relaxed text-muted-foreground">
                Uses Groq&rsquo;s free tier to tailor the plan. If AI is busy or off, Festa&rsquo;s built-in
                planner creates it instead — you&rsquo;ll see which one was used.
              </span>
            </span>
            <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Generate with AI" />
          </label>
        )}
      />
    </div>
  );
}
