"use client";

import { useSyncExternalStore } from "react";

/** Matches Tailwind `lg` - FR-13 narrow layout threshold. */
export const NARROW_VIEWPORT_MAX = 1023;

export type ViewportState = {
  /** True when width is at most 1023 px (below the 1024 lg breakpoint). */
  isNarrow: boolean;
  width: number;
};

function subscribeViewport(onStoreChange: () => void): () => void {
  window.addEventListener("resize", onStoreChange);
  return () => {
    window.removeEventListener("resize", onStoreChange);
  };
}

function getViewportWidth(): number {
  return window.innerWidth;
}

/** Desktop-first SSR snapshot so the primary layout does not flash on wide screens. */
function getServerViewportWidth(): number {
  return 1440;
}

/**
 * Single viewport hook for layout decisions that CSS cannot express alone.
 * Prefer `lg:` / `max-lg:` classes for pure presentation; use this when
 * mounting exclusive trees (one Control Deck, one metrics layout).
 */
export function useViewport(
  narrowMax = NARROW_VIEWPORT_MAX,
): ViewportState {
  const width = useSyncExternalStore(
    subscribeViewport,
    getViewportWidth,
    getServerViewportWidth,
  );

  return {
    isNarrow: width <= narrowMax,
    width,
  };
}
