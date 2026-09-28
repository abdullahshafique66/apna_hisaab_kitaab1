import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { CornerDownLeft, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useDebounced, useQuery } from "@/hooks";
import * as api from "@/services/api";
import { CategoryIcon } from "@/components/expenses/CategoryIcon";
import { qtyLabel } from "@/components/expenses/ExpenseList";
import { cn, formatDate, formatRs } from "@/lib/utils";

const TRY = ["doodh", "chicken", "bill", "sabzi", "rickshaw"];

/** Global instant search (Ctrl/⌘+K or "/"). */
export function SearchPalette() {
  const { searchOpen, setSearchOpen, categoryById, openAddExpense } = useApp();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const dq = useDebounced(q, 60);

  // Pull all rows once when opened, then filter locally so typing feels instant.
  const { data, loading } = useQuery(() => (searchOpen ? api.getExpenses({ page_size: 5000 }) : Promise.resolve(null)), [searchOpen]);
  const results = useMemo(() => {
    const s = dq.trim().toLowerCase();
    if (!s || !data) return [];
    return data.items.filter((e) => `${e.item_name} ${e.note ?? ""} ${categoryById(e.category_id)?.name ?? ""}`.toLowerCase().includes(s)).slice(0, 40);
  }, [dq, data, categoryById]);
  const total = results.reduce((a, e) => a + e.amount, 0);

  useEffect(() => {
    if (searchOpen) {
      setQ("");
      setActive(0);
      const prev = document.activeElement as HTMLElement | null;
      setTimeout(() => inputRef.current?.focus(), 50);
      const overflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = overflow;
        prev?.focus?.();
      };
    }
  }, [searchOpen]);
  useEffect(() => setActive(0), [dq]);

  const close = () => setSearchOpen(false);
  const choose = (i: number) => {
    const e = results[i];
    if (!e) return;
    close();
    openAddExpense({ edit: e });
  };

  return createPortal(
    <AnimatePresence>
      {searchOpen && (
        <div className="fixed inset-0 z-[75] flex items-start justify-center px-3 pt-[max(12px,env(safe-area-inset-top,0px))] sm:pt-[12vh]" onKeyDown={(e) => e.key === "Escape" && close()}>
          <motion.div className="absolute inset-0 bg-[rgb(10_20_16/0.45)] backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} aria-hidden />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search expenses"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="relative flex max-h-[80dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-lift"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="h-5 w-5 shrink-0 text-brand" aria-hidden />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(results.length - 1, a + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(0, a - 1));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    choose(active);
                  }
                }}
                placeholder="Doodh, chicken, bijli bill…"
                className="h-14 min-w-0 flex-1 bg-transparent text-[17px] text-ink placeholder:text-ink-muted/70 focus:outline-none"
                aria-label="Search expenses"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="search-results"
                aria-activedescendant={results[active] ? `sr-${results[active].id}` : undefined}
                autoComplete="off"
              />
              <button onClick={close} className="rounded-lg p-2 text-ink-muted hover:bg-surface-2" aria-label="Close search">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {!q.trim() ? (
                <div className="p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">Try searching</p>
                  <div className="flex flex-wrap gap-2">
                    {TRY.map((t) => (
                      <button key={t} onClick={() => setQ(t)} className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-brand/40 hover:bg-brand-soft/50">
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ) : loading ? (
                <p className="p-6 text-center text-sm text-ink-muted">Dhoond rahe hain…</p>
              ) : results.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="font-semibold text-ink">"{q}" nahi mila</p>
                  <p className="mt-1 text-sm text-ink-muted">Spelling check karein ya naya kharcha add karein.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-4 pb-1 pt-3 text-xs text-ink-muted">
                    <span>
                      {results.length} results{results.length === 40 ? "+" : ""}
                    </span>
                    <span className="num">
                      Total <b className="text-ink">{formatRs(total)}</b>
                    </span>
                  </div>
                  <ul id="search-results" role="listbox" className="px-2 pb-2">
                    {results.map((e, i) => {
                      const c = categoryById(e.category_id);
                      return (
                        <li
                          key={e.id}
                          id={`sr-${e.id}`}
                          role="option"
                          aria-selected={i === active}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => choose(i)}
                          className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5", i === active && "bg-brand-soft/60")}
                        >
                          <CategoryIcon category={c} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-ink">
                              <Highlight text={e.item_name} q={dq} />
                            </p>
                            <p className="truncate text-xs text-ink-muted">{[formatDate(e.date), c?.name, qtyLabel(e)].filter(Boolean).join(" · ")}</p>
                          </div>
                          <span className="num font-bold text-ink">{formatRs(e.amount)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
            <div className="hidden items-center justify-between border-t border-line px-4 py-2.5 text-xs text-ink-muted sm:flex">
              <span className="flex items-center gap-1.5">
                <CornerDownLeft className="h-3.5 w-3.5" aria-hidden /> Edit expense
              </span>
              <button
                className="font-semibold text-brand hover:underline"
                onClick={() => {
                  close();
                  navigate(`/expenses?q=${encodeURIComponent(q)}`);
                }}
              >
                Expenses page par dekhein
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Highlight({ text, q }: { text: string; q: string }) {
  const s = q.trim();
  if (!s) return <>{text}</>;
  const i = text.toLowerCase().indexOf(s.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-saffron/30 px-0.5 text-ink">{text.slice(i, i + s.length)}</mark>
      {text.slice(i + s.length)}
    </>
  );
}
