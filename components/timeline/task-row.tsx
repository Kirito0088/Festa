"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "cn";
import { CalendarPlus, GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATEGORY_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { describeOffset, type DeadlineState } from "@/lib/dates";
import { googleCalendarUrl } from "@/lib/google";
import { spring } from "@/lib/motion";
import { DeadlineChip } from "./deadline-chip";

export type TimelineTask = Doc<"tasks"> & { due: string | null; state: DeadlineState };

const PRIORITY_DOT = {
  high: "bg-blush-strong",
  medium: "bg-sand-strong",
  low: "bg-[#c9c2b4]",
} as const;

function CheckCircle({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className="relative grid size-6 shrink-0 cursor-pointer place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <motion.span
        className="absolute inset-0 rounded-full border-[1.5px]"
        initial={false}
        animate={{
          backgroundColor: checked ? "var(--sage-strong)" : "rgba(0,0,0,0)",
          borderColor: checked ? "var(--sage-strong)" : "var(--input)",
          scale: checked ? [1, 0.86, 1] : 1,
        }}
        // Springs only animate between two keyframes, so the press-in pulse is a tween.
        transition={{ ...spring.momentum, scale: { type: "tween", duration: 0.3, ease: "easeOut" } }}
      />
      <svg viewBox="0 0 16 16" className="relative size-3.5" aria-hidden="true">
        <motion.path
          d="M3.5 8.5 6.5 11.5 12.5 4.5"
          fill="none"
          stroke="var(--ivory)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={spring.snappy}
        />
      </svg>
    </button>
  );
}

export function TaskRow({
  task,
  eventName,
  today,
  sortable,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: TimelineTask;
  eventName: string;
  today: string;
  sortable: boolean;
  onToggle: (completed: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task._id,
      disabled: !sortable,
    });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative flex items-center gap-3 bg-card px-4 py-3.5 sm:px-5",
        isDragging && "z-10 rounded-2xl shadow-[var(--shadow-lifted)] ring-1 ring-foreground/8",
      )}
    >
      {sortable && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${task.title}`}
          className="-ml-1 cursor-grab touch-none rounded-md p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
      )}
      <CheckCircle
        checked={task.completed}
        onToggle={() => onToggle(!task.completed)}
        label={`${task.completed ? "Reopen" : "Complete"} ${task.title}`}
      />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onEdit}
          className={cn(
            "max-w-full cursor-pointer truncate text-left text-[0.9375rem] transition-colors",
            task.completed
              ? "text-muted-foreground line-through decoration-[#bfb7a8]"
              : "hover:underline hover:underline-offset-4",
          )}
        >
          {task.title}
        </button>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] text-muted-foreground">
          {/* On narrow screens the deadline moves into the meta line. */}
          <DeadlineChip due={task.due} state={task.state} today={today} className="h-5 px-2 sm:hidden" />
          <span className="inline-flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", PRIORITY_DOT[task.priority])} aria-hidden="true" />
            {PRIORITY_LABELS[task.priority]}
          </span>
          <span aria-hidden="true">·</span>
          <span>{CATEGORY_LABELS[task.category]}</span>
          {task.dueMode === "relative" && task.offsetDays !== undefined && (
            <>
              <span aria-hidden="true">·</span>
              <span>{describeOffset(task.offsetDays)}</span>
            </>
          )}
          {task.source === "concierge" && (
            <>
              <span aria-hidden="true">·</span>
              <span>From concierge</span>
            </>
          )}
        </p>
      </div>
      <DeadlineChip due={task.due} state={task.state} today={today} className="hidden sm:inline-flex" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${task.title}`}>
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil aria-hidden="true" /> Edit
          </DropdownMenuItem>
          {task.due && (
            <DropdownMenuItem asChild>
              <a
                href={googleCalendarUrl({
                  title: task.title,
                  date: task.due,
                  details: `Festa task for ${eventName}`,
                })}
                target="_blank"
                rel="noopener noreferrer"
              >
                <CalendarPlus aria-hidden="true" /> Add to Google Calendar
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 aria-hidden="true" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
