/**
 * Client-side report exporters (CSV, Excel, PDF).
 * When the FastAPI backend is connected, swap these for GET /reports/export?format=… and download the returned file.
 */
import type { Category, Report, ReportFormat } from "@/types";
import { UNIT_LABELS } from "@/types";
import { formatLongDate, formatNum } from "@/lib/utils";
import { buildXlsx, type Sheet } from "@/lib/xlsx";

const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

function rows(report: Report, categories: Category[]) {
  const cat = new Map(categories.map((c) => [c.id, c.name]));
  return report.expenses.map((e) => ({
    Date: e.date,
    Item: e.item_name,
    Category: cat.get(e.category_id) ?? "Other",
    Quantity: e.quantity != null ? `${e.quantity} ${e.unit ? UNIT_LABELS[e.unit] : ""}`.trim() : "",
    "Amount (Rs.)": e.amount,
    Note: e.note ?? "",
  }));
}

export function toCSV(report: Report, categories: Category[]): Blob {
  const data = rows(report, categories);
  const head = Object.keys(data[0] ?? { Date: "", Item: "", Category: "", Quantity: "", "Amount (Rs.)": "", Note: "" });
  const lines = [head.join(","), ...data.map((r) => head.map((h) => esc(String(r[h as keyof typeof r]))).join(","))];
  lines.push("", `Total Items,${report.total_items}`, `Total Expense (Rs.),${report.total_expense}`);
  return new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
}

/** Real .xlsx workbook (Expenses + Categories sheets), built without extra libraries. */
export function toExcel(report: Report, categories: Category[]): Blob {
  const data = rows(report, categories);
  const expenses: Sheet = {
    name: "Expenses",
    widths: [12, 24, 14, 12, 14, 30],
    rows: [
      [{ v: `APNA HISAB KITAAB — ${report.title}`, s: "title" }],
      [report.period_label],
      [],
      ["Date", "Item", "Category", "Quantity", "Amount (Rs.)", "Note"].map((h) => ({ v: h, s: "header" as const })),
      ...data.map((r) => [r.Date, r.Item, r.Category, r.Quantity, { v: r["Amount (Rs.)"], s: "money" as const }, r.Note]),
      [],
      [{ v: "Total Items", s: "bold" }, report.total_items],
      [{ v: "Total Expense", s: "bold" }, { v: report.total_expense, s: "total" }],
    ],
  };
  const cats: Sheet = {
    name: "Categories",
    widths: [18, 10, 16, 10],
    rows: [
      ["Category", "Entries", "Total (Rs.)", "Share %"].map((h) => ({ v: h, s: "header" as const })),
      ...report.by_category.map((c) => [c.name, c.count, { v: c.total, s: "money" as const }, Math.round(c.share * 1000) / 10]),
    ],
  };
  return buildXlsx([expenses, cats]);
}

