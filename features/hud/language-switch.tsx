"use client";

import { useLanguage } from "@/lib/i18n/language-provider";
import type { Locale } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

const OPTIONS: readonly { locale: Locale; label: string }[] = [
  { locale: "en", label: "EN" },
  { locale: "sr", label: "SR" },
];

export type LanguageSwitchProps = {
  className?: string;
};

/**
 * Segmented EN / SR control. Locale persistence lives in LanguageProvider (localStorage).
 */
export function LanguageSwitch({ className }: LanguageSwitchProps) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("ui.language")}
      className={cn(
        "inline-flex overflow-hidden rounded-md border border-primary/25 bg-[#070b14]/70 p-0.5",
        "backdrop-blur-sm",
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const active = locale === option.locale;
        return (
          <button
            key={option.locale}
            type="button"
            aria-pressed={active}
            onClick={() => {
              setLocale(option.locale);
            }}
            className={cn(
              "min-w-9 rounded px-2 py-1 font-mono text-[11px] tracking-[0.12em] transition-colors",
              active
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
