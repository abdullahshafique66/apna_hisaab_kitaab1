import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowRight, BarChart3, Calculator, Check, ChevronDown, Download, FileSpreadsheet, FileText, FileType2, History, Menu, Moon,
  NotebookPen, PieChart, Plus, Sun, Tags, Wand2, X,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { FloatingBudget, FloatingExpenseAdded, FloatingMonthly, HeroDashboard, smoothPath } from "@/components/landing/HeroVisuals";
import { useApp } from "@/context/AppContext";
import { cn, formatRs } from "@/lib/utils";
import { parseQuickEntry } from "@/lib/quickEntry";
import { UNIT_LABELS } from "@/types";

const ease = [0.22, 1, 0.36, 1] as const;
const up: Variants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } };
// Scroll reveals only slide — content is always visible at rest (screenshots, no-JS observers, reduced motion).
const reveal: Variants = { hidden: { y: 22 }, show: { y: 0, transition: { duration: 0.7, ease } } };
const inView = { variants: reveal, initial: "hidden", whileInView: "show", viewport: { once: true, margin: "-60px" } } as const;

const NAV_LINKS = [
  { href: "#top", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#how", label: "How It Works" },
  { href: "#reports", label: "Reports" },
  { href: "#faq", label: "FAQ" },
];

function scrollTo(href: string) {
  document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, resolvedTheme, toggleTheme } = useApp();
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={cn("sticky top-[env(safe-area-inset-top,0px)] z-50 transition-all duration-300", scrolled ? "border-b border-line/80 bg-bg/80 backdrop-blur-lg" : "border-b border-transparent")}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="mx-auto flex h-[68px] max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="Apna Hisab Kitaab home">
          <Logo />
        </a>
        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={(e) => { e.preventDefault(); scrollTo(l.href); }} className="rounded-lg px-3 py-2 text-[15px] font-medium text-ink-muted transition hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <button onClick={toggleTheme} className="rounded-xl p-2.5 text-ink-muted hover:bg-surface-2 hover:text-ink" aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          {user ? (
            <Link to="/dashboard" className="btn-primary">
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Login
              </Link>
              <Link to="/signup" className="btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>
        <button className="ml-auto rounded-xl p-2.5 text-ink lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="mobile-menu">
          <Menu className="h-6 w-6" />
        </button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div id="mobile-menu" className="fixed inset-0 z-[60] bg-bg lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Menu">
            <div className="flex h-[68px] items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)]">
              <Logo />
              <button className="rounded-xl p-2.5" onClick={() => setOpen(false)} aria-label="Close menu" autoFocus>
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-col px-4 pt-4" aria-label="Mobile">
              {NAV_LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    setTimeout(() => scrollTo(l.href), 150);
                  }}
                  className="border-b border-line py-4 text-2xl font-bold text-ink"
                >
                  {l.label}
                </motion.a>
              ))}
            </nav>
            <div className="absolute inset-x-4 bottom-[calc(24px+env(safe-area-inset-bottom,0px))] grid gap-3">
              <button onClick={toggleTheme} className="btn-ghost justify-start">
                {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />} {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <Link to={user ? "/dashboard" : "/login"} className="btn-secondary h-12">
                {user ? "Open Dashboard" : "Login"}
              </Link>
              <Link to="/signup" className="btn-primary h-12">
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -top-40 left-1/2 h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--brand)/0.14),transparent)]" />
      <div className="absolute right-[-10%] top-[30%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgb(var(--saffron)/0.16),transparent)]" />
      <div className="bg-ledger absolute inset-0" />
      {/* margin rule of a ledger page */}
      <div className="absolute left-[7%] top-0 hidden h-full w-px bg-[rgb(var(--danger)/0.12)] xl:block" />
      <svg className="absolute left-[3%] top-[18%] hidden h-24 w-24 text-brand/20 lg:block" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
      </svg>
      <span className="absolute right-[46%] top-[14%] h-3 w-3 rounded-full bg-saffron/60" />
      <span className="absolute bottom-[18%] left-[42%] h-2 w-2 rounded-full bg-brand/40" />
      <span className="absolute right-[6%] top-[12%] hidden h-16 w-16 rotate-12 rounded-2xl border-2 border-brand/15 lg:block" />
    </div>
  );
}

