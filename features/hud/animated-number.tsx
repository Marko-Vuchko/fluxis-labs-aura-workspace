"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";

export type AnimatedNumberProps = {
  value: number;
  format: (value: number) => string;
  className?: string;
  durationMs?: number;
};

/**
 * Count-up / count-down of a numeric HUD figure on each new target value.
 * Formatting stays outside so compact / percent / integer styles stay shared.
 */
export function AnimatedNumber({
  value,
  format,
  className,
  durationMs = 550,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const displayRef = useRef(value);

  useEffect(() => {
    if (reduceMotion || !Number.isFinite(value)) {
      fromRef.current = value;
      displayRef.current = value;
      return;
    }

    const from = fromRef.current;
    const controls = animate(from, value, {
      duration: durationMs / 1000,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        displayRef.current = latest;
        setDisplay(latest);
      },
      onComplete: () => {
        fromRef.current = value;
        displayRef.current = value;
        setDisplay(value);
      },
    });

    return () => {
      controls.stop();
      fromRef.current = displayRef.current;
    };
  }, [value, reduceMotion, durationMs]);

  const shown = reduceMotion || !Number.isFinite(value) ? value : display;

  return <span className={className}>{format(shown)}</span>;
}
