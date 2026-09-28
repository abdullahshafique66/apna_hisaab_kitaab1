import { useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Database, Download, KeyRound, LogOut, Monitor, Moon, Palette, RotateCcw, Sun, Trash2, User, Wallet, WifiOff, Eraser } from "lucide-react";
import type { DateFormatPref, ThemePref } from "@/types";
import { PageHeader, Avatar } from "@/components/layout/AppLayout";
import { BudgetEditor } from "./BudgetPage";
import { ConfirmDialog, Spinner } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/context/AppContext";
import { useInstallPrompt, useQuery } from "@/hooks";
import * as api from "@/services/api";
import { downloadBlob } from "@/services/exporters";
import { cn, formatDate, todayISO } from "@/lib/utils";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Preferences", icon: Palette },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "security", label: "Security", icon: KeyRound },
  { id: "data", label: "Data", icon: Database },
];

function Section({ id, title, desc, icon: Icon, children }: { id: string; title: string; desc: string; icon: typeof User; children: ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-24 p-5 sm:p-6" aria-labelledby={`${id}-h`}>
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 id={`${id}-h`} className="text-lg font-bold text-ink">
            {title}
          </h2>
          <p className="text-sm text-ink-muted">{desc}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { user, setUser, prefs, setPrefs, signOut } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwErr, setPwErr] = useState<string>("");
  const [savingPw, setSavingPw] = useState(false);
  const [confirm, setConfirm] = useState<null | "delete" | "clear" | "reset">(null);
  const [busy, setBusy] = useState(false);
  const [simFail, setSimFail] = useState(api.getSimulateFailure());
  const budget = useQuery(() => api.getBudget(), []);
  const pwa = useInstallPrompt();

  const saveProfile = async () => {
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Profile save nahi hua.", "Naam aur sahi email likhein.");
      return;
    }
    setSavingProfile(true);
    try {
      const u = await api.updateProfile({ name: name.trim(), email: email.trim() });
      setUser(u);
      toast.success("Profile updated.");
    } catch (e) {
      toast.error("Profile save nahi hua.", (e as Error).message);
    } finally {
      setSavingProfile(false);
    }
  };

  const onAvatar = (f?: File) => {
    if (!f) return;
    if (f.size > 2_000_000) return toast.error("Tasveer bohat bari hai.", "2 MB se chhoti tasveer chunein.");
    const r = new FileReader();
    r.onload = async () => {
      // Downscale to 160px so the stored image stays small
      const img = new Image();
      img.onload = async () => {
        const c = document.createElement("canvas");
        const s = 160;
        c.width = c.height = s;
        const ctx = c.getContext("2d")!;
        const m = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
        const u = await api.updateProfile({ avatar_url: c.toDataURL("image/jpeg", 0.85) });
        setUser(u);
        toast.success("Profile picture updated.");
      };
      img.src = r.result as string;
    };
    r.readAsDataURL(f);
  };

  const changePw = async () => {
    if (pw.next.length < 8) return setPwErr("Naya password kam az kam 8 characters ka ho.");
    if (pw.next !== pw.confirm) return setPwErr("Dono passwords match nahi karte.");
    setSavingPw(true);
    try {
      await api.changePassword(pw.current, pw.next);
      setPw({ current: "", next: "", confirm: "" });
      setPwErr("");
      toast.success("Password changed.");
    } catch (e) {
      setPwErr((e as Error).message);
    } finally {
      setSavingPw(false);
    }
  };

  const exportData = async () => {
    try {
      const data = await api.exportAllData();
      const saved = await downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `apna-hisab-data-${todayISO()}.json`);
      if (saved) toast.success("Data export ready.", `${data.expenses.length} expenses`);
    } catch (e) {
      toast.error("Export nahi hua.", (e as Error).message);
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Profile, preferences aur data." />
      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="-mx-4 flex gap-1 overflow-x-auto px-4 scrollbar-none lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:self-start lg:px-0">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-2 hover:text-ink">
              <s.icon className="h-4 w-4" aria-hidden /> {s.label}
            </a>
          ))}
        </nav>

        <div className="space-y-5">
          <Section id="profile" title="Profile" desc="Aap ka naam, email aur tasveer." icon={User}>
            <div className="mb-5 flex items-center gap-4">
              <div className="relative">
                <Avatar name={user?.name ?? "?"} size={72} src={user?.avatar_url} />
                <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-brand text-white" aria-label="Change profile picture">
                  <Camera className="h-4 w-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => onAvatar(e.target.files?.[0])} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-ink">{user?.name}</p>
                <p className="text-sm text-ink-muted">Member since {user ? formatDate(user.created_at.slice(0, 10)) : ""}</p>
                {user?.avatar_url && (
                  <button className="mt-1 text-sm font-semibold text-danger hover:underline" onClick={async () => setUser(await api.updateProfile({ avatar_url: null }))}>
                    Remove picture
                  </button>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="set-name" className="label">
                  Name
                </label>
                <input id="set-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </div>
              <div>
                <label htmlFor="set-email" className="label">
                  Email
                </label>
                <input id="set-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
            </div>
            <button className="btn-primary mt-4" onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? <Spinner /> : "Save Profile"}
            </button>
          </Section>

          <Section id="preferences" title="Preferences" desc="Currency, theme aur date format." icon={Palette}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="set-cur" className="label">
                  Currency
                </label>
                <select id="set-cur" className="input" value="PKR" onChange={() => undefined}>
                  <option value="PKR">Pakistani Rupee (Rs.)</option>
                </select>
              </div>
              <div>
                <label htmlFor="set-df" className="label">
                  Date format
                </label>
                <select id="set-df" className="input" value={prefs.date_format} onChange={(e) => setPrefs({ date_format: e.target.value as DateFormatPref })}>
                  <option value="dd MMM yyyy">28 Sep 2026</option>
                  <option value="dd/MM/yyyy">28/09/2026</option>
                  <option value="yyyy-MM-dd">2026-09-28</option>
                </select>
              </div>
              <fieldset className="sm:col-span-2">
                <legend className="label">Theme</legend>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { v: "light", l: "Light", i: Sun },
                      { v: "dark", l: "Dark", i: Moon },
                      { v: "system", l: "System", i: Monitor },
                    ] as { v: ThemePref; l: string; i: typeof Sun }[]
                  ).map((t) => (
                    <button
                      key={t.v}
                      type="button"
                      aria-pressed={prefs.theme === t.v}
                      onClick={() => setPrefs({ theme: t.v })}
                      className={cn("flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition", prefs.theme === t.v ? "border-brand bg-brand-soft text-brand" : "border-line text-ink hover:border-brand/40")}
                    >
                      <t.i className="h-4 w-4" aria-hidden /> {t.l}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-2 p-4 sm:col-span-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">Phone par install karein</p>
                  <p className="text-sm text-ink-muted">
                    {pwa.canInstall
                      ? "App ko home screen par rakhein — bilkul asli app ki tarah khulegi."
                      : pwa.showIOSHint
                        ? "Safari mein Share button, phir “Add to Home Screen” dabayein."
                        : "Chrome menu (⋮) mein “Install app” ya “Add to Home screen” chunein."}
                  </p>
                </div>
                {pwa.canInstall && (
                  <button className="btn-primary" onClick={async () => (await pwa.install()) && toast.success("App install ho gayi!")}>
                    <Download className="h-4 w-4" aria-hidden /> Install App
                  </button>
                )}
              </div>
            </div>
          </Section>

          <Section id="budget" title="Budget" desc="Is mahine ka budget." icon={Wallet}>
            <BudgetEditor current={budget.data?.amount} />
          </Section>

          <Section id="security" title="Security" desc="Password badlein ya logout karein." icon={KeyRound}>
            <form
              className="grid gap-4 sm:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                changePw();
              }}
              noValidate
            >
              {(
                [
                  ["current", "Current password", "current-password"],
                  ["next", "New password", "new-password"],
                  ["confirm", "Confirm new password", "new-password"],
                ] as const
              ).map(([k, l, ac]) => (
                <div key={k}>
                  <label htmlFor={`pw-${k}`} className="label">
                    {l}
                  </label>
                  <input id={`pw-${k}`} type="password" autoComplete={ac} className={cn("input", pwErr && "input-error")} value={pw[k]} onChange={(e) => { setPw((p) => ({ ...p, [k]: e.target.value })); setPwErr(""); }} />
                </div>
              ))}
              {pwErr && (
                <p className="text-sm font-medium text-danger sm:col-span-3" role="alert">
                  {pwErr}
                </p>
              )}
              <div className="flex flex-wrap gap-2 sm:col-span-3">
                <button className="btn-primary" disabled={savingPw || !pw.current}>
                  {savingPw ? <Spinner /> : "Change Password"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    signOut();
                    navigate("/login");
                  }}
                >
                  <LogOut className="h-4 w-4" aria-hidden /> Logout
                </button>
              </div>
            </form>
          </Section>

          <Section id="data" title="Data" desc="Apna data export karein ya account delete karein." icon={Database}>
            <ul className="divide-y divide-line">
              <Row title="Export data" desc="Saare kharchay, categories aur budget JSON file mein." action={<button className="btn-secondary" onClick={exportData}><Download className="h-4 w-4" aria-hidden /> Export</button>} />
              {!api.isLiveBackend && user?.email === "ayesha@example.pk" && <Row title="Demo data reset" desc="Sample Pakistani household data wapas le aayein." action={<button className="btn-secondary" onClick={() => setConfirm("reset")}><RotateCcw className="h-4 w-4" aria-hidden /> Reset</button>} />}
              <Row title="Saare kharchay clear karein" desc="Empty states dekhne ke liye — categories aur budget rahenge." action={<button className="btn-secondary" onClick={() => setConfirm("clear")}><Eraser className="h-4 w-4" aria-hidden /> Clear</button>} />
              {!api.isLiveBackend && <Row
                title="Connection error simulate karein"
                desc="Testing ke liye: har screen ka error state dekhein."
                action={
                  <button
                    role="switch"
                    aria-checked={simFail}
                    aria-label="Simulate connection error"
                    onClick={() => {
                      api.setSimulateFailure(!simFail);
                      setSimFail(!simFail);
                    }}
                    className={cn("relative h-7 w-12 shrink-0 rounded-full transition", simFail ? "bg-danger" : "bg-line")}
                  >
                    <span className={cn("absolute top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-all", simFail ? "left-6" : "left-1")}>{simFail && <WifiOff className="h-3 w-3 text-danger" />}</span>
                  </button>
                }
              />}
              <Row title="Delete account" desc="Aap ka saara data hamesha ke liye delete ho jayega." danger action={<button className="btn-danger" onClick={() => setConfirm("delete")}><Trash2 className="h-4 w-4" aria-hidden /> Delete</button>} />
            </ul>
          </Section>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        busy={busy}
        title={confirm === "delete" ? "Delete account?" : confirm === "clear" ? "Clear all expenses?" : "Reset demo data?"}
        description={
          confirm === "delete"
            ? "Aap ka account aur saara hisab hamesha ke liye delete ho jayega. Yeh wapas nahi ho sakta."
            : confirm === "clear"
              ? "Saare kharchay delete ho jayenge. Categories aur budget wese hi rahenge."
              : "Aap ke saare changes hat kar sample data wapas aa jayega."
        }
        confirmLabel={confirm === "delete" ? "Delete Account" : confirm === "clear" ? "Clear" : "Reset"}
        onConfirm={async () => {
          setBusy(true);
          try {
            if (confirm === "delete") {
              await api.deleteAccount();
              signOut();
              navigate("/");
              toast.success("Account deleted.");
            } else if (confirm === "clear") {
              await api.clearAllExpenses();
              toast.success("Saare kharchay clear ho gaye.");
            } else {
              await api.resetDemoData();
              toast.success("Demo data reset ho gaya.");
            }
            setConfirm(null);
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}

function Row({ title, desc, action, danger }: { title: string; desc: string; action: ReactNode; danger?: boolean }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold", danger ? "text-danger" : "text-ink")}>{title}</p>
        <p className="text-sm text-ink-muted">{desc}</p>
      </div>
      {action}
    </li>
  );
}
