"use client";

import type { SimulationStatus } from "@/features/simulation/types";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

export type StatusBadgeProps = {
  status: SimulationStatus;
  className?: string;
  onRetry?: () => void;
};

/**
 * Non-blocking status chrome: COMPUTING + top progress line while simulating,
 * LINK LOST + STALE when the last payload is retained after a link failure.
 * Scene and controls stay interactive in both cases.
 */
export function StatusBadge({ status, className, onRetry }: StatusBadgeProps) {
  const { t } = useLanguage();
  const computing = status === "simulating" || status === "booting";
  const stale = status === "stale";

  const liveMessage = computing
    ? t("a11y.statusComputing")
    : stale
      ? t("a11y.statusLinkLost")
      : "";

  return (
    <>
      <div
        aria-hidden={!computing}
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden",
          computing ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="absolute inset-0 bg-primary/15" />
        <div
          className={cn(
            "absolute inset-y-0 w-1/3 bg-primary",
            "shadow-[0_0_12px_rgb(34_211_238_/_0.55)]",
            computing && "animate-[aura-progress_1.1s_ease-in-out_infinite]",
          )}
        />
      </div>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cn("flex flex-wrap items-center gap-2", className)}
      >
        <span className="sr-only">{liveMessage}</span>

        {computing ? (
          <span
            aria-hidden
            className={cn(
              "inline-flex items-center rounded-md border border-primary/35",
              "bg-primary/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.16em]",
              "text-primary uppercase",
            )}
          >
            {t("ui.computing")}
          </span>
        ) : null}

        {stale ? (
          <>
            <span
              aria-hidden
              className={cn(
                "inline-flex items-center rounded-md border border-status-critical/40",
                "bg-status-critical/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.16em]",
                "text-status-critical uppercase",
              )}
            >
              {t("ui.linkLost")}
            </span>
            <span
              aria-hidden
              className={cn(
                "inline-flex items-center rounded-md border border-status-warning/40",
                "bg-status-warning/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.16em]",
                "text-status-warning uppercase",
              )}
            >
              {t("ui.stale")}
            </span>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className={cn(
                  "inline-flex items-center rounded-md border border-primary/35",
                  "bg-primary/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.16em]",
                  "text-primary uppercase",
                  "transition-colors hover:border-primary/55 hover:bg-primary/15",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
                )}
              >
                {t("ui.retryConnection")}
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}
