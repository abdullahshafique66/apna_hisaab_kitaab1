import { useState } from "react";
import { Lock, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import type { Category, CategoryIcon as IconKey, CategoryTotal } from "@/types";
import { PageHeader } from "@/components/layout/AppLayout";
import { CATEGORY_COLORS, CategoryIcon, ICON_CHOICES } from "@/components/expenses/CategoryIcon";
import { ConfirmDialog, Dialog, Spinner } from "@/components/ui/Dialog";
import { ErrorState, LoadingSkeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/context/AppContext";
import { useQuery } from "@/hooks";
import * as api from "@/services/api";
import { cn, formatRs, startOfMonth, todayISO } from "@/lib/utils";

export function CategoryCard({ category, stat, onEdit, onDelete }: { category: Category; stat?: CategoryTotal; onEdit: () => void; onDelete?: () => void }) {
  const [menu, setMenu] = useState(false);
  return (
    <div className="card group relative flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
      <CategoryIcon category={category} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-ink">{category.name}</p>
        <p className="num truncate text-sm text-ink-muted">
          {stat ? `${formatRs(stat.total)} · ${stat.count} entries` : "Is mahine koi kharcha nahi"}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(stat ? 3 : 0, (stat?.share ?? 0) * 100)}%`, backgroundColor: category.color }} />
        </div>
      </div>
      <div className="relative">
        <button onClick={() => setMenu((v) => !v)} className="rounded-lg p-2 text-ink-muted hover:bg-surface-2 hover:text-ink" aria-label={`Options for ${category.name}`} aria-haspopup="menu" aria-expanded={menu}>
          <MoreHorizontal className="h-5 w-5" />
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} aria-hidden />
            <div role="menu" className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lift" onKeyDown={(e) => e.key === "Escape" && setMenu(false)}>
              <button role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-surface-2" onClick={() => { setMenu(false); onEdit(); }} autoFocus>
                <Pencil className="h-4 w-4" /> Edit
              </button>
              {onDelete ? (
                <button role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10" onClick={() => { setMenu(false); onDelete(); }}>
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              ) : (
                <p className="flex items-center gap-2 px-3 py-2 text-xs text-ink-muted">
                  <Lock className="h-3.5 w-3.5" /> Default fallback
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { categories } = useApp();
  const toast = useToast();
  const cats = useQuery(() => api.getCategories(), []);
  const stats = useQuery(() => api.getAnalytics(startOfMonth(todayISO()), todayISO(), "daily"), []);
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const list = cats.data ?? categories;

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Kharchon ko apne hisab se tarteeb dein."
        actions={
          <button className="btn-primary" onClick={() => setEditing("new")}>
            <Plus className="h-5 w-5" aria-hidden /> Add Category
          </button>
        }
      />
      {cats.error ? (
        <div className="card">
          <ErrorState onRetry={cats.retry} />
        </div>
      ) : cats.loading ? (
        <LoadingSkeleton variant="cards" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <CategoryCard
              key={c.id}
              category={c}
              stat={stats.data?.by_category.find((s) => s.category_id === c.id)}
              onEdit={() => setEditing(c)}
              onDelete={c.icon === "other" && list.filter((x) => x.icon === "other").length === 1 ? undefined : () => setDeleting(c)}
            />
          ))}
          <button onClick={() => setEditing("new")} className="flex min-h-[92px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-[15px] font-semibold text-ink-muted transition hover:border-brand/50 hover:text-brand">
            <Plus className="h-5 w-5" aria-hidden /> Nayi category
          </button>
        </div>
      )}

      <CategoryDialog key={editing === "new" ? "new" : editing?.id ?? "none"} target={editing} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        busy={busy}
        title="Delete category?"
        description={deleting ? `"${deleting.name}" delete ho jayegi. Is ke saare kharchay "Other" mein chale jayenge — koi record delete nahi hoga.` : ""}
        onConfirm={async () => {
          if (!deleting) return;
          setBusy(true);
          try {
            await api.deleteCategory(deleting.id);
            toast.success("Category deleted.", deleting.name);
            setDeleting(null);
          } catch (e) {
            toast.error("Delete nahi ho saki.", (e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}

function CategoryDialog({ target, onClose }: { target: Category | "new" | null; onClose: () => void }) {
  const toast = useToast();
  const existing = target && target !== "new" ? target : null;
  const [name, setName] = useState(existing?.name ?? "");
  const [icon, setIcon] = useState<IconKey>(existing?.icon ?? "other");
  const [color, setColor] = useState(existing?.color ?? CATEGORY_COLORS[10]);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return setErr("Category ka naam likhein.");
    if (name.trim().length > 24) return setErr("Naam 24 characters se chhota rakhein.");
    setSaving(true);
    try {
      if (existing) {
        await api.updateCategory(existing.id, { name: name.trim(), icon, color });
        toast.success("Category updated.", name.trim());
      } else {
        await api.createCategory({ name: name.trim(), icon, color });
        toast.success("Category added.", name.trim());
      }
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={!!target}
      onClose={onClose}
      title={existing ? "Edit Category" : "Add Category"}
      size="sm"
      footer={
        <>
          <button className="btn-secondary flex-1" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary flex-1" onClick={save} disabled={saving}>
            {saving ? <Spinner /> : existing ? "Save Changes" : "Add Category"}
          </button>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
          <CategoryIcon icon={icon} color={color} size="lg" />
          <span className="text-lg font-bold text-ink">{name || "Category name"}</span>
        </div>
        <div>
          <label htmlFor="cat-name" className="label">
            Name
          </label>
          <input id="cat-name" className={cn("input", err && "input-error")} value={name} onChange={(e) => { setName(e.target.value); setErr(""); }} placeholder="e.g. School Fees" aria-invalid={!!err} aria-describedby={err ? "cat-err" : undefined} />
          {err && (
            <p id="cat-err" className="mt-1 text-xs font-medium text-danger" role="alert">
              {err}
            </p>
          )}
        </div>
        <fieldset>
          <legend className="label">Icon</legend>
          <div className="grid grid-cols-7 gap-2">
            {ICON_CHOICES.map((k) => (
              <button key={k} type="button" onClick={() => setIcon(k)} aria-pressed={icon === k} aria-label={k} className={cn("flex items-center justify-center rounded-xl border p-1.5 transition", icon === k ? "border-brand bg-brand-soft" : "border-line hover:border-brand/40")}>
                <CategoryIcon icon={k} color={icon === k ? color : "#86938C"} size="sm" />
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="label">Color</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} aria-pressed={color === c} aria-label={`Color ${c}`} className={cn("h-9 w-9 rounded-full ring-offset-2 ring-offset-surface transition", color === c && "ring-2 ring-ink")} style={{ backgroundColor: c }} />
            ))}
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}
