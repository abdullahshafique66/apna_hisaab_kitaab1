import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck2, CalendarDays, CalendarRange, ListChecks, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/AppLayout";
import { ExpenseSummaryCard, BudgetProgress, Ring } from "@/components/expenses/SummaryCards";
import { ExpenseCard, useDeleteExpense } from "@/components/expenses/ExpenseList";
import { SpendingChart, CategoryChart } from "@/components/charts";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/States";
import { useApp } from "@/context/AppContext";
import { useQuery } from "@/hooks";
import * as api from "@/services/api";
import { addDays, formatLongDate, formatRs, startOfMonth, todayISO, WEEKDAYS, fromISO } from "@/lib/utils";

export default function DashboardPage() {
  const { openAddExpense, categoryById, user } = useApp();
  const today = todayISO();
  const stats = useQuery(() => api.getDashboardStats(), []);
  const trend = useQuery(() => api.getAnalytics(addDays(today, -13), today, "daily"), [today]);
  const month = useQuery(() => api.getAnalytics(startOfMonth(today), today, "daily"), [today]);
  const todays = useQuery(() => api.getExpenses({ from: today, to: today, page_size: 100, sort: "date_asc" }), [today]);
  const recent = useQuery(() => api.getExpenses({ to: addDays(today, -1), page_size: 6 }), [today]);
  const { askDelete, dialog } = useDeleteExpense();

  const header = (
    <PageHeader
      eyebrow={`${WEEKDAYS[fromISO(today).getDay()]}, ${formatLongDate(today)}`}
      title={`Assalam-o-Alaikum${user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋`}
      subtitle="Aaj ka kharcha dekhein aur apna hisab manage karein."
      actions={
        <button className="btn-primary hidden lg:inline-flex" onClick={() => openAddExpense()}>
          <Plus className="h-5 w-5" aria-hidden /> Add Expense
        </button>
      }
    />
  );

  if (stats.error)
    return (
      <>
        {header}
        <div className="card">
          <ErrorState onRetry={stats.retry} />
        </div>
      </>
    );
  if (stats.loading || !stats.data)
    return (
      <>
        {header}
        <LoadingSkeleton variant="dashboard" />
      </>
    );

  const s = stats.data;
  const budgetPct = s.budget ? s.month / s.budget.amount : 0;
  const todayRows = todays.data?.items ?? [];

  return (
    <>
      {header}

      <section aria-label="Spending summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <ExpenseSummaryCard index={0} emphasis label="Today" value={s.today} previous={s.yesterday} compareLabel="from yesterday" icon={<CalendarCheck2 className="h-5 w-5" />} />
        <ExpenseSummaryCard index={1} label="This Week" value={s.week} previous={s.last_week} compareLabel="vs previous 7 days" icon={<CalendarDays className="h-5 w-5" />} />
        <ExpenseSummaryCard index={2} label="This Month" value={s.month} previous={s.last_month} compareLabel="vs same days last month" icon={<CalendarRange className="h-5 w-5" />} />
        <ExpenseSummaryCard index={3} label="Total Entries" value={s.total_entries} money={false} icon={<ListChecks className="h-5 w-5" />} />
      </section>

      <div className="mt-4 grid gap-4 lg:mt-5 lg:grid-cols-3 lg:gap-5">
        {/* Today's hisab — the live, auto-calculated list */}
        <section className="card flex flex-col p-4 sm:p-5 lg:col-span-2" aria-labelledby="today-h">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="today-h" className="text-lg font-bold text-ink sm:text-xl">
                Aaj ka Hisab
              </h2>
              <p className="text-sm text-ink-muted">{formatLongDate(today)}</p>
            </div>
            <Link to="/daily" className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
              Daily record <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          {todays.loading ? (
            <LoadingSkeleton variant="list" />
          ) : todays.error ? (
            <ErrorState onRetry={todays.retry} />
          ) : todayRows.length === 0 ? (
            <EmptyState compact title="Aaj ka pehla kharcha add karein." description="Jo bhi khareedein, yahan likhein — total hum khud bana denge." action={{ label: "Add Expense", onClick: () => openAddExpense() }} />
          ) : (
            <>
              <ul className="mt-2 divide-y divide-line">
                {todayRows.map((e) => (
                  <motion.li key={e.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <ExpenseCard expense={e} category={categoryById(e.category_id)} showDate={false} onEdit={(x) => openAddExpense({ edit: x })} onDelete={askDelete} />
                  </motion.li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between rounded-2xl bg-brand-soft/60 px-4 py-3">
                <span className="text-sm font-semibold text-ink-muted">
                  {todayRows.length} {todayRows.length === 1 ? "Item" : "Items"}
                </span>
                <span className="num text-lg font-extrabold text-ink" aria-live="polite">
                  Total {formatRs(todays.data!.total_amount)}
                </span>
              </div>
            </>
          )}
        </section>

        {/* Budget */}
        <section className="card self-start p-4 sm:p-5" aria-labelledby="budget-h">
          <div className="flex items-center justify-between">
            <h2 id="budget-h" className="text-lg font-bold text-ink">
              Monthly Budget
            </h2>
            {s.budget && (
              <Ring value={budgetPct} size={52} stroke={6} color={budgetPct >= 1 ? "rgb(var(--danger))" : budgetPct >= 0.85 ? "rgb(var(--warning))" : "rgb(var(--brand))"}>
                <span className="num text-xs font-bold text-ink">{Math.round(budgetPct * 100)}%</span>
              </Ring>
            )}
          </div>
          <div className="mt-3">
            <BudgetProgress budget={s.budget} spent={s.month} />
          </div>
          <Link to="/budget" className="btn-secondary mt-4 w-full">
            Manage budget
          </Link>
        </section>

        {/* Trend */}
        <section className="card p-4 sm:p-5 lg:col-span-2" aria-labelledby="trend-h">
          <div className="mb-4 flex items-end justify-between gap-2">
            <div>
              <h2 id="trend-h" className="text-lg font-bold text-ink">
                Pichlay 14 din
              </h2>
              <p className="text-sm text-ink-muted">Rozana ka kharcha</p>
            </div>
            {trend.data && (
              <p className="text-right text-sm text-ink-muted">
                Avg / day
                <span className="num block text-base font-bold text-ink">{formatRs(trend.data.average_per_day)}</span>
              </p>
            )}
          </div>
          {trend.error ? <ErrorState onRetry={trend.retry} /> : trend.data ? <SpendingChart data={trend.data.series} kind="bar" height={240} average={trend.data.average_per_day} /> : <LoadingSkeleton variant="chart" />}
        </section>

        {/* Category */}
        <section className="card p-4 sm:p-5" aria-labelledby="cat-h">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="cat-h" className="text-lg font-bold text-ink">
              Is mahine kahan gaya?
            </h2>
            <Link to="/analytics" className="text-sm font-semibold text-brand hover:underline">
              Details
            </Link>
          </div>
          {month.error ? (
            <ErrorState onRetry={month.retry} />
          ) : month.data ? (
            month.data.by_category.length ? (
              <CategoryChart data={month.data.by_category} total={month.data.total} height={180} limit={5} />
            ) : (
              <EmptyState compact title="Is mahine koi kharcha nahi" />
            )
          ) : (
            <LoadingSkeleton variant="chart" />
          )}
        </section>

        {/* Recent */}
        <section className="card p-4 sm:p-5 lg:col-span-3" aria-labelledby="recent-h">
          <div className="flex items-center justify-between">
            <h2 id="recent-h" className="text-lg font-bold text-ink">
              Pichlay kharchay
            </h2>
            <Link to="/expenses" className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
              Sab dekhein <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          {recent.loading ? (
            <LoadingSkeleton variant="list" />
          ) : recent.data?.items.length ? (
            <ul className="mt-1 grid divide-y divide-line md:grid-cols-2 md:gap-x-8 md:divide-y-0">
              {recent.data.items.map((e) => (
                <li key={e.id} className="md:border-b md:border-line">
                  <ExpenseCard expense={e} category={categoryById(e.category_id)} onEdit={(x) => openAddExpense({ edit: x })} onDelete={askDelete} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact title="Abhi koi purana record nahi" />
          )}
        </section>
      </div>
      {dialog}
    </>
  );
}
