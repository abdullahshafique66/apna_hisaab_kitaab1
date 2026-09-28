import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import type { Category, Expense, SortKey } from "@/types";
import { UNIT_LABELS } from "@/types";
import { CategoryChip, CategoryIcon } from "./CategoryIcon";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/context/AppContext";
import * as api from "@/services/api";
import { cn, formatDate, formatNum, formatRs, relativeDay } from "@/lib/utils";

export const qtyLabel = (e: Pick<Expense, "quantity" | "unit">) =>
  e.quantity != null ? `${formatNum(e.quantity)} ${e.unit ? UNIT_LABELS[e.unit] : ""}`.trim() : null;

/** Delete with confirmation + undo toast. Returns a trigger and the dialog element to render. */
export function useDeleteExpense() {
  const [target, setTarget] = useState<Expense | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const dialog = (
    <ConfirmDialog
      open={!!target}
      onClose={() => setTarget(null)}
      title="Delete expense?"
      description={target ? `"${target.item_name} — ${formatRs(target.amount)}" hisab se nikal jayega. Totals khud update ho jayenge.` : ""}
      busy={busy}
      onConfirm={async () => {
        if (!target) return;
        const snapshot = target;
        setBusy(true);
        try {
          await api.deleteExpense(snapshot.id);
          toast.toast({
            title: "Expense deleted.",
            description: `${snapshot.item_name} — ${formatRs(snapshot.amount)}`,
            variant: "info",
            duration: 5000,
            action: { label: "Undo", onClick: () => api.restoreExpense(snapshot) },
          });
          setTarget(null);
        } catch (e) {
          toast.error("Delete nahi ho saka.", (e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    />
  );
  return { askDelete: setTarget, dialog };
}

export function ExpenseCard({
  expense, category, onEdit, onDelete, showDate = true, className,
}: {
  expense: Expense;
  category?: Category;
  onEdit?: (e: Expense) => void;
  onDelete?: (e: Expense) => void;
  showDate?: boolean;
  className?: string;
}) {
  const q = qtyLabel(expense);
  return (
    <div className={cn("group relative flex items-center gap-3 py-3", className)}>
      <CategoryIcon category={category} />
      <button
        type="button"
        onClick={() => onEdit?.(expense)}
        className="min-w-0 flex-1 text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
        aria-label={`Edit ${expense.item_name}, ${formatRs(expense.amount)}`}
        disabled={!onEdit}
      >
        <p className="truncate text-[15px] font-semibold text-ink">{expense.item_name}</p>
        <p className="truncate text-[13px] text-ink-muted">
          {[category?.name, q, showDate ? relativeDay(expense.date) : null].filter(Boolean).join(" · ")}
        </p>
      </button>
      <div className="relative flex items-center gap-1">
        <span className="num text-[15px] font-bold text-ink">{formatRs(expense.amount)}</span>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(expense)}
            aria-label={`Delete ${expense.item_name}`}
            className="ml-1 rounded-lg p-2 text-ink-muted opacity-100 transition hover:bg-danger/10 hover:text-danger lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

const sortable: { key: string; label: string; asc?: SortKey; desc?: SortKey; align?: "right" }[] = [
  { key: "item", label: "Item", asc: "name_asc", desc: "name_asc" },
  { key: "category", label: "Category" },
  { key: "qty", label: "Quantity" },
  { key: "date", label: "Date", asc: "date_asc", desc: "date_desc" },
  { key: "amount", label: "Amount", asc: "amount_asc", desc: "amount_desc", align: "right" },
];

export function ExpenseTable({
  rows, sort, onSort, onEdit, onDelete,
}: {
  rows: Expense[];
  sort: SortKey;
  onSort: (s: SortKey) => void;
  onEdit: (e: Expense) => void;
  onDelete: (e: Expense) => void;
}) {
  const { categoryById } = useApp();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[15px]">
        <caption className="sr-only">Expenses</caption>
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-ink-muted">
            {sortable.map((c) => {
              const active = sort === c.asc || sort === c.desc;
              const dir = sort === c.asc && c.asc !== c.desc ? "asc" : "desc";
              return (
                <th key={c.key} scope="col" className={cn("px-4 py-3 font-semibold", c.align === "right" && "text-right")} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}>
                  {c.asc ? (
                    <button
                      className={cn("inline-flex items-center gap-1 uppercase hover:text-ink", active && "text-ink")}
                      onClick={() => onSort(active && sort === c.desc && c.asc !== c.desc ? c.asc! : c.desc!)}
                    >
                      {c.label}
                      {active ? dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              );
            })}
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => {
            const cat = categoryById(e.category_id);
            return (
              <tr key={e.id} className="group border-b border-line/70 transition-colors last:border-0 hover:bg-surface-2/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CategoryIcon category={cat} size="sm" />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{e.item_name}</p>
                      {e.note && <p className="max-w-[220px] truncate text-xs text-ink-muted">{e.note}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <CategoryChip category={cat} />
                </td>
                <td className="num px-4 py-3 text-ink-muted">{qtyLabel(e) ?? "—"}</td>
                <td className="num whitespace-nowrap px-4 py-3 text-ink-muted">{formatDate(e.date)}</td>
                <td className="num whitespace-nowrap px-4 py-3 text-right font-bold text-ink">{formatRs(e.amount)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => onEdit(e)} className="rounded-lg p-2 text-ink-muted hover:bg-brand-soft hover:text-brand" aria-label={`Edit ${e.item_name}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDelete(e)} className="rounded-lg p-2 text-ink-muted hover:bg-danger/10 hover:text-danger" aria-label={`Delete ${e.item_name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
