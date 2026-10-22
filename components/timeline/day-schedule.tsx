"use client";

import { useMutation, useQuery } from "convex/react";
import { Clock3, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useEventContext } from "@/components/events/event-context";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIsoDate } from "@/lib/dates";
import { errorMessage } from "@/lib/errors";
import { ScheduleDialog } from "./schedule-dialog";

/** The run sheet for the day itself, editable line by line. */
export function DaySchedule() {
  const { event } = useEventContext();
  const items = useQuery(api.schedule.list, { eventId: event._id });
  const remove = useMutation(api.schedule.remove);
  const [editing, setEditing] = useState<Doc<"scheduleItems"> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Doc<"scheduleItems"> | null>(null);

  function open(item: Doc<"scheduleItems"> | null) {
    setEditing(item);
    setDialogOpen(true);
  }

  return (
    <Panel
      title="On the day"
      description={`The run sheet for ${formatIsoDate(event.date, "invitation")}. Share it with your vendors and family helpers.`}
      action={
        items?.length ? (
          <Button size="sm" variant="outline" onClick={() => open(null)}>
            <Plus aria-hidden="true" /> Add
          </Button>
        ) : undefined
      }
    >
      {items === undefined ? (
        <Skeleton className="h-48" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Clock3}
          title="Nothing scheduled for the day yet"
          description="Plan the day hour by hour: when vendors arrive, when guests come in, and when each moment happens."
          action={
            <Button onClick={() => open(null)}>
              <Plus aria-hidden="true" /> Add the first moment
            </Button>
          }
        />
      ) : (
        <ol className="grid gap-0.5">
          {items.map((item) => (
            <li
              key={item._id}
              className="grid grid-cols-[4rem_1fr_auto] items-start gap-3 rounded-2xl px-2 py-2.5 sm:grid-cols-[5rem_1fr_auto]"
            >
              <time className="type-title tabular pt-0.5 text-[1.125rem]" dateTime={item.time}>
                {item.time}
              </time>
              <div className="min-w-0">
                <p className="text-[0.9375rem] font-medium">{item.title}</p>
                {item.notes && <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">{item.notes}</p>}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${item.title}`}>
                    <MoreHorizontal aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onSelect={() => open(item)}>
                    <Pencil aria-hidden="true" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(item)}>
                    <Trash2 aria-hidden="true" /> Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ol>
      )}

      <ScheduleDialog open={dialogOpen} onOpenChange={setDialogOpen} eventId={event._id} item={editing} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(next) => !next && setDeleting(null)}
        title={`Remove “${deleting?.title ?? ""}”?`}
        description="It comes off the day's schedule. Your tasks and budget are unaffected."
        confirmLabel="Remove"
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove({ itemId: deleting._id });
            toast.success("Removed from the schedule.");
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
      />
    </Panel>
  );
}
