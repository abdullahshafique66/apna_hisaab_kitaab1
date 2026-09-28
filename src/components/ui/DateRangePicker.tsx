import type { ISODate } from "@/types";
import { addDays, cn, startOfMonth, todayISO } from "@/lib/utils";

export type RangePreset = "all" | "today" | "7d" | "week" | "30d" | "month" | "3m" | "custom";
export interface RangeValue {
  preset: RangePreset;
  from?: ISODate;
  to?: ISODate;
}

export const PRESET_LABELS: Record<RangePreset, string> = {
  all: "All time",
  today: "Today",
  "7d": "7 Days",
  week: "This Week",
  "30d": "30 Days",
  month: "This Month",
  "3m": "3 Months",
  custom: "Custom",
};

export function rangeFromPreset(p: RangePreset, custom?: { from?: ISODate; to?: ISODate }): RangeValue {
  const t = todayISO();
  switch (p) {
    case "today": return { preset: p, from: t, to: t };
    case "7d":
    case "week": return { preset: p, from: addDays(t, -6), to: t };
    case "30d": return { preset: p, from: addDays(t, -29), to: t };
    case "month": return { preset: p, from: startOfMonth(t), to: t };
    case "3m": return { preset: p, from: addDays(t, -89), to: t };
    case "custom": return { preset: p, from: custom?.from ?? addDays(t, -13), to: custom?.to ?? t };
    default: return { preset: "all" };
  }
}

/** Segmented presets + custom from/to inputs. */
export function DateRangePicker({ value, onChange, presets, label = "Date range" }: { value: RangeValue; onChange: (v: RangeValue) => void; presets: RangePreset[]; label?: string }) {
  const t = todayISO();
  return (
    <div>
      <span className="label" id="drp-label">
        {label}
      </span>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby="drp-label">
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1 scrollbar-none">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={value.preset === p}
              onClick={() => onChange(rangeFromPreset(p, value))}
              className={cn(
                "h-9 shrink-0 rounded-lg px-3 text-sm font-semibold transition",
                value.preset === p ? "bg-surface text-ink shadow-card" : "text-ink-muted hover:text-ink",
              )}
            >
              {PRESET_LABELS[p]}
            </button>
          ))}
        </div>
        {value.preset === "custom" && (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <label className="sr-only" htmlFor="drp-from">
              From date
            </label>
            <input id="drp-from" type="date" className="input h-11 min-w-0" max={value.to ?? t} value={value.from ?? ""} onChange={(e) => onChange({ ...value, from: e.target.value })} />
            <span className="text-ink-muted">to</span>
            <label className="sr-only" htmlFor="drp-to">
              To date
            </label>
            <input id="drp-to" type="date" className="input h-11 min-w-0" min={value.from} max={t} value={value.to ?? ""} onChange={(e) => onChange({ ...value, to: e.target.value })} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact segmented control used for granularity toggles etc. */
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[]; label: string }) {
  return (
    <div className="flex gap-1 rounded-xl bg-surface-2 p-1" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          aria-pressed={value === o.v}
          onClick={() => onChange(o.v)}
          className={cn("h-8 flex-1 rounded-lg px-3 text-[13px] font-semibold transition", value === o.v ? "bg-surface text-ink shadow-card" : "text-ink-muted hover:text-ink")}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
