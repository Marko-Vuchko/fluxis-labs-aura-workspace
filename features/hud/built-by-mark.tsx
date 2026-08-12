"use client";

import Link from "next/link";

import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

type BuiltByMarkProps = {
  className?: string;
};

/**
 * Discrete portfolio signature in the main HUD. Links to the case study page.
 */
export function BuiltByMark({ className }: BuiltByMarkProps) {
  const { t } = useLanguage();

  return (
    <Link
      href="/about"
      className={cn(
        "pointer-events-auto font-mono text-[10px] tracking-wide text-muted-foreground/80",
        "transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        className,
      )}
    >
      {t("brand.builtBy")}
    </Link>
  );
}
