"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { requiredNumber } from "@/components/ui/money-input";
import { Segmented } from "@/components/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, CATEGORY_LABELS, LIMITS, PRIORITIES } from "@/lib/constants";
import { formatIsoDate, isIsoDate, resolveDueDate } from "@/lib/dates";
import { errorMessage } from "@/lib/errors";

const schema = z
  .object({
    title: z.string().trim().min(1, "Give the task a title.").max(LIMITS.nameMax),
    notes: z.string().trim().max(1000),
    category: z.enum(CATEGORIES),
    priority: z.enum(PRIORITIES),
    dueMode: z.enum(["relative", "fixed", "none"]),
    offsetAmount: z.number(),
    offsetUnit: z.enum(["days", "weeks"]),
    dueDate: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.dueMode === "relative") {
      const days = values.offsetAmount * (values.offsetUnit === "weeks" ? 7 : 1);
      if (!Number.isInteger(values.offsetAmount) || values.offsetAmount < 0 || days > LIMITS.offsetDaysMax) {
        ctx.addIssue({
          code: "custom",
          path: ["offsetAmount"],
          message: "Use a whole number up to two years.",
        });
      }
    }
    if (values.dueMode === "fixed" && !isIsoDate(values.dueDate)) {
      ctx.addIssue({ code: "custom", path: ["dueDate"], message: "Choose a due date." });
    }
  });

type Values = z.infer<typeof schema>;

/** Form values for a task, or the defaults for a new one. */
function valuesFor(task: Doc<"tasks"> | null): Values {
  const offset = task?.offsetDays ?? 14;
  const inWeeks = offset >= 14 && offset % 7 === 0;
  return {
    title: task?.title ?? "",
    notes: task?.notes ?? "",
    category: task?.category ?? "other",
    priority: task?.priority ?? "medium",
    dueMode: task?.dueMode ?? "relative",
    offsetAmount: inWeeks ? offset / 7 : offset,
    offsetUnit: inWeeks ? "weeks" : "days",
    dueDate: task?.dueDate ?? "",
  };
}

function toOffsetDays(values: Values): number {
  return values.offsetAmount * (values.offsetUnit === "weeks" ? 7 : 1);
}

export function TaskDialog({
  open,
  onOpenChange,
  eventId,
  eventDate,
  task,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: Id<"events">;
  eventDate: string;
  task: Doc<"tasks"> | null;
}) {
  const create = useMutation(api.tasks.create);
  const update = useMutation(api.tasks.update);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: valuesFor(task) });

  useEffect(() => {
    if (open) reset(valuesFor(task));
  }, [open, task, reset]);

  const values = useWatch({ control });
  const preview =
    values.dueMode === "relative" && Number.isFinite(values.offsetAmount)
      ? resolveDueDate(
          {
            dueMode: "relative",
            offsetDays: (values.offsetAmount ?? 0) * (values.offsetUnit === "weeks" ? 7 : 1),
          },
          eventDate,
        )
      : null;

  const onSubmit = handleSubmit(async (v) => {
    const due =
      v.dueMode === "relative"
        ? { dueMode: v.dueMode, offsetDays: toOffsetDays(v) }
        : v.dueMode === "fixed"
          ? { dueMode: v.dueMode, dueDate: v.dueDate }
          : { dueMode: v.dueMode };
    const fields = { title: v.title, notes: v.notes, category: v.category, priority: v.priority, ...due };
    try {
      if (task) {
        await update({ taskId: task._id, ...fields });
        toast.success("Task updated.");
      } else {
        await create({ eventId, ...fields });
        toast.success("Task added.");
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
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            Deadlines set &ldquo;before the event&rdquo; move automatically if the date changes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="grid gap-5">
          <Field id="task-title" label="Task" error={errors.title?.message}>
            <Input {...fieldAria("task-title", errors.title?.message)} {...register("title")} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="task-category" label="Category">
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="task-category" className="w-full">
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
            <div className="grid gap-2">
              <span className="text-[0.8125rem] font-medium">Priority</span>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Segmented
                    label="Priority"
                    value={field.value ?? "medium"}
                    onChange={field.onChange}
                    options={[
                      { value: "low", label: "Low" },
                      { value: "medium", label: "Medium" },
                      { value: "high", label: "High" },
                    ]}
                    className="w-full"
                  />
                )}
              />
            </div>
          </div>

          <div className="grid gap-3">
            <span className="text-[0.8125rem] font-medium">Deadline</span>
            <Controller
              control={control}
              name="dueMode"
              render={({ field }) => (
                <Segmented
                  label="Deadline type"
                  value={field.value ?? "relative"}
                  onChange={field.onChange}
                  options={[
                    { value: "relative", label: "Before the event" },
                    { value: "fixed", label: "On a date" },
                    { value: "none", label: "None" },
                  ]}
                  className="w-full"
                />
              )}
            />
            {values.dueMode === "relative" && (
              <div className="grid gap-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    aria-label="Amount of time before the event"
                    className="w-28"
                    aria-invalid={errors.offsetAmount ? true : undefined}
                    {...register("offsetAmount", { setValueAs: requiredNumber })}
                  />
                  <Controller
                    control={control}
                    name="offsetUnit"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger aria-label="Unit" className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">days</SelectItem>
                          <SelectItem value="weeks">weeks</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <span className="self-center text-[0.875rem] text-muted-foreground">before</span>
                </div>
                {errors.offsetAmount ? (
                  <p role="alert" className="text-[0.8125rem] text-danger">
                    {errors.offsetAmount.message}
                  </p>
                ) : (
                  preview && (
                    <p className="text-[0.8125rem] text-muted-foreground">
                      Due {formatIsoDate(preview, "weekday")}
                    </p>
                  )
                )}
              </div>
            )}
            {values.dueMode === "fixed" && (
              <Field id="task-due" label="Due date" error={errors.dueDate?.message}>
                <Input
                  type="date"
                  className="max-w-xs"
                  {...fieldAria("task-due", errors.dueDate?.message)}
                  {...register("dueDate")}
                />
              </Field>
            )}
          </div>

          <Field id="task-notes" label="Notes" optional error={errors.notes?.message}>
            <Textarea rows={3} {...fieldAria("task-notes", errors.notes?.message)} {...register("notes")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
              {task ? "Save changes" : "Add task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
