import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Category, Expense, Preferences, ThemePref, User } from "@/types";
import * as api from "@/services/api";
import { useQuery } from "@/hooks";
import { setDateFormat, storage } from "@/lib/utils";

interface AppState {
  user: User | null;
  setUser: (u: User | null) => void;
  signOut: () => void;

  prefs: Preferences;
  setPrefs: (p: Partial<Preferences>) => void;
  resolvedTheme: "light" | "dark";
  toggleTheme: () => void;

  categories: Category[];
  categoryById: (id: string) => Category | undefined;

  /** Opens the Add / Edit expense sheet from anywhere */
  openAddExpense: (opts?: { edit?: Expense; date?: string; quick?: boolean }) => void;
  addExpenseState: { open: boolean; edit?: Expense; date?: string; quick?: boolean };
  closeAddExpense: () => void;

  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
}

const Ctx = createContext<AppState | null>(null);
export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp outside AppProvider");
  return c;
};

const PREFS_KEY = "ahk:prefs";
const defaultPrefs: Preferences = { theme: "system", currency: "PKR", date_format: "dd MMM yyyy" };

function applyTheme(t: ThemePref) {
  const root = document.documentElement;
  if (t === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", t);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => api.getSession()?.user ?? null);
  const [prefs, setPrefsState] = useState<Preferences>(() => ({ ...defaultPrefs, ...storage.get<Partial<Preferences>>(PREFS_KEY, {}) }));
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [addExpenseState, setAddExpenseState] = useState<AppState["addExpenseState"]>({ open: false });
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = () => setSystemDark(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // If the host already stamped a theme (e.g. embedded preview) and the user hasn't chosen, respect it.
  const hostTheme = document.documentElement.getAttribute("data-theme") as "light" | "dark" | null;
  const [initialHost] = useState(hostTheme);

  useEffect(() => {
    if (prefs.theme === "system" && initialHost) document.documentElement.setAttribute("data-theme", initialHost);
    else applyTheme(prefs.theme);
    setDateFormat(prefs.date_format);
  }, [prefs.theme, prefs.date_format, initialHost]);

  const resolvedTheme: "light" | "dark" = prefs.theme === "system" ? initialHost ?? (systemDark ? "dark" : "light") : prefs.theme;

  const setPrefs = useCallback((p: Partial<Preferences>) => {
    setPrefsState((cur) => {
      const next = { ...cur, ...p };
      storage.set(PREFS_KEY, next);
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => setPrefs({ theme: resolvedTheme === "dark" ? "light" : "dark" }), [resolvedTheme, setPrefs]);

  const { data: categories = [] } = useQuery(() => (user ? api.getCategories() : Promise.resolve([])), [user?.id]);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Expired / invalid token from the backend → back to login
  useEffect(() => {
    const onUnauth = () => {
      api.logout();
      setUser(null);
    };
    window.addEventListener("ahk:unauthorized", onUnauth);
    return () => window.removeEventListener("ahk:unauthorized", onUnauth);
  }, []);

  // Global keyboard shortcuts: "/" or Ctrl/⌘+K = search, "n" = new expense
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        if (!user) return;
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "n" && !typing && !e.metaKey && !e.ctrlKey && user && !document.querySelector('[role="dialog"]')) {
        e.preventDefault();
        setAddExpenseState({ open: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user]);

  const value = useMemo<AppState>(
    () => ({
      user,
      setUser,
      signOut: () => {
        api.logout();
        setUser(null);
      },
      prefs,
      setPrefs,
      resolvedTheme,
      toggleTheme,
      categories,
      categoryById: (id) => catMap.get(id),
      openAddExpense: (opts) => setAddExpenseState({ open: true, ...opts }),
      addExpenseState,
      closeAddExpense: () => setAddExpenseState((s) => ({ ...s, open: false })),
      searchOpen,
      setSearchOpen,
    }),
    [user, prefs, setPrefs, resolvedTheme, toggleTheme, categories, catMap, addExpenseState, searchOpen],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
