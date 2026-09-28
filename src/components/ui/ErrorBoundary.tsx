import { Component, lazy, type ComponentType, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

const RELOAD_KEY = "ahk:chunk-reload";

const isChunkError = (e: unknown) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading chunk|MIME type/i.test(String((e as Error)?.message ?? e));

/**
 * lazy() that survives new deployments: if a page file from an older version is gone,
 * reload once to pick up the new version instead of showing a white screen.
 */
export function lazyWithReload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const mod = await factory();
      try {
        sessionStorage.removeItem(RELOAD_KEY);
      } catch {
        /* ignore */
      }
      return mod;
    } catch (e) {
      let reloaded = false;
      try {
        reloaded = sessionStorage.getItem(RELOAD_KEY) === "1";
        if (!reloaded) sessionStorage.setItem(RELOAD_KEY, "1");
      } catch {
        /* ignore */
      }
      if (!reloaded && isChunkError(e)) {
        window.location.reload();
        return new Promise<{ default: T }>(() => undefined); // keep suspended while reloading
      }
      throw e;
    }
  });
}

/** Catches any crash so the user sees a friendly screen with a Reload button, never a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    // A stale page file after a new deployment: reload once automatically.
    if (isChunkError(error)) {
      try {
        if (sessionStorage.getItem(RELOAD_KEY) !== "1") {
          sessionStorage.setItem(RELOAD_KEY, "1");
          window.location.reload();
        }
      } catch {
        /* ignore */
      }
    }
    console.error(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="flex min-h-[100dvh] flex-col items-center justify-center bg-bg px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <RefreshCw className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-bold text-ink">Kuch ghalat ho gaya.</h1>
        <p className="mt-1 max-w-sm text-[15px] text-ink-muted">App ka naya version aaya hai ya connection mein masla hai. Reload karein.</p>
        <p className="mt-4 max-w-md break-words rounded-xl bg-surface-2 px-3 py-2 font-mono text-xs text-ink-muted">{String(this.state.error?.message || this.state.error)}</p>
        <button
          className="btn-primary mt-6"
          onClick={() => {
            try {
              sessionStorage.removeItem(RELOAD_KEY);
            } catch {
              /* ignore */
            }
            window.location.reload();
          }}
        >
          <RefreshCw className="h-4 w-4" aria-hidden /> Reload
        </button>
      </div>
    );
  }
}
