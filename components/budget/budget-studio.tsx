"use client";

import { cn } from "cn";
import { useMutation, useQuery } from "convex/react";
import {
  CircleDollarSign,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Stat } from "@/components/ui/stat";
import { committedCost, isLineOverspent, paymentStatusOf, summarizeBudget } from "@/lib/budget";
import { CATEGORIES, CATEGORY_LABELS, PAYMENT_STATUS_LABELS, type Category } from "@/lib/constants";
import { errorMessage } from "@/lib/errors";
import { formatMoney, subtractMoney } from "@/lib/money";
import { BudgetChart } from "./budget-chart";
import { BudgetItemDialog } from "./budget-item-dialog";
import { DepositDialog } from "./deposit-dialog";

const PAYMENT_TONE = {
  unpaid: "bg-secondary text-muted-foreground",
  deposit: "bg-[#f5e7cf] text-warning",
  paid: "bg-sage-soft text-sage-strong",
} as const;

export function BudgetStudio() {
  const { event } = useEventContext();
  const items = useQuery(api.budget.list, { eventId: event._id });
  const recordPayment = useMutation(api.budget.recordPayment);
  const removeItem = useMutation(api.budget.remove);

  const [editing, setEditing] = useState<Doc<"budgetItems"> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [depositItem, setDepositItem] = useState<Doc<"budgetItems"> | null>(null);
  const [deleting, setDeleting] = useState<Doc<"budgetItems"> | null>(null);

  const summary = useMemo(() => (items ? summarizeBudget(event.budget, items) : null), [items, event.budget]);
  const grouped = useMemo(() => {
    if (!items) return [];
    return CATEGORIES.map((category) => ({
      category,
      lines: items.filter((item) => item.category === category),
    })).filter((group) => group.lines.length > 0);
  }, [items]);

  const fmt = (amount: number) => formatMoney(amount, event.currency);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  async function payment(item: Doc<"budgetItems">, mode: "full" | "clear") {
    try {
      await recordPayment({ itemId: item._id, mode });
      toast.success(mode === "full" ? "Marked as paid in full." : "Payments cleared.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  if (items === undefined || summary === null) {
    return (
      <div className="grid gap-4" aria-busy="true">
        <Skeleton className="h-36" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <Panel>
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-3 lg:grid-cols-6">
          <Stat label="Total budget" value={fmt(summary.total)} />
          <Stat label="Estimated" value={fmt(summary.estimated)} />
          <Stat label="Committed" value={fmt(summary.committed)} detail="Actual cost where known" />
          <Stat label="Paid" value={fmt(summary.paid)} />
          <Stat label="Still to pay" value={fmt(summary.outstanding)} />
          <Stat
            label={summary.isOverBudget ? "Over budget" : "Remaining"}
            value={fmt(summary.isOverBudget ? summary.overBy : summary.remaining)}
            tone={summary.isOverBudget ? "negative" : "positive"}
          />
        </div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#ebe6dc]" aria-hidden="true">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out-soft)]",
              summary.isOverBudget ? "bg-danger" : "bg-charcoal",
            )}
            style={{ width: `${Math.min(100, summary.utilization * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-[0.8125rem] text-muted-foreground">
          {Math.round(summary.utilization * 100)}% of the budget is committed.
        </p>
        {(summary.isOverBudget || summary.overspentLines > 0) && (
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-danger-soft px-4 py-3 text-[0.8125rem] text-danger">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              {summary.isOverBudget && <>Committed costs exceed the budget by {fmt(summary.overBy)}. </>}
              {summary.overspentLines > 0 && (
                <>
                  {summary.overspentLines} line{summary.overspentLines === 1 ? " is" : "s are"} costing more
                  than estimated.
                </>
              )}
            </p>
          </div>
        )}
      </Panel>

      {items.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Start with the big costs"
          description="Add the venue and the food first; they're usually the biggest lines. Festa keeps the totals as you go."
          action={
            <Button onClick={openNew}>
              <Plus aria-hidden="true" /> Add a budget line
            </Button>
          }
        />
      ) : (
        <>
          <Panel
            title="Estimated vs committed"
            description="By category. Hover or tap a bar for exact figures."
          >
            <BudgetChart categories={summary.categories} currency={event.currency} />
          </Panel>

          <Panel
            title="Ledger"
            description={`${items.length} line${items.length === 1 ? "" : "s"}`}
            action={
              <Button size="sm" onClick={openNew}>
                <Plus aria-hidden="true" /> Add line
              </Button>
            }
            bodyClassName="-mx-5 sm:-mx-6"
          >
            <div role="table" aria-label="Budget ledger" className="text-[0.875rem]">
              <div
                role="row"
                className="hidden grid-cols-[minmax(0,1fr)_7.5rem_7.5rem_7.5rem_8rem_2.5rem] gap-4 border-b border-border px-6 pb-2.5 md:grid"
              >
                {["Item", "Estimated", "Actual", "Paid", "Status", ""].map((heading, index) => (
                  <span
                    key={heading || index}
                    role="columnheader"
                    className={cn("type-eyebrow", index > 0 && index < 4 && "text-right")}
                  >
                    {heading || <span className="sr-only">Actions</span>}
                  </span>
                ))}
              </div>
              {grouped.map((group) => {
                const category = summary.categories.find((c) => c.category === group.category);
                return (
                  <div key={group.category} role="rowgroup">
                    <div
                      role="row"
                      className="flex items-baseline justify-between gap-4 bg-[#f7f4ee] px-6 py-2 text-[0.8125rem]"
                    >
                      <span role="rowheader" className="font-medium">
                        {CATEGORY_LABELS[group.category as Category]}
                      </span>
                      {category && (
                        <span
                          className={cn(
                            "tabular",
                            category.isOverspent ? "text-danger" : "text-muted-foreground",
                          )}
                        >
                          {fmt(category.committed)}
                          {category.isOverspent && ` · ${fmt(category.variance)} over`}
                        </span>
                      )}
                    </div>
                    {group.lines.map((item) => {
                      const status = paymentStatusOf(item);
                      const overspent = isLineOverspent(item);
                      return (
                        <div
                          key={item._id}
                          role="row"
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-border px-6 py-3.5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_7.5rem_7.5rem_7.5rem_8rem_2.5rem]"
                        >
                          <div role="cell" className="min-w-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditing(item);
                                setDialogOpen(true);
                              }}
                              className="max-w-full cursor-pointer truncate text-left font-medium hover:underline hover:underline-offset-4"
                            >
                              {item.name}
                            </button>
                            {item.notes && (
                              <p className="truncate text-[0.75rem] text-muted-foreground">{item.notes}</p>
                            )}
                            <p className="tabular mt-1 text-[0.75rem] text-muted-foreground md:hidden">
                              Est. {fmt(item.estimated)}
                              {item.actual !== null && ` · Actual ${fmt(item.actual)}`} · Paid{" "}
                              {fmt(item.paid)}
                            </p>
                          </div>
                          <span role="cell" className="tabular hidden text-right md:block">
                            {fmt(item.estimated)}
                          </span>
                          <span
                            role="cell"
                            className={cn("tabular hidden text-right md:block", overspent && "text-danger")}
                          >
                            {item.actual === null ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              fmt(item.actual)
                            )}
                            {overspent && (
                              <span className="block text-[0.6875rem]">
                                +{fmt(subtractMoney(item.actual ?? 0, item.estimated))}
                              </span>
                            )}
                          </span>
                          <span role="cell" className="tabular hidden text-right md:block">
                            {fmt(item.paid)}
                          </span>
                          <span role="cell" className="hidden md:block">
                            <span
                              className={cn(
                                "inline-flex h-6 items-center rounded-full px-2.5 text-[0.75rem] font-medium",
                                PAYMENT_TONE[status],
                              )}
                            >
                              {PAYMENT_STATUS_LABELS[status]}
                            </span>
                          </span>
                          <span role="cell" className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Actions for ${item.name}`}
                                >
                                  <MoreHorizontal aria-hidden="true" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setEditing(item);
                                    setDialogOpen(true);
                                  }}
                                >
                                  <Pencil aria-hidden="true" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setDepositItem(item)}>
                                  <CircleDollarSign aria-hidden="true" /> Record a deposit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={status === "paid" || committedCost(item) === 0}
                                  onSelect={() => payment(item, "full")}
                                >
                                  <Wallet aria-hidden="true" /> Mark paid in full
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={item.paid === 0}
                                  onSelect={() => payment(item, "clear")}
                                >
                                  <RotateCcw aria-hidden="true" /> Clear payments
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(item)}>
                                  <Trash2 aria-hidden="true" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </Panel>
        </>
      )}

      <BudgetItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        eventId={event._id}
        currency={event.currency}
        item={editing}
      />
      <DepositDialog
        item={depositItem}
        currency={event.currency}
        onOpenChange={(open) => !open && setDepositItem(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete “${deleting?.name ?? ""}”?`}
        description="The line and its payment record are removed from your budget."
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await removeItem({ itemId: deleting._id });
            toast.success("Budget line deleted.");
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
      />
    </div>
  );
}
