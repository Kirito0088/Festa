"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/errors";
import { scheduleSchema, type ScheduleValues } from "./schedule-schema";

const EMPTY: ScheduleValues = { time: "", title: "", notes: "" };

export function ScheduleDialog({
  open,
  onOpenChange,
  eventId,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: Id<"events">;
  item: Doc<"scheduleItems"> | null;
}) {
  const create = useMutation(api.schedule.create);
  const update = useMutation(api.schedule.update);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleValues>({ resolver: zodResolver(scheduleSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(item ? { time: item.time, title: item.title, notes: item.notes } : EMPTY);
  }, [open, item, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (item) {
        await update({ itemId: item._id, ...values });
        toast.success("Schedule updated.");
      } else {
        await create({ eventId, ...values });
        toast.success("Added to the schedule.");
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
          <DialogTitle>{item ? "Edit this moment" : "Add to the day"}</DialogTitle>
          <DialogDescription>
            Times use the 24-hour clock. Anything from midnight to 5 a.m. counts as the same night and goes at
            the end.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-[9rem_1fr]">
            <Field id="schedule-time" label="Time" error={errors.time?.message}>
              <Input
                type="time"
                {...fieldAria("schedule-time", errors.time?.message)}
                {...register("time")}
              />
            </Field>
            <Field id="schedule-title" label="What happens" error={errors.title?.message}>
              <Input {...fieldAria("schedule-title", errors.title?.message)} {...register("title")} />
            </Field>
          </div>
          <Field id="schedule-notes" label="Notes" optional error={errors.notes?.message}>
            <Textarea
              rows={3}
              {...fieldAria("schedule-notes", errors.notes?.message)}
              {...register("notes")}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
              {item ? "Save changes" : "Add to the day"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
