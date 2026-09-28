import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3, CalendarDays, FileDown, LayoutGrid, LayoutDashboard, LogOut, Moon, Plus, ReceiptText, Search, Settings, Sun, Tags, Wallet,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useApp } from "@/context/AppContext";
import { Dialog } from "@/components/ui/Dialog";
import { AddExpenseSheet } from "@/components/expenses/AddExpenseForm";
import { SearchPalette } from "./SearchPalette";
import { cn } from "@/lib/utils";

export const NAV = [
  { to: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { to: "/expenses", label: "Expenses", short: "Expenses", icon: ReceiptText },
  { to: "/daily", label: "Daily Record", short: "Daily", icon: CalendarDays },
  { to: "/analytics", label: "Analytics", short: "Analytics", icon: BarChart3 },
  { to: "/reports", label: "Reports", short: "Reports", icon: FileDown },
  { to: "/categories", label: "Categories", short: "Categories", icon: Tags },
  { to: "/budget", label: "Budget", short: "Budget", icon: Wallet },
  { to: "/settings", label: "Settings", short: "Settings", icon: Settings },
];

export function AppSidebar() {
  const { user, openAddExpense, signOut } = useApp();
  const navigate = useNavigate();
  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-[260px] shrink-0 flex-col border-r border-line bg-surface lg:flex" aria-label="Main navigation">
      <div className="px-5 pb-4 pt-6">
        <NavLink to="/dashboard" aria-label="Apna Hisab Kitaab home">
          <Logo />
        </NavLink>
      </div>
      <div className="px-4">
        <button className="btn-primary h-12 w-full text-[15px]" onClick={() => openAddExpense()}>
          <Plus className="h-5 w-5" aria-hidden /> Add Expense
          <kbd className="ml-auto hidden rounded-md bg-white/15 px-1.5 text-[11px] font-medium xl:inline">N</kbd>
        </button>
      </div>
      <nav className="mt-5 flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                isActive ? "bg-brand-soft text-brand" : "text-ink-muted hover:bg-surface-2 hover:text-ink",
              )
            }
          >
            {({ isActive }) => (
              <>
                <n.icon className="h-[19px] w-[19px]" aria-hidden strokeWidth={isActive ? 2.3 : 2} />
                {n.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 flex items-center gap-3 rounded-2xl border border-line p-3">
        <Avatar name={user?.name ?? "?"} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
          <p className="truncate text-xs text-ink-muted">{user?.email}</p>
        </div>
        <button
          aria-label="Log out"
          className="rounded-lg p-2 text-ink-muted hover:bg-surface-2 hover:text-danger"
          onClick={() => {
            signOut();
            navigate("/login");
          }}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

export function Avatar({ name, size = 36, src }: { name: string; size?: number; src?: string | null }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  if (src) return <img src={src} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-saffron-soft font-bold text-ink" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden>
      {initials}
    </span>
  );
}

/** Top bar inside the app (mobile + desktop) */
export function Header({ title }: { title?: string }) {
  const { setSearchOpen, resolvedTheme, toggleTheme, user } = useApp();
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b border-line/80 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 lg:px-8">
        <NavLink to="/dashboard" className="lg:hidden" aria-label="Apna Hisab Kitaab home">
          <Logo variant="compact" size={32} />
        </NavLink>
        {title && <span className="sr-only">{title}</span>}
        <button
          onClick={() => setSearchOpen(true)}
          className="ml-auto flex h-10 w-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm text-ink-muted transition hover:border-brand/40 hover:text-ink sm:w-auto sm:min-w-[260px] sm:justify-start sm:px-3 lg:ml-0"
          aria-label="Search expenses"
        >
          <Search className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Kharchay dhoondein…</span>
          <kbd className="ml-auto hidden rounded-md border border-line px-1.5 text-[11px] sm:inline">/</kbd>
        </button>
        <button onClick={toggleTheme} className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted hover:bg-surface-2 hover:text-ink lg:ml-auto" aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <NavLink to="/settings" aria-label="Profile and settings" className="rounded-full">
          <Avatar name={user?.name ?? "?"} size={36} src={user?.avatar_url} />
        </NavLink>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const { openAddExpense } = useApp();
  const [more, setMore] = useState(false);
  const loc = useLocation();
  const moreActive = ["/daily", "/reports", "/categories", "/budget", "/settings"].includes(loc.pathname);
  const tab = (to: string, label: string, Icon: typeof LayoutDashboard) => (
    <NavLink
      to={to}
      className={({ isActive }) => cn("flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold transition-colors", isActive ? "text-brand" : "text-ink-muted")}
    >
      {({ isActive }) => (
        <>
          <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", isActive && "bg-brand-soft")}>
            <Icon className="h-[20px] w-[20px]" strokeWidth={isActive ? 2.4 : 2} aria-hidden />
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
  return (
    <>
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden" aria-label="Main navigation">
        <div className="mx-auto flex max-w-lg items-end px-2">
          {tab("/dashboard", "Home", LayoutDashboard)}
          {tab("/expenses", "Expenses", ReceiptText)}
          <div className="flex flex-1 justify-center">
            <button
              onClick={() => openAddExpense()}
              aria-label="Add expense"
              className="-mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_10px_24px_-6px_rgb(var(--brand)/0.7)] ring-4 ring-bg transition active:scale-95"
            >
              <Plus className="h-7 w-7" strokeWidth={2.4} />
            </button>
          </div>
          {tab("/analytics", "Analytics", BarChart3)}
          <button onClick={() => setMore(true)} className={cn("flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold", moreActive ? "text-brand" : "text-ink-muted")} aria-haspopup="dialog">
            <span className={cn("flex h-7 w-12 items-center justify-center rounded-full", moreActive && "bg-brand-soft")}>
              <LayoutGrid className="h-[20px] w-[20px]" aria-hidden />
            </span>
            More
          </button>
        </div>
      </nav>
      <Dialog open={more} onClose={() => setMore(false)} title="More" size="sm">
        <div className="grid grid-cols-3 gap-2 pb-2">
          {NAV.filter((n) => !["/dashboard", "/expenses", "/analytics"].includes(n.to)).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={() => setMore(false)}
              className={({ isActive }) => cn("flex flex-col items-center gap-2 rounded-2xl border p-3 text-center text-xs font-semibold", isActive ? "border-brand bg-brand-soft text-brand" : "border-line text-ink")}
            >
              <n.icon className="h-5 w-5" aria-hidden />
              {n.short}
            </NavLink>
          ))}
        </div>
      </Dialog>
    </>
  );
}

export function AppLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { openAddExpense } = useApp();
  // PWA shortcut: /dashboard?add=1 opens the Add Expense sheet
  useEffect(() => {
    if (new URLSearchParams(loc.search).get("add") === "1") {
      openAddExpense();
      navigate(loc.pathname, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.search]);
  return (
    <div className="flex min-h-[100dvh] bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-xl focus:bg-brand focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-[calc(104px+env(safe-area-inset-bottom,0px))] pt-5 lg:px-8 lg:pb-12 lg:pt-8">
          {/* Enter-only page transition: the new page shows immediately, never waits on the old one */}
          <motion.div key={loc.pathname} initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
      <MobileBottomNav />
      <AddExpenseSheet />
      <SearchPalette />
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: string; actions?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[13px] font-medium text-ink-muted">{eyebrow}</p>}
        <h1 className="text-[24px] font-extrabold leading-tight text-ink sm:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-ink-muted sm:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

