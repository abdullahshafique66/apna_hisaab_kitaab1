import type { DateFormatPref, ISODate } from "@/types";

// ---------- Money ----------
const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
export function formatRs(n: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact && Math.abs(n) >= 1000) {
    const k = n / 1000;
    return `Rs. ${k >= 100 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `Rs. ${nf.format(Math.round(n))}`;
}
export const formatNum = (n: number) => nf.format(n);

export function pctChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

// ---------- Dates (all local-time, ISO yyyy-mm-dd strings) ----------
export const pad = (n: number) => String(n).padStart(2, "0");
export function toISO(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function fromISO(s: ISODate): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export const todayISO = () => toISO(new Date());
export function addDays(s: ISODate, n: number): ISODate {
  const d = fromISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
}
export function startOfMonth(s: ISODate): ISODate {
  const d = fromISO(s);
  return toISO(new Date(d.getFullYear(), d.getMonth(), 1));
}
export function endOfMonth(s: ISODate): ISODate {
  const d = fromISO(s);
  return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86400000);
}

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

let currentFormat: DateFormatPref = "dd MMM yyyy";
export function setDateFormat(f: DateFormatPref) {
  currentFormat = f;
}

/** "28 September 2026" */
export function formatLongDate(s: ISODate): string {
  const d = fromISO(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
/** Uses the user's date-format preference. */
export function formatDate(s: ISODate): string {
  const d = fromISO(s);
  if (currentFormat === "dd/MM/yyyy") return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  if (currentFormat === "yyyy-MM-dd") return s;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}
export function formatShortDate(s: ISODate): string {
  const d = fromISO(s);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}
export function relativeDay(s: ISODate): string {
  const diff = daysBetween(s, todayISO());
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7) return WEEKDAYS[fromISO(s).getDay()];
  return formatDate(s);
}
export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Safe storage (artifact sandboxes / private windows may throw)
export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — keep working in memory */
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
