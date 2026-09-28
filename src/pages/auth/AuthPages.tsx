import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, CheckCircle2, Eye, EyeOff, MailCheck, Sparkles } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { Spinner } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/context/AppContext";
import * as api from "@/services/api";
import { cn } from "@/lib/utils";

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex min-h-[100dvh] bg-bg">
      {/* Brand panel */}
      <aside className="relative hidden w-[46%] max-w-[640px] flex-col justify-between overflow-hidden bg-[#056044] p-10 text-white lg:flex" aria-hidden>
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#087F5B] blur-2xl" />
        <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-[#F4A340]/25 blur-3xl" />
        <Link to="/" className="relative">
          <Logo tone="inverse" />
        </Link>
        <div className="relative">
          <p className="text-[40px] font-extrabold leading-[1.1] tracking-tight">
            Kharcha likhein.
            <br />
            <span className="text-[#F4A340]">Hisab hum karein ge.</span>
          </p>
          <p className="mt-4 max-w-md text-[17px] text-white/80">Doodh se bijli bill tak — ghar ka har kharcha ek jagah, total hamesha tayyar.</p>
          {/* mini ledger card */}
          <div className="mt-8 max-w-sm rounded-2xl bg-white/95 p-4 text-[#17211D] shadow-2xl">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Aaj ka Hisab</span>
              <span className="text-[#66736D]">4 items</span>
            </div>
            {[
              ["🥛 Doodh", "180"],
              ["🥔 Aloo", "120"],
              ["🍅 Tamatar", "150"],
              ["🍗 Chicken", "650"],
            ].map(([n, a]) => (
              <div key={n} className="flex justify-between border-b border-[#E4E9E6] py-2 text-[15px] last:border-0">
                <span>{n}</span>
                <span className="num font-semibold">Rs. {a}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between rounded-xl bg-[#E6F4EE] px-3 py-2 font-bold">
              <span>Total</span>
              <span className="num">Rs. 1,100</span>
            </div>
          </div>
        </div>
        <p className="relative text-sm text-white/60">© 2026 Apna Hisab Kitaab · Made in Pakistan</p>
      </aside>

      {/* Form */}
      <main className="relative flex flex-1 flex-col px-5 py-6 sm:px-10">
        <div className="bg-ledger pointer-events-none absolute inset-0 lg:hidden" aria-hidden />
        <div className="relative flex items-center justify-between">
          <Link to="/" className="lg:hidden" aria-label="Apna Hisab Kitaab home">
            <Logo size={32} />
          </Link>
          <Link to="/" className="ml-auto flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Home
          </Link>
        </div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="relative mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          <LogoMark size={44} className="mb-5 hidden lg:block" />
          <h1 className="text-[30px] font-extrabold leading-tight text-ink sm:text-[34px]">{title}</h1>
          <p className="mt-2 text-[16px] text-ink-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </motion.div>
      </main>
    </div>
  );
}

function Field({
  id, label, type = "text", value, onChange, error, valid, autoComplete, placeholder, trailing, hint,
}: {
  id: string;
  label: ReactNode;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  valid?: boolean;
  autoComplete?: string;
  placeholder?: string;
  trailing?: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn("input h-12", error && "input-error", valid && !error && "border-success/60", (!!trailing || !!valid) && "pr-11")}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
        <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center">{trailing ?? (valid && !error ? <CheckCircle2 className="h-5 w-5 text-success" aria-hidden /> : null)}</span>
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-[13px] font-medium text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <div id={`${id}-hint`} className="mt-1.5">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="rounded-md p-1 text-ink-muted hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
      {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  );
}

export function LoginPage() {
  const { setUser } = useApp();
  const navigate = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [busy, setBusy] = useState(false);

  const errs = {
    email: !email ? "Email likhein." : !emailOk(email) ? "Sahi email likhein, jaise ayesha@example.pk" : "",
    password: !password ? "Password likhein." : password.length < 6 ? "Password kam az kam 6 characters ka hai." : "",
  };

  const submit = async (e?: string, p?: string) => {
    setTouched(true);
    setFormErr("");
    const em = e ?? email, pw = p ?? password;
    if (!e && (errs.email || errs.password)) return;
    setBusy(true);
    try {
      const s = await api.login(em, pw, remember);
      setUser(s.user);
      toast.success(`Khush aamdeed, ${s.user.name.split(" ")[0]}!`);
      navigate(loc.state?.from ?? "/dashboard", { replace: true });
    } catch (err) {
      setFormErr((err as Error).message || "Login nahi ho saka.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Apne hisab mein login karein.">
      <form
        className="space-y-4"
        onSubmit={(ev) => {
          ev.preventDefault();
          submit();
        }}
        noValidate
      >
        {formErr && (
          <div className="rounded-xl border border-danger/30 bg-danger/[0.07] px-4 py-3 text-sm font-medium text-ink" role="alert">
            {formErr}
          </div>
        )}
        <Field id="email" label="Email" type="email" value={email} onChange={setEmail} error={touched ? errs.email : ""} valid={touched && !errs.email} autoComplete="email" placeholder="aap@example.pk" />
        <Field
          id="password"
          label={
            <span className="flex items-center justify-between">
              Password
              <Link to="/forgot-password" className="text-sm font-semibold text-brand hover:underline">
                Forgot password?
              </Link>
            </span>
          }
          type={show ? "text" : "password"}
          value={password}
          onChange={setPassword}
          error={touched ? errs.password : ""}
          autoComplete="current-password"
          placeholder="••••••••"
          trailing={<PasswordToggle show={show} onToggle={() => setShow((v) => !v)} />}
        />
        <label className="flex cursor-pointer select-none items-center gap-2.5 text-[15px] text-ink">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-5 w-5 rounded-md border-line accent-[rgb(var(--brand))]" />
          Remember me
        </label>
        <button className="btn-primary h-12 w-full text-base" disabled={busy}>
          {busy ? <Spinner /> : "Login"}
        </button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.1em] text-ink-muted">
        <span className="h-px flex-1 bg-line" /> ya <span className="h-px flex-1 bg-line" />
      </div>
      <button className="btn-secondary h-12 w-full" onClick={() => submit("ayesha@example.pk", "demo1234")} disabled={busy}>
        <Sparkles className="h-4 w-4 text-saffron" aria-hidden /> Demo account se try karein
      </button>
      <p className="mt-8 text-center text-[15px] text-ink-muted">
        Naya account?{" "}
        <Link to="/signup" className="font-semibold text-brand hover:underline">
          Sign up karein
        </Link>
      </p>
    </AuthLayout>
  );
}

function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++;
  return s;
}

export function SignupPage() {
  const { setUser } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState("");
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));

  const errs = {
    name: f.name.trim().length < 2 ? "Apna poora naam likhein." : "",
    email: !emailOk(f.email) ? "Sahi email likhein." : "",
    password: f.password.length < 8 ? "Password kam az kam 8 characters ka ho." : "",
    confirm: !f.confirm ? "Password dobara likhein." : f.confirm !== f.password ? "Dono passwords match nahi karte." : "",
  };
  const st = strength(f.password);
  const stLabel = ["Bohat kamzor", "Kamzor", "Theek", "Mazboot", "Bohat mazboot"][st];
  const stColor = st <= 1 ? "bg-danger" : st === 2 ? "bg-warning" : "bg-success";

  const submit = async () => {
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    setFormErr("");
    try {
      const s = await api.signup(f.name.trim(), f.email.trim(), f.password);
      setUser(s.user);
      toast.success("Account ban gaya!", "Ab apna pehla kharcha add karein.");
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setFormErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Apna hisab shuru karein" subtitle="Muft account banayein — 1 minute se kam lagega.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        {formErr && (
          <div className="rounded-xl border border-danger/30 bg-danger/[0.07] px-4 py-3 text-sm font-medium text-ink" role="alert">
            {formErr}
          </div>
        )}
        <div onBlur={blur("name")}>
          <Field id="name" label="Full Name" value={f.name} onChange={set("name")} error={touched.name ? errs.name : ""} valid={touched.name && !errs.name} autoComplete="name" placeholder="Ayesha Khan" />
        </div>
        <div onBlur={blur("email")}>
          <Field id="su-email" label="Email" type="email" value={f.email} onChange={set("email")} error={touched.email ? errs.email : ""} valid={touched.email && !errs.email} autoComplete="email" placeholder="aap@example.pk" />
        </div>
        <div onBlur={blur("password")}>
          <Field
            id="su-password"
            label="Password"
            type={show ? "text" : "password"}
            value={f.password}
            onChange={set("password")}
            error={touched.password ? errs.password : ""}
            autoComplete="new-password"
            placeholder="Kam az kam 8 characters"
            trailing={<PasswordToggle show={show} onToggle={() => setShow((v) => !v)} />}
            hint={
              f.password ? (
                <div className="flex items-center gap-2" aria-live="polite">
                  <div className="flex flex-1 gap-1" aria-hidden>
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < st ? stColor : "bg-line")} />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-ink-muted">{stLabel}</span>
                </div>
              ) : undefined
            }
          />
        </div>
        <div onBlur={blur("confirm")}>
          <Field id="su-confirm" label="Confirm Password" type={show ? "text" : "password"} value={f.confirm} onChange={set("confirm")} error={touched.confirm ? errs.confirm : ""} valid={!!f.confirm && !errs.confirm} autoComplete="new-password" placeholder="Password dobara" />
        </div>
        <button className="btn-primary h-12 w-full text-base" disabled={busy}>
          {busy ? <Spinner /> : "Create Account"}
        </button>
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-1 text-[13px] text-ink-muted">
          {["Muft", "Koi card nahi chahiye", "Data aap ka"].map((t) => (
            <li key={t} className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-success" aria-hidden /> {t}
            </li>
          ))}
        </ul>
      </form>
      <p className="mt-8 text-center text-[15px] text-ink-muted">
        Pehle se account hai?{" "}
        <Link to="/login" className="font-semibold text-brand hover:underline">
          Login karein
        </Link>
      </p>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const err = !emailOk(email) ? "Sahi email likhein." : "";

  if (sent)
    return (
      <AuthLayout title="Email check karein" subtitle={`Humne ${email} par password reset ka link bhej diya hai.`}>
        <div className="flex flex-col items-center rounded-2xl border border-line bg-surface p-8 text-center">
          <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-brand/20" aria-hidden />
            <MailCheck className="h-8 w-8" aria-hidden />
          </span>
          <p className="mt-4 text-[15px] text-ink-muted">Link 30 minute tak valid hai. Email nahi mili? Spam folder dekhein.</p>
          <button className="btn-secondary mt-5" onClick={() => setSent(false)}>
            Doosri email try karein
          </button>
        </div>
        <Link to="/login" className="btn-primary mt-6 h-12 w-full">
          Back to Login
        </Link>
      </AuthLayout>
    );

  return (
    <AuthLayout title="Password bhool gaye?" subtitle="Apni email likhein, hum reset link bhej denge.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setTouched(true);
          if (err) return;
          setBusy(true);
          await api.requestPasswordReset(email);
          setBusy(false);
          setSent(true);
        }}
        noValidate
      >
        <Field id="fp-email" label="Email" type="email" value={email} onChange={setEmail} error={touched ? err : ""} valid={touched && !err} autoComplete="email" placeholder="aap@example.pk" />
        <button className="btn-primary h-12 w-full text-base" disabled={busy}>
          {busy ? <Spinner /> : "Send Reset Link"}
        </button>
      </form>
      <p className="mt-8 text-center text-[15px] text-ink-muted">
        Yaad aa gaya?{" "}
        <Link to="/login" className="font-semibold text-brand hover:underline">
          Login karein
        </Link>
      </p>
    </AuthLayout>
  );
}

