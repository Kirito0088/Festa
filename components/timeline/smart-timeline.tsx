"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation, useQuery } from "convex/react";
import { CalendarCheck2, Plus } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useEventContext } from "@/components/events/event-context";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Segmented } from "@/components/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToday } from "@/hooks/use-today";
import { CATEGORIES, CATEGORY_LABELS, PRIORITIES, PRIORITY_LABELS } from "@/lib/constants";
import { daysBetween } from "@/lib/dates";
import { errorMessage } from "@/lib/errors";
import {
  DEADLINE_GROUP_LABELS,
  deadlineGroup,
  mergeReorder,
  resolveTasks,
  sortTasks,
  type DeadlineGroup,
  type TaskSort,
} from "@/lib/tasks";
import { TaskDialog } from "./task-dialog";
import { TaskRow, type TimelineTask } from "./task-row";

type StatusFilter = "open" | "done" | "all";
const GROUP_ORDER: DeadlineGroup[] = ["overdue", "week", "month", "later", "undated", "done"];

export function SmartTimeline() {
  const { event } = useEventContext();
  const today = useToday();
  const tasks = useQuery(api.tasks.list, { eventId: event._id });

  const setCompleted = useMutation(api.tasks.setCompleted).withOptimisticUpdate((store, args) => {
    const list = store.getQuery(api.tasks.list, { eventId: event._id });
    if (!list) return;
    store.setQuery(
      api.tasks.list,
      { eventId: event._id },
      list.map((task) => (task._id === args.taskId ? { ...task, completed: args.completed } : task)),
    );
  });
  const reorder = useMutation(api.tasks.reorder).withOptimisticUpdate((store, args) => {
    const list = store.getQuery(api.tasks.list, { eventId: args.eventId });
    if (!list) return;
    const order = new Map(args.orderedIds.map((id, index) => [id, (index + 1) * 1000]));
    store.setQuery(
      api.tasks.list,
      { eventId: args.eventId },
      list
        .map((task) => ({ ...task, order: order.get(task._id) ?? task.order }))
        .sort((a, b) => a.order - b.order),
    );
  });
  const removeTask = useMutation(api.tasks.remove);

  const [status, setStatus] = useState<StatusFilter>("open");
  const [priority, setPriority] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<TaskSort>("due");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Doc<"tasks"> | null>(null);
  const [deleting, setDeleting] = useState<Doc<"tasks"> | null>(null);

  const reduceMotion = useReducedMotion();
  const sensors = useSensors(
    // A small movement threshold separates a drag from a tap.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      scrollBehavior: reduceMotion ? "auto" : "smooth",
    }),
  );

  const resolved = useMemo(
    () => (tasks && today ? resolveTasks(tasks, event.date, today) : null),
    [tasks, today, event.date],
  );

  const visible = useMemo(() => {
    if (!resolved) return [];
    const filtered = resolved.filter(
      (task) =>
        (status === "all" || (status === "done" ? task.completed : !task.completed)) &&
        (priority === "all" || task.priority === priority) &&
        (category === "all" || task.category === category),
    );
    return sortTasks(filtered, sort);
  }, [resolved, status, priority, category, sort]);

  const groups = useMemo(() => {
    if (sort !== "due" || !today) return null;
    const map = new Map<DeadlineGroup, TimelineTask[]>();
    for (const task of visible) {
      const group = deadlineGroup(task, task.due ? daysBetween(today, task.due) : null);
      map.set(group, [...(map.get(group) ?? []), task]);
    }
    return GROUP_ORDER.filter((group) => map.has(group)).map((group) => ({ group, tasks: map.get(group)! }));
  }, [visible, sort, today]);

  const doneCount = resolved?.filter((task) => task.completed).length ?? 0;

  function openTask(task: Doc<"tasks"> | null) {
    setEditing(task);
    setDialogOpen(true);
  }

  async function toggle(task: TimelineTask, completed: boolean) {
    try {
      await setCompleted({ taskId: task._id, completed });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id || !tasks) return;
    const ids = visible.map((task) => task._id as string);
    const moved = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    const full = [...tasks].sort((a, b) => a.order - b.order).map((task) => task._id as string);
    try {
      await reorder({ eventId: event._id, orderedIds: mergeReorder(full, moved) as Id<"tasks">[] });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const renderRow = (task: TimelineTask) => (
    <TaskRow
      key={task._id}
      task={task}
      eventName={event.name}
      today={today ?? task.due ?? event.date}
      sortable={sort === "manual"}
      onToggle={(completed) => toggle(task, completed)}
      onEdit={() => openTask(task)}
      onDelete={() => setDeleting(task)}
    />
  );

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="type-title text-[2rem]">Smart timeline</h2>
          <p className="mt-1 text-[0.875rem] text-muted-foreground">
            {resolved ? `${doneCount} of ${resolved.length} tasks done` : "Loading tasks…"}
          </p>
        </div>
        <Button onClick={() => openTask(null)}>
          <Plus aria-hidden="true" /> Add task
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Status"
          size="sm"
          value={status}
          onChange={setStatus}
          options={[
            { value: "open", label: "Open" },
            { value: "done", label: "Done" },
            { value: "all", label: "All" },
          ]}
        />
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger size="sm" aria-label="Filter by priority" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABELS[p]} priority
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger size="sm" aria-label="Filter by category" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="text-[0.8125rem] text-muted-foreground">Sort</span>
          <Segmented
            label="Sort tasks"
            size="sm"
            value={sort}
            onChange={setSort}
            options={[
              { value: "due", label: "Deadline" },
              { value: "priority", label: "Priority" },
              { value: "manual", label: "Custom" },
            ]}
          />
        </div>
      </div>

      {resolved === null || !today ? (
        <div className="grid gap-2" aria-busy="true">
          {[0, 1, 2, 3, 4].map((key) => (
            <Skeleton key={key} className="h-16" />
          ))}
        </div>
      ) : resolved.length === 0 ? (
        <EmptyState
          icon={CalendarCheck2}
          title="Your checklist is empty"
          description="Add a task, or draft a blueprint and Festa writes the checklist for you, each date counted back from the day itself."
          action={
            <Button onClick={() => openTask(null)}>
              <Plus aria-hidden="true" /> Add a task
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-[#d9d1c3] px-6 py-10 text-center text-[0.9375rem] text-muted-foreground">
          No tasks match these filters.
        </p>
      ) : groups ? (
        <div className="grid grid-cols-1 gap-6">
          {groups.map(({ group, tasks: groupTasks }) => (
            <section key={group} aria-labelledby={`group-${group}`}>
              <h3
                id={`group-${group}`}
                className={`type-eyebrow mb-2 px-1 ${group === "overdue" ? "!text-danger" : ""}`}
              >
                {DEADLINE_GROUP_LABELS[group]} · {groupTasks.length}
              </h3>
              <ul className="surface divide-y divide-border">{groupTasks.map(renderRow)}</ul>
            </section>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          accessibility={{ announcements: announcementsFor(visible) }}
        >
          <SortableContext items={visible.map((task) => task._id)} strategy={verticalListSortingStrategy}>
            <ul className="surface divide-y divide-border">{visible.map(renderRow)}</ul>
          </SortableContext>
          {sort === "manual" && (
            <p className="px-1 text-[0.75rem] text-muted-foreground">
              Drag the handle, or focus it and use Space and the arrow keys, to reorder.
            </p>
          )}
        </DndContext>
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        eventId={event._id}
        eventDate={event.date}
        task={editing}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete “${deleting?.title ?? ""}”?`}
        description="The task is removed from your timeline."
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await removeTask({ taskId: deleting._id });
            toast.success("Task deleted.");
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
      />
    </div>
  );
}

/** Screen-reader announcements that name tasks and positions, not record IDs. */
function announcementsFor(tasks: TimelineTask[]): Announcements {
  const title = (id: string | number) => tasks.find((task) => task._id === id)?.title ?? "Task";
  const position = (id: string | number) =>
    `position ${tasks.findIndex((task) => task._id === id) + 1} of ${tasks.length}`;
  return {
    onDragStart: ({ active }) => `Picked up ${title(active.id)}, ${position(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${title(active.id)} moved to ${position(over.id)}.`
        : `${title(active.id)} is not over the list.`,
    onDragEnd: ({ active, over }) =>
      over ? `${title(active.id)} dropped at ${position(over.id)}.` : `${title(active.id)} dropped.`,
    onDragCancel: ({ active }) => `Reordering cancelled. ${title(active.id)} returned to its place.`,
  };
}
