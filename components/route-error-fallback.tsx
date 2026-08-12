"use client";

import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

export type RouteErrorFallbackProps = {
  title: string;
  body: string;
  retryLabel: string;
  onRetry: () => void;
  digest?: string;
  className?: string;
};

/**
 * Shared HUD-styled shell for route-level and global error boundaries.
 * Keeps a crash from rendering as a blank white screen.
 */
export function RouteErrorFallback({
  title,
  body,
  retryLabel,
  onRetry,
  digest,
  className,
}: RouteErrorFallbackProps) {
  const { t } = useLanguage();

  return (
    <div
      role="alert"
      className={cn(
        "relative flex min-h-dvh w-full flex-col items-center justify-center",
        "overflow-hidden bg-[#05070d] px-6 py-16 text-foreground",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(34_211_238_/_0.08),transparent_55%)]"
      />

      <div
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-xl border border-status-critical/35",
          "bg-[#070b14]/92 p-6 shadow-[0_0_48px_-18px_rgb(251_113_133_/_0.55)]",
          "backdrop-blur-md",
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute top-2 left-2 h-3.5 w-3.5 border-t border-l border-status-critical/70"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-2 right-2 h-3.5 w-3.5 border-t border-r border-status-critical/70"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-2 left-2 h-3.5 w-3.5 border-b border-l border-status-critical/70"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-2 bottom-2 h-3.5 w-3.5 border-r border-b border-status-critical/70"
        />

        <p className="font-mono text-[10px] tracking-[0.2em] text-status-critical uppercase">
          {t("ui.panelFault")}
        </p>
        <h1 className="mt-2 font-sans text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
        {digest ? (
          <p className="mt-3 font-mono text-[11px] break-all text-muted-foreground/80">
            {digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            "mt-5 inline-flex items-center rounded-md border border-primary/40",
            "bg-primary/10 px-4 py-2 font-mono text-[11px] tracking-[0.14em]",
            "text-primary uppercase transition-colors",
            "hover:bg-primary/20",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          )}
        >
          {retryLabel}
        </button>
      </div>
    </div>
  );
}
