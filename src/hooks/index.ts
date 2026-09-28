import { useCallback, useEffect, useRef, useState } from "react";
import { onDataChange } from "@/services/api";

export interface QueryState<T> {
  data: T | undefined;
  loading: boolean; // first load (show skeleton)
  refreshing: boolean; // background refetch after a change (keep old data visible)
  error: Error | null;
  retry: () => void;
}

/**
 * Minimal data hook: fetches on mount / when deps change, and silently refetches
 * whenever any mutation happens (so every total everywhere stays in sync automatically).
 */
export function useQuery<T>(fetcher: () => Promise<T>, deps: unknown[] = []): QueryState<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const seq = useRef(0);
  const hasData = useRef(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback((background: boolean) => {
    const id = ++seq.current;
    if (background && hasData.current) setRefreshing(true);
    else setLoading(true);
    fetcherRef
      .current()
      .then((d) => {
        if (id !== seq.current) return;
        hasData.current = true;
        setData(d);
        setError(null);
      })
      .catch((e: Error) => {
        if (id !== seq.current) return;
        setError(e);
      })
      .finally(() => {
        if (id !== seq.current) return;
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => run(hasData.current), deps);
  useEffect(() => onDataChange(() => run(true)), [run]);

  return { data, loading: loading && !hasData.current, refreshing, error, retry: () => run(false) };
}

export function useMediaQuery(q: string) {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const h = () => setM(mq.matches);
    mq.addEventListener("change", h);
    h();
    return () => mq.removeEventListener("change", h);
  }, [q]);
  return m;
}

export function useDebounced<T>(value: T, ms = 150) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Animated count-up for big money numbers. Respects reduced motion. */
export function useCountUp(target: number, duration = 700) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setV(target);
      from.current = target;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(a + (target - a) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

/** Reads resolved theme colors for SVG charts (SVG attributes can't use CSS variables reliably). */
export function useThemeColors() {
  const read = () => {
    const s = getComputedStyle(document.documentElement);
    const rgb = (n: string) => `rgb(${s.getPropertyValue(`--${n}`).trim().split(/\s+/).join(",")})`;
    return {
      brand: rgb("brand"),
      saffron: rgb("saffron"),
      ink: rgb("ink"),
      muted: rgb("ink-muted"),
      line: rgb("line"),
      surface: rgb("surface"),
      bg: rgb("bg"),
      danger: rgb("danger"),
    };
  };
  const [c, setC] = useState(read);
  useEffect(() => {
    const update = () => setC(read());
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", update);
    };
  }, []);
  return c;
}

// ---------- PWA install prompt ----------
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    installListeners.forEach((f) => f());
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installListeners.forEach((f) => f());
  });
}

/** Returns an install() function when the browser allows installing the PWA. */
export function useInstallPrompt() {
  const [available, setAvailable] = useState(!!deferredPrompt);
  useEffect(() => {
    const f = () => setAvailable(!!deferredPrompt);
    installListeners.add(f);
    return () => void installListeners.delete(f);
  }, []);
  const standalone = typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
  const isIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  return {
    canInstall: available && !standalone,
    showIOSHint: isIOS && !standalone,
    install: async () => {
      if (!deferredPrompt) return false;
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      setAvailable(false);
      return outcome === "accepted";
    },
  };
}
