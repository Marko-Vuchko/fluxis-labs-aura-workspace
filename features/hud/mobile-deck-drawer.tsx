"use client";

import { ChevronUp } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useState } from "react";

import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

import { ControlDeck, type ControlDeckProps } from "./control-deck";
import { orbitGuardPointerDown } from "./orbit-gate";

export type MobileDeckDrawerProps = ControlDeckProps;

/**
 * Narrow-viewport shell for Control Deck: peeks at the bottom, pulls up over
 * the scene only while open. Reuses the same ControlDeck (no slider fork).
 */
export function MobileDeckDrawer(props: MobileDeckDrawerProps) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion() ?? false;
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <AnimatePresence>
        {open ? (
          <motion.button
            key="backdrop"
            type="button"
            aria-label={t("ui.controlDeckClose")}
            className="pointer-events-auto absolute inset-x-0 bottom-0 h-[100dvh] bg-[#05070D]/55 backdrop-blur-[2px]"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            onClick={() => {
              setOpen(false);
            }}
          />
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-auto relative">
        {!open ? (
          <button
            type="button"
            aria-expanded={false}
            aria-controls={panelId}
            aria-label={t("ui.controlDeckOpen")}
            onPointerDown={orbitGuardPointerDown}
            onClick={() => {
              setOpen(true);
            }}
            className={cn(
              "flex w-full min-h-11 items-center justify-center gap-2",
              "border-t border-primary/25 bg-[#070b14]/92 px-4 py-3",
              "text-[11px] tracking-[0.18em] text-primary/90 uppercase",
              "shadow-[0_-12px_40px_-24px_rgb(34_211_238_/_0.55)] backdrop-blur-md",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
            )}
          >
            <ChevronUp className="size-4 shrink-0" aria-hidden />
            <span id={titleId}>{t("ui.controlDeck")}</span>
          </button>
        ) : null}

        <AnimatePresence>
          {open ? (
            <motion.div
              key="panel"
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={reduceMotion ? false : { y: "100%" }}
              animate={{ y: 0 }}
              exit={reduceMotion ? undefined : { y: "100%" }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 380, damping: 36 }
              }
              className={cn(
                "flex max-h-[min(88dvh,40rem)] flex-col overflow-hidden",
                "rounded-t-2xl border border-b-0 border-primary/25",
                "bg-[#070b14]/96 shadow-[0_-20px_60px_-28px_rgb(34_211_238_/_0.6)]",
                "backdrop-blur-md",
              )}
              onPointerDown={orbitGuardPointerDown}
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-primary/10 px-4 py-2">
                <button
                  type="button"
                  aria-expanded={true}
                  aria-controls={panelId}
                  aria-label={t("ui.controlDeckClose")}
                  onClick={() => {
                    setOpen(false);
                  }}
                  className={cn(
                    "flex min-h-11 min-w-11 flex-1 items-center justify-center gap-2",
                    "rounded-md text-[11px] tracking-[0.18em] text-primary/90 uppercase",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
                  )}
                >
                  <span
                    aria-hidden
                    className="h-1 w-10 rounded-full bg-primary/35"
                  />
                  <span id={titleId} className="sr-only">
                    {t("ui.controlDeck")}
                  </span>
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
                <ControlDeck
                  {...props}
                  className="max-w-none border-0 bg-transparent p-2 shadow-none backdrop-blur-none"
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
