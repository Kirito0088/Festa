"use client";

import { cn } from "cn";
import { useMutation } from "convex/react";
import { Cpu, Lightbulb, Loader2, RefreshCw, ShieldAlert, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
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
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { currentIsoDate, useToday } from "@/hooks/use-today";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatIsoDate, shiftIsoDate } from "@/lib/dates";
import { errorMessage } from "@/lib/errors";
import { useEventContext } from "./event-context";

export function BlueprintView() {
  const { event, blueprint } = useEventContext();
  const today = useToday();
  const regenerate = useMutation(api.plans.regenerate);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const generating = event.planStatus === "generating";

  async function run(useAI: boolean) {
    setBusy(true);
    try {
      await regenerate({ eventId: event._id, useAI, today: currentIsoDate() });
      toast.success(useAI ? "Asking the AI for a fresh blueprint…" : "Building a fresh blueprint…");
      setDialogOpen(false);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const regenerateDialog = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerate the blueprint</DialogTitle>
          <DialogDescription>
            A new concept, palette and ideas replace the current blueprint. Your budget lines and tasks stay
            exactly as they are; Festa only fills them in for an empty plan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => run(true)}
            className="surface flex cursor-pointer items-start gap-4 p-4 text-left transition-colors hover:bg-secondary disabled:opacity-50"
          >
            <Sparkles className="mt-0.5 size-5 text-sage-strong" aria-hidden="true" />
            <span>
              <span className="block font-medium">With AI</span>
              <span className="text-[0.8125rem] text-muted-foreground">
                Tailored by Groq&rsquo;s free tier. Falls back to the built-in planner if AI is unavailable.
              </span>
            </span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(false)}
            className="surface flex cursor-pointer items-start gap-4 p-4 text-left transition-colors hover:bg-secondary disabled:opacity-50"
          >
            <Cpu className="mt-0.5 size-5 text-sand-strong" aria-hidden="true" />
            <span>
              <span className="block font-medium">Built-in planner</span>
              <span className="text-[0.8125rem] text-muted-foreground">
                Instant and deterministic, based on proven planning templates.
              </span>
            </span>
          </button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (!blueprint) {
    return generating ? (
      <div className="grid gap-4" aria-busy="true" aria-label="Drafting blueprint">
        <Skeleton className="h-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    ) : (
      <>
        <EmptyState
          icon={Wand2}
          title="No blueprint yet"
          description="Generate a concept, palette, budget split, checklist and vendor plan for this celebration."
          action={
            <Button size="lg" onClick={() => setDialogOpen(true)}>
              <Sparkles aria-hidden="true" /> Generate blueprint
            </Button>
          }
        />
        {regenerateDialog}
      </>
    );
  }

  const { content } = blueprint;
  const sourceLabel =
    blueprint.source === "ai"
      ? `Generated with AI${blueprint.model ? ` · ${blueprint.model}` : ""}`
      : blueprint.source === "sample"
        ? "Sample blueprint"
        : "Built-in planner";

  return (
    <div className="grid grid-cols-1 gap-4">
      <section className="surface overflow-hidden">
        <div className="flex h-2" aria-hidden="true">
          {content.palette.map((swatch) => (
            <span key={swatch.hex} className="flex-1" style={{ background: swatch.hex }} />
          ))}
        </div>
        <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={blueprint.source === "ai" ? "default" : "secondary"}>
                {blueprint.source === "ai" ? <Sparkles aria-hidden="true" /> : <Cpu aria-hidden="true" />}
                {sourceLabel}
              </Badge>
              <Badge variant="outline">{content.concept.theme}</Badge>
            </div>
            <h2 className="type-display mt-5 text-[2.5rem] sm:text-[3.25rem]">{content.concept.title}</h2>
            <p className="type-title mt-3 text-[1.375rem] text-muted-foreground italic">
              {content.concept.tagline}
            </p>
            <p className="mt-5 max-w-2xl text-[1rem] leading-relaxed">{content.concept.summary}</p>
            {blueprint.notice && (
              <p className="mt-5 rounded-2xl bg-sand-soft px-4 py-3 text-[0.8125rem] text-[#5c4b31]">
                {blueprint.notice}
              </p>
            )}
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => setDialogOpen(true)}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw aria-hidden="true" />
              )}
              {generating ? "Generating…" : "Regenerate"}
            </Button>
          </div>
          <div>
            <p className="type-eyebrow">Palette</p>
            <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-3">
              {content.palette.map((swatch) => (
                <li key={swatch.hex}>
                  <span
                    className="block aspect-square rounded-2xl ring-1 ring-black/5"
                    style={{ background: swatch.hex }}
                  />
                  <span className="mt-1.5 block text-[0.8125rem] font-medium">{swatch.name}</span>
                  <span className="tabular block text-[0.75rem] text-muted-foreground">{swatch.hex}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Suggested budget split"
          description="Shares of your total. Festa turned these into the amounts in Budget Studio."
        >
          <ul className="grid gap-3.5">
            {content.budget.map((line) => (
              <li key={`${line.category}-${line.label}`}>
                <div className="flex items-baseline justify-between gap-4 text-[0.875rem]">
                  <span className="min-w-0 truncate">{line.label}</span>
                  <span className="tabular text-muted-foreground">{Math.round(line.percent)}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#ebe6dc]">
                  <div
                    className="h-full rounded-full bg-chart-1"
                    style={{ width: `${Math.min(100, line.percent)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Vendors to line up"
          description="Suggestions only — Festa doesn't recommend specific businesses."
        >
          <ul className="divide-y divide-border">
            {content.vendors.map((vendor) => {
              const bookBy = shiftIsoDate(event.date, -vendor.bookByDaysBefore);
              // The suggested lead time can exceed the time left before the event.
              const late = today !== null && bookBy < today;
              return (
                <li key={vendor.title} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[0.9375rem] font-medium">{vendor.title}</span>
                    <span
                      className={cn(
                        "tabular shrink-0 text-[0.75rem]",
                        late ? "font-medium text-danger" : "text-muted-foreground",
                      )}
                    >
                      {late ? "Book as soon as you can" : `Book by ${formatIsoDate(bookBy, "short")}`}
                    </span>
                  </div>
                  {vendor.why && <p className="mt-1 text-[0.8125rem] text-muted-foreground">{vendor.why}</p>}
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(
          [
            ["Decor & styling", content.decor],
            ["Food & drinks", content.food],
            ["Entertainment", content.entertainment],
          ] as const
        ).map(([title, ideas]) => (
          <Panel key={title} title={title}>
            <ul className="grid gap-2.5 text-[0.875rem] leading-relaxed">
              {ideas.map((idea) => (
                <li key={idea} className="flex gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-sand-strong" aria-hidden="true" />
                  {idea}
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Risks to plan for">
          <ul className="grid gap-4">
            {content.risks.map((risk) => (
              <li key={risk.risk} className="flex gap-3">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-blush-strong" aria-hidden="true" />
                <div>
                  <p className="text-[0.9375rem] font-medium">{risk.risk}</p>
                  <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
                    {risk.mitigation}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recommendations">
          <ul className="grid gap-4">
            {content.recommendations.map((tip) => (
              <li key={tip} className="flex gap-3 text-[0.875rem] leading-relaxed">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-sand-strong" aria-hidden="true" />
                {tip}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[0.75rem] text-muted-foreground">
            Categories covered:{" "}
            {[...new Set(content.budget.map((line) => CATEGORY_LABELS[line.category]))].join(", ")}.
          </p>
        </Panel>
      </div>

      {regenerateDialog}
    </div>
  );
}
