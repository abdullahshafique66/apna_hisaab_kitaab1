import { motion } from "framer-motion";
import { Check, TrendingUp } from "lucide-react";
import { Ring } from "@/components/expenses/SummaryCards";
import { formatLongDate, todayISO } from "@/lib/utils";

/** Catmull-Rom → cubic Bézier for a smooth line through points. */
export function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

const WEEK = [820, 1100, 950, 1440, 1020, 1112, 1250];
const DAYS = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"];

export function HeroChart({ delay = 1.1 }: { delay?: number }) {
  const W = 300, H = 92, max = 1600;
  const pts = WEEK.map((v, i) => [Math.round((i / (WEEK.length - 1)) * (W - 12)) + 6, Math.round(H - 8 - (v / max) * (H - 18))] as [number, number]);
  const line = smoothPath(pts);
  const area = `${line} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`;
  const last = pts[pts.length - 1];
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[92px] w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="heroFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgb(var(--brand))" stopOpacity=".26" />
            <stop offset="1" stopColor="rgb(var(--brand))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.33, 0.66].map((f) => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="rgb(var(--line))" strokeDasharray="3 5" />
        ))}
        <motion.path d={area} fill="url(#heroFill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.4, duration: 0.8 }} />
        <motion.path d={line} fill="none" stroke="rgb(var(--brand))" strokeWidth="2.6" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay, duration: 1.1, ease: [0.65, 0, 0.35, 1] }} />
        <motion.circle cx={last[0]} cy={last[1]} r="4.5" fill="rgb(var(--surface))" stroke="rgb(var(--brand))" strokeWidth="2.6" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: delay + 1.05, type: "spring", stiffness: 400 }} />
      </svg>
      <div className="mt-1 flex justify-between px-0.5 text-[10px] font-medium text-ink-muted">
        {DAYS.map((d, i) => (
          <span key={d} className={i === DAYS.length - 1 ? "text-brand" : undefined}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

const ITEMS = [
  { e: "🥛", n: "Doodh", q: "1 Liter", a: 180 },
  { e: "🥔", n: "Aloo", q: "2 Kg", a: 120 },
  { e: "🍅", n: "Tamatar", q: "1 Kg", a: 150 },
  { e: "🍗", n: "Chicken", q: "1 Kg", a: 650 },
];

/** Realistic product screenshot built from real UI primitives. */
export function HeroDashboard() {
  const total = ITEMS.reduce((s, i) => s + i.a, 0);
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-line bg-surface shadow-[0_40px_80px_-30px_rgb(var(--shadow)/0.35),0_0_0_1px_rgb(var(--shadow)/0.02)]">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 border-b border-line bg-surface-2/70 px-4 py-2.5" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-[#E4E9E6]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E4E9E6]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E4E9E6]" />
        <span className="ml-3 flex-1 truncate rounded-md bg-surface px-3 py-1 text-[11px] text-ink-muted">apnahisab.pk/dashboard</span>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-bold text-ink">Good Morning 👋</p>
            <p className="text-xs text-ink-muted">{formatLongDate(todayISO())}</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-saffron-soft text-xs font-bold text-ink">AK</span>
        </div>

        <div className="mt-4 rounded-2xl bg-brand p-4 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-white/80">Today's Spending</p>
              <p className="num mt-0.5 text-[30px] font-extrabold leading-none tracking-tight sm:text-[34px]">Rs. 1,250</p>
            </div>
            <span className="chip num bg-white/15 text-white">
              <TrendingUp className="h-3 w-3" aria-hidden /> 12.4%
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-white/75">12.4% from yesterday</p>
        </div>

        <div className="mt-4">
          <HeroChart />
        </div>

        <ul className="mt-3 divide-y divide-line">
          {ITEMS.map((i, idx) => (
            <motion.li key={i.n} className="flex items-center gap-3 py-2.5" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 + idx * 0.08, duration: 0.4 }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-lg" aria-hidden>
                {i.e}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-ink">{i.n}</span>
                <span className="block text-[11px] text-ink-muted">{i.q}</span>
              </span>
              <span className="num text-sm font-bold text-ink">Rs. {i.a.toLocaleString("en-US")}</span>
            </motion.li>
          ))}
        </ul>
        <div className="mt-2 flex items-center justify-between rounded-xl bg-brand-soft px-3.5 py-2.5">
          <span className="text-xs font-semibold text-ink-muted">4 Items</span>
          <span className="num text-[15px] font-extrabold text-ink">Total Rs. {total.toLocaleString("en-US")}</span>
        </div>
      </div>
    </div>
  );
}

export function FloatingExpenseAdded() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 shadow-float">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5E9E3F]/12 text-xl" aria-hidden>
        🥬
      </span>
      <div>
        <p className="text-[11px] font-medium text-ink-muted">Expense Added</p>
        <p className="text-sm font-bold text-ink">
          Sabzi <span className="num ml-1">Rs. 350</span>
        </p>
      </div>
      <span className="relative ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-success text-white">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-success" aria-hidden />
        <Check className="relative h-3.5 w-3.5" strokeWidth={3} aria-hidden />
      </span>
    </div>
  );
}

export function FloatingMonthly() {
  const vals = [18, 22, 19, 26, 24, 30, 28, 34];
  const pts = vals.map((v, i) => [i * 12, 36 - v] as [number, number]);
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3 shadow-float">
      <p className="text-[11px] font-medium text-ink-muted">Monthly Spending</p>
      <div className="flex items-end gap-3">
        <p className="num text-lg font-extrabold text-ink">Rs. 32,450</p>
        <svg viewBox="0 0 84 36" className="mb-1 h-7 w-[84px]" aria-hidden>
          <path d={smoothPath(pts)} fill="none" stroke="rgb(var(--saffron))" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export function FloatingBudget() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 shadow-float">
      <Ring value={32450 / 50000} size={44} stroke={5}>
        <span className="num text-[10px] font-bold text-ink">65%</span>
      </Ring>
      <div>
        <p className="text-[11px] font-medium text-ink-muted">Budget Remaining</p>
        <p className="num text-base font-extrabold text-ink">Rs. 17,550</p>
      </div>
    </div>
  );
}
