import { useState } from "react";
import { PageHeader } from "@/components/layout/AppLayout";
import { SpendingChart, CategoryChart } from "@/components/charts";
import { DateRangePicker, Segmented, rangeFromPreset, type RangeValue } from "@/components/ui/DateRangePicker";
import { EmptyState, ErrorState, LoadingSkeleton, Skeleton } from "@/components/ui/States";
import { CategoryIcon } from "@/components/expenses/CategoryIcon";
import type { Granularity } from "@/types";
import { useQuery } from "@/hooks";
import * as api from "@/services/api";
import { addDays, daysBetween, formatNum, formatRs, todayISO } from "@/lib/utils";

export default function AnalyticsPage() {
  const [range, setRange] = useState<RangeValue>(rangeFromPreset("30d"));
  const [gran, setGran] = useState<Granularity>("daily");
  const from = range.from ?? addDays(todayISO(), -29);
  const to = range.to ?? todayISO();
  const span = daysBetween(from, to) + 1;

  const overview = useQuery(() => api.getAnalytics(from, to, gran), [from, to, gran]);
  const trend = useQuery(() => api.getAnalytics(from, to, span > 45 ? "weekly" : "daily"), [from, to]);
  // Previous equivalent period, for comparison
  const prev = useQuery(() => api.getAnalytics(addDays(from, -span), addDays(from, -1), "daily"), [from, span]);

  const a = overview.data;
  const change = a && prev.data?.total ? ((a.total - prev.data.total) / prev.data.total) * 100 : null;

  return (
    <>
      <PageHeader title="Analytics" subtitle="Dekhein paisa kahan ja raha hai." />

      <div className="card p-3 sm:p-4">
        <DateRangePicker value={range} onChange={setRange} presets={["7d", "30d", "3m", "custom"]} label="Period" />
      </div>

      {overview.error ? (
        <div className="card mt-4">
          <ErrorState onRetry={overview.retry} />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Key figures">
            <Kpi label="Total spent" value={a ? formatRs(a.total) : null} sub={change != null ? `${change > 0 ? "▲" : "▼"} ${Math.abs(change).toFixed(1)}% vs previous ${span} days` : undefined} tone={change != null && change > 0 ? "warn" : "good"} />
            <Kpi label="Average per day" value={a ? formatRs(a.average_per_day) : null} />
            <Kpi label="Entries" value={a ? formatNum(a.count) : null} sub={a && a.count ? `Avg ${formatRs(a.total / a.count)} per entry` : undefined} />
            <Kpi
              label="Top category"
              value={a ? a.by_category[0]?.name ?? "—" : null}
              sub={a?.by_category[0] ? `${formatRs(a.by_category[0].total)} · ${Math.round(a.by_category[0].share * 100)}%` : undefined}
            />
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-5">
            <section className="card p-4 sm:p-5 lg:col-span-3" aria-labelledby="ov-h">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="ov-h" className="text-lg font-bold text-ink">
                    Spending Overview
                  </h2>
                  <p className="text-sm text-ink-muted">{gran === "daily" ? "Har din" : gran === "weekly" ? "Har hafta" : "Har mahina"} ka total</p>
                </div>
                <div className="w-full sm:w-auto">
                  <Segmented
                    label="Granularity"
                    value={gran}
                    onChange={setGran}
                    options={[
                      { v: "daily", l: "Daily" },
                      { v: "weekly", l: "Weekly" },
                      { v: "monthly", l: "Monthly" },
                    ]}
                  />
                </div>
              </div>
              {a ? a.count ? <SpendingChart data={a.series} kind="bar" height={280} /> : <EmptyState compact title="Is period mein koi kharcha nahi" /> : <LoadingSkeleton variant="chart" />}
            </section>

            <section className="card p-4 sm:p-5 lg:col-span-2" aria-labelledby="cb-h">
              <h2 id="cb-h" className="mb-4 text-lg font-bold text-ink">
                Category Breakdown
              </h2>
              {a ? a.by_category.length ? <CategoryChart data={a.by_category} total={a.total} height={190} /> : <EmptyState compact title="Koi data nahi" /> : <LoadingSkeleton variant="chart" />}
            </section>

            <section className="card p-4 sm:p-5 lg:col-span-3" aria-labelledby="tr-h">
              <div className="mb-4">
                <h2 id="tr-h" className="text-lg font-bold text-ink">
                  Spending Trend
                </h2>
                <p className="text-sm text-ink-muted">Saffron line = average</p>
              </div>
              {trend.error ? (
                <ErrorState onRetry={trend.retry} />
              ) : trend.data ? (
                <SpendingChart data={trend.data.series} kind="area" height={240} average={trend.data.series.reduce((s, p) => s + p.total, 0) / Math.max(1, trend.data.series.length)} />
              ) : (
                <LoadingSkeleton variant="chart" />
              )}
            </section>

            <section className="card p-4 sm:p-5 lg:col-span-2" aria-labelledby="ti-h">
              <h2 id="ti-h" className="mb-3 text-lg font-bold text-ink">
                Sab se zyada kharcha
              </h2>
              {a ? (
                <ol className="space-y-3">
                  {a.top_items.map((t, i) => (
                    <li key={t.item_name} className="flex items-center gap-3">
                      <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-bold text-ink-muted">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate font-semibold text-ink">{t.item_name}</span>
                          <span className="num font-bold text-ink">{formatRs(t.total)}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                          <div className="h-full rounded-full bg-saffron" style={{ width: `${(t.total / (a.top_items[0]?.total || 1)) * 100}%` }} />
                        </div>
                        <p className="mt-0.5 text-xs text-ink-muted">{t.count} times</p>
                      </div>
                    </li>
                  ))}
                  {!a.top_items.length && <p className="text-sm text-ink-muted">Koi data nahi.</p>}
                </ol>
              ) : (
                <LoadingSkeleton variant="list" />
              )}
            </section>
          </div>

          {a && a.by_category.length > 0 && (
            <section className="card mt-4 overflow-hidden" aria-labelledby="ct-h">
              <h2 id="ct-h" className="px-5 pb-2 pt-5 text-lg font-bold text-ink">
                Category totals
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-[15px]">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-[0.08em] text-ink-muted">
                      <th scope="col" className="px-5 py-2.5 font-semibold">Category</th>
                      <th scope="col" className="px-5 py-2.5 text-right font-semibold">Entries</th>
                      <th scope="col" className="px-5 py-2.5 text-right font-semibold">Share</th>
                      <th scope="col" className="px-5 py-2.5 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.by_category.map((c) => (
                      <tr key={c.category_id} className="border-b border-line/70 last:border-0">
                        <td className="px-5 py-2.5">
                          <span className="flex items-center gap-2.5 font-medium text-ink">
                            <CategoryIcon icon={c.icon} color={c.color} size="sm" /> {c.name}
                          </span>
                        </td>
                        <td className="num px-5 py-2.5 text-right text-ink-muted">{c.count}</td>
                        <td className="num px-5 py-2.5 text-right text-ink-muted">{(c.share * 100).toFixed(1)}%</td>
                        <td className="num px-5 py-2.5 text-right font-bold text-ink">{formatRs(c.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-surface-2/60">
                      <th scope="row" className="px-5 py-3 text-left font-bold text-ink">Total</th>
                      <td className="num px-5 py-3 text-right font-semibold text-ink">{a.count}</td>
                      <td className="num px-5 py-3 text-right text-ink-muted">100%</td>
                      <td className="num px-5 py-3 text-right font-extrabold text-ink">{formatRs(a.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string | null; sub?: string; tone?: "good" | "warn" }) {
  return (
    <div className="card p-4">
      <p className="text-[13px] font-medium text-ink-muted">{label}</p>
      {value == null ? <Skeleton className="mt-2 h-7 w-24" /> : <p className="num mt-1 truncate text-[22px] font-extrabold tracking-tight text-ink sm:text-[26px]">{value}</p>}
      {sub && <p className={`mt-0.5 truncate text-xs ${tone === "warn" ? "text-ink" : tone === "good" ? "text-success" : "text-ink-muted"}`}>{sub}</p>}
    </div>
  );
}
