"use client";

import { cn } from "cn";
import { useMutation } from "convex/react";
import { ArrowRight, Check, Loader2, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { currentIsoDate } from "@/hooks/use-today";
import { CATEGORY_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { describeOffset } from "@/lib/dates";
import { previewProposal } from "@/lib/concierge/preview";
import type { ProposedChange } from "@/lib/concierge/proposal";
import { errorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/money";

type Proposal = NonNullable<Doc<"conciergeMessages">["proposal"]>;

function describeChange(
  change: ProposedChange,
  ctx: {
    event: Doc<"events">;
    items: Map<string, Doc<"budgetItems">>;
    tasks: Map<string, Doc<"tasks">>;
  },
): { title: string; before?: string; after: string } {
  const fmt = (amount: number) => formatMoney(amount, ctx.event.currency);
  switch (change.type) {
    case "set_event_budget":
      return { title: "Total budget", before: fmt(ctx.event.budget), after: fmt(change.amount) };
    case "set_guest_count":
      return { title: "Guest count", before: String(ctx.event.guestCount), after: String(change.count) };
    case "update_budget_item": {
      const item = ctx.items.get(change.itemId);
      return {
        title: item ? item.name : "Budget line (no longer exists)",
        before: item ? fmt(item.estimated) : undefined,
        after: fmt(change.estimated),
      };
    }
    case "add_budget_item":
      return {
        title: `New line: ${change.name}`,
        after: `${fmt(change.estimated)} · ${CATEGORY_LABELS[change.category]}`,
      };
    case "add_task":
      return {
        title: `New task: ${change.title}`,
        after: `${PRIORITY_LABELS[change.priority]} · ${describeOffset(change.offsetDays)}`,
      };
    case "update_task": {
      const task = ctx.tasks.get(change.taskId);
      const parts = [
        change.priority ? `${PRIORITY_LABELS[change.priority]} priority` : null,
        change.offsetDays !== null ? describeOffset(change.offsetDays) : null,
      ].filter(Boolean);
      return { title: task ? task.title : "Task (no longer exists)", after: parts.join(" · ") };
    }
  }
}

export function ProposalCard({
  message,
  event,
  items,
  tasks,
}: {
  message: Doc<"conciergeMessages">;
  event: Doc<"events">;
  items: Doc<"budgetItems">[];
  tasks: Doc<"tasks">[];
}) {
  const proposal = message.proposal as Proposal;
  const changes = proposal.changes as ProposedChange[];
  const apply = useMutation(api.concierge.applyProposal);
  const dismiss = useMutation(api.concierge.dismissProposal);
  const [selected, setSelected] = useState<Set<number>>(() => new Set(changes.map((_, index) => index)));
  const [busy, setBusy] = useState<"apply" | "dismiss" | null>(null);
  const pending = proposal.status === "pending";
  // Once handled, show what happened rather than re-deriving it from live records.
  const appliedIndexes = proposal.appliedIndexes ? new Set(proposal.appliedIndexes) : null;
  const wasApplied = (index: number) =>
    proposal.status === "applied" && (appliedIndexes ? appliedIndexes.has(index) : true);

  const itemMap = useMemo(() => new Map(items.map((item) => [item._id as string, item])), [items]);
  const taskMap = useMemo(() => new Map(tasks.map((task) => [task._id as string, task])), [tasks]);

  const preview = useMemo(
    () =>
      previewProposal(
        changes.filter((_, index) => selected.has(index)),
        {
          budget: event.budget,
          guestCount: event.guestCount,
          items: items.map((item) => ({ ...item, id: item._id })),
        },
      ),
    [changes, selected, event.budget, event.guestCount, items],
  );
  const fmt = (amount: number) => formatMoney(amount, event.currency);
  const touchesBudget = changes.some((change) =>
    ["set_event_budget", "update_budget_item", "add_budget_item"].includes(change.type),
  );

  async function handleApply() {
    setBusy("apply");
    try {
      const result = await apply({
        messageId: message._id,
        changeIndexes: [...selected],
        today: currentIsoDate(),
      });
      toast.success(
        `Applied ${result.applied} change${result.applied === 1 ? "" : "s"}${
          result.skipped ? ` · ${result.skipped} skipped because the record changed` : ""
        }.`,
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  async function handleDismiss() {
    setBusy("dismiss");
    try {
      await dismiss({ messageId: message._id });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-hairline),var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="type-eyebrow">Proposed changes</p>
          <p className="mt-0.5 text-[0.9375rem] font-medium">{proposal.title}</p>
        </div>
        {proposal.status === "applied" && (
          <span className="inline-flex h-6 items-center gap-1 rounded-full bg-sage-soft px-2.5 text-[0.75rem] font-medium text-sage-strong">
            <Check className="size-3" aria-hidden="true" /> Applied {proposal.appliedCount ?? ""}
          </span>
        )}
        {proposal.status === "dismissed" && (
          <span className="inline-flex h-6 items-center rounded-full bg-secondary px-2.5 text-[0.75rem] text-muted-foreground">
            Dismissed
          </span>
        )}
      </div>

      <ul className="divide-y divide-border">
        {changes.map((change, index) => {
          const info = describeChange(change, { event, items: itemMap, tasks: taskMap });
          const checked = pending ? selected.has(index) : wasApplied(index);
          const skipped = proposal.status === "applied" && !checked;
          return (
            <li key={index}>
              <label
                className={cn(
                  "flex gap-3 px-4 py-3",
                  pending ? "cursor-pointer hover:bg-[#fbf9f5]" : skipped ? "opacity-55" : "opacity-80",
                )}
              >
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 cursor-pointer accent-[var(--charcoal)]"
                  checked={checked}
                  disabled={!pending}
                  onChange={() =>
                    setSelected((current) => {
                      const next = new Set(current);
                      if (next.has(index)) next.delete(index);
                      else next.add(index);
                      return next;
                    })
                  }
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.875rem] font-medium">
                    {info.title}
                    {skipped && <span className="ml-2 font-normal text-muted-foreground">Not applied</span>}
                  </span>
                  <span className="tabular mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.8125rem]">
                    {pending && info.before && (
                      <>
                        <span className="text-muted-foreground line-through decoration-[#bfb7a8]">
                          {info.before}
                        </span>
                        <ArrowRight className="size-3 text-muted-foreground" aria-label="becomes" />
                      </>
                    )}
                    <span>{info.after}</span>
                  </span>
                  {change.reason && (
                    <span className="mt-1 block text-[0.75rem] leading-relaxed text-muted-foreground">
                      {change.reason}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {pending && touchesBudget && (
        <div className="grid grid-cols-3 gap-3 border-t border-border bg-[#faf8f3] px-4 py-3 text-[0.75rem]">
          <div>
            <p className="text-muted-foreground">Budget</p>
            <p className="tabular mt-0.5 text-[0.875rem] font-medium">{fmt(preview.budgetAfter)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Committed</p>
            <p className="tabular mt-0.5 text-[0.875rem] font-medium">{fmt(preview.after.committed)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{preview.after.isOverBudget ? "Over by" : "Remaining"}</p>
            <p
              className={cn(
                "tabular mt-0.5 text-[0.875rem] font-medium",
                preview.after.isOverBudget ? "text-danger" : "text-sage-strong",
              )}
            >
              {fmt(preview.after.isOverBudget ? preview.after.overBy : preview.after.remaining)}
            </p>
          </div>
          {preview.after.isOverBudget && (
            <p className="col-span-3 flex items-center gap-1.5 text-danger">
              <TriangleAlert className="size-3.5" aria-hidden="true" />
              With these changes the plan would still be over budget.
            </p>
          )}
          <p className="col-span-3 text-muted-foreground">Calculated by Festa from your saved records.</p>
        </div>
      )}

      {pending && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Button variant="ghost" size="sm" onClick={handleDismiss} disabled={busy !== null}>
            {busy === "dismiss" && <Loader2 className="animate-spin" aria-hidden="true" />}
            Dismiss
          </Button>
          <Button size="sm" onClick={handleApply} disabled={busy !== null || selected.size === 0}>
            {busy === "apply" ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Check aria-hidden="true" />
            )}
            Apply {selected.size} change{selected.size === 1 ? "" : "s"}
          </Button>
        </div>
      )}
    </div>
  );
}
