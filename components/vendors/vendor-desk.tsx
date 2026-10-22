"use client";

import { cn } from "cn";
import { useMutation, useQuery } from "convex/react";
import { Columns3, Globe, Mail, MoreHorizontal, Pencil, Phone, Plus, Store, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useEventContext } from "@/components/events/event-context";
import { Badge } from "@/components/ui/badge";
import { useConfetti } from "@/components/ui/confetti";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  PAYMENT_STATUS_LABELS,
  VENDOR_STATUSES,
  VENDOR_STATUS_LABELS,
  type Category,
  type VendorStatus,
} from "@/lib/constants";
import { formatIsoDate, shiftIsoDate } from "@/lib/dates";
import { errorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/money";
import { spring } from "@/lib/motion";
import { VendorDialog } from "./vendor-dialog";

const STATUS_TONE: Record<VendorStatus, string> = {
  researching: "bg-secondary text-muted-foreground",
  contacted: "bg-sand-soft text-sand-strong",
  quoted: "bg-[#eef1ea] text-sage-strong",
  // Booked reads as an ink stamp on the card.
  booked: "-rotate-[3deg] border-[1.5px] border-current bg-sage-soft/60 font-semibold text-sage-strong",
  declined: "bg-blush-soft text-blush-strong",
};

type SortKey = "status" | "quote-asc" | "quote-desc" | "name";
const STATUS_RANK: Record<VendorStatus, number> = {
  booked: 0,
  quoted: 1,
  contacted: 2,
  researching: 3,
  declined: 4,
};
const MAX_COMPARE = 3;

function bestQuote(vendor: Doc<"vendors">): number | null {
  return vendor.quoteActual ?? vendor.quoteEstimated;
}

export function VendorDesk() {
  const { event, blueprint } = useEventContext();
  const vendors = useQuery(api.vendors.list, { eventId: event._id });
  const removeVendor = useMutation(api.vendors.remove);
  const updateVendor = useMutation(api.vendors.update);
  const celebrate = useConfetti();

  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("status");
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Doc<"vendors"> | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<Category | undefined>();
  const [deleting, setDeleting] = useState<Doc<"vendors"> | null>(null);

  const fmt = (amount: number | null) => (amount === null ? "—" : formatMoney(amount, event.currency));

  const visible = useMemo(() => {
    if (!vendors) return [];
    const filtered = vendors.filter(
      (vendor) =>
        (category === "all" || vendor.category === category) &&
        (status === "all" || vendor.status === status),
    );
    return filtered.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "status")
        return STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.name.localeCompare(b.name);
      const qa = bestQuote(a);
      const qb = bestQuote(b);
      if (qa === null) return 1;
      if (qb === null) return -1;
      return sort === "quote-asc" ? qa - qb : qb - qa;
    });
  }, [vendors, category, status, sort]);

  const suggestions = useMemo(() => {
    if (!blueprint || !vendors) return [];
    const covered = new Set(vendors.map((vendor) => vendor.category));
    return blueprint.content.vendors.filter((vendor) => !covered.has(vendor.category)).slice(0, 6);
  }, [blueprint, vendors]);

  const compared = (vendors ?? []).filter((vendor) => compare.includes(vendor._id));

  function openVendor(vendor: Doc<"vendors"> | null, preset?: Category) {
    setEditing(vendor);
    setDefaultCategory(preset);
    setDialogOpen(true);
  }

  function toggleCompare(id: string) {
    setCompare((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= MAX_COMPARE) {
        toast.info(`Compare up to ${MAX_COMPARE} vendors at a time.`);
        return current;
      }
      return [...current, id];
    });
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="type-title text-[2rem]">Vendor desk</h2>
          <p className="mt-1 text-[0.875rem] text-muted-foreground">
            {vendors
              ? `${vendors.filter((v) => v.status === "booked").length} booked of ${vendors.length}`
              : "Loading vendors…"}
          </p>
        </div>
        <Button onClick={() => openVendor(null)}>
          <Plus aria-hidden="true" /> Add vendor
        </Button>
      </div>

      {suggestions.length > 0 && (
        <section aria-labelledby="vendor-suggestions" className="rounded-3xl bg-sand-soft p-5">
          <h3 id="vendor-suggestions" className="text-[0.875rem] font-medium text-[#5c4b31]">
            Suggested from your blueprint
          </h3>
          <p className="mt-0.5 text-[0.8125rem] text-[#6b5a3f]">
            Categories to start researching. Festa doesn&rsquo;t recommend specific businesses, prices or
            availability.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <li key={suggestion.title}>
                <button
                  type="button"
                  onClick={() => openVendor(null, suggestion.category)}
                  className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-card px-4 text-[0.8125rem] shadow-[var(--shadow-hairline)] transition-transform hover:bg-[#fffdf8] active:scale-[0.97]"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  {suggestion.title}
                  <span className="text-muted-foreground">
                    · by {formatIsoDate(shiftIsoDate(event.date, -suggestion.bookByDaysBefore), "short")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
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
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger size="sm" aria-label="Filter by status" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {VENDOR_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {VENDOR_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
          <SelectTrigger size="sm" aria-label="Sort vendors" className="w-44 sm:ml-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="status">Sort by status</SelectItem>
            <SelectItem value="quote-asc">Lowest quote first</SelectItem>
            <SelectItem value="quote-desc">Highest quote first</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {vendors === undefined ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-56" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Who are you talking to?"
          description="Add the caterer, decorator or band you're considering. Quotes sit side by side, so comparing two of them takes seconds."
          action={
            <Button onClick={() => openVendor(null)}>
              <Plus aria-hidden="true" /> Add a vendor
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-[#d9d1c3] px-6 py-10 text-center text-[0.9375rem] text-muted-foreground">
          No vendors match these filters.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((vendor) => {
            const selected = compare.includes(vendor._id);
            return (
              <li
                key={vendor._id}
                className={cn(
                  "surface flex flex-col p-5 transition-shadow",
                  selected && "shadow-[0_0_0_2px_var(--charcoal),var(--shadow-soft)]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="type-eyebrow">{CATEGORY_LABELS[vendor.category]}</p>
                    <button
                      type="button"
                      onClick={() => openVendor(vendor)}
                      className="mt-1 max-w-full cursor-pointer truncate text-left text-[1.0625rem] font-medium hover:underline hover:underline-offset-4"
                    >
                      {vendor.name}
                    </button>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${vendor.name}`}>
                        <MoreHorizontal aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onSelect={() => openVendor(vendor)}>
                        <Pencil aria-hidden="true" /> Edit
                      </DropdownMenuItem>
                      {vendor.status !== "booked" && (
                        <DropdownMenuItem
                          onSelect={async () => {
                            try {
                              await updateVendor({ vendorId: vendor._id, status: "booked" });
                              const stamp = document.getElementById(`vendor-status-${vendor._id}`);
                              if (stamp) celebrate(stamp);
                              toast.success(`${vendor.name} marked as booked.`);
                            } catch (error) {
                              toast.error(errorMessage(error));
                            }
                          }}
                        >
                          <Store aria-hidden="true" /> Mark as booked
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(vendor)}>
                        <Trash2 aria-hidden="true" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span
                    className={cn(
                      "inline-flex h-6 items-center rounded-full px-2.5 text-[0.75rem] font-medium",
                      STATUS_TONE[vendor.status],
                    )}
                    id={`vendor-status-${vendor._id}`}
                  >
                    {VENDOR_STATUS_LABELS[vendor.status]}
                  </span>
                  <Badge variant="outline">{PAYMENT_STATUS_LABELS[vendor.paymentStatus]}</Badge>
                  {vendor.isSample && <Badge variant="secondary">Sample</Badge>}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-[0.8125rem]">
                  <div>
                    <dt className="text-muted-foreground">Estimated</dt>
                    <dd className="tabular mt-0.5 text-[0.9375rem] font-medium">
                      {fmt(vendor.quoteEstimated)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Final quote</dt>
                    <dd className="tabular mt-0.5 text-[0.9375rem] font-medium">{fmt(vendor.quoteActual)}</dd>
                  </div>
                </dl>

                {vendor.notes && (
                  <p className="mt-3 line-clamp-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
                    {vendor.notes}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <div className="flex gap-1">
                    {vendor.phone && (
                      <Button asChild variant="ghost" size="icon-sm">
                        <a
                          href={`tel:${vendor.phone.replace(/[^\d+]/g, "")}`}
                          aria-label={`Call ${vendor.name}`}
                        >
                          <Phone aria-hidden="true" />
                        </a>
                      </Button>
                    )}
                    {vendor.email && (
                      <Button asChild variant="ghost" size="icon-sm">
                        <a href={`mailto:${vendor.email}`} aria-label={`Email ${vendor.name}`}>
                          <Mail aria-hidden="true" />
                        </a>
                      </Button>
                    )}
                    {vendor.website && (
                      <Button asChild variant="ghost" size="icon-sm">
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          aria-label={`Open ${vendor.name}'s website`}
                        >
                          <Globe aria-hidden="true" />
                        </a>
                      </Button>
                    )}
                  </div>
                  <Button
                    variant={selected ? "default" : "outline"}
                    size="sm"
                    aria-pressed={selected}
                    onClick={() => toggleCompare(vendor._id)}
                  >
                    {selected ? "Comparing" : "Compare"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AnimatePresence>
        {compare.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={spring.default}
            className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4"
          >
            <div className="flex items-center gap-2 rounded-full bg-charcoal py-2 pr-2 pl-5 text-[0.875rem] text-ivory shadow-[var(--shadow-lifted)]">
              <span className="tabular">{compare.length} selected</span>
              <Button
                size="sm"
                className="bg-ivory text-charcoal hover:bg-ivory/90"
                disabled={compare.length < 2}
                onClick={() => setCompareOpen(true)}
              >
                <Columns3 aria-hidden="true" /> Compare
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-ivory hover:bg-white/10"
                aria-label="Clear comparison"
                onClick={() => setCompare([])}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Compare vendors</DialogTitle>
            <DialogDescription>Side by side, from the details you&rsquo;ve recorded.</DialogDescription>
          </DialogHeader>
          <div className="-mx-6 overflow-x-auto px-6">
            <table className="w-full min-w-[32rem] text-left text-[0.875rem]">
              <thead>
                <tr>
                  <th scope="col" className="w-36 pb-3 font-normal text-muted-foreground">
                    <span className="sr-only">Detail</span>
                  </th>
                  {compared.map((vendor) => (
                    <th key={vendor._id} scope="col" className="pb-3 pl-4 align-bottom font-medium">
                      {vendor.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(
                  [
                    ["Category", (v: Doc<"vendors">) => CATEGORY_LABELS[v.category]],
                    ["Status", (v: Doc<"vendors">) => VENDOR_STATUS_LABELS[v.status]],
                    ["Estimated", (v: Doc<"vendors">) => fmt(v.quoteEstimated)],
                    ["Final quote", (v: Doc<"vendors">) => fmt(v.quoteActual)],
                    ["Best known price", (v: Doc<"vendors">) => fmt(bestQuote(v))],
                    ["Payment", (v: Doc<"vendors">) => PAYMENT_STATUS_LABELS[v.paymentStatus]],
                    ["Contact", (v: Doc<"vendors">) => v.contactName || v.phone || v.email || "—"],
                    ["Notes", (v: Doc<"vendors">) => v.notes || "—"],
                  ] as const
                ).map(([label, value]) => {
                  // Prices are only comparable between vendors for the same thing.
                  const sameCategory = compared.every((vendor) => vendor.category === compared[0]?.category);
                  const quotes = compared.map(bestQuote).filter((q): q is number => q !== null);
                  const lowest = sameCategory && quotes.length > 1 ? Math.min(...quotes) : null;
                  return (
                    <tr key={label}>
                      <th scope="row" className="py-3 align-top font-normal text-muted-foreground">
                        {label}
                      </th>
                      {compared.map((vendor) => {
                        const isLowest =
                          label === "Best known price" && lowest !== null && bestQuote(vendor) === lowest;
                        return (
                          <td key={vendor._id} className="tabular py-3 pl-4 align-top">
                            {value(vendor)}
                            {isLowest && <span className="ml-2 text-[0.75rem] text-sage-strong">Lowest</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      <VendorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        eventId={event._id}
        currency={event.currency}
        vendor={editing}
        defaultCategory={defaultCategory}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "vendor"}?`}
        description="The vendor and its notes are removed from this celebration."
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await removeVendor({ vendorId: deleting._id });
            setCompare((current) => current.filter((id) => id !== deleting._id));
            toast.success("Vendor deleted.");
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
      />
    </div>
  );
}
