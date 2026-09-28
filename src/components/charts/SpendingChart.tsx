import { Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SeriesPoint } from "@/types";
import { useThemeColors } from "@/hooks";
import { formatRs } from "@/lib/utils";
import { ChartTooltip } from "./ChartTooltip";

const yTick = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : String(v));

/** Spending over time. `kind="area"` for trends, `kind="bar"` for discrete buckets. */
export default function SpendingChart({ data, kind = "area", height = 260, average }: { data: SeriesPoint[]; kind?: "area" | "bar"; height?: number; average?: number }) {
  const c = useThemeColors();
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const interval = data.length > 16 ? Math.ceil(data.length / 8) - 1 : data.length > 10 ? 1 : 0;
  const common = {
    data,
    margin: { top: 8, right: 8, left: -8, bottom: 0 },
  };
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke={c.line} strokeDasharray="3 4" />
      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: c.muted, fontSize: 12 }} interval={interval} dy={6} />
      <YAxis tickLine={false} axisLine={false} tick={{ fill: c.muted, fontSize: 12 }} tickFormatter={yTick} width={48} />
      <Tooltip content={<ChartTooltip />} cursor={kind === "bar" ? { fill: c.line, opacity: 0.4 } : { stroke: c.brand, strokeWidth: 1, strokeDasharray: "4 4" }} />
      {average != null && average > 0 && (
        <ReferenceLine y={average} stroke={c.saffron} strokeDasharray="5 5" label={{ value: `Avg ${formatRs(average, { compact: true })}`, position: "insideTopRight", fill: c.muted, fontSize: 11 }} />
      )}
    </>
  );
  return (
    <div style={{ height }} className="w-full" role="img" aria-label={`Spending chart: ${data.map((d) => `${d.label} ${formatRs(d.total)}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        {kind === "bar" ? (
          <BarChart {...common} barCategoryGap="22%">
            {axes}
            <Bar dataKey="total" fill={c.brand} radius={[6, 6, 2, 2]} isAnimationActive={!reduce} animationDuration={800} maxBarSize={36} />
          </BarChart>
        ) : (
          <AreaChart {...common}>
            <defs>
              <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.brand} stopOpacity={0.28} />
                <stop offset="100%" stopColor={c.brand} stopOpacity={0} />
              </linearGradient>
            </defs>
            {axes}
            <Area
              type="monotone"
              dataKey="total"
              stroke={c.brand}
              strokeWidth={2.5}
              fill="url(#spendFill)"
              isAnimationActive={!reduce}
              animationDuration={900}
              dot={false}
              activeDot={{ r: 5, fill: c.brand, stroke: c.surface, strokeWidth: 2 }}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
