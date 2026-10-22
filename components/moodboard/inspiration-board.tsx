"use client";

import { cn } from "cn";
import { useMutation, useQuery } from "convex/react";
import { Images, Loader2, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useEventContext } from "@/components/events/event-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { MOODBOARD_CATEGORIES, MOODBOARD_CATEGORY_LABELS, type MoodboardCategory } from "@/lib/constants";
import { errorMessage } from "@/lib/errors";
import { spring } from "@/lib/motion";
import { AddInspirationDialog } from "./add-inspiration-dialog";

type Filter = MoodboardCategory | "all";

export function InspirationBoard() {
  const { event } = useEventContext();
  const items = useQuery(api.moodboard.list, { eventId: event._id });
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Doc<"moodboardItems"> | null>(null);

  const visible = items?.filter((item) => filter === "all" || item.category === filter) ?? [];

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="type-title text-[2rem]">Inspiration</h2>
          <p className="mt-1 text-[0.875rem] text-muted-foreground">
            Themes, colours, decor, invitations, food and venues that feel right.
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus aria-hidden="true" /> Add inspiration
        </Button>
      </div>

      <div
        role="group"
        aria-label="Filter inspiration"
        className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1"
      >
        {(["all", ...MOODBOARD_CATEGORIES] as const).map((category) => {
          const active = filter === category;
          const count = items?.filter((item) => category === "all" || item.category === category).length;
          return (
            <button
              key={category}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(category)}
              className={cn(
                "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-[0.8125rem] transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-[#cfc6b6]",
              )}
            >
              {category === "all" ? "Everything" : MOODBOARD_CATEGORY_LABELS[category]}
              {count !== undefined && (
                <span className={cn("tabular", active ? "text-[#cfc9be]" : "text-muted-foreground")}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {items === undefined ? (
        <div className="columns-2 gap-4 md:columns-3" aria-busy="true">
          {[220, 300, 260, 200, 280, 240].map((height, index) => (
            <Skeleton key={index} className="mb-4 break-inside-avoid" style={{ height }} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Images}
          title={items.length === 0 ? "Your board is empty" : "Nothing in this category yet"}
          description="Start with Festa's curated library, paste an image link, or save a colour from your palette."
          action={
            <Button onClick={() => setAdding(true)}>
              <Plus aria-hidden="true" /> Add inspiration
            </Button>
          }
        />
      ) : (
        <ul className="columns-2 gap-4 md:columns-3 lg:columns-4">
          <AnimatePresence initial={false}>
            {visible.map((item) => (
              <motion.li
                key={item._id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={spring.default}
                className="mb-4 break-inside-avoid"
              >
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className="surface group block w-full cursor-pointer overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* The name comes from the visible card text, so voice control can target it. */}
                  <span className="sr-only">Edit </span>
                  {item.kind === "image" && item.imageUrl ? (
                    <SafeImage
                      src={item.imageUrl}
                      alt=""
                      className="block min-h-32 w-full transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:group-hover:scale-100"
                    />
                  ) : (
                    <span
                      className="block aspect-[4/3]"
                      style={{ background: item.color }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="block p-4">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[0.9375rem] font-medium">{item.title}</span>
                      {item.kind === "swatch" && (
                        <span className="tabular shrink-0 text-[0.75rem] text-muted-foreground">
                          {item.color}
                        </span>
                      )}
                    </span>
                    <span className="type-eyebrow mt-1 block">
                      {MOODBOARD_CATEGORY_LABELS[item.category]}
                    </span>
                    {item.note && (
                      <span className="mt-2 block text-[0.8125rem] leading-relaxed text-muted-foreground">
                        {item.note}
                      </span>
                    )}
                    {item.credit && (
                      <span className="mt-2 block text-[0.6875rem] text-muted-foreground">
                        Photo: {item.credit}
                      </span>
                    )}
                  </span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <AddInspirationDialog
        open={adding}
        onOpenChange={setAdding}
        eventId={event._id}
        initialCategory={filter}
      />
      <EditInspirationDialog item={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function EditInspirationDialog({
  item,
  onClose,
}: {
  item: Doc<"moodboardItems"> | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {item && <EditInspirationForm key={item._id} item={item} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function EditInspirationForm({ item, onClose }: { item: Doc<"moodboardItems">; onClose: () => void }) {
  const update = useMutation(api.moodboard.update);
  const remove = useMutation(api.moodboard.remove);
  const [title, setTitle] = useState(item.title);
  const [note, setNote] = useState(item.note);
  const [category, setCategory] = useState<MoodboardCategory>(item.category);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);

  async function save() {
    if (!title.trim()) return;
    setBusy("save");
    try {
      await update({
        itemId: item._id,
        title: title.trim(),
        note: note.trim(),
        category,
      });
      toast.success("Inspiration updated.");
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  async function destroy() {
    setBusy("delete");
    try {
      await remove({ itemId: item._id });
      toast.success("Removed from your board.");
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit inspiration</DialogTitle>
        <DialogDescription>Rename, recategorise or annotate this item.</DialogDescription>
      </DialogHeader>
      {item.kind === "image" && item.imageUrl && (
        <SafeImage src={item.imageUrl} alt={item.title} className="max-h-64 w-full rounded-2xl" />
      )}
      {item.kind === "swatch" && (
        <span className="block h-24 rounded-2xl" style={{ background: item.color }} aria-hidden="true" />
      )}
      <form
        noValidate
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="edit-inspiration-title" label="Title" error={title.trim() ? undefined : "Add a title."}>
            <Input
              id="edit-inspiration-title"
              value={title}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          {item.kind === "image" && (
            <Field id="edit-inspiration-category" label="Category">
              <Select value={category} onValueChange={(value) => setCategory(value as MoodboardCategory)}>
                <SelectTrigger id="edit-inspiration-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOODBOARD_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {MOODBOARD_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </div>
        <Field id="edit-inspiration-note" label="Note" optional>
          <Textarea
            id="edit-inspiration-note"
            rows={3}
            value={note}
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="destructive" onClick={destroy} disabled={busy !== null}>
            {busy === "delete" ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 aria-hidden="true" />
            )}
            Remove
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy !== null || !title.trim()}>
              {busy === "save" && <Loader2 className="animate-spin" aria-hidden="true" />}
              Save
            </Button>
          </div>
        </DialogFooter>
      </form>
    </>
  );
}
