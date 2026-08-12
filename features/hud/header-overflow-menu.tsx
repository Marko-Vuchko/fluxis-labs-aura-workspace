"use client";

import { EllipsisVertical } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { TourRestart } from "@/features/tour/tour-restart";
import { useTourCompleted } from "@/features/tour/guided-tour";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

export type HeaderOverflowMenuProps = {
  className?: string;
};

/**
 * Mobile header overflow: parks tour restart behind a more-button so EN/SR
 * and sound stay on the primary row.
 */
export function HeaderOverflowMenu({ className }: HeaderOverflowMenuProps) {
  const { t } = useLanguage();
  const completed = useTourCompleted();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!completed) {
    return null;
  }

  const label = t("ui.moreActions");

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title={label}
        onClick={() => {
          setOpen((value) => !value);
        }}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md border border-primary/25",
          "bg-[#070b14]/70 text-primary/90 backdrop-blur-sm transition-colors",
          "hover:bg-primary/10 hover:text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
        )}
      >
        <EllipsisVertical className="size-4" aria-hidden />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute top-full right-0 z-30 mt-1 min-w-[11rem]",
            "rounded-md border border-primary/30 bg-[#070b14]/96 p-1",
            "shadow-[0_0_28px_-14px_rgb(34_211_238_/_0.65)] backdrop-blur-md",
          )}
        >
          <TourRestart
            variant="menu-item"
            onActivate={() => {
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
