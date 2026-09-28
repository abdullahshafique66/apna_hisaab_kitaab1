import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronDown, Sparkles, Wand2 } from "lucide-react";
import type { ExpenseInput, Unit } from "@/types";
import { UNITS, UNIT_LABELS } from "@/types";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { Dialog, Spinner } from "@/components/ui/Dialog";
import { CategoryIcon } from "./CategoryIcon";
import * as api from "@/services/api";
import { parseQuickEntry } from "@/lib/quickEntry";
import { addDays, cn, formatLongDate, formatNum, formatRs, todayISO } from "@/lib/utils";
import { useQuery } from "@/hooks";

interface FormState {
  item_name: string;
  quantity: string;
  unit: Unit | "";
  amount: string;
  category_id: string;
  date: string;
  note: string;
}

const empty = (date = todayISO()): FormState => ({ item_name: "", quantity: "", unit: "", amount: "", category_id: "", date, note: "" });

/** Add / edit expense sheet, mounted once at app level and opened from anywhere via useApp().openAddExpense() */
export function AddExpenseSheet() {
  const { addExpenseState, closeAddExpense } = useApp();
  const { open, edit } = addExpenseState;
  return (
    <Dialog open={open} onClose={closeAddExpense} title={edit ? "Edit Expense" : "Add Expense"} description={edit ? "Change karein, total khud update ho jayega." : "Kya khareeda? Kitne ka? Bas itna likhein."} size="md">
      {open && <AddExpenseForm key={edit?.id ?? "new"} />}
    </Dialog>
  );
}

