import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "success" | "error" | "info" | "warning";
interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: Variant;
  action?: { label: string; onClick: () => void };
}
interface ToastApi {
  toast: (t: Omit<ToastItem, "id" | "variant"> & { variant?: Variant; duration?: number }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const Ctx = createContext<ToastApi | null>(null);
export const useToast = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast outside ToastProvider");
  return c;
};

const icons = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle };
const tone = {
  success: "text-success",
  error: "text-danger",
  info: "text-brand",
  warning: "text-warning",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const toast = useCallback<ToastApi["toast"]>(
    ({ duration = 3200, variant = "success", ...t }) => {
      const id = ++idRef.current;
      setItems((xs) => [...xs.slice(-2), { ...t, variant, id }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );
  const api = useMemo<ToastApi>(
    () => ({
      toast,
      success: (title, description) => toast({ title, description, variant: "success" }),
      error: (title, description) => toast({ title, description, variant: "error", duration: 4500 }),
    }),
    [toast],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 z-[80] flex flex-col items-center gap-2 px-4 bottom-[calc(88px+env(safe-area-inset-bottom,0px))] lg:bottom-6 lg:items-end lg:right-6 lg:left-auto"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const Icon = icons[t.variant];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                role={t.variant === "error" ? "alert" : "status"}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-lift"
              >
                <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", tone[t.variant])} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-ink">{t.title}</p>
                  {t.description && <p className="text-sm text-ink-muted">{t.description}</p>}
                </div>
                {t.action && (
                  <button
                    className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-brand hover:bg-brand-soft"
                    onClick={() => {
                      t.action!.onClick();
                      dismiss(t.id);
                    }}
                  >
                    {t.action.label}
                  </button>
                )}
                <button aria-label="Dismiss notification" onClick={() => dismiss(t.id)} className="shrink-0 rounded-lg p-1 text-ink-muted hover:bg-surface-2 hover:text-ink">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
