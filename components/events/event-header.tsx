"use client";

import { useMutation } from "convex/react";
import {
  ArrowLeft,
  CalendarPlus,
  Loader2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
  TriangleAlert,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { lazy, Suspense, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { currentIsoDate, useToday } from "@/hooks/use-today";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { countdownTo, formatIsoDate } from "@/lib/dates";
import { errorMessage } from "@/lib/errors";
import { googleCalendarUrl, googleMapsSearchUrl } from "@/lib/google";
import { useEventContext } from "./event-context";

const loadSettingsDialog = () => import("./event-settings-dialog");
const EventSettingsDialog = lazy(() =>
  loadSettingsDialog().then((module) => ({ default: module.EventSettingsDialog })),
);

export function EventHeader() {
  const { event } = useEventContext();
  const today = useToday();
  const router = useRouter();
  const removeEvent = useMutation(api.events.remove);
  const regenerate = useMutation(api.plans.regenerate);
  const [editing, setEditing] = useState(false);
  // The form (with zod and react-hook-form) loads on first open, then stays
  // mounted so its close animation can play.
  const [editedOnce, setEditedOnce] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const countdown = today ? countdownTo(event.date, today) : null;
  const place = [event.venue, event.city].filter(Boolean).join(", ");

  return (
    <header className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" /> All celebrations
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-4 pb-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="type-eyebrow">{EVENT_TYPE_LABELS[event.type]}</p>
            {event.isDemo && <Badge variant="secondary">Sample data</Badge>}
          </div>
          <h1 className="type-display mt-2 text-[2.5rem] break-words sm:text-[3.5rem]">{event.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.875rem] text-muted-foreground">
            <span className="font-medium text-foreground">{formatIsoDate(event.date, "weekday")}</span>
            {countdown && (
              <span className="tabular">
                {countdown.isToday
                  ? "Today"
                  : countdown.isPast
                    ? `${Math.abs(countdown.days)} days ago`
                    : `${countdown.days} days to go`}
              </span>
            )}
            {place && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden="true" /> {place}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" aria-hidden="true" /> {event.guestCount} guests
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onPointerEnter={loadSettingsDialog}
            onFocus={loadSettingsDialog}
            onClick={() => {
              setEditedOnce(true);
              setEditing(true);
            }}
          >
            <Pencil aria-hidden="true" /> Edit details
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="More actions">
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem asChild>
                <a
                  href={googleCalendarUrl({
                    title: event.name,
                    date: event.date,
                    location: place || undefined,
                    details: "Planned with Festa.",
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CalendarPlus aria-hidden="true" /> Add to Google Calendar
                </a>
              </DropdownMenuItem>
              {place && (
                <DropdownMenuItem asChild>
                  <a href={googleMapsSearchUrl(place)} target="_blank" rel="noopener noreferrer">
                    <MapPin aria-hidden="true" /> Open in Google Maps
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2 aria-hidden="true" /> Delete celebration
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {event.planStatus === "generating" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              role="status"
              className="mb-6 flex items-center gap-3 rounded-2xl bg-sage-soft px-4 py-3 text-[0.875rem] text-sage-strong"
            >
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Drafting your blueprint — budget, timeline and ideas will appear here in a few seconds.
            </div>
          </motion.div>
        )}
        {event.planStatus === "failed" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              role="alert"
              className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-danger-soft px-4 py-3 text-[0.875rem] text-danger"
            >
              <span className="inline-flex items-center gap-2">
                <TriangleAlert className="size-4" aria-hidden="true" />
                The blueprint couldn&rsquo;t be generated. Everything else still works.
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await regenerate({ eventId: event._id, useAI: false, today: currentIsoDate() });
                  } catch (error) {
                    toast.error(errorMessage(error));
                  }
                }}
              >
                Use the built-in planner
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {editedOnce && (
        <Suspense fallback={null}>
          <EventSettingsDialog open={editing} onOpenChange={setEditing} />
        </Suspense>
      )}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${event.name}?`}
        description="This permanently removes the celebration with its budget, tasks, vendors, inspiration and conversations. This can't be undone."
        confirmLabel="Delete celebration"
        onConfirm={async () => {
          try {
            await removeEvent({ eventId: event._id });
            toast.success("Celebration deleted.");
            router.replace("/events");
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
      />
    </header>
  );
}
