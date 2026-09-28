import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/AppLayout";
import { CategoryIcon } from "@/components/expenses/CategoryIcon";
import { ExpenseCard, useDeleteExpense } from "@/components/expenses/ExpenseList";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/States";
import { useApp } from "@/context/AppContext";
import { useQuery } from "@/hooks";
import * as api from "@/services/api";
import { addDays, cn, formatLongDate, formatRs, fromISO, relativeDay, todayISO, WEEKDAYS } from "@/lib/utils";

export default function DailyPage() {
  const { categoryById, openAddExpense } = useApp();
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [dir, setDir] = useState(0);
  const { askDelete, dialog } = useDeleteExpense();

  const day = useQuery(() => api.getExpenses({ from: date, to: date, page_size: 500, sort: "date_desc" }), [date]);
  const strip = useQuery(() => api.getAnalytics(addDays(date, -6), date, "daily"), [date]);

  const groups = useMemo(() => {
    const m = new Map<string, { total: number; items: NonNullable<typeof day.data>["items"] }>();
    for (const e of day.data?.items ?? []) {
      const g = m.get(e.category_id) ?? { total: 0, items: [] };
      g.total += e.amount;
      g.items.push(e);
      m.set(e.category_id, g);
    }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [day.data]);

  const go = (n: number) => {
    const next = addDays(date, n);
    if (next > today) return;
    setDir(n);
    setDate(next);
  };

  const total = day.data?.total_amount ?? 0;
  const count = day.data?.items.length ?? 0;

  return (
    <>
      <PageHeader title="Daily Record" subtitle="Har din ka hisab, category ke hisab se." />

      {/* Date navigator */}
      <div className="card p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <button className="btn-secondary h-11 w-11 shrink-0 px-0" onClick={() => go(-1)} aria-label="Previous day">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <label className="relative min-w-0 flex-1 cursor-pointer text-center">
            <span className="block text-xs font-medium uppercase tracking-[0.1em] text-ink-muted">{relativeDay(date) === formatLongDate(date) ? WEEKDAYS[fromISO(date).getDay()] : relativeDay(date)}</span>
            <span className="block truncate text-lg font-bold text-ink sm:text-xl">{formatLongDate(date)}</span>
            <input type="date" className="absolute inset-0 cursor-pointer opacity-0" max={today} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Choose date" />
          </label>
          <button className="btn-secondary h-11 w-11 shrink-0 px-0" onClick={() => go(1)} disabled={date >= today} aria-label="Next day">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        {/* Week strip with daily totals */}
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {(strip.data?.series.slice(-7) ?? Array.from({ length: 7 }, (_, i) => ({ key: addDays(date, i - 6), label: "", total: 0 }))).map((p) => {
            const d = fromISO(p.key);
            const active = p.key === date;
            const max = Math.max(1, ...(strip.data?.series.map((x) => x.total) ?? [1]));
            return (
              <button
                key={p.key}
                onClick={() => setDate(p.key)}
                disabled={p.key > today}
                aria-pressed={active}
                aria-label={`${formatLongDate(p.key)}, ${formatRs(p.total)}`}
                className={cn("flex flex-col items-center gap-1 rounded-xl py-2 transition", active ? "bg-brand text-white" : "hover:bg-surface-2 disabled:opacity-40")}
              >
                <span className={cn("text-[11px] font-medium", active ? "text-white/80" : "text-ink-muted")}>{WEEKDAYS[d.getDay()].slice(0, 3)}</span>
                <span className={cn("text-[15px] font-bold", active ? "text-white" : "text-ink")}>{d.getDate()}</span>
                <span className="flex h-6 w-1.5 items-end overflow-hidden rounded-full bg-black/5" aria-hidden>
                  <span className={cn("w-full rounded-full", active ? "bg-saffron" : "bg-brand/60")} style={{ height: `${(p.total / max) * 100}%` }} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={date} initial={{ opacity: 0, x: dir * 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -16 }} transition={{ duration: 0.22 }}>
          {day.error ? (
            <div className="card mt-4">
              <ErrorState onRetry={day.retry} />
            </div>
          ) : day.loading ? (
            <div className="card mt-4 px-4">
              <LoadingSkeleton variant="list" />
            </div>
          ) : count === 0 ? (
            <div className="card mt-4">
              <EmptyState
                title={date === today ? "Aaj ka pehla kharcha add karein." : "Is din koi kharcha record nahi hua."}
                description={date === today ? "Doodh, sabzi, kiraya — jo bhi ho, yahan likhein." : "Agar kuch reh gaya tha to abhi add kar lein."}
                action={{ label: "Add Expense", onClick: () => openAddExpense({ date }) }}
              />
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-end justify-between gap-3 rounded-2xl bg-brand px-5 py-4 text-white">
                <div>
                  <p className="text-sm text-white/80">Total</p>
                  <p className="num text-[32px] font-extrabold leading-tight tracking-tight sm:text-[38px]">{formatRs(total)}</p>
                </div>
                <div className="text-right">
                  <p className="num text-sm text-white/85">
                    {count} {count === 1 ? "item" : "items"} · {groups.length} {groups.length === 1 ? "category" : "categories"}
                  </p>
                  <button onClick={() => openAddExpense({ date })} className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-xl bg-white/15 px-3 text-sm font-semibold hover:bg-white/25">
                    <Plus className="h-4 w-4" aria-hidden /> Add
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {groups.map(([catId, g]) => {
                  const c = categoryById(catId);
                  return (
                    <section key={catId} className="card p-4" aria-label={`${c?.name ?? "Other"} ${formatRs(g.total)}`}>
                      <header className="flex items-center gap-3 border-b border-line pb-3">
                        <CategoryIcon category={c} />
                        <h2 className="flex-1 font-bold text-ink">{c?.name ?? "Other"}</h2>
                        <span className="num font-bold text-ink">{formatRs(g.total)}</span>
                      </header>
                      <ul className="divide-y divide-line">
                        {g.items.map((e) => (
                          <li key={e.id}>
                            <ExpenseCard expense={e} category={c} showDate={false} onEdit={(x) => openAddExpense({ edit: x })} onDelete={askDelete} className="[&>span:first-child]:hidden" />
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border-2 border-dashed border-brand/30 px-5 py-4">
                <span className="font-semibold text-ink">Total Daily Expense</span>
                <span className="num text-xl font-extrabold text-brand">{formatRs(total)}</span>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      {dialog}
    </>
  );
}
