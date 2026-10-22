"use client";

import { cn } from "cn";
import { useMutation } from "convex/react";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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
import { SafeImage } from "@/components/ui/safe-image";
import { Segmented } from "@/components/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MOODBOARD_CATEGORIES, MOODBOARD_CATEGORY_LABELS, type MoodboardCategory } from "@/lib/constants";
import { errorMessage } from "@/lib/errors";
import { CURATED_IMAGES, isSafeImageUrl, unsplashUrl } from "@/lib/inspiration";

type Mode = "library" | "link" | "colour";

export function AddInspirationDialog({
  open,
  onOpenChange,
  eventId,
  initialCategory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: Id<"events">;
  initialCategory: MoodboardCategory | "all";
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <AddInspirationForm
          eventId={eventId}
          initialCategory={initialCategory === "all" ? "theme" : initialCategory}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

/** Mounted fresh each time the dialog opens, so every field starts empty. */
function AddInspirationForm({
  eventId,
  initialCategory,
  onDone,
}: {
  eventId: Id<"events">;
  initialCategory: MoodboardCategory;
  onDone: () => void;
}) {
  const addImage = useMutation(api.moodboard.addImage);
  const addSwatch = useMutation(api.moodboard.addSwatch);
  const [mode, setMode] = useState<Mode>("library");
  const [category, setCategory] = useState<MoodboardCategory>(initialCategory);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [color, setColor] = useState("#A7B5A0");
  const [busy, setBusy] = useState(false);

  const library = useMemo(() => CURATED_IMAGES.filter((image) => image.category === category), [category]);
  const selected = CURATED_IMAGES.find((image) => image.id === selectedId) ?? null;
  const urlValid = isSafeImageUrl(url.trim());
  const urlError = url.trim() && !urlValid ? "Use a direct image link that starts with https://" : undefined;

  const canSubmit =
    !busy &&
    (mode === "library"
      ? selected !== null
      : mode === "link"
        ? urlValid && title.trim().length > 0
        : /^#[0-9a-f]{6}$/i.test(color) && title.trim().length > 0);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      if (mode === "library" && selected) {
        await addImage({
          eventId,
          imageUrl: unsplashUrl(selected.id),
          title: title.trim() || selected.title,
          category: selected.category,
          note: note.trim(),
          credit: "Unsplash",
        });
      } else if (mode === "link") {
        await addImage({
          eventId,
          imageUrl: url.trim(),
          title: title.trim(),
          category,
          note: note.trim(),
        });
      } else {
        await addSwatch({
          eventId,
          color,
          title: title.trim(),
          note: note.trim(),
        });
      }
      toast.success("Saved to your inspiration board.");
      onDone();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add inspiration</DialogTitle>
        <DialogDescription>
          Pick from Festa&rsquo;s curated library, paste an image link, or save a colour.
        </DialogDescription>
      </DialogHeader>

      <Segmented
        label="Source"
        value={mode}
        onChange={setMode}
        options={[
          { value: "library", label: "Library" },
          { value: "link", label: "Image link" },
          { value: "colour", label: "Colour" },
        ]}
        className="w-full"
      />

      <form
        noValidate
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {mode !== "colour" && (
          <Field id="inspiration-category" label="Category">
            <Select value={category} onValueChange={(value) => setCategory(value as MoodboardCategory)}>
              <SelectTrigger id="inspiration-category" className="w-full sm:w-60">
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

        {mode === "library" && (
          <div
            role="radiogroup"
            aria-label="Curated images"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          >
            {library.map((image) => {
              const isSelected = image.id === selectedId;
              return (
                <button
                  key={image.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={image.title}
                  onClick={() => setSelectedId(isSelected ? null : image.id)}
                  className={cn(
                    "group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isSelected && "ring-2 ring-charcoal ring-offset-2",
                  )}
                >
                  <SafeImage src={unsplashUrl(image.id, 480)} alt="" className="size-full" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-2.5 text-left text-[0.75rem] font-medium text-white">
                    {image.title}
                  </span>
                  {isSelected && (
                    <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-charcoal text-ivory">
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {mode === "link" && (
          <div className="grid gap-3">
            <Field
              id="inspiration-url"
              label="Image link"
              error={urlError}
              hint="Use images you have permission to use."
            >
              <Input
                {...fieldAria("inspiration-url", urlError, true)}
                type="url"
                inputMode="url"
                placeholder="https://"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </Field>
            <LinkPreview url={urlValid ? url.trim() : ""} alt={title.trim()} />
          </div>
        )}

        {mode === "colour" && (
          <div className="flex items-end gap-4">
            <label className="grid gap-2">
              <span className="text-[0.8125rem] font-medium">Colour</span>
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value.toUpperCase())}
                className="h-11 w-20 cursor-pointer rounded-xl border border-input bg-card p-1"
              />
            </label>
            <span className="tabular pb-3 text-[0.875rem] text-muted-foreground">{color}</span>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="inspiration-title"
            label={mode === "colour" ? "Colour name" : "Title"}
            optional={mode === "library"}
          >
            <Input
              id="inspiration-title"
              value={title}
              placeholder={mode === "library" ? (selected?.title ?? "") : ""}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
            />
          </Field>
          <Field id="inspiration-note" label="Note" optional>
            <Textarea
              id="inspiration-note"
              rows={1}
              className="min-h-11"
              value={note}
              placeholder="What do you love about it?"
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            Save to board
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

const PREVIEW_DELAY_MS = 400;

/**
 * Shows the linked image before it's saved, so a broken link is caught here
 * instead of as "Image unavailable" on the board. The box keeps its size in
 * every state, so the form never jumps.
 */
function LinkPreview({ url, alt }: { url: string; alt: string }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState<{ src: string; ok: boolean } | null>(null);

  // Wait for typing to pause so every keystroke doesn't fetch a new image.
  useEffect(() => {
    const id = window.setTimeout(() => setPreviewUrl(url), url ? PREVIEW_DELAY_MS : 0);
    return () => window.clearTimeout(id);
  }, [url]);

  const status = !previewUrl
    ? "empty"
    : result?.src !== previewUrl
      ? "loading"
      : result.ok
        ? "loaded"
        : "failed";

  return (
    <div className="relative h-44 overflow-hidden rounded-2xl border border-border bg-sand-soft">
      {status === "loading" && (
        <Loader2
          className="absolute inset-0 m-auto size-5 animate-spin text-sand-strong"
          aria-hidden="true"
        />
      )}
      {previewUrl ? (
        <SafeImage
          key={previewUrl}
          src={previewUrl}
          alt={alt ? `Preview of ${alt}` : "Preview of the linked image"}
          fallbackLabel="This link didn't load as an image. Check that it opens the picture itself, not a page around it."
          onLoad={() => setResult({ src: previewUrl, ok: true })}
          onError={() => setResult({ src: previewUrl, ok: false })}
          className="relative size-full"
        />
      ) : (
        <p className="grid size-full place-items-center px-6 text-center text-[0.8125rem] text-muted-foreground">
          A preview appears here once the link looks right.
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {status === "loading" && "Loading the preview."}
        {status === "loaded" && "Preview loaded."}
        {status === "failed" && "This link didn't load as an image."}
      </p>
    </div>
  );
}
