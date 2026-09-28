/**
 * Pure calculation helpers — the "automatic hisab".
 * Used by the mock backend today; the FastAPI backend can reproduce the same logic server-side.
 * Every total in the UI is derived from expense rows, never typed in by hand.
 */
import type {
  Analytics, Budget, Category, CategoryTotal, DashboardStats, Expense, ExpenseQuery,
  Granularity, ISODate, Paginated, Report, SeriesPoint,
} from "@/types";
import { MONTHS, MONTHS_SHORT, addDays, daysBetween, endOfMonth, formatShortDate, fromISO, startOfMonth, toISO, todayISO } from "@/lib/utils";

export const sum = (xs: Expense[]) => xs.reduce((a, e) => a + e.amount, 0);
export const inRange = (e: Expense, from: ISODate, to: ISODate) => e.date >= from && e.date <= to;

export function computeDashboardStats(expenses: Expense[], budget: Budget | null, today = todayISO()): DashboardStats {
  const within = (from: ISODate, to: ISODate) => expenses.filter((e) => inRange(e, from, to));
  const monthStart = startOfMonth(today);
  const prevMonthEnd = addDays(monthStart, -1);
  const prevMonthStart = startOfMonth(prevMonthEnd);
  // Compare month-to-date with the same number of days last month
  const dayOfMonth = fromISO(today).getDate();
  const prevSameDay = toISO(new Date(fromISO(prevMonthStart).getFullYear(), fromISO(prevMonthStart).getMonth(), Math.min(dayOfMonth, fromISO(prevMonthEnd).getDate())));
  const month = within(monthStart, today);
  return {
    today: sum(within(today, today)),
    yesterday: sum(within(addDays(today, -1), addDays(today, -1))),
    week: sum(within(addDays(today, -6), today)),
    last_week: sum(within(addDays(today, -13), addDays(today, -7))),
    month: sum(month),
    last_month: sum(within(prevMonthStart, prevSameDay)),
    total_entries: month.length,
    month_entries: month.length,
    budget,
  };
}

export function filterExpenses(expenses: Expense[], q: ExpenseQuery, categories: Category[]): Paginated<Expense> {
  const search = q.search?.trim().toLowerCase();
  const catName = new Map(categories.map((c) => [c.id, c.name.toLowerCase()]));
  let rows = expenses.filter((e) => {
    if (q.category_id && q.category_id !== "all" && e.category_id !== q.category_id) return false;
    if (q.from && e.date < q.from) return false;
    if (q.to && e.date > q.to) return false;
    if (q.min_amount != null && e.amount < q.min_amount) return false;
    if (q.max_amount != null && e.amount > q.max_amount) return false;
    if (search) {
      const hay = `${e.item_name} ${e.note ?? ""} ${catName.get(e.category_id) ?? ""}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
  const sort = q.sort ?? "date_desc";
  rows = [...rows].sort((a, b) => {
    switch (sort) {
      case "date_asc": return a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at);
      case "amount_desc": return b.amount - a.amount;
      case "amount_asc": return a.amount - b.amount;
      case "name_asc": return a.item_name.localeCompare(b.item_name);
      default: return b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at);
    }
  });
  const page_size = q.page_size ?? 10;
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / page_size));
  const page = Math.min(Math.max(1, q.page ?? 1), pages);
  return {
    items: rows.slice((page - 1) * page_size, page * page_size),
    total,
    page,
    page_size,
    total_amount: sum(rows),
  };
}

export function categoryTotals(expenses: Expense[], categories: Category[]): CategoryTotal[] {
  const total = sum(expenses) || 1;
  const map = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    const m = map.get(e.category_id) ?? { total: 0, count: 0 };
    m.total += e.amount;
    m.count += 1;
    map.set(e.category_id, m);
  }
  const fallback = categories.find((c) => c.icon === "other");
  return [...map.entries()]
    .map(([id, v]) => {
      const c = categories.find((x) => x.id === id) ?? fallback;
      return {
        category_id: id,
        name: c?.name ?? "Other",
        color: c?.color ?? "#86938C",
        icon: c?.icon ?? "other",
        total: v.total,
        count: v.count,
        share: v.total / total,
      } satisfies CategoryTotal;
    })
    .sort((a, b) => b.total - a.total);
}

export function buildSeries(expenses: Expense[], from: ISODate, to: ISODate, g: Granularity): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  if (g === "daily") {
    const byDay = new Map<string, number>();
    for (const e of expenses) byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.amount);
    for (let d = from; d <= to; d = addDays(d, 1)) points.push({ key: d, label: formatShortDate(d), total: byDay.get(d) ?? 0 });
  } else if (g === "weekly") {
    // 7-day buckets ending on `to`
    for (let end = to; end >= from; end = addDays(end, -7)) {
      const start = addDays(end, -6) < from ? from : addDays(end, -6);
      const total = sum(expenses.filter((e) => inRange(e, start, end)));
      points.unshift({ key: start, label: formatShortDate(start), total });
    }
  } else {
    for (let m = startOfMonth(from); m <= to; m = addDays(endOfMonth(m), 1)) {
      const end = endOfMonth(m) > to ? to : endOfMonth(m);
      const d = fromISO(m);
      points.push({ key: m, label: `${MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, total: sum(expenses.filter((e) => inRange(e, m < from ? from : m, end))) });
    }
  }
  return points;
}

export function computeAnalytics(all: Expense[], categories: Category[], from: ISODate, to: ISODate, g: Granularity): Analytics {
  const rows = all.filter((e) => inRange(e, from, to));
  const total = sum(rows);
  const items = new Map<string, { total: number; count: number }>();
  for (const e of rows) {
    const k = e.item_name.trim();
    const m = items.get(k) ?? { total: 0, count: 0 };
    m.total += e.amount;
    m.count += 1;
    items.set(k, m);
  }
  return {
    from,
    to,
    total,
    count: rows.length,
    average_per_day: total / (daysBetween(from, to) + 1),
    series: buildSeries(rows, from, to, g),
    by_category: categoryTotals(rows, categories),
    top_items: [...items.entries()].map(([item_name, v]) => ({ item_name, ...v })).sort((a, b) => b.total - a.total).slice(0, 6),
  };
}

export function periodLabel(from: ISODate, to: ISODate): string {
  const a = fromISO(from), b = fromISO(to);
  if (from === startOfMonth(from) && (to === endOfMonth(from) || (to === todayISO() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear())))
    return `${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
  return `${formatShortDate(from)} ${a.getFullYear() !== b.getFullYear() ? a.getFullYear() : ""} – ${formatShortDate(to)} ${b.getFullYear()}`.replace(/\s+/g, " ");
}

export function buildReport(all: Expense[], categories: Category[], from: ISODate, to: ISODate, title: string): Report {
  const expenses = all.filter((e) => inRange(e, from, to)).sort((a, b) => a.date.localeCompare(b.date));
  return {
    title,
    period_label: periodLabel(from, to),
    from,
    to,
    total_items: expenses.length,
    total_expense: sum(expenses),
    by_category: categoryTotals(expenses, categories),
    expenses,
    generated_at: new Date().toISOString(),
  };
}
