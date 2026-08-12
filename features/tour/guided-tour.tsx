"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

export const TOUR_STORAGE_KEY = "aura.tour.completed";
const TOUR_EVENT = "aura-tour-change";

/** Mobile Control Deck listens for these to reveal tour targets. */
export const MOBILE_DECK_OPEN_EVENT = "aura-mobile-deck-open";
export const MOBILE_DECK_CLOSE_EVENT = "aura-mobile-deck-close";

/** In-memory flag so Skip still closes the tour if localStorage is unavailable. */
let memoryTourCompleted = false;
/** Bumped on restart so a remounted session begins at step 1. */
let tourSession = 0;
/** True while the guided tour dialog is mounted (focus-trap coordination). */
let tourUiActive = false;

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
  /** When true, open the mobile Control Deck drawer so the target exists in the DOM. */
  requiresMobileDeck?: boolean;
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
    requiresMobileDeck: true,
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
    requiresMobileDeck: true,
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
  if (memoryTourCompleted) {
    return true;
  }
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
  memoryTourCompleted = true;
  try {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
  } catch {
    // Ignore storage failures; memory flag still closes this session.
  }
  window.dispatchEvent(new Event(TOUR_EVENT));
}

/** Clears the completed flag so the guided tour can run again. */
export function restartTour(): void {
  memoryTourCompleted = false;
  tourSession += 1;
  try {
    window.localStorage.removeItem(TOUR_STORAGE_KEY);
  } catch {
    // Ignore storage failures; in-memory listeners still update via event.
  }
  window.dispatchEvent(new Event(TOUR_EVENT));
}

function readTourSession(): number {
  return tourSession;
}

export function useTourCompleted(): boolean {
  return useSyncExternalStore(subscribeTour, readTourCompleted, () => true);
}

/** True while the guided tour UI is on screen (not merely incomplete). */
export function useTourUiActive(): boolean {
  return useSyncExternalStore(
    subscribeTour,
    () => tourUiActive,
    () => false,
  );
}

function useTourSession(): number {
  return useSyncExternalStore(subscribeTour, readTourSession, () => 0);
}

function readHighlightRect(selector: string): HighlightRect | null {
  const el = document.querySelector(selector);
  if (!(el instanceof HTMLElement)) {
    return null;
  }
  const box = el.getBoundingClientRect();
  if (box.width < 2 || box.height < 2) {
    return null;
  }
  const pad = 10;
  return {
    top: Math.max(8, box.top - pad),
    left: Math.max(8, box.left - pad),
    width: Math.min(window.innerWidth - 16, box.width + pad * 2),
    height: Math.min(window.innerHeight - 16, box.height + pad * 2),
  };
}

function syncMobileDeckForStep(step: TourStep): void {
  if (step.requiresMobileDeck) {
    window.dispatchEvent(new Event(MOBILE_DECK_OPEN_EVENT));
  } else {
    window.dispatchEvent(new Event(MOBILE_DECK_CLOSE_EVENT));
  }
}

/**
 * Four-step spotlight tour. Skippable; remembered in localStorage.
 */
export function GuidedTour({ active }: GuidedTourProps) {
  const completed = useTourCompleted();
  const session = useTourSession();
  const open = active && !completed;

  if (!open) {
    return null;
  }

  return <GuidedTourSession key={session} />;
}

function GuidedTourSession() {
  const { t } = useLanguage();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<HighlightRect | null>(null);

  const step = TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0]!;
  const isLast = stepIndex >= TOUR_STEPS.length - 1;

  const closeTour = useCallback(() => {
    window.dispatchEvent(new Event(MOBILE_DECK_CLOSE_EVENT));
    persistTourCompleted();
  }, []);

  const goNext = useCallback(() => {
    if (isLast) {
      closeTour();
      return;
    }
    setStepIndex((current) => current + 1);
  }, [closeTour, isLast]);

  useEffect(() => {
    tourUiActive = true;
    window.dispatchEvent(new Event(TOUR_EVENT));
    return () => {
      tourUiActive = false;
      window.dispatchEvent(new Event(TOUR_EVENT));
    };
  }, []);

  useFocusTrap({
    active: true,
    containerRef: dialogRef,
    onEscape: closeTour,
    initialFocusRef: nextButtonRef,
  });

  useLayoutEffect(() => {
    syncMobileDeckForStep(step);

    let frame = 0;
    let attempts = 0;
    let cancelled = false;
    const maxAttempts = step.requiresMobileDeck ? 45 : 12;

    const update = () => {
      if (cancelled) {
        return;
      }
      frame = 0;
      const target = document.querySelector(step.selector);
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
      const next = readHighlightRect(step.selector);
      if (!next && attempts < maxAttempts) {
        attempts += 1;
        frame = window.requestAnimationFrame(update);
        return;
      }
      setRect(next);
    };

    const schedule = () => {
      if (frame !== 0 || cancelled) {
        return;
      }
      frame = window.requestAnimationFrame(update);
    };

    // Give the mobile drawer spring a beat before measuring deck targets.
    const delayMs = step.requiresMobileDeck ? 280 : 0;
    const delayId = window.setTimeout(schedule, delayMs);

    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    return () => {
      cancelled = true;
      window.clearTimeout(delayId);
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [step, stepIndex]);

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
    <div
      className="pointer-events-none fixed inset-0 z-[80]"
      aria-live="polite"
      data-aura-tour=""
    >
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
        ref={dialogRef}
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
          <Button
            ref={nextButtonRef}
            type="button"
            size="sm"
            onClick={goNext}
          >
            {isLast ? t("tour.done") : t("tour.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
