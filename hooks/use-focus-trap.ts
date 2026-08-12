"use client";

import { useEffect, useEffectEvent, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function isVisible(el: HTMLElement): boolean {
  return el.getClientRects().length > 0;
}

function listFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => isVisible(el));
}

export type UseFocusTrapOptions = {
  active: boolean;
  containerRef: RefObject<HTMLElement | null>;
  /** When true (default), return focus to the previously focused element. */
  restoreFocus?: boolean;
  /** Optional Escape handler; called after preventDefault. */
  onEscape?: () => void;
  /**
   * Prefer this element on activate when it is focusable and inside the
   * container. Falls back to the first focusable child, then the container.
   */
  initialFocusRef?: RefObject<HTMLElement | null>;
};

/**
 * Traps Tab focus inside a dialog-like container while active, and restores
 * focus when the trap deactivates. Escape is optional (caller may handle it).
 */
export function useFocusTrap({
  active,
  containerRef,
  restoreFocus = true,
  onEscape,
  initialFocusRef,
}: UseFocusTrapOptions): void {
  const onEscapeKey = useEffectEvent((event: KeyboardEvent) => {
    if (!onEscape) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onEscape();
  });

  useEffect(() => {
    if (!active) {
      return;
    }

    const root = containerRef.current;
    if (!root) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (!root.hasAttribute("tabindex")) {
      root.tabIndex = -1;
    }

    const focusInitial = () => {
      const preferred = initialFocusRef?.current;
      if (
        preferred &&
        root.contains(preferred) &&
        isVisible(preferred)
      ) {
        preferred.focus();
        return;
      }
      const items = listFocusable(root);
      (items[0] ?? root).focus();
    };

    const frame = window.requestAnimationFrame(focusInitial);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscapeKey(event);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const items = listFocusable(root);
      if (items.length === 0) {
        event.preventDefault();
        root.focus();
        return;
      }

      const first = items[0]!;
      const last = items[items.length - 1]!;
      const focused = document.activeElement;

      if (event.shiftKey) {
        if (focused === first || !root.contains(focused)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (focused === last || !root.contains(focused)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      if (
        restoreFocus &&
        previouslyFocused &&
        previouslyFocused.isConnected
      ) {
        previouslyFocused.focus();
      }
    };
  }, [active, containerRef, initialFocusRef, restoreFocus]);
}
