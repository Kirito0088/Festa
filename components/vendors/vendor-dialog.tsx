"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Field, fieldAria } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MoneyInput, optionalNumber } from "@/components/ui/money-input";
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
  CATEGORIES,
  CATEGORY_LABELS,
  LIMITS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  VENDOR_STATUSES,
  VENDOR_STATUS_LABELS,
  type Category,
} from "@/lib/constants";
import { errorMessage } from "@/lib/errors";

const money = z.number().min(0, "Amounts can't be negative.").max(LIMITS.moneyMax).nullable();

const schema = z.object({
  name: z.string().trim().min(1, "Enter the vendor's name.").max(LIMITS.nameMax),
  category: z.enum(CATEGORIES),
  contactName: z.string().trim().max(LIMITS.nameMax),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v === "" || /^[+\d][\d\s().-]{5,}$/.test(v), "Enter a valid phone number."),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email address.")]),
  website: z.string().trim().max(300),
  quoteEstimated: money,
  quoteActual: money,
  status: z.enum(VENDOR_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES),
  notes: z.string().trim().max(1000),
});

type Values = z.infer<typeof schema>;

export function VendorDialog({
  open,
  onOpenChange,
  eventId,
  currency,
  vendor,
  defaultCategory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: Id<"events">;
  currency: string;
  vendor: Doc<"vendors"> | null;
  defaultCategory?: Category;
}) {
  const create = useMutation(api.vendors.create);
  const update = useMutation(api.vendors.update);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    reset({
      name: vendor?.name ?? "",
      category: vendor?.category ?? defaultCategory ?? "venue",
      contactName: vendor?.contactName ?? "",
      phone: vendor?.phone ?? "",
      email: vendor?.email ?? "",
      website: vendor?.website ?? "",
      quoteEstimated: vendor?.quoteEstimated ?? null,
      quoteActual: vendor?.quoteActual ?? null,
      status: vendor?.status ?? "researching",
      paymentStatus: vendor?.paymentStatus ?? "unpaid",
      notes: vendor?.notes ?? "",
    });
  }, [open, vendor, defaultCategory, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (vendor) {
        await update({ vendorId: vendor._id, ...values });
        toast.success("Vendor updated.");
      } else {
        await create({ eventId, ...values });
        toast.success("Vendor added.");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  });

  const selectField = <K extends "category" | "status" | "paymentStatus">(
    name: K,
    id: string,
    options: readonly string[],
    labels: Record<string, string>,
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value as string} onValueChange={field.onChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {labels[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0">
        <SheetHeader>
          <SheetTitle>{vendor ? "Edit vendor" : "New vendor"}</SheetTitle>
          <SheetDescription>
            Keep quotes and contacts in one place. Only you can see this information.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="grid flex-1 gap-5 overflow-y-auto px-6 py-5">
            <Field id="vendor-name" label="Vendor name" error={errors.name?.message}>
              <Input {...fieldAria("vendor-name", errors.name?.message)} {...register("name")} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="vendor-category" label="Category">
                {selectField("category", "vendor-category", CATEGORIES, CATEGORY_LABELS)}
              </Field>
              <Field id="vendor-status" label="Booking status">
                {selectField("status", "vendor-status", VENDOR_STATUSES, VENDOR_STATUS_LABELS)}
              </Field>
              <Field
                id="vendor-estimate"
                label="Estimated quote"
                optional
                error={errors.quoteEstimated?.message}
              >
                <MoneyInput
                  currency={currency}
                  placeholder="—"
                  {...fieldAria("vendor-estimate", errors.quoteEstimated?.message)}
                  {...register("quoteEstimated", { setValueAs: optionalNumber })}
                />
              </Field>
              <Field id="vendor-actual" label="Final quote" optional error={errors.quoteActual?.message}>
                <MoneyInput
                  currency={currency}
                  placeholder="—"
                  {...fieldAria("vendor-actual", errors.quoteActual?.message)}
                  {...register("quoteActual", { setValueAs: optionalNumber })}
                />
              </Field>
              <Field id="vendor-payment" label="Payment">
                {selectField("paymentStatus", "vendor-payment", PAYMENT_STATUSES, PAYMENT_STATUS_LABELS)}
              </Field>
              <Field id="vendor-contact" label="Contact person" optional>
                <Input autoComplete="off" {...fieldAria("vendor-contact")} {...register("contactName")} />
              </Field>
              <Field id="vendor-phone" label="Phone" optional error={errors.phone?.message}>
                <Input
                  type="tel"
                  autoComplete="off"
                  {...fieldAria("vendor-phone", errors.phone?.message)}
                  {...register("phone")}
                />
              </Field>
              <Field id="vendor-email" label="Email" optional error={errors.email?.message}>
                <Input
                  type="email"
                  autoComplete="off"
                  {...fieldAria("vendor-email", errors.email?.message)}
                  {...register("email")}
                />
              </Field>
            </div>
            <Field id="vendor-website" label="Website" optional>
              <Input
                type="url"
                placeholder="https://"
                {...fieldAria("vendor-website")}
                {...register("website")}
              />
            </Field>
            <Field id="vendor-notes" label="Notes" optional error={errors.notes?.message}>
              <Textarea
                rows={4}
                {...fieldAria("vendor-notes", errors.notes?.message)}
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
              {vendor ? "Save changes" : "Add vendor"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