export function AddExpenseForm() {
  const { categories, addExpenseState, closeAddExpense } = useApp();
  const { edit, date: presetDate } = addExpenseState;
  const toast = useToast();
  const [f, setF] = useState<FormState>(() =>
    edit
      ? {
          item_name: edit.item_name,
          quantity: edit.quantity != null ? String(edit.quantity) : "",
          unit: edit.unit ?? "",
          amount: String(edit.amount),
          category_id: edit.category_id,
          date: edit.date,
          note: edit.note ?? "",
        }
      : empty(presetDate),
  );
  const [quick, setQuick] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState<false | "close" | "again">(false);
  const [showMore, setShowMore] = useState(Boolean(edit?.note || edit?.quantity));
  const [justParsed, setJustParsed] = useState(false);
  const quickRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLInputElement>(null);

  const { data: suggestions = [] } = useQuery(() => api.getItemSuggestions(), []);
  const parsed = useMemo(() => (quick.trim() ? parseQuickEntry(quick) : null), [quick]);

  useEffect(() => {
    if (!edit) setTimeout(() => quickRef.current?.focus(), 80);
  }, [edit]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setF((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const catForKey = (key: string | null) => (key ? categories.find((c) => c.icon === key)?.id : undefined);

  const applyParsed = () => {
    if (!parsed || !parsed.item_name) return;
    // Look up the item in history for a sensible category when keywords don't match
    const hist = suggestions.find((s) => s.item_name.toLowerCase() === parsed.item_name.toLowerCase());
    setF((s) => ({
      ...s,
      item_name: parsed.item_name,
      amount: parsed.amount != null ? String(parsed.amount) : s.amount,
      quantity: parsed.quantity != null ? String(parsed.quantity) : "",
      unit: parsed.unit ?? "",
      category_id: catForKey(parsed.category_key) ?? hist?.category_id ?? s.category_id ?? "",
    }));
    if (parsed.quantity != null) setShowMore(true);
    setErrors({});
    setQuick("");
    setJustParsed(true);
    setTimeout(() => setJustParsed(false), 1400);
  };

  const pickSuggestion = (s: (typeof suggestions)[number]) => {
    setF((cur) => ({ ...cur, item_name: s.item_name, category_id: s.category_id, amount: String(s.amount), quantity: s.quantity != null ? String(s.quantity) : "", unit: s.unit ?? "" }));
    setErrors({});
  };

  const validate = (): ExpenseInput | null => {
    const e: typeof errors = {};
    if (!f.item_name.trim()) e.item_name = "Item ka naam likhein.";
    const amt = Number(f.amount.replace(/,/g, ""));
    if (!f.amount) e.amount = "Amount likhein.";
    else if (!(amt > 0)) e.amount = "Amount 0 se zyada ho.";
    else if (amt > 10_000_000) e.amount = "Amount bohat zyada hai.";
    const qty = f.quantity ? Number(f.quantity) : null;
    if (f.quantity && !(qty! > 0)) e.quantity = "Sahi quantity likhein.";
    if (!f.date) e.date = "Date select karein.";
    setErrors(e);
    if (Object.keys(e).length) {
      if (e.item_name) itemRef.current?.focus();
      return null;
    }
    const other = categories.find((c) => c.icon === "other")?.id ?? categories[0]?.id ?? "";
    return {
      item_name: f.item_name.trim(),
      amount: Math.round(amt),
      quantity: qty,
      unit: qty ? ((f.unit || "piece") as Unit) : null,
      category_id: f.category_id || other,
      date: f.date,
      note: f.note.trim() || null,
    };
  };

  const submit = async (mode: "close" | "again") => {
    const input = validate();
    if (!input) return;
    setSaving(mode);
    try {
      if (edit) {
        await api.updateExpense(edit.id, input);
        toast.success("Expense updated successfully.", `${input.item_name} — ${formatRs(input.amount)}`);
      } else {
        await api.createExpense(input);
        toast.success("Expense saved successfully.", `${input.item_name} — ${formatRs(input.amount)}`);
      }
      if (mode === "again") {
        setF(empty(f.date));
        setShowMore(false);
        setTimeout(() => quickRef.current?.focus(), 30);
      } else closeAddExpense();
    } catch (err) {
      toast.error("Save nahi ho saka.", (err as Error).message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const today = todayISO();
  const yesterday = addDays(today, -1);
  const selectedCat = categories.find((c) => c.id === f.category_id);

  return (
    <form
      className="space-y-5 pb-1"
      onSubmit={(e) => {
        e.preventDefault();
        submit("close");
      }}
      noValidate
    >
      {/* Smart quick entry */}
      {!edit && (
        <div className="rounded-2xl border border-brand/20 bg-brand-soft/50 p-3">
          <label htmlFor="quick-entry" className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-brand">
            <Wand2 className="h-4 w-4" aria-hidden /> Quick Entry
          </label>
          <div className="flex gap-2">
            <input
              id="quick-entry"
              ref={quickRef}
              className="input bg-surface"
              placeholder="e.g. Aloo 2kg 240"
              value={quick}
              autoComplete="off"
              enterKeyHint="done"
              onChange={(e) => setQuick(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyParsed();
                }
              }}
              aria-describedby="quick-hint"
            />
            <button type="button" className="btn-primary shrink-0 px-3.5" onClick={applyParsed} disabled={!parsed?.item_name}>
              Fill
            </button>
          </div>
          <AnimatePresence initial={false} mode="wait">
            {parsed?.item_name ? (
              <motion.div key="p" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <dl className="mt-2.5 flex flex-wrap gap-1.5 text-xs">
                  <ParsedChip k="Item" v={parsed.item_name} />
                  {parsed.quantity != null && <ParsedChip k="Quantity" v={formatNum(parsed.quantity)} />}
                  {parsed.unit && <ParsedChip k="Unit" v={UNIT_LABELS[parsed.unit]} />}
                  <ParsedChip k="Amount" v={parsed.amount != null ? formatRs(parsed.amount) : "—"} warn={parsed.amount == null} />
                  {parsed.category_key && <ParsedChip k="Category" v={categories.find((c) => c.icon === parsed.category_key)?.name ?? parsed.category_key} />}
                </dl>
              </motion.div>
            ) : (
              <motion.p key="h" id="quick-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2 text-xs text-ink-muted">
                Likhein <span className="font-semibold text-ink">Doodh 180</span> ya <span className="font-semibold text-ink">Aloo 2kg 240</span> aur Enter dabayein.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Frequent items */}
      {!edit && suggestions.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">Aksar khareeday</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
            {suggestions.slice(0, 10).map((s) => {
              const c = categories.find((x) => x.id === s.category_id);
              return (
                <button
                  key={s.item_name}
                  type="button"
                  onClick={() => pickSuggestion(s)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm font-medium transition",
                    f.item_name === s.item_name ? "border-brand bg-brand-soft text-ink" : "border-line bg-surface text-ink hover:border-brand/40",
                  )}
                >
                  <CategoryIcon category={c} size="sm" className="!h-6 !w-6 !rounded-full" />
                  {s.item_name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <motion.div animate={justParsed ? { scale: [1, 1.01, 1] } : {}} className={cn("grid grid-cols-5 gap-3 rounded-2xl transition-shadow", justParsed && "ring-4 ring-brand/15")}>
        <div className="col-span-3">
          <label htmlFor="item_name" className="label">
            Item Name
          </label>
          <input
            id="item_name"
            ref={itemRef}
            className={cn("input", errors.item_name && "input-error")}
            placeholder="Doodh, Aloo, Bijli Bill…"
            value={f.item_name}
            onChange={(e) => set("item_name", e.target.value)}
            aria-invalid={!!errors.item_name}
            aria-describedby={errors.item_name ? "item_name-err" : undefined}
            autoComplete="off"
            list="item-suggestions"
          />
          <datalist id="item-suggestions">
            {suggestions.map((s) => (
              <option key={s.item_name} value={s.item_name} />
            ))}
          </datalist>
          <FieldError id="item_name-err" msg={errors.item_name} />
        </div>
        <div className="col-span-2">
          <label htmlFor="amount" className="label">
            Amount
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">Rs.</span>
            <input
              id="amount"
              className={cn("input num pl-11 text-[17px] font-bold", errors.amount && "input-error")}
              inputMode="numeric"
              placeholder="0"
              value={f.amount}
              onChange={(e) => set("amount", e.target.value.replace(/[^\d.,]/g, ""))}
              aria-invalid={!!errors.amount}
              aria-describedby={errors.amount ? "amount-err" : undefined}
            />
          </div>
          <FieldError id="amount-err" msg={errors.amount} />
        </div>
      </motion.div>

      {/* Category */}
      <fieldset>
        <legend className="label">Category</legend>
        <div className="grid grid-cols-5 gap-2">
          {categories.map((c) => {
            const active = f.category_id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => set("category_id", active ? "" : c.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[11px] font-medium transition sm:text-xs",
                  active ? "border-brand bg-brand-soft text-ink shadow-[inset_0_0_0_1px_rgb(var(--brand))]" : "border-line text-ink-muted hover:border-brand/40 hover:text-ink",
                )}
              >
                <CategoryIcon category={c} size="sm" />
                <span className="w-full truncate text-center">{c.name}</span>
              </button>
            );
          })}
        </div>
        {!f.category_id && <p className="mt-1.5 text-xs text-ink-muted">Category na chunein to "Other" mein save hoga.</p>}
      </fieldset>

      {/* Date */}
      <div>
        <span className="label" id="date-label">
          Date
        </span>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="date-label">
          {[
            { v: today, l: "Aaj" },
            { v: yesterday, l: "Kal" },
          ].map((d) => (
            <button
              key={d.v}
              type="button"
              aria-pressed={f.date === d.v}
              onClick={() => set("date", d.v)}
              className={cn("h-10 rounded-xl border px-4 text-sm font-semibold transition", f.date === d.v ? "border-brand bg-brand text-white" : "border-line text-ink hover:border-brand/40")}
            >
              {d.l}
            </button>
          ))}
          <label className="relative flex h-10 min-w-0 flex-1 items-center rounded-xl border border-line px-3 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15">
            <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
            <span className="sr-only">Pick a date</span>
            <input
              id="date"
              type="date"
              max={today}
              value={f.date}
              onChange={(e) => set("date", e.target.value)}
              className="w-full min-w-0 bg-transparent text-sm text-ink focus:outline-none"
            />
          </label>
        </div>
        <p className="mt-1.5 text-xs text-ink-muted">{f.date ? formatLongDate(f.date) : ""}</p>
        <FieldError id="date-err" msg={errors.date} />
      </div>

      {/* More: qty/unit/notes */}
      <div>
        <button type="button" className="flex items-center gap-1.5 text-sm font-semibold text-brand" aria-expanded={showMore} onClick={() => setShowMore((v) => !v)}>
          <ChevronDown className={cn("h-4 w-4 transition-transform", showMore && "rotate-180")} aria-hidden />
          Quantity, unit aur notes
        </button>
        <AnimatePresence initial={false}>
          {showMore && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div>
                  <label htmlFor="quantity" className="label">
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    className={cn("input num", errors.quantity && "input-error")}
                    inputMode="decimal"
                    placeholder="e.g. 2"
                    value={f.quantity}
                    onChange={(e) => set("quantity", e.target.value.replace(/[^\d.]/g, ""))}
                    aria-invalid={!!errors.quantity}
                  />
                  <FieldError id="quantity-err" msg={errors.quantity} />
                </div>
                <div>
                  <label htmlFor="unit" className="label">
                    Unit
                  </label>
                  <select id="unit" className="input" value={f.unit} onChange={(e) => set("unit", e.target.value as Unit)}>
                    <option value="">Select unit</option>
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {UNIT_LABELS[u]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label htmlFor="note" className="label">
                    Notes <span className="font-normal text-ink-muted">(optional)</span>
                  </label>
                  <textarea id="note" rows={2} className="input h-auto py-2.5" placeholder="Kis dukaan se, kis ke liye…" value={f.note} onChange={(e) => set("note", e.target.value)} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live summary + actions */}
      <div className="sticky bottom-0 -mx-5 border-t border-line bg-surface px-5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-3 sm:-mx-6 sm:px-6 sm:pb-2">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="flex min-w-0 items-center gap-2 text-ink-muted">
            {selectedCat && <CategoryIcon category={selectedCat} size="sm" className="!h-6 !w-6" />}
            <span className="truncate">{f.item_name || "Naya kharcha"}</span>
          </span>
          <span className="num text-lg font-bold text-ink">{formatRs(Number(f.amount.replace(/,/g, "")) || 0)}</span>
        </div>
        <div className="flex gap-2">
          {!edit && (
            <button type="button" className="btn-secondary flex-1" onClick={() => submit("again")} disabled={!!saving}>
              {saving === "again" ? <Spinner /> : "Save & Add More"}
            </button>
          )}
          <button type="submit" className="btn-primary flex-1" disabled={!!saving}>
            {saving === "close" ? <Spinner /> : edit ? "Update Expense" : "Save Expense"}
          </button>
        </div>
      </div>
    </form>
  );
}

function ParsedChip({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className={cn("flex items-center gap-1 rounded-lg border bg-surface px-2 py-1", warn ? "border-warning/50" : "border-line")}>
      <dt className="text-ink-muted">{k}:</dt>
      <dd className="font-semibold text-ink">{v}</dd>
      {k === "Item" && <Sparkles className="h-3 w-3 text-saffron" aria-hidden />}
    </div>
  );
}

function FieldError({ id, msg }: { id: string; msg?: string }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.p id={id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1 text-xs font-medium text-danger" role="alert">
          {msg}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
