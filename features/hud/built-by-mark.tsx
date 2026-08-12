"use client";

import Link from "next/link";

import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

type BuiltByMarkProps = {
  className?: string;
  /** Compact single-line mark for tight mobile headers. */
  compact?: boolean;
};

/**
 * Persistent brand + About anchor in the main HUD.
 * Keeps Aura Workspace visible after boot (not only the tiny "Built by" line).
 */
export function BuiltByMark({ className, compact = false }: BuiltByMarkProps) {
  const { t } = useLanguage();

  return (
    <Link
      href="/about"
      aria-label={`${t("brand.name")} - ${t("brand.builtBy")}`}
      className={cn(
        "pointer-events-auto group block min-w-0 text-left",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        className,
      )}
    >
      <span
        className={cn(
          "block truncate font-sans font-semibold tracking-[0.14em] text-primary uppercase",
          compact ? "text-[10px]" : "text-[11px] sm:text-xs",
          "group-hover:text-primary/90",
        )}
      >
        {t("brand.name")}
      </span>
      <span
        className={cn(
          "block truncate font-mono tracking-wide text-muted-foreground/85",
          compact ? "text-[9px]" : "text-[10px]",
          "group-hover:text-muted-foreground",
        )}
      >
        {t("brand.builtBy")}
      </span>
    </Link>
  );
}
