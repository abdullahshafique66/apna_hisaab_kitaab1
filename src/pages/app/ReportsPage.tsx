import { useState } from "react";
import { FileSpreadsheet, FileText, FileType2, Download, Check } from "lucide-react";
import type { ReportFormat } from "@/types";
import { PageHeader } from "@/components/layout/AppLayout";
import { LogoMark } from "@/components/brand/Logo";
import { CategoryIcon } from "@/components/expenses/CategoryIcon";
import { DateRangePicker, rangeFromPreset, type RangeValue } from "@/components/ui/DateRangePicker";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/States";
import { Spinner } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/context/AppContext";
import { useQuery } from "@/hooks";
import * as api from "@/services/api";
import { downloadBlob, exportReport } from "@/services/exporters";
import { cn, formatLongDate, formatNum, formatRs, todayISO } from "@/lib/utils";

const FORMATS: { f: ReportFormat; title: string; desc: string; icon: typeof FileText; tint: string }[] = [
  { f: "pdf", title: "PDF", desc: "Print ya WhatsApp par share karne ke liye", icon: FileText, tint: "#C4524E" },
  { f: "excel", title: "Excel", desc: "Excel / Google Sheets mein kholne ke liye", icon: FileSpreadsheet, tint: "#087F5B" },
  { f: "csv", title: "CSV", desc: "Kisi bhi app mein import ke liye", icon: FileType2, tint: "#4A86C8" },
];