export async function toPDF(report: Report, categories: Category[]): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 44;
  const emerald: [number, number, number] = [8, 127, 91];
  const ink: [number, number, number] = [23, 33, 29];
  const muted: [number, number, number] = [102, 115, 109];

  // Header band
  doc.setFillColor(...emerald);
  doc.rect(0, 0, W, 92, "F");
  doc.setFillColor(244, 163, 64);
  doc.rect(0, 92, W, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("APNA HISAB KITAAB", M, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Har Kharchay Ka Apna Hisab.", M, 62);
  doc.setFontSize(10);
  doc.text(`Generated ${formatLongDate(report.generated_at.slice(0, 10))}`, W - M, 44, { align: "right" });

  let y = 130;
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(report.title, M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...muted);
  doc.text(report.period_label, M, y + 20);

  // Summary boxes
  y += 44;
  const boxW = (W - M * 2 - 16) / 2;
  const box = (x: number, label: string, value: string) => {
    doc.setDrawColor(228, 233, 230);
    doc.setFillColor(250, 250, 247);
    doc.roundedRect(x, y, boxW, 62, 8, 8, "FD");
    doc.setFontSize(10);
    doc.setTextColor(...muted);
    doc.text(label, x + 14, y + 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...ink);
    doc.text(value, x + 14, y + 46);
    doc.setFont("helvetica", "normal");
  };
  box(M, "Total Items", String(report.total_items));
  box(M + boxW + 16, "Total Expense", `Rs. ${formatNum(report.total_expense)}`);
  y += 92;

  // Category breakdown with bars
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ink);
  doc.text("Category Breakdown", M, y);
  y += 16;
  const barMax = W - M * 2 - 220;
  for (const c of report.by_category) {
    const hex = c.color.replace("#", "");
    const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...ink);
    doc.text(c.name, M, y + 9);
    doc.setFillColor(240, 243, 241);
    doc.roundedRect(M + 90, y + 1, barMax, 10, 3, 3, "F");
    doc.setFillColor(...rgb);
    doc.roundedRect(M + 90, y + 1, Math.max(4, barMax * c.share), 10, 3, 3, "F");
    doc.setTextColor(...muted);
    doc.text(`${Math.round(c.share * 100)}%`, M + 100 + barMax, y + 9);
    doc.setTextColor(...ink);
    doc.text(`Rs. ${formatNum(c.total)}`, W - M, y + 9, { align: "right" });
    y += 20;
  }

  // Expense table
  y += 18;
  const cols = [
    { h: "Date", x: M, w: 70 },
    { h: "Item", x: M + 74, w: 150 },
    { h: "Category", x: M + 228, w: 90 },
    { h: "Qty", x: M + 322, w: 70 },
    { h: "Amount", x: W - M, w: 90, right: true },
  ];
  const cat = new Map(categories.map((c) => [c.id, c.name]));
  const header = () => {
    doc.setFillColor(...emerald);
    doc.rect(M - 6, y - 12, W - M * 2 + 12, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    cols.forEach((c) => doc.text(c.h, c.x, y + 2, c.right ? { align: "right" } : undefined));
    doc.setFont("helvetica", "normal");
    y += 22;
  };
  header();
  report.expenses.forEach((e, i) => {
    if (y > H - 70) {
      doc.addPage();
      y = 60;
      header();
    }
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 247);
      doc.rect(M - 6, y - 12, W - M * 2 + 12, 18, "F");
    }
    doc.setTextColor(...ink);
    doc.setFontSize(9.5);
    const qty = e.quantity != null ? `${e.quantity} ${e.unit ? UNIT_LABELS[e.unit] : ""}` : "-";
    doc.text(e.date, cols[0].x, y);
    doc.text(e.item_name.slice(0, 28), cols[1].x, y);
    doc.text(cat.get(e.category_id) ?? "Other", cols[2].x, y);
    doc.text(qty, cols[3].x, y);
    doc.text(`Rs. ${formatNum(e.amount)}`, cols[4].x, y, { align: "right" });
    y += 18;
  });
  y += 6;
  doc.setDrawColor(...emerald);
  doc.line(M, y - 8, W - M, y - 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Total", M, y + 8);
  doc.text(`Rs. ${formatNum(report.total_expense)}`, W - M, y + 8, { align: "right" });

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...muted);
    doc.text("Apna Hisab Kitaab · Write your expense. We'll do the hisab.", M, H - 24);
    doc.text(`Page ${p} of ${pages}`, W - M, H - 24, { align: "right" });
  }
  return doc.output("blob");
}

export async function exportReport(report: Report, categories: Category[], format: ReportFormat): Promise<{ blob: Blob; filename: string }> {
  const base = `apna-hisab-${report.from}_to_${report.to}`;
  if (format === "csv") return { blob: toCSV(report, categories), filename: `${base}.csv` };
  if (format === "excel") return { blob: toExcel(report, categories), filename: `${base}.xlsx` };
  return { blob: await toPDF(report, categories), filename: `${base}.pdf` };
}

type DownloadsApi = { save: (r: { filename: string; data: Blob }) => Promise<{ status: string }> };
type ClaudeHost = { use?: (name: string) => Promise<unknown> };

/**
 * Saves a file for the user. Inside the hosted claude.ai preview the sandbox blocks normal
 * downloads, so the viewer's "downloads" capability is used; everywhere else a normal download.
 * Resolves false if the viewer declined.
 */
export async function downloadBlob(blob: Blob, filename: string): Promise<boolean> {
  const host = (window as unknown as { claude?: ClaudeHost }).claude;
  if (__SINGLE__ && host?.use) {
    const dl = (await host.use("downloads").catch(() => null)) as DownloadsApi | null;
    if (dl) {
      try {
        await dl.save({ filename, data: blob });
        return true;
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code === "declined") return false;
        throw new Error(code === "rate_limited" ? "Ek download pehle se khula hai — thori der baad try karein." : "Is view mein download dastiyab nahi.");
      }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}
