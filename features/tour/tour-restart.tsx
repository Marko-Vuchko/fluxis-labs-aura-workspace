"use client";

import { Route } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-provider";

import { restartTour, useTourCompleted } from "./guided-tour";

export type TourRestartProps = {
  className?: string;
  /** Icon button in the desktop header; labeled row inside the mobile overflow menu. */
  variant?: "icon" | "menu-item";
  onActivate?: () => void;
};

/**
 * Header control that clears the tour completion flag so the spotlight walkthrough
 * can run again after Skip / Done.
 */
export function TourRestart({
  className,
  variant = "icon",
  onActivate,
}: TourRestartProps) {
  const { t } = useLanguage();
  const completed = useTourCompleted();

  if (!completed) {
    return null;
  }

  const label = t("tour.restart");

  return (
    <button
      type="button"
      role={variant === "menu-item" ? "menuitem" : undefined}
      aria-label={label}
      title={label}
      onClick={() => {
        restartTour();
        onActivate?.();
      }}
      className={cn(
        variant === "menu-item"
          ? [
              "flex w-full min-h-11 items-center gap-2 rounded-md px-2.5 py-2",
              "text-left font-mono text-[11px] tracking-[0.12em] text-primary/90 uppercase",
              "hover:bg-primary/10 hover:text-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
            ]
          : [
              "inline-flex size-8 items-center justify-center rounded-md border border-primary/25",
              "bg-[#070b14]/70 text-primary/90 backdrop-blur-sm transition-colors",
              "hover:bg-primary/10 hover:text-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
            ],
        className,
      )}
    >
      <Route className="size-4 shrink-0" aria-hidden />
      {variant === "menu-item" ? <span>{label}</span> : null}
    </button>
  );
}
