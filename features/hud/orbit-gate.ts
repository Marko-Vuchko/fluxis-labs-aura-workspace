"use client";

import { useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";

type OrbitLockListener = (locked: boolean) => void;

let lockDepth = 0;
const listeners = new Set<OrbitLockListener>();

function notify(): void {
  const locked = lockDepth > 0;
  for (const listener of listeners) {
    listener(locked);
  }
}

/** Disable OrbitControls while a HUD control is being dragged. */
export function lockOrbitControls(): void {
  lockDepth += 1;
  if (lockDepth === 1) {
    notify();
  }
}

export function unlockOrbitControls(): void {
  if (lockDepth === 0) {
    return;
  }
  lockDepth -= 1;
  if (lockDepth === 0) {
    notify();
  }
}

export function subscribeOrbitLock(listener: OrbitLockListener): () => void {
  listeners.add(listener);
  listener(lockDepth > 0);
  return () => {
    listeners.delete(listener);
  };
}

/** True when OrbitControls should accept pointer input. */
export function useOrbitControlsEnabled(): boolean {
  const [locked, setLocked] = useState(false);

  useEffect(() => subscribeOrbitLock(setLocked), []);

  return !locked;
}

function releaseOnPointerEnd(): void {
  unlockOrbitControls();
  window.removeEventListener("pointerup", releaseOnPointerEnd);
  window.removeEventListener("pointercancel", releaseOnPointerEnd);
}

/**
 * Attach to HUD controls so finger drags do not rotate the scene underneath.
 * Stops propagation and holds an orbit lock until the pointer is released.
 */
export function orbitGuardPointerDown(
  event: ReactPointerEvent<Element>,
): void {
  event.stopPropagation();
  lockOrbitControls();
  window.addEventListener("pointerup", releaseOnPointerEnd);
  window.addEventListener("pointercancel", releaseOnPointerEnd);
}
