import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import type { Budget } from "@/types";
import { useCountUp } from "@/hooks";
import { cn, formatNum, formatRs, pctChange } from "@/lib/utils";

export function ExpenseSummaryCard({
  label, value, previous, compareLabel, icon, money = true, emphasis, index = 0,
}: {
  label: string;
  value: number;
  previous?: number;
  compareLabel?: string;
  icon: ReactNode;
  money?: boolean;
  emphasis?: boolean;
  index?: number;
}) {
  const v = useCountUp(value);
  const change = previous != null ? pctChange(value, previous) : null;
  // For spending, going up is "bad" (warning tone), going down is good.
  const up = change != null && change > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 lg:p-5",
        emphasis ? "border-transparent bg-brand text-white shadow-[0_18px_40px_-18px_rgb(var(--brand)/0.8)]" : "card",
      )}
    >
      {emphasis && (
        <svg className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 opacity-[0.14]" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="50" cy="50" r="34" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="50" cy="50" r="20" fill="none" stroke="white" strokeWidth="1" />
        </svg>
      )}
      <div className="flex items-center justify-between">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", emphasis ? "bg-white/15 text-white" : "bg-brand-soft text-brand")}>{icon}</span>
        {change != null && (
          <span
            className={cn(
              "chip num",
              emphasis ? "bg-white/15 text-white" : up ? "bg-warning/15 text-ink" : "bg-success/12 text-success",
            )}
            title={compareLabel}
          >
            {up ? <TrendingUp className="h-3 w-3" aria-hidden /> : <TrendingDown className="h-3 w-3" aria-hidden />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <p className={cn("mt-3 text-[13px] font-medium", emphasis ? "text-white/80" : "text-ink-muted")}>{label}</p>
      <p className={cn("num mt-0.5 whitespace-nowrap text-[21px] font-extrabold leading-tight tracking-tight min-[400px]:text-[24px] sm:text-[26px] lg:text-[30px]", emphasis ? "text-white" : "text-ink")}>
        {money ? formatRs(v) : formatNum(v)}
      </p>
      {compareLabel && change != null && (
        <p className={cn("mt-1 truncate text-xs", emphasis ? "text-white/75" : "text-ink-muted")}>
          <span className="sr-only">{up ? "Up" : "Down"} {Math.abs(change).toFixed(1)}% </span>
          {compareLabel}
        </p>
      )}
    </motion.div>
  );
}

export function BudgetProgress({ budget, spent, onEdit, compact }: { budget: Budget | null; spent: number; onEdit?: () => void; compact?: boolean }) {
  if (!budget)
    return (
      <div className="rounded-2xl border border-dashed border-line p-5 text-center">
        <p className="font-semibold text-ink">Monthly budget set nahi hai</p>
        <p className="mt-1 text-sm text-ink-muted">Budget set karein taake pata chale kitna bacha hai.</p>
        {onEdit && (
          <button className="btn-primary mt-4" onClick={onEdit}>
            Set Budget
          </button>
        )}
      </div>
    );
  const pct = spent / budget.amount;
  const remaining = budget.amount - spent;
  const state = pct >= 1 ? "over" : pct >= 0.85 ? "near" : "ok";
  const barColor = state === "over" ? "bg-danger" : state === "near" ? "bg-warning" : "bg-brand";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-[13px] font-medium text-ink-muted">{remaining >= 0 ? "Remaining" : "Over budget"}</p>
          <p className={cn("num text-[28px] font-extrabold leading-tight tracking-tight", remaining < 0 ? "text-danger" : "text-ink")}>{formatRs(Math.abs(remaining))}</p>
        </div>
        {onEdit && (
          <button onClick={onEdit} className="text-sm font-semibold text-brand hover:underline">
            Edit
          </button>
        )}
      </div>
      <div
        className="mt-3 h-3 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-label="Monthly budget used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, Math.round(pct * 100))}
      >
        <motion.div className={cn("h-full rounded-full", barColor)} initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct * 100)}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
      </div>
      <div className="mt-2 flex justify-between text-[13px] text-ink-muted">
        <span className="num">
          Spent <b className="text-ink">{formatRs(spent)}</b>
        </span>
        <span className="num">
          of <b className="text-ink">{formatRs(budget.amount)}</b>
        </span>
      </div>
      {state !== "ok" && !compact && (
        <div className={cn("mt-3 flex items-start gap-2 rounded-xl p-3 text-sm", state === "over" ? "bg-danger/10 text-ink" : "bg-warning/12 text-ink")} role="status">
          <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", state === "over" ? "text-danger" : "text-warning")} aria-hidden />
          {state === "over" ? "Is mahine ka budget khatam ho gaya hai. Kharchon par nazar rakhein." : `Budget ka ${Math.round(pct * 100)}% istemal ho chuka hai. Sirf ${formatRs(remaining)} baqi hain.`}
        </div>
      )}
    </div>
  );
}

/** Circular progress ring for budget usage (hero + dashboard) */
export function Ring({ value, size = 56, stroke = 6, color = "rgb(var(--brand))", track = "rgb(var(--surface-2))", children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, value)) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </div>
  );
}
