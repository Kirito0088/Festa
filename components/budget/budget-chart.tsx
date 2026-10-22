"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategorySummary } from "@/lib/budget";
import { CATEGORY_LABELS, type Category } from "@/lib/constants";
import { formatMoney } from "@/lib/money";

/**
 * Estimated vs committed per category. Colours were run through the
 * dataviz palette validator (lightness, chroma, CVD and normal-vision
 * separation all pass on the card surface). The amber sits below 3:1
 * contrast, so the chart always ships with a legend, tooltips and the
 * ledger table as a text equivalent.
 */
const SERIES = {
  estimated: { label: "Estimated", color: "#c48a3a" },
  committed: { label: "Committed", color: "#43824a" },
} as const;

type Row = { category: string; label: string; estimated: number; committed: number; variance: number };

function ChartTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ payload: Row }>;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-2xl bg-popover px-4 py-3 text-[0.8125rem] shadow-[var(--shadow-lifted)] ring-1 ring-foreground/8">
      <p className="font-medium">{row.label}</p>
      <dl className="mt-2 grid grid-cols-[auto_auto] gap-x-5 gap-y-1">
        {(["estimated", "committed"] as const).map((key) => (
          <div key={key} className="contents">
            <dt className="inline-flex items-center gap-2 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: SERIES[key].color }} />
              {SERIES[key].label}
            </dt>
            <dd className="tabular text-right">{formatMoney(row[key], currency)}</dd>
          </div>
        ))}
      </dl>
      {row.variance > 0 && (
        <p className="mt-2 text-danger">Over estimate by {formatMoney(row.variance, currency)}</p>
      )}
    </div>
  );
}

export function BudgetChart({ categories, currency }: { categories: CategorySummary[]; currency: string }) {
  const rows: Row[] = categories.map((category) => ({
    category: category.category,
    label: CATEGORY_LABELS[category.category as Category] ?? category.category,
    estimated: category.estimated,
    committed: category.committed,
    variance: category.variance,
  }));

  return (
    <figure aria-label="Estimated versus committed spending by category">
      <div style={{ height: Math.max(220, rows.length * 46 + 60) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
            barGap={2}
          >
            <CartesianGrid horizontal={false} stroke="#ece7dd" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(value: number) => formatMoney(value, currency, { compact: true })}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={132}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "rgb(32 33 31 / 0.04)" }}
              content={<ChartTooltip currency={currency} />}
            />
            <Legend
              verticalAlign="top"
              align="right"
              height={32}
              iconType="circle"
              iconSize={8}
              // Match the bar order (estimated, then committed) rather than sorting by label.
              itemSorter={(item) => (item.dataKey === "estimated" ? 0 : 1)}
              formatter={(value: string) => (
                <span className="text-[0.75rem] text-muted-foreground">{value}</span>
              )}
            />
            <Bar
              dataKey="estimated"
              name={SERIES.estimated.label}
              fill={SERIES.estimated.color}
              barSize={9}
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="committed"
              name={SERIES.committed.label}
              fill={SERIES.committed.color}
              barSize={9}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {rows
          .map(
            (row) =>
              `${row.label}: estimated ${formatMoney(row.estimated, currency)}, committed ${formatMoney(row.committed, currency)}`,
          )
          .join("; ")}
      </figcaption>
    </figure>
  );
}
