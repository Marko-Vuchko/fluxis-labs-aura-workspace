"use client";

import Link from "next/link";

import { CornerBracket } from "@/features/hud/hud-chrome";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

/**
 * Branded 404 shell. Lives inside the root layout so EN/SR and HUD chrome apply.
 */
export function NotFoundScreen() {
  const { t } = useLanguage();

  return (
    <div
      className={cn(
        "relative flex min-h-dvh w-full flex-col items-center justify-center",
        "overflow-hidden bg-[#05070d] px-6 py-16 text-foreground",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(34_211_238_/_0.08),transparent_55%)]"
      />

      <div
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-xl border border-primary/25",
          "bg-[#070b14]/92 p-6 shadow-[0_0_48px_-18px_rgb(34_211_238_/_0.45)]",
          "backdrop-blur-md",
        )}
      >
        <CornerBracket className="top-2 left-2 border-t border-l" />
        <CornerBracket className="top-2 right-2 border-t border-r" />
        <CornerBracket className="bottom-2 left-2 border-b border-l" />
        <CornerBracket className="right-2 bottom-2 border-r border-b" />

        <p className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
          {t("ui.notFoundCode")}
        </p>
        <h1 className="mt-2 font-sans text-lg font-semibold tracking-tight text-foreground">
          {t("ui.notFoundTitle")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("ui.notFoundBody")}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/"
            className={cn(
              "inline-flex items-center rounded-md border border-primary/40",
              "bg-primary/10 px-4 py-2 font-mono text-[11px] tracking-[0.14em]",
              "text-primary uppercase transition-colors",
              "hover:bg-primary/20",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            )}
          >
            {t("ui.notFoundHome")}
          </Link>
          <Link
            href="/about"
            className={cn(
              "inline-flex items-center rounded-md border border-primary/25",
              "px-4 py-2 font-mono text-[11px] tracking-[0.14em]",
              "text-primary/90 uppercase transition-colors",
              "hover:border-primary/50 hover:bg-primary/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            )}
          >
            {t("ui.notFoundAbout")}
          </Link>
        </div>
      </div>
    </div>
  );
}
