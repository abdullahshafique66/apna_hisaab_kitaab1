import { cn } from "@/lib/utils";

/**
 * Apna Hisab Kitaab mark.
 * A rounded ledger page (spine on the left, two ruled lines) whose bottom-right corner
 * carries a saffron seal with a check mark — "entry recorded".
 * The ruled lines + vertical stroke on the page read as a stylised "Rs" / ₨ monogram:
 * the spine is the R stem, the top rule curls into the R bowl.
 * Uses currentColor-free explicit fills so it works on any background; `mono` variant for tight spots.
 */
export function LogoMark({ size = 36, className, variant = "color", title }: { size?: number; className?: string; variant?: "color" | "white" | "app"; title?: string }) {
  const page = variant === "white" ? "#FFFFFF" : "#087F5B";
  const ink = variant === "white" ? "#087F5B" : "#FFFFFF";
  const seal = "#F4A340";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {variant === "app" && <rect width="48" height="48" rx="12" fill="#FAFAF7" />}
      <g transform={variant === "app" ? "translate(6 6) scale(.75)" : undefined}>
        {/* page */}
        <path d="M11 4h21a8 8 0 0 1 8 8v13.16A12.5 12.5 0 0 0 25.64 44H11a6 6 0 0 1-6-6V10a6 6 0 0 1 6-6Z" fill={page} />
        {/* spine */}
        <rect x="11" y="4" width="3.2" height="40" fill="#056044" opacity={variant === "white" ? 0.18 : 1} />
        {/* Rs monogram: stem + bowl + leg, drawn as ledger strokes */}
        <path d="M18.5 30V12.5h5.4a4.3 4.3 0 0 1 0 8.6h-5.4m4.6 0 3.3 5.8" fill="none" stroke={ink} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        {/* seal */}
        <circle cx="36" cy="37" r="10" fill={seal} />
        <path d="m31.8 37.2 2.9 2.9 5.6-6" fill="none" stroke="#17211D" strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function Logo({ variant = "full", className, size = 36, tone = "default" }: { variant?: "full" | "compact" | "icon"; className?: string; size?: number; tone?: "default" | "inverse" }) {
  if (variant === "icon") return <LogoMark size={size} className={className} title="Apna Hisab Kitaab" />;
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} variant={tone === "inverse" ? "white" : "color"} />
      {variant === "full" ? (
        <span className={cn("leading-none", tone === "inverse" ? "text-white" : "text-ink")}>
          <span className="block text-[17px] font-extrabold tracking-[-0.02em]">
            Apna Hisab <span className={tone === "inverse" ? "text-saffron" : "text-brand"}>Kitaab</span>
          </span>
        </span>
      ) : (
        <span aria-hidden className={cn("text-lg font-extrabold tracking-[0.04em]", tone === "inverse" ? "text-white" : "text-ink")}>
          AH<span className="text-brand">K</span>
        </span>
      )}
      {variant === "compact" && <span className="sr-only">Apna Hisab Kitaab</span>}
    </span>
  );
}
