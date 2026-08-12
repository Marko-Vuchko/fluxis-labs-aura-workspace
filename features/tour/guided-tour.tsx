"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

export const TOUR_STORAGE_KEY = "aura.tour.completed";
const TOUR_EVENT = "aura-tour-change";

export type TourStepId = "scene" | "controlDeck" | "copilot" | "presets";

type TourStep = {
  id: TourStepId;
  selector: string;
  titleKey:
    | "tour.step1Title"
    | "tour.step2Title"
    | "tour.step3Title"
    | "tour.step4Title";
  bodyKey:
    | "tour.step1Body"
    | "tour.step2Body"
    | "tour.step3Body"
    | "tour.step4Body";
};

const TOUR_STEPS: readonly TourStep[] = [
  {
    id: "scene",
    selector: '[data-tour="scene"]',
    titleKey: "tour.step1Title",
    bodyKey: "tour.step1Body",
  },
  {
    id: "controlDeck",
    selector: '[data-tour="controlDeck"]',
    titleKey: "tour.step2Title",
    bodyKey: "tour.step2Body",
  },
  {
    id: "copilot",
    selector: '[data-tour="copilot"]',
    titleKey: "tour.step3Title",
    bodyKey: "tour.step3Body",
  },
  {
    id: "presets",
    selector: '[data-tour="presets"]',
    titleKey: "tour.step4Title",
    bodyKey: "tour.step4Body",
  },
] as const;

export type GuidedTourProps = {
  /** Must be true only after ENTER AURA and first simulation payload. */
  active: boolean;
};

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function readTourCompleted(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  try {
    return window.localStorage.getItem(TOUR_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeTour(onStoreChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === TOUR_STORAGE_KEY) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(TOUR_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(TOUR_EVENT, onStoreChange);
  };
}

function persistTourCompleted(): void {
  try {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
  } catch {
    // Ignore storage failures; tour simply will not persist.
  }
  window.dispatchEvent(new Event(TOUR_EVENT));
}

function readHighlightRect(selector: string): HighlightRect | null {
  const el = document.querySelector(selector);
  if (!(el instanceof HTMLElement)) {
    return null;
  }
  const box = el.getBoundingClientRect();
  const pad = 10;
  return {
    top: Math.max(8, box.top - pad),
    left: Math.max(8, box.left - pad),
    width: Math.min(window.innerWidth - 16, box.width + pad * 2),
    height: Math.min(window.innerHeight - 16, box.height + pad * 2),
  };
}

/**
 * Four-step spotlight tour. Skippable; remembered in localStorage.
 */
export function GuidedTour({ active }: GuidedTourProps) {
  const { t } = useLanguage();
  const titleId = useId();
  const completed = useSyncExternalStore(
    subscribeTour,
    readTourCompleted,
    () => true,
  );
  const [dismissed, setDismissed] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<HighlightRect | null>(null);

  const open = active && !completed && !dismissed;
  const step = TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0]!;
  const isLast = stepIndex >= TOUR_STEPS.length - 1;

  const closeTour = useCallback(() => {
    persistTourCompleted();
    setDismissed(true);
  }, []);

  const goNext = useCallback(() => {
    if (isLast) {
      closeTour();
      return;
    }
    setStepIndex((current) => current + 1);
  }, [closeTour, isLast]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      setRect(readHighlightRect(step.selector));
    };
    const schedule = () => {
      if (frame !== 0) {
        return;
      }
      frame = window.requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [open, step.selector, stepIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeTour();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closeTour]);

  if (!open) {
    return null;
  }

  const tooltipStyle = (() => {
    if (!rect) {
      return { top: "30%", left: "50%", transform: "translateX(-50%)" } as const;
    }
    const preferBelow = rect.top + rect.height + 180 < window.innerHeight;
    if (preferBelow) {
      return {
        top: rect.top + rect.height + 14,
        left: Math.min(Math.max(16, rect.left), window.innerWidth - 320),
      };
    }
    return {
      top: Math.max(16, rect.top - 170),
      left: Math.min(Math.max(16, rect.left), window.innerWidth - 320),
    };
  })();

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]" aria-live="polite">
      {rect ? (
        <div
          aria-hidden
          className="absolute rounded-xl border border-primary/70"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 9999px rgb(5 7 13 / 0.72)",
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-[#05070d]/72" />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "pointer-events-auto absolute w-[min(20rem,calc(100vw-2rem))]",
          "rounded-xl border border-primary/30 bg-[#070b14]/95 p-4",
          "shadow-[0_0_48px_-16px_rgb(34_211_238_/_0.7)] backdrop-blur-md",
        )}
        style={tooltipStyle}
      >
        <p className="font-mono text-[10px] tracking-[0.2em] text-primary/80 uppercase">
          {t("tour.progress", {
            current: stepIndex + 1,
            total: TOUR_STEPS.length,
          })}
        </p>
        <h2
          id={titleId}
          className="mt-1 font-sans text-sm font-semibold tracking-tight text-foreground"
        >
          {t(step.titleKey)}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t(step.bodyKey)}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={closeTour}
            className="text-muted-foreground"
          >
            {t("tour.skip")}
          </Button>
          <Button type="button" size="sm" onClick={goNext}>
            {isLast ? t("tour.done") : t("tour.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