export function ReportCard({ format, onDownload, busy, done }: { format: (typeof FORMATS)[number]; onDownload: () => void; busy: boolean; done: boolean }) {
  const Icon = format.icon;
  return (
    <div className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${format.tint}1A`, color: format.tint }}>
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-ink">{format.title}</p>
        <p className="truncate text-sm text-ink-muted">{format.desc}</p>
      </div>
      <button className={cn("shrink-0", done ? "btn-secondary" : "btn-primary")} onClick={onDownload} disabled={busy} aria-label={`Download ${format.title}`}>
        {busy ? <Spinner /> : done ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        <span className="hidden sm:inline">Download {format.title}</span>
      </button>
    </div>
  );
}

export default function ReportsPage() {
  const { categories, categoryById } = useApp();
  const toast = useToast();
  const [range, setRange] = useState<RangeValue>(rangeFromPreset("month"));
  const [busy, setBusy] = useState<ReportFormat | null>(null);
  const [done, setDone] = useState<ReportFormat[]>([]);
  const from = range.from!;
  const to = range.to ?? todayISO();
  const title = range.preset === "month" ? "Monthly Expense Report" : range.preset === "week" ? "Weekly Expense Report" : "Expense Report";
  const { data: report, loading, error, retry } = useQuery(() => api.getReports(from, to, title), [from, to, title]);

  const download = async (f: ReportFormat) => {
    if (!report) return;
    setBusy(f);
    try {
      const server = await api.downloadReportFile(from, to, title, f);
      const { blob, filename } = server
        ? { blob: server, filename: `apna-hisab-${from}_to_${to}.${f === "excel" ? "xlsx" : f}` }
        : await exportReport(report, categories, f);
      const saved = await downloadBlob(blob, filename);
      if (saved) {
        setDone((d) => [...new Set([...d, f])]);
        toast.success("Report generated successfully.", filename);
      }
    } catch (e) {
      toast.error("Report nahi ban saki.", (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader title="Download Your Hisab" subtitle="Apna hisab PDF, Excel ya CSV mein download karein." />

      <div className="card p-3 sm:p-4">
        <DateRangePicker value={range} onChange={(r) => { setRange(r); setDone([]); }} presets={["week", "month", "custom"]} label="Date range" />
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <section aria-labelledby="fmt-h" className="space-y-3">
          <h2 id="fmt-h" className="px-1 text-sm font-semibold uppercase tracking-[0.1em] text-ink-muted">
            Format
          </h2>
          {FORMATS.map((f) => (
            <ReportCard key={f.f} format={f} busy={busy === f.f} done={done.includes(f.f)} onDownload={() => download(f.f)} />
          ))}
        </section>

        <section aria-labelledby="prev-h">
          <h2 id="prev-h" className="mb-3 px-1 text-sm font-semibold uppercase tracking-[0.1em] text-ink-muted">
            Report preview
          </h2>
          {error ? (
            <div className="card">
              <ErrorState onRetry={retry} />
            </div>
          ) : loading || !report ? (
            <LoadingSkeleton variant="report" />
          ) : (
            <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
              <header className="relative bg-brand px-5 pb-5 pt-5 text-white sm:px-7">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <LogoMark size={30} variant="white" />
                    <span className="text-[15px] font-extrabold tracking-[0.08em]">APNA HISAB KITAAB</span>
                  </div>
                  <span className="hidden text-xs text-white/75 sm:block">Generated {formatLongDate(todayISO())}</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-saffron" aria-hidden />
              </header>
              <div className="px-5 py-5 sm:px-7">
                <h3 className="text-xl font-extrabold text-ink">{report.title}</h3>
                <p className="text-ink-muted">{report.period_label}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-surface-2 p-3.5">
                    <dt className="text-xs text-ink-muted">Total Items</dt>
                    <dd className="num text-2xl font-extrabold text-ink">{formatNum(report.total_items)}</dd>
                  </div>
                  <div className="rounded-xl bg-surface-2 p-3.5">
                    <dt className="text-xs text-ink-muted">Total Expense</dt>
                    <dd className="num text-2xl font-extrabold text-ink">{formatRs(report.total_expense)}</dd>
                  </div>
                </dl>
                {report.total_items === 0 ? (
                  <EmptyState compact title="Is period mein koi kharcha nahi" description="Doosri dates select karein." />
                ) : (
                  <>
                    <h4 className="mt-5 text-sm font-bold text-ink">Category breakdown</h4>
                    <ul className="mt-2 space-y-2">
                      {report.by_category.map((c) => (
                        <li key={c.category_id} className="flex items-center gap-3 text-sm">
                          <CategoryIcon icon={c.icon} color={c.color} size="sm" className="!h-7 !w-7" />
                          <span className="w-24 shrink-0 truncate font-medium text-ink">{c.name}</span>
                          <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                            <span className="block h-full rounded-full" style={{ width: `${Math.max(2, c.share * 100)}%`, backgroundColor: c.color }} />
                          </span>
                          <span className="num w-24 shrink-0 text-right font-semibold text-ink">{formatRs(c.total)}</span>
                        </li>
                      ))}
                    </ul>
                    <h4 className="mt-5 text-sm font-bold text-ink">Entries</h4>
                    <div className="mt-2 max-h-72 overflow-auto rounded-xl border border-line">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-surface-2 text-left text-xs text-ink-muted">
                          <tr>
                            <th scope="col" className="px-3 py-2 font-semibold">Date</th>
                            <th scope="col" className="px-3 py-2 font-semibold">Item</th>
                            <th scope="col" className="hidden px-3 py-2 font-semibold sm:table-cell">Category</th>
                            <th scope="col" className="px-3 py-2 text-right font-semibold">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.expenses.map((e) => (
                            <tr key={e.id} className="border-t border-line/70">
                              <td className="num whitespace-nowrap px-3 py-2 text-ink-muted">{e.date.slice(5).split("-").reverse().join("/")}</td>
                              <td className="px-3 py-2 text-ink">{e.item_name}</td>
                              <td className="hidden px-3 py-2 text-ink-muted sm:table-cell">{categoryById(e.category_id)?.name}</td>
                              <td className="num whitespace-nowrap px-3 py-2 text-right font-semibold text-ink">{formatRs(e.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t-2 border-brand pt-3">
                      <span className="font-bold text-ink">Total</span>
                      <span className="num text-lg font-extrabold text-ink">{formatRs(report.total_expense)}</span>
                    </div>
                  </>
                )}
              </div>
            </article>
          )}
        </section>
      </div>
    </>
  );
}
