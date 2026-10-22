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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, fieldAria } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MoneyInput, optionalNumber, requiredNumber } from "@/components/ui/money-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, CATEGORY_LABELS, LIMITS } from "@/lib/constants";
import { errorMessage } from "@/lib/errors";

const money = z
  .number({ error: "Enter an amount." })
  .min(0, "Amounts can't be negative.")
  .max(LIMITS.moneyMax);

const schema = z.object({
  name: z.string().trim().min(1, "Give this line a name.").max(LIMITS.nameMax),
  category: z.enum(CATEGORIES),
  estimated: money,
  actual: money.nullable(),
  paid: money,
  notes: z.string().trim().max(1000),
});

type Values = z.infer<typeof schema>;

function valuesFor(item: Doc<"budgetItems"> | null): Values {
  if (item) {
    const { name, category, estimated, actual, paid, notes } = item;
    return { name, category, estimated, actual, paid, notes };
  }
  // The estimate stays empty until typed; the schema then asks for an amount.
  return {
    name: "",
    category: "venue",
    estimated: undefined as unknown as number,
    actual: null,
    paid: 0,
    notes: "",
  };
}

export function BudgetItemDialog({
  open,
  onOpenChange,
  eventId,
  currency,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: Id<"events">;
  currency: string;
  item: Doc<"budgetItems"> | null;
}) {
  const create = useMutation(api.budget.create);
  const update = useMutation(api.budget.update);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: valuesFor(item) });

  useEffect(() => {
    if (open) reset(valuesFor(item));
  }, [open, item, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (item) {
        await update({ itemId: item._id, ...values });
        toast.success("Budget line updated.");
      } else {
        await create({ eventId, ...values });
        toast.success("Budget line added.");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Edit budget line" : "New budget line"}</DialogTitle>
          <DialogDescription>
            Leave the actual cost empty until you have a final quote or invoice.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="grid gap-5">
          <Field id="budget-name" label="Name" error={errors.name?.message}>
            <Input {...fieldAria("budget-name", errors.name?.message)} {...register("name")} />
          </Field>
          <Field id="budget-category" label="Category">
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="budget-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {CATEGORY_LABELS[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field id="budget-estimated" label="Estimated" error={errors.estimated?.message}>
              <MoneyInput
                currency={currency}
                {...fieldAria("budget-estimated", errors.estimated?.message)}
                {...register("estimated", { setValueAs: requiredNumber })}
              />
            </Field>
            <Field id="budget-actual" label="Actual" optional error={errors.actual?.message}>
              <MoneyInput
                currency={currency}
                placeholder="—"
                {...fieldAria("budget-actual", errors.actual?.message)}
                {...register("actual", { setValueAs: optionalNumber })}
              />
            </Field>
            <Field id="budget-paid" label="Paid so far" error={errors.paid?.message}>
              <MoneyInput
                currency={currency}
                {...fieldAria("budget-paid", errors.paid?.message)}
                {...register("paid", { setValueAs: requiredNumber })}
              />
            </Field>
          </div>
          <Field id="budget-notes" label="Notes" optional error={errors.notes?.message}>
            <Textarea rows={3} {...fieldAria("budget-notes", errors.notes?.message)} {...register("notes")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
              {item ? "Save changes" : "Add line"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
