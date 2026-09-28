import { useEffect, useState } from "react";
import { CalendarClock, PiggyBank, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/AppLayout";
import { BudgetProgress, Ring } from "@/components/expenses/SummaryCards";
import { ErrorState, LoadingSkeleton } from "@/components/ui/States";
import { Spinner } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { useQuery } from "@/hooks";
import * as api from "@/services/api";
import { cn, endOfMonth, formatNum, formatRs, fromISO, MONTHS, todayISO } from "@/lib/utils";

export function BudgetEditor({ current, onSaved }: { current?: number; onSaved?: () => void }) {
  const toast = useToast();
  const [amount, setAmount] = useState(current ? String(current) : "");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (current) setAmount(String(current));
  }, [current]);
  const save = async () => {
    const n = Number(amount.replace(/,/g, ""));
    if (!(n > 0)) return setErr("Sahi budget amount likhein.");
    setSaving(true);
    try {
      await api.setBudget(Math.round(n));
      toast.success("Budget saved.", `${formatRs(n)} is mahine ke liye`);
      onSaved?.();
    } catch (e) {
      toast.error("Budget save nahi hua.", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      noValidate
    >
      <label htmlFor="budget-amt" className="label">
        Monthly Budget
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">Rs.</span>
          <input
            id="budget-amt"
            className={cn("input num pl-11 text-lg font-bold", err && "input-error")}
            inputMode="numeric"
            value={amount ? formatNum(Number(amount.replace(/,/g, "")) || 0) : ""}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^\d]/g, ""));
              setErr("");
            }}
            placeholder="50,000"
            aria-invalid={!!err}
          />
        </div>
        <button className="btn-primary" disabled={saving}>
          {saving ? <Spinner /> : "Save"}
        </button>
      </div>
      {err && (
        <p className="mt-1 text-xs font-medium text-danger" role="alert">
          {err}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {[30000, 40000, 50000, 75000, 100000].map((v) => (
          <button key={v} type="button" onClick={() => setAmount(String(v))} className={cn("num rounded-full border px-3 py-1.5 text-sm font-semibold transition", Number(amount) === v ? "border-brand bg-brand-soft text-brand" : "border-line text-ink hover:border-brand/40")}>
            {formatRs(v, { compact: true })}
          </button>
        ))}
      </div>
    </form>
  );
}

export default function BudgetPage() {
  const { data: s, loading, error, retry } = useQuery(() => api.getDashboardStats(), []);
  const today = todayISO();
  const d = fromISO(today);
  const daysLeft = fromISO(endOfMonth(today)).getDate() - d.getDate() + 1;

  return (
    <>
      <PageHeader title="Budget" subtitle={`${MONTHS[d.getMonth()]} ${d.getFullYear()} ka budget`} />
      {error ? (
        <div className="card">
          <ErrorState onRetry={retry} />
        </div>
      ) : loading || !s ? (
        <LoadingSkeleton variant="dashboard" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <section className="card p-5 lg:col-span-3" aria-labelledby="bud-h">
            <h2 id="bud-h" className="sr-only">
              Budget status
            </h2>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              {s.budget && (
                <Ring value={s.month / s.budget.amount} size={148} stroke={14} color={s.month / s.budget.amount >= 1 ? "rgb(var(--danger))" : s.month / s.budget.amount >= 0.85 ? "rgb(var(--warning))" : "rgb(var(--brand))"}>
                  <span className="text-center">
                    <span className="num block text-3xl font-extrabold text-ink">{Math.round((s.month / s.budget.amount) * 100)}%</span>
                    <span className="text-xs text-ink-muted">used</span>
                  </span>
                </Ring>
              )}
              <div className="w-full flex-1">
                <BudgetProgress budget={s.budget} spent={s.month} />
              </div>
            </div>
            {s.budget && (
              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-5">
                <Stat icon={<Wallet className="h-4 w-4" />} label="Monthly Budget" value={formatRs(s.budget.amount)} />
                <Stat icon={<PiggyBank className="h-4 w-4" />} label="Spent" value={formatRs(s.month)} />
                <Stat icon={<CalendarClock className="h-4 w-4" />} label={`${daysLeft} din baqi`} value={s.budget.amount > s.month ? `${formatRs((s.budget.amount - s.month) / daysLeft)}/din` : "—"} />
              </dl>
            )}
          </section>
          <section className="card p-5 lg:col-span-2" aria-labelledby="set-h">
            <h2 id="set-h" className="mb-1 text-lg font-bold text-ink">
              {s.budget ? "Budget badlein" : "Budget set karein"}
            </h2>
            <p className="mb-4 text-sm text-ink-muted">85% istemal hone par hum aap ko khabardaar karenge.</p>
            <BudgetEditor current={s.budget?.amount} />
          </section>
        </div>
      )}
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-ink-muted">
        <span className="text-brand" aria-hidden>
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </dt>
      <dd className="num mt-1 truncate text-[15px] font-bold text-ink sm:text-lg">{value}</dd>
    </div>
  );
}