/** Opened from the emailed link: /reset-password?token=… */
export function ResetPasswordPage() {
  const { setUser } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const token = new URLSearchParams(useLocation().search).get("token") ?? "";
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState("");
  const errs = {
    pw: pw.length < 8 ? "Password kam az kam 8 characters ka ho." : "",
    confirm: confirm !== pw ? "Dono passwords match nahi karte." : "",
  };
  if (!token)
    return (
      <AuthLayout title="Link adhoora hai" subtitle="Yeh reset link sahi nahi. Email wala link dobara kholein ya naya link mangwayein.">
        <Link to="/forgot-password" className="btn-primary h-12 w-full">
          Naya link mangwayein
        </Link>
      </AuthLayout>
    );
  return (
    <AuthLayout title="Naya password" subtitle="Apna naya password set karein.">
      <form
        className="space-y-4"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setTouched(true);
          if (errs.pw || errs.confirm) return;
          setBusy(true);
          setFormErr("");
          try {
            const s = await api.resetPassword(token, pw);
            toast.success("Password badal gaya.");
            if (s) {
              setUser(s.user);
              navigate("/dashboard", { replace: true });
            } else navigate("/login", { replace: true });
          } catch (err) {
            setFormErr((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {formErr && (
          <div className="rounded-xl border border-danger/30 bg-danger/[0.07] px-4 py-3 text-sm font-medium text-ink" role="alert">
            {formErr}
          </div>
        )}
        <Field id="rp-pw" label="New password" type="password" value={pw} onChange={setPw} error={touched ? errs.pw : ""} valid={touched && !errs.pw} autoComplete="new-password" />
        <Field id="rp-confirm" label="Confirm password" type="password" value={confirm} onChange={setConfirm} error={touched ? errs.confirm : ""} valid={!!confirm && !errs.confirm} autoComplete="new-password" />
        <button className="btn-primary h-12 w-full text-base" disabled={busy}>
          {busy ? <Spinner /> : "Save Password"}
        </button>
      </form>
    </AuthLayout>
  );
}