function Hero() {
  const navigate = useNavigate();
  const { user } = useApp();
  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } } };
  return (
    <section id="top" className="relative scroll-mt-24">
      <HeroBackground />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-8 lg:pb-28 lg:pt-20">
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl">
          <motion.div variants={up}>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-surface/80 px-3.5 py-1.5 text-[13px] font-semibold text-brand shadow-card backdrop-blur">
              <motion.span animate={{ rotate: [0, 90, 180] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }} className="text-saffron" aria-hidden>
                ✦
              </motion.span>
              Smart Household Expense Tracker
            </span>
          </motion.div>
          <motion.h1 variants={up} className="mt-6 text-[42px] font-extrabold leading-[1.04] tracking-[-0.035em] text-ink sm:text-[56px] lg:text-[60px] xl:text-[68px]">
            <span className="whitespace-nowrap">Har Kharchay Ka</span>
            <br />
            <span className="relative inline-block whitespace-nowrap text-brand">
              Apna Hisab.
              <svg className="absolute -bottom-2 left-0 h-4 w-full sm:-bottom-3 sm:h-5" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden>
                <motion.path d="M3 14 C 60 4, 140 4, 297 11" fill="none" stroke="rgb(var(--saffron))" strokeWidth="6" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.9, duration: 0.8, ease }} />
              </svg>
            </span>
          </motion.h1>
          <motion.p variants={up} className="mt-7 max-w-xl text-[17px] leading-relaxed text-ink-muted sm:text-lg">
            Rozana grocery, bills aur ghar ke har kharchay ko aasani se record karein. Total automatic calculate karein aur apna poora hisab ek jagah dekhein.
          </motion.p>
          <motion.div variants={up} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => navigate(user ? "/dashboard" : "/signup")} className="btn-primary group h-[52px] px-6 text-base">
              Start Tracking <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>
            <button onClick={() => scrollTo("#how")} className="btn-secondary h-[52px] px-6 text-base">
              See How It Works
            </button>
          </motion.div>
          <motion.ul variants={up} className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-medium text-ink">
            {["Simple to use", "Automatic calculations", "Downloadable reports"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                </span>
                {t}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Product preview + floating cards */}
        <div className="relative mx-auto w-full max-w-[460px] lg:mr-4">
          <motion.div initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.8, ease }}>
            <HeroDashboard />
          </motion.div>
          <motion.div className="absolute -left-4 top-[40%] sm:-left-20" initial={{ opacity: 0, x: -20, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 1.5, duration: 0.6, ease }}>
            <div className="animate-float">
              <FloatingExpenseAdded />
            </div>
          </motion.div>
          <motion.div className="absolute -right-24 top-[3%] hidden xl:block" initial={{ opacity: 0, x: 20, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 1.7, duration: 0.6, ease }}>
            <div className="animate-float-slow [animation-delay:-2s]">
              <FloatingMonthly />
            </div>
          </motion.div>
          <motion.div className="absolute -bottom-14 -right-2 sm:-right-16" initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 1.9, duration: 0.6, ease }}>
            <div className="animate-float [animation-delay:-4s]">
              <FloatingBudget />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title, desc, center = true }: { eyebrow: string; title: string; desc?: string; center?: boolean }) {
  return (
    <motion.div {...inView} className={cn("max-w-2xl", center && "mx-auto text-center")}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] text-ink sm:text-[40px] lg:text-[46px]">{title}</h2>
      {desc && <p className="mt-4 text-[17px] text-ink-muted">{desc}</p>}
    </motion.div>
  );
}

const FEATURES = [
  { icon: NotebookPen, title: "Daily Expenses", desc: "Record every purchase quickly — doodh, sabzi, kiraya, sab kuch seconds mein." },
  { icon: Calculator, title: "Automatic Hisab", desc: "Totals calculate automatically. Ek amount badlein, har total khud update." },
  { icon: Tags, title: "Smart Categories", desc: "Organize expenses easily. Doodh khud Dairy mein, Aloo khud Vegetables mein." },
  { icon: PieChart, title: "Spending Analytics", desc: "Understand where your money goes, din, hafta aur mahine ke hisab se." },
  { icon: History, title: "Expense History", desc: "Find old records instantly. Pichle mahine chicken kitne ka tha? Foran dekhein." },
  { icon: Download, title: "Download Reports", desc: "Download PDF, Excel and CSV reports — ghar walon se share karein." },
];

