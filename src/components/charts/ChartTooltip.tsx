import { formatRs } from "@/lib/utils";

export function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { label?: string; name?: string; count?: number } }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-lift">
      <p className="text-xs text-ink-muted">{label ?? p.payload.label ?? p.payload.name}</p>
      <p className="num text-[15px] font-bold text-ink">{formatRs(p.value)}</p>
      {p.payload.count != null && <p className="text-xs text-ink-muted">{p.payload.count} entries</p>}
    </div>
  );
}
