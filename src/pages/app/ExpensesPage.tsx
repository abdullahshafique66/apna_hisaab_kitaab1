import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Filter, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import type { ExpenseQuery, SortKey } from "@/types";
import { PageHeader } from "@/components/layout/AppLayout";
import { ExpenseCard, ExpenseTable, useDeleteExpense } from "@/components/expenses/ExpenseList";
import { DateRangePicker, rangeFromPreset, type RangeValue } from "@/components/ui/DateRangePicker";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/States";
import { useApp } from "@/context/AppContext";
import { useDebounced, useMediaQuery, useQuery } from "@/hooks";
import * as api from "@/services/api";
import { cn, formatNum, formatRs, relativeDay } from "@/lib/utils";

const SORTS: { v: SortKey; l: string }[] = [
  { v: "date_desc", l: "Newest first" },
  { v: "date_asc", l: "Oldest first" },
  { v: "amount_desc", l: "Amount: high to low" },
  { v: "amount_asc", l: "Amount: low to high" },
  { v: "name_asc", l: "Item name A–Z" },
];

export default function ExpensesPage() {
  const { categories, categoryById, openAddExpense } = useApp();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "all");
  const [range, setRange] = useState<RangeValue>(rangeFromPreset("all"));
  const [minAmt, setMinAmt] = useState("");
  const [maxAmt, setMaxAmt] = useState("");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const dSearch = useDebounced(search, 120);
  const { askDelete, dialog } = useDeleteExpense();

  useEffect(() => {
    const q = params.get("q");
    if (q !== null) setSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get("q")]);

  const query: ExpenseQuery = useMemo(
    () => ({
      search: dSearch,
      category_id: category,
      from: range.from,
      to: range.to,
      min_amount: minAmt ? Number(minAmt) : undefined,
      max_amount: maxAmt ? Number(maxAmt) : undefined,
      sort,
      page,
      page_size: isDesktop ? 12 : 15,
    }),
    [dSearch, category, range, minAmt, maxAmt, sort, page, isDesktop],
  );
  useEffect(() => setPage(1), [dSearch, category, range, minAmt, maxAmt, sort]);

  const { data, loading, error, retry, refreshing } = useQuery(() => api.getExpenses(query), [JSON.stringify(query)]);

  const activeFilters = [category !== "all", range.preset !== "all", !!minAmt, !!maxAmt].filter(Boolean).length;
  const clearAll = () => {
    setSearch("");
    setCategory("all");
    setRange(rangeFromPreset("all"));
    setMinAmt("");
    setMaxAmt("");
    setParams({});
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  // Group mobile cards by day for a notebook feel
  const grouped = useMemo(() => {
    if (!data || sort.startsWith("amount") || sort === "name_asc") return null;
    const g: { date: string; items: typeof data.items; total: number }[] = [];
    for (const e of data.items) {
      const last = g[g.length - 1];
      if (last?.date === e.date) {
        last.items.push(e);
        last.total += e.amount;
      } else g.push({ date: e.date, items: [e], total: e.amount });
    }
    return g;
  }, [data, sort]);

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle="Har kharcha, har din — sab yahan."
        actions={
          <button className="btn-primary" onClick={() => openAddExpense()}>
            <Plus className="h-5 w-5" aria-hidden /> Add Expense
          </button>
        }
      />

      <div className="card p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <label htmlFor="exp-search" className="sr-only">
              Search expenses
            </label>
            <input id="exp-search" className="input pl-10 pr-10" placeholder="Search item, note or category" value={search} onChange={(e) => setSearch(e.target.value)} type="search" />
            {search && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-muted hover:bg-surface-2" onClick={() => setSearch("")} aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <label htmlFor="exp-cat" className="sr-only">
              Category
            </label>
            <select id="exp-cat" className="input w-auto min-w-0 flex-1 lg:w-44" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <label htmlFor="exp-sort" className="sr-only">
              Sort
            </label>
            <select id="exp-sort" className="input w-auto min-w-0 flex-1 lg:w-48" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              {SORTS.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.l}
                </option>
              ))}
            </select>
            <button className={cn("btn-secondary relative shrink-0 px-3", showFilters && "border-brand text-brand")} onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters} aria-controls="more-filters">
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Filters</span>
              {activeFilters > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-saffron text-[11px] font-bold text-[#17211D]">{activeFilters}</span>}
            </button>
          </div>
        </div>
        {showFilters && (
          <div id="more-filters" className="mt-3 grid gap-3 border-t border-line pt-3 md:grid-cols-[1fr_auto]">
            <DateRangePicker value={range} onChange={setRange} presets={["all", "today", "7d", "month", "30d", "custom"]} />
            <fieldset className="flex items-end gap-2">
              <legend className="label">Amount (Rs.)</legend>
              <label className="sr-only" htmlFor="min-amt">
                Minimum amount
              </label>
              <input id="min-amt" className="input num w-full md:w-28" inputMode="numeric" placeholder="Min" value={minAmt} onChange={(e) => setMinAmt(e.target.value.replace(/\D/g, ""))} />
              <span className="pb-3 text-ink-muted">–</span>
              <label className="sr-only" htmlFor="max-amt">
                Maximum amount
              </label>
              <input id="max-amt" className="input num w-full md:w-28" inputMode="numeric" placeholder="Max" value={maxAmt} onChange={(e) => setMaxAmt(e.target.value.replace(/\D/g, ""))} />
            </fieldset>
          </div>
        )}
      </div>

      {/* Auto-calculated summary for whatever is filtered */}
      <div className="my-4 flex flex-wrap items-center justify-between gap-2 px-1" aria-live="polite">
        <p className="text-sm text-ink-muted">
          {data ? (
            <>
              <b className="num text-ink">{formatNum(data.total)}</b> entries
              {activeFilters > 0 || search ? " match" : ""}
              {(activeFilters > 0 || search) && (
                <button onClick={clearAll} className="ml-2 font-semibold text-brand hover:underline">
                  Clear filters
                </button>
              )}
            </>
          ) : (
            " "
          )}
        </p>
        {data && (
          <p className={cn("num text-[15px] font-semibold text-ink transition-opacity", refreshing && "opacity-60")}>
            Total <span className="text-lg font-extrabold">{formatRs(data.total_amount)}</span>
          </p>
        )}
      </div>

      <div className="card overflow-hidden">
        {error ? (
          <ErrorState onRetry={retry} />
        ) : loading || !data ? (
          <div className="px-4">
            <LoadingSkeleton variant="list" />
          </div>
        ) : data.items.length === 0 ? (
          activeFilters || search ? (
            <EmptyState
              icon={<span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-ink-muted"><Filter className="h-6 w-6" /></span>}
              title="Koi kharcha nahi mila"
              description="Filters badal kar dobara koshish karein."
              action={{ label: "Clear filters", onClick: clearAll, icon: <X className="h-4 w-4" /> }}
            />
          ) : (
            <EmptyState title="Aaj ka pehla kharcha add karein." description="Yahan aap ke saare kharchay nazar aayenge." action={{ label: "Add Expense", onClick: () => openAddExpense() }} />
          )
        ) : isDesktop ? (
          <ExpenseTable rows={data.items} sort={sort} onSort={setSort} onEdit={(e) => openAddExpense({ edit: e })} onDelete={askDelete} />
        ) : grouped ? (
          <div>
            {grouped.map((g) => (
              <section key={g.date} aria-label={relativeDay(g.date)}>
                <div className="sticky top-16 z-10 flex items-center justify-between border-b border-line bg-surface-2/95 px-4 py-2 text-[13px] backdrop-blur">
                  <span className="font-semibold text-ink">{relativeDay(g.date)}</span>
                  <span className="num font-semibold text-ink-muted">{formatRs(g.total)}</span>
                </div>
                <ul className="divide-y divide-line px-4">
                  {g.items.map((e) => (
                    <li key={e.id}>
                      <ExpenseCard expense={e} category={categoryById(e.category_id)} showDate={false} onEdit={(x) => openAddExpense({ edit: x })} onDelete={askDelete} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-line px-4">
            {data.items.map((e) => (
              <li key={e.id}>
                <ExpenseCard expense={e} category={categoryById(e.category_id)} onEdit={(x) => openAddExpense({ edit: x })} onDelete={askDelete} />
              </li>
            ))}
          </ul>
        )}

        {data && data.total > data.page_size && (
          <nav className="flex items-center justify-between gap-2 border-t border-line px-4 py-3" aria-label="Pagination">
            <p className="num text-sm text-ink-muted">
              {(data.page - 1) * data.page_size + 1}–{Math.min(data.total, data.page * data.page_size)} of {data.total}
            </p>
            <div className="flex items-center gap-1">
              <button className="btn-ghost h-9 px-2.5" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="num px-2 text-sm font-semibold text-ink" aria-current="page">
                {data.page} / {pages}
              </span>
              <button className="btn-ghost h-9 px-2.5" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </nav>
        )}
      </div>
      {dialog}
    </>
  );
}