function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead eyebrow="Features" title="Sab Kharchay, Ek Jagah." desc="Wohi kaam jo aap diary mein karte thay — ab bina calculator ke, aur hamesha mehfooz." />
        <motion.div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>
          {FEATURES.map((f, i) => (
            <motion.article key={f.title} variants={reveal} className="group relative overflow-hidden rounded-3xl border border-line bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-soft opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
              <span className={cn("relative flex h-12 w-12 items-center justify-center rounded-2xl transition-colors", i === 1 ? "bg-saffron-soft text-[#B86E14] dark:text-saffron" : "bg-brand-soft text-brand")}>
                <f.icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="relative mt-5 text-xl font-bold text-ink">{f.title}</h3>
              <p className="relative mt-2 text-[15px] leading-relaxed text-ink-muted">{f.desc}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Kharcha Likhein",
      desc: "Enter what you bought and how much it cost. Bas likhein: Aloo 2kg 240.",
      art: (
        <div className="rounded-2xl border border-line bg-surface p-3 shadow-card">
          <div className="flex items-center gap-2 rounded-xl border border-brand/40 bg-surface px-3 py-2.5 ring-4 ring-brand/10">
            <Wand2 className="h-4 w-4 text-brand" aria-hidden />
            <span className="text-sm font-medium text-ink">Aloo 2kg 240</span>
            <span className="ml-0.5 h-4 w-px animate-pulse bg-ink" />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            {["Aloo", "2 Kg", "Rs. 240", "Vegetables"].map((c) => (
              <span key={c} className="rounded-md bg-surface-2 px-2 py-1 font-semibold text-ink">
                {c}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      n: "02",
      title: "Automatic Hisab",
      desc: "The app calculates everything automatically — daily, weekly, monthly aur category totals.",
      art: (
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Aaj", "1,250"],
            ["Hafta", "8,450"],
            ["Mahina", "32,450"],
          ].map(([l, v], i) => (
            <div key={l} className={cn("rounded-2xl p-3 shadow-card", i === 0 ? "bg-brand text-white" : "border border-line bg-surface")}>
              <p className={cn("text-[11px]", i === 0 ? "text-white/80" : "text-ink-muted")}>{l}</p>
              <p className={cn("num text-sm font-extrabold", i === 0 ? "text-white" : "text-ink")}>Rs. {v}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      n: "03",
      title: "Report Dekhein",
      desc: "Understand your daily, weekly and monthly spending — charts aur downloadable reports.",
      art: (
        <div className="flex items-end gap-1.5 rounded-2xl border border-line bg-surface p-3 shadow-card" aria-hidden>
          {[40, 62, 48, 80, 55, 70, 92].map((h, i) => (
            <span key={i} className={cn("flex-1 rounded-md", i === 6 ? "bg-saffron" : "bg-brand/70")} style={{ height: h * 0.7 }} />
          ))}
        </div>
      ),
    },
  ];
  return (
    <section id="how" className="scroll-mt-20 border-y border-line bg-surface py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead eyebrow="How it works" title="Teen qadam. Bas." desc="Na koi formula, na koi spreadsheet. Likhein aur bhool jayein — hisab tayyar milega." />
        <ol className="relative mt-16 grid gap-10 lg:grid-cols-3 lg:gap-8">
          <div className="absolute left-[16%] right-[16%] top-7 hidden border-t-2 border-dashed border-line lg:block" aria-hidden />
          {steps.map((s, i) => (
            <motion.li key={s.n} {...inView} transition={{ delay: i * 0.12 }} className="relative">
              <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                <span className="num relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-brand bg-bg text-lg font-extrabold text-brand">{s.n}</span>
                <h3 className="text-2xl font-extrabold text-ink lg:mt-3">{s.title}</h3>
              </div>
              <p className="mt-3 max-w-sm text-[16px] leading-relaxed text-ink-muted">{s.desc}</p>
              <div className="mt-6 max-w-sm">{s.art}</div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Interactive: edit any amount and watch the total recalculate. */
function ProductPreview() {
  const [rows, setRows] = useState([
    { id: 1, e: "🥛", n: "Doodh", a: 180 },
    { id: 2, e: "🥔", n: "Aloo", a: 120 },
    { id: 3, e: "🍅", n: "Tamatar", a: 150 },
    { id: 4, e: "🍗", n: "Chicken", a: 650 },
  ]);
  const [quick, setQuick] = useState("");
  const total = rows.reduce((s, r) => s + (Number(r.a) || 0), 0);
  const [bump, setBump] = useState(0);
  useEffect(() => setBump((b) => b + 1), [total]);
  const parsed = quick.trim() ? parseQuickEntry(quick) : null;
  const add = () => {
    if (!parsed?.item_name || parsed.amount == null) return;
    setRows((r) => [...r, { id: Date.now(), e: "🧾", n: parsed.item_name + (parsed.quantity ? ` · ${parsed.quantity} ${parsed.unit ? UNIT_LABELS[parsed.unit] : ""}` : ""), a: parsed.amount! }]);
    setQuick("");
  };
  return (
    <section className="py-20 lg:py-28" aria-labelledby="pp-h">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <motion.div {...inView}>
          <p className="eyebrow">Product preview</p>
          <h2 id="pp-h" className="mt-3 text-[32px] font-extrabold leading-[1.1] text-ink sm:text-[40px] lg:text-[46px]">
            Aap likhein.
            <br />
            Hum jor dein.
          </h2>
          <p className="mt-4 max-w-lg text-[17px] text-ink-muted">Yeh asli hisab hai — koi bhi amount badal kar dekhein. Aloo Rs. 120 se Rs. 150 karein, total foran Rs. 1,100 se Rs. 1,130 ho jayega. Dashboard, charts aur reports bhi saath hi update hote hain.</p>
          <ul className="mt-6 space-y-3 text-[15px] text-ink">
            {["Koi manual calculation nahi", "Quick entry: “Aloo 2kg 240” likhein, baqi app samajh legi", "Internet ya AI key ki zaroorat nahi — sab aap ke phone par"].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div {...inView} className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[40px] bg-[radial-gradient(closest-side,rgb(var(--brand)/0.12),transparent)]" aria-hidden />
          <div className="rounded-[28px] border border-line bg-surface p-5 shadow-lift sm:p-6">
            <div className="flex items-center justify-between">
              <p className="font-bold text-ink">Aaj ka Hisab</p>
              <span className="chip bg-brand-soft text-brand">Live demo</span>
            </div>
            <ul className="mt-3 divide-y divide-line">
              <AnimatePresence initial={false}>
                {rows.map((r) => (
                  <motion.li key={r.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 py-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-lg" aria-hidden>
                      {r.e}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-ink">{r.n}</span>
                    <label className="flex items-center gap-1 rounded-lg border border-line bg-bg px-2 py-1 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15">
                      <span className="text-xs font-semibold text-ink-muted">Rs.</span>
                      <span className="sr-only">Amount for {r.n}</span>
                      <input
                        className="num w-16 bg-transparent text-right text-[15px] font-bold text-ink focus:outline-none"
                        inputMode="numeric"
                        value={r.a}
                        onChange={(e) => setRows((xs) => xs.map((x) => (x.id === r.id ? { ...x, a: Number(e.target.value.replace(/\D/g, "")) || 0 } : x)))}
                      />
                    </label>
                    <button onClick={() => setRows((xs) => xs.filter((x) => x.id !== r.id))} className="rounded-lg p-1.5 text-ink-muted hover:bg-danger/10 hover:text-danger" aria-label={`Remove ${r.n}`}>
                      <X className="h-4 w-4" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                add();
              }}
            >
              <label htmlFor="pp-quick" className="sr-only">
                Quick entry
              </label>
              <input id="pp-quick" className="input h-10 text-sm" placeholder="Try: Pyaz 1kg 100" value={quick} onChange={(e) => setQuick(e.target.value)} />
              <button className="btn-primary h-10 shrink-0 px-3" disabled={!parsed?.item_name || parsed.amount == null} aria-label="Add item">
                <Plus className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-brand px-4 py-3.5 text-white" aria-live="polite">
              <span className="text-sm font-semibold text-white/85">
                {rows.length} {rows.length === 1 ? "Item" : "Items"}
              </span>
              <motion.span key={bump} initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }} className="num text-xl font-extrabold">
                Total {formatRs(total)}
              </motion.span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function AnalyticsPreview() {
  const cats = [
    { n: "Bills", v: 10700, c: "#7A66C4" },
    { n: "Grocery", v: 6830, c: "#087F5B" },
    { n: "Meat", v: 4150, c: "#C4524E" },
    { n: "Dairy", v: 3690, c: "#4A86C8" },
    { n: "Transport", v: 2750, c: "#2A9D96" },
    { n: "Others", v: 4330, c: "#F4A340" },
  ];
  const total = cats.reduce((s, c) => s + c.v, 0);
  let acc = 0;
  const R = 52, C = 2 * Math.PI * R;
  const trend = [22, 26, 24, 30, 27, 33, 29, 35, 32, 38];
  const pts = trend.map((v, i) => [i * 30 + 6, 96 - v * 2] as [number, number]);
  return (
    <section className="border-y border-line bg-surface py-20 lg:py-28" aria-labelledby="ap-h">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead eyebrow="Analytics" title="Pata chalay paisa kahan gaya." desc="Category breakdown, rozana ka trend aur mahine ka muqabla — sab ek nazar mein." />
        <div className="mt-14 grid gap-4 lg:grid-cols-5">
          <motion.div {...inView} className="card p-6 lg:col-span-2">
            <p className="font-bold text-ink">Category Breakdown</p>
            <p className="text-sm text-ink-muted">September 2026</p>
            <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
              <svg viewBox="0 0 140 140" className="h-40 w-40 shrink-0 -rotate-90" role="img" aria-label="Donut chart of spending by category">
                {cats.map((c) => {
                  const len = (c.v / total) * C;
                  const el = <circle key={c.n} cx="70" cy="70" r={R} fill="none" stroke={c.c} strokeWidth="18" strokeDasharray={`${Math.max(0, len - 3)} ${C}`} strokeDashoffset={-acc} />;
                  acc += len;
                  return el;
                })}
              </svg>
              <ul className="w-full space-y-2">
                {cats.map((c) => (
                  <li key={c.n} className="flex items-center gap-2.5 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.c }} aria-hidden />
                    <span className="flex-1 text-ink">{c.n}</span>
                    <span className="num font-semibold text-ink">{Math.round((c.v / total) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
          <motion.div {...inView} className="card p-6 lg:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-ink">Spending Trend</p>
                <p className="text-sm text-ink-muted">Pichlay 10 hafte</p>
              </div>
              <div className="flex gap-1 rounded-xl bg-surface-2 p-1 text-[13px] font-semibold" aria-hidden>
                <span className="rounded-lg px-3 py-1 text-ink-muted">Daily</span>
                <span className="rounded-lg bg-surface px-3 py-1 text-ink shadow-card">Weekly</span>
                <span className="rounded-lg px-3 py-1 text-ink-muted">Monthly</span>
              </div>
            </div>
            <svg viewBox="0 0 282 100" className="mt-6 h-48 w-full" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="apFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="rgb(var(--brand))" stopOpacity=".22" />
                  <stop offset="1" stopColor="rgb(var(--brand))" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[25, 50, 75].map((y) => (
                <line key={y} x1="0" x2="282" y1={y} y2={y} stroke="rgb(var(--line))" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
              ))}
              <path d={`${smoothPath(pts)} L276,100 L6,100 Z`} fill="url(#apFill)" />
              <path d={smoothPath(pts)} fill="none" stroke="rgb(var(--brand))" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
              <line x1="0" x2="282" y1="40" y2="40" stroke="rgb(var(--saffron))" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
              {[
                ["Avg / din", "Rs. 1,082"],
                ["Sab se zyada", "Bijli Bill"],
                ["Pichlay mahine se", "−6.2%"],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs text-ink-muted">{l}</p>
                  <p className="num font-bold text-ink">{v}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ReportsPreview() {
  return (
    <section id="reports" className="scroll-mt-20 py-20 lg:py-28" aria-labelledby="rp-h">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <motion.div {...inView} className="relative order-2 lg:order-1">
          <div className="absolute left-6 top-6 h-full w-full rotate-[-3deg] rounded-3xl border border-line bg-surface-2" aria-hidden />
          <article className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-lift">
            <header className="relative bg-brand px-6 py-5 text-white">
              <div className="flex items-center gap-2.5">
                <LogoMark size={28} variant="white" />
                <span className="text-sm font-extrabold tracking-[0.08em]">APNA HISAB KITAAB</span>
              </div>
              <span className="absolute inset-x-0 bottom-0 h-1 bg-saffron" aria-hidden />
            </header>
            <div className="p-6">
              <p className="text-xl font-extrabold text-ink">Monthly Expense Report</p>
              <p className="text-ink-muted">September 2026</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-2 p-3">
                  <p className="text-xs text-ink-muted">Total Items</p>
                  <p className="num text-2xl font-extrabold text-ink">48</p>
                </div>
                <div className="rounded-xl bg-surface-2 p-3">
                  <p className="text-xs text-ink-muted">Total Expense</p>
                  <p className="num text-2xl font-extrabold text-ink">Rs. 32,450</p>
                </div>
              </div>
              <div className="mt-5 space-y-2.5">
                {[
                  ["Bills", 10700, "#7A66C4"],
                  ["Grocery", 6830, "#087F5B"],
                  ["Meat", 4150, "#C4524E"],
                  ["Dairy", 3690, "#4A86C8"],
                ].map(([n, v, c]) => (
                  <div key={n as string} className="flex items-center gap-3 text-sm">
                    <span className="w-16 text-ink">{n}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <span className="block h-full rounded-full" style={{ backgroundColor: c as string, width: `${((v as number) / 10700) * 100}%` }} />
                    </span>
                    <span className="num w-24 shrink-0 text-right font-semibold text-ink">{formatRs(v as number)}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </motion.div>
        <motion.div {...inView} className="order-1 lg:order-2">
          <p className="eyebrow">Reports</p>
          <h2 id="rp-h" className="mt-3 text-[32px] font-extrabold leading-[1.1] text-ink sm:text-[40px] lg:text-[46px]">
            Download Your Hisab.
          </h2>
          <p className="mt-4 max-w-lg text-[17px] text-ink-muted">Hafta, mahina ya apni marzi ki dates — ek click mein saaf suthri report. Ghar walon ko WhatsApp karein ya record ke liye rakh lein.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { i: FileText, l: "PDF", c: "#C4524E" },
              { i: FileSpreadsheet, l: "Excel", c: "#087F5B" },
              { i: FileType2, l: "CSV", c: "#4A86C8" },
            ].map((f) => (
              <div key={f.l} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${f.c}1A`, color: f.c }}>
                  <f.i className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-bold text-ink">{f.l}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const FAQS = [
  ["Kya Apna Hisab Kitaab muft hai?", "Jee haan. Rozana kharchay likhna, automatic totals, categories, analytics aur reports — sab muft hain."],
  ["Kya internet ke baghair chalegi?", "App aap ke phone par install ho jati hai (PWA). Kharchay likhna aur hisab dekhna internet ke baghair bhi kaam karta hai; connection wapas aane par data sync ho jata hai."],
  ["Kya mujhe koi AI ya API key chahiye?", "Bilkul nahi. Quick entry (“Aloo 2kg 240”) aur saari calculations aap ke device par simple rules se hoti hain."],
  ["Phone par kaise install karein?", "Browser mein app kholein, phir Chrome mein “Add to Home screen” ya iPhone Safari mein Share → “Add to Home Screen” dabayein. Icon aap ki home screen par aa jayega."],
  ["Kya mera data mehfooz hai?", "Aap ka hisab sirf aap ka hai. Aap kabhi bhi apna saara data export kar sakte hain ya account delete kar sakte hain."],
  ["Kya ek se zyada log ek hi hisab chala sakte hain?", "Abhi har account alag hai. Ghar walon ke saath shared hisab jald aa raha hai — tab tak reports download kar ke share karein."],
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-20 border-t border-line bg-surface py-20 lg:py-28" aria-labelledby="faq-h">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-h" className="mt-3 text-[32px] font-extrabold leading-[1.1] text-ink sm:text-[40px] lg:text-[46px]">
            Aam sawalaat
          </h2>
          <p className="mt-4 max-w-sm text-[17px] text-ink-muted">Koi aur sawal? Humein support@apnahisab.pk par likhein.</p>
          <p className="urdu mt-6 text-2xl text-brand" lang="ur" dir="rtl">
            اپنا حساب کتاب
          </p>
        </div>
        <div className="divide-y divide-line border-y border-line">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={q}>
                <h3>
                  <button className="flex w-full items-center justify-between gap-4 py-5 text-left text-[17px] font-semibold text-ink" aria-expanded={isOpen} aria-controls={`faq-${i}`} id={`faq-q-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                    {q}
                    <ChevronDown className={cn("h-5 w-5 shrink-0 text-ink-muted transition-transform duration-300", isOpen && "rotate-180 text-brand")} aria-hidden />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
                      <p className="max-w-2xl pb-5 text-[16px] leading-relaxed text-ink-muted">{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  const navigate = useNavigate();
  const { user } = useApp();
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <motion.div {...inView} className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-[#056044] px-6 py-14 text-center text-white sm:px-12 sm:py-20">
        <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} aria-hidden />
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[#087F5B] blur-3xl" aria-hidden />
        <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-[#F4A340]/30 blur-3xl" aria-hidden />
        <div className="relative">
          <LogoMark size={56} variant="white" className="mx-auto" />
          <h2 className="mx-auto mt-6 max-w-2xl text-[34px] font-extrabold leading-[1.08] sm:text-[48px]">Aaj se apna hisab khud sambhalein.</h2>
          <p className="mx-auto mt-4 max-w-xl text-[17px] text-white/80">Write your expense. We'll do the hisab.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={() => navigate(user ? "/dashboard" : "/signup")} className="btn h-[52px] bg-white px-7 text-base text-[#056044] hover:bg-[#FAFAF7]">
              Start Tracking <ArrowRight className="h-5 w-5" aria-hidden />
            </button>
            <Link to="/login" className="btn h-[52px] border border-white/30 px-7 text-base text-white hover:bg-white/10">
              Login
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] pt-14">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[15px] text-ink-muted">Har Kharchay Ka Apna Hisab. Pakistani gharon ke liye bana digital hisab kitaab.</p>
        </div>
        {[
          ["Product", [["Features", "#features"], ["How It Works", "#how"], ["Reports", "#reports"], ["FAQ", "#faq"]]],
          ["App", [["Login", "/login"], ["Sign up", "/signup"], ["Dashboard", "/dashboard"]]],
          ["Company", [["About", "#top"], ["Privacy", "#faq"], ["Contact", "#faq"]]],
        ].map(([h, links]) => (
          <div key={h as string}>
            <p className="text-sm font-semibold text-ink">{h as string}</p>
            <ul className="mt-3 space-y-2">
              {(links as string[][]).map(([l, href]) => (
                <li key={l}>
                  {href.startsWith("/") ? (
                    <Link to={href} className="text-[15px] text-ink-muted hover:text-ink">
                      {l}
                    </Link>
                  ) : (
                    <a href={href} onClick={(e) => { e.preventDefault(); scrollTo(href); }} className="text-[15px] text-ink-muted hover:text-ink">
                      {l}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-line px-4 pt-6 text-sm text-ink-muted sm:flex-row sm:px-6 lg:px-8">
        <p>© 2026 Apna Hisab Kitaab. Made with care in Pakistan.</p>
        <p className="flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4 text-brand" aria-hidden /> Write your expense. We'll do the hisab.
        </p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-xl focus:bg-brand focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <LandingHeader />
      <main id="main">
        <Hero />
        <Features />
        <HowItWorks />
        <ProductPreview />
        <AnalyticsPreview />
        <ReportsPreview />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
