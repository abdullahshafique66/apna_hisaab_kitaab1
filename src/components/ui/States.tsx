import type { ReactNode } from "react";
import { Plus, RefreshCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small line illustration: an open ledger with an empty row waiting for an entry. */
export function LedgerIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 110" className={className} fill="none" aria-hidden>
      <ellipse cx="80" cy="100" rx="58" ry="6" fill="rgb(var(--brand) / 0.08)" />
      <path d="M22 18c16-6 40-6 58 2v74c-18-8-42-8-58-2V18Z" fill="rgb(var(--surface))" stroke="rgb(var(--line))" strokeWidth="2" />
      <path d="M138 18c-16-6-40-6-58 2v74c18-8 42-8 58-2V18Z" fill="rgb(var(--surface))" stroke="rgb(var(--line))" strokeWidth="2" />
      <path d="M32 34h38M32 46h30M32 58h36M32 70h24" stroke="rgb(var(--brand) / 0.35)" strokeWidth="3" strokeLinecap="round" />
      <path d="M90 34h36M90 46h28" stroke="rgb(var(--brand) / 0.35)" strokeWidth="3" strokeLinecap="round" />
      <path d="M90 60h36" stroke="rgb(var(--saffron))" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 6" />
      <circle cx="128" cy="76" r="11" fill="rgb(var(--saffron))" />
      <path d="M128 71v10M123 76h10" stroke="#17211D" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({
  title, description, action, icon, className, compact,
}: {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: ReactNode };
  icon?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "py-8" : "py-14", className)}>
      {icon ?? <LedgerIllustration className={compact ? "h-20 w-28" : "h-28 w-40"} />}
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[15px] text-ink-muted">{description}</p>}
      {action && (
        <button className="btn-primary mt-5" onClick={action.onClick}>
          {action.icon ?? <Plus className="h-4 w-4" />}
          {action.label}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ onRetry, className, message }: { onRetry?: () => void; className?: string; message?: string }) {
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <WifiOff className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="mt-4 text-lg font-bold text-ink">Kuch ghalat ho gaya.</h3>
      <p className="mt-1 text-[15px] text-ink-muted">{message ?? "Please try again."}</p>
      {onRetry && (
        <button className="btn-secondary mt-5" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function LoadingSkeleton({ variant }: { variant: "dashboard" | "list" | "chart" | "report" | "cards" }) {
  const label = <span className="sr-only">Loading…</span>;
  if (variant === "dashboard")
    return (
      <div role="status" className="space-y-6">
        {label}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card space-y-4 p-4 lg:p-5">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-28" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-6 h-52 w-full" />
          </div>
          <div className="card space-y-4 p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  if (variant === "chart")
    return (
      <div role="status" className="flex h-full min-h-[240px] items-end gap-2 p-2">
        {label}
        {[40, 65, 50, 80, 55, 90, 70, 45, 75, 60].map((h, i) => (
          <div key={i} className="skeleton flex-1 rounded-md" style={{ height: `${h}%` }} aria-hidden />
        ))}
      </div>
    );
  if (variant === "report")
    return (
      <div role="status" className="card space-y-4 p-6">
        {label}
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    );
  if (variant === "cards")
    return (
      <div role="status" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {label}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card flex items-center gap-3 p-4">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  return (
    <div role="status" className="divide-y divide-line">
      {label}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3.5">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
