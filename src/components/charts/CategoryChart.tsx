import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CategoryTotal } from "@/types";
import { useThemeColors } from "@/hooks";
import { formatRs } from "@/lib/utils";
import { ChartTooltip } from "./ChartTooltip";
import { CategoryIcon } from "@/components/expenses/CategoryIcon";

/** Donut chart + legend of spending by category. */
export default function CategoryChart({ data, total, height = 220, legend = true, limit = 8 }: { data: CategoryTotal[]; total: number; height?: number; legend?: boolean; limit?: number }) {
  const c = useThemeColors();
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shown = data.slice(0, limit);
  const rest = data.slice(limit);
  const chartData = rest.length ? [...shown, { ...rest[0], category_id: "rest", name: "Baaqi", color: "#9AA69F", total: rest.reduce((a, r) => a + r.total, 0), count: rest.reduce((a, r) => a + r.count, 0), share: rest.reduce((a, r) => a + r.share, 0) }] : shown;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: height, height, maxWidth: "100%" }} role="img" aria-label={`Category breakdown: ${chartData.map((d) => `${d.name} ${Math.round(d.share * 100)}%`).join(", ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="total"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              cornerRadius={4}
              stroke={c.surface}
              strokeWidth={2}
              isAnimationActive={!reduce}
              animationDuration={900}
            >
              {chartData.map((d) => (
                <Cell key={d.category_id} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-ink-muted">Total</span>
          <span className="num text-lg font-extrabold text-ink">{formatRs(total, { compact: total >= 100000 })}</span>
        </div>
      </div>
      {legend && (
        <ul className="w-full min-w-0 flex-1 space-y-2.5">
          {chartData.map((d) => (
            <li key={d.category_id} className="flex items-center gap-3">
              <CategoryIcon icon={d.icon} color={d.color} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-ink">{d.name}</span>
                  <span className="num text-sm font-semibold text-ink">{formatRs(d.total)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(2, d.share * 100)}%`, backgroundColor: d.color }} />
                  </div>
                  <span className="num w-9 text-right text-xs text-ink-muted">{Math.round(d.share * 100)}%</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
