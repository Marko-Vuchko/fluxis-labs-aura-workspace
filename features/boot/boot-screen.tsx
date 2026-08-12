"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";
import type { BootAttemptTelemetry } from "@/features/simulation/use-simulation";
import type {
  HealthResponse,
  SimulationStatus,
} from "@/features/simulation/types";

import { buildBootLogLines, computeBootProgress } from "./boot-log";
import { unlockAudioContext } from "./unlock-audio";
import { playBootSequence } from "@/lib/audio/soundscape";

export type BootScreenProps = {
  status: SimulationStatus;
  error: string | null;
  bootAttempt: number;
  bootAttempts: readonly BootAttemptTelemetry[];
  health: HealthResponse | null;
  firstSimReady: boolean;
  onRetry: () => void;
  onEnter: () => void;
};

function CornerBracket({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute h-5 w-5 border-primary/70",
        className,
      )}
    />
  );
}

export function BootScreen({
  status,
  error,
  bootAttempt,
  bootAttempts,
  health,
  firstSimReady,
  onRetry,
  onEnter,
}: BootScreenProps) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const lines = buildBootLogLines(
    {
      attempts: bootAttempts,
      health,
      firstSimReady,
    },
    {
      attempt: t("boot.attempt"),
      responseMs: t("boot.responseMs"),
      engineVersion: t("boot.engineVersion"),
      numpyWarmup: t("boot.numpyWarmup"),
      firstSimReady: t("boot.firstSimReady"),
    },
  );

  const progress = computeBootProgress({
    bootAttempt,
    health,
    firstSimReady,
  });

  const canEnter = status === "ready" && firstSimReady;
  const canRetry = status === "error" || (status === "stale" && !firstSimReady);
  const transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 260, damping: 28 };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [lines.length, reduceMotion]);

  const handleEnter = () => {
    try {
      unlockAudioContext();
      playBootSequence();
    } catch {
      // Audio unlock / boot tones are best-effort; entry must still proceed.
    }
    onEnter();
  };

  return (
    <main className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(34_211_238_/0.08),transparent_55%),linear-gradient(180deg,#05070d_0%,#070b14_55%,#05070d_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgb(34_211_238_/0.15)_1px,transparent_1px),linear-gradient(90deg,rgb(34_211_238_/0.15)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />

      <motion.section
        className="relative z-10 w-full max-w-xl space-y-8 rounded-sm border border-primary/20 bg-card/40 p-6 shadow-[0_0_0_1px_rgb(34_211_238_/0.06)] backdrop-blur-md sm:p-8"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
      >
        <CornerBracket className="top-2 left-2 border-t border-l" />
        <CornerBracket className="top-2 right-2 border-t border-r" />
        <CornerBracket className="bottom-2 left-2 border-b border-l" />
        <CornerBracket className="right-2 bottom-2 border-r border-b" />

        <header className="space-y-3">
          <p className="text-xs tracking-[0.24em] text-primary uppercase">
            {t("brand.name")}
          </p>
          <h1 className="font-sans text-xl font-semibold tracking-tight text-balance sm:text-2xl">
            {t("boot.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {canEnter
              ? t("boot.ready")
              : canRetry
                ? t("boot.failed")
                : t("boot.waiting")}
          </p>
        </header>

        <div className="space-y-2">
          <div className="flex items-center justify-end gap-3 font-mono text-xs text-muted-foreground">
            <span aria-live="polite">{progress}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <motion.div
              className="h-full origin-left rounded-full bg-primary"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 120, damping: 24 }
              }
            />
          </div>
        </div>

        <div
          className="max-h-56 overflow-y-auto rounded-sm border border-border/70 bg-background/50 p-3 font-mono text-xs leading-relaxed text-primary/90"
          aria-live="polite"
          aria-relevant="additions"
        >
          {lines.length === 0 ? (
            <p className="text-muted-foreground">{t("boot.waiting")}</p>
          ) : (
            <ul className="space-y-1">
              <AnimatePresence initial={false}>
                {lines.map((line, index) => (
                  <motion.li
                    key={`${index}-${line}`}
                    initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { duration: 0.22, ease: "easeOut" }
                    }
                  >
                    <span className="text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>{" "}
                    {line}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
          <div ref={logEndRef} />
        </div>

        {error && canRetry ? (
          <p className="font-mono text-xs text-status-critical">{error}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {canEnter ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={transition}
            >
              <Button
                type="button"
                size="lg"
                className="min-w-40 tracking-[0.18em]"
                onClick={handleEnter}
              >
                {t("ui.enterAura")}
              </Button>
            </motion.div>
          ) : null}

          {canRetry ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="min-w-32 tracking-[0.12em]"
              onClick={onRetry}
            >
              {t("ui.retry")}
            </Button>
          ) : null}
        </div>
      </motion.section>
    </main>
  );
}
