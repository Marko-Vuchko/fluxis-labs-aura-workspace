"use client";

import { useEffect, useRef, useState } from "react";

import { CornerBracket } from "@/features/hud/hud-chrome";
import { useTourUiActive } from "@/features/tour/guided-tour";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

/**
 * One HUD card of keyboard hints. Toggle with `?` after ENTER AURA.
 */
export function KeyboardCheatsheet() {
  const { t } = useLanguage();
  const tourActive = useTourUiActive();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const visible = open && !tourActive;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "?") {
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (isTypingTarget(event.target)) {
        return;
      }
      if (tourActive) {
        return;
      }
      event.preventDefault();
      setOpen((current) => !current);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [tourActive]);

  useFocusTrap({
    active: visible,
    containerRef: panelRef,
    onEscape: () => {
      setOpen(false);
    },
    initialFocusRef: closeRef,
  });

  if (!visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[80] flex items-center justify-center bg-[#05070d]/55 px-4 backdrop-blur-[2px]"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          setOpen(false);
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="aura-shortcuts-title"
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-xl border border-primary/25",
          "bg-[#070b14]/94 p-5 shadow-[0_0_48px_-18px_rgb(34_211_238_/_0.5)]",
          "backdrop-blur-md",
        )}
      >
        <CornerBracket className="top-2 left-2 border-t border-l" />
        <CornerBracket className="top-2 right-2 border-t border-r" />
        <CornerBracket className="bottom-2 left-2 border-b border-l" />
        <CornerBracket className="right-2 bottom-2 border-r border-b" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
              {t("shortcuts.kicker")}
            </p>
            <h2
              id="aura-shortcuts-title"
              className="mt-1 font-sans text-sm font-semibold tracking-tight text-foreground"
            >
              {t("shortcuts.title")}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => {
              setOpen(false);
            }}
            className={cn(
              "rounded-md border border-primary/30 px-2 py-1",
              "font-mono text-[10px] tracking-[0.14em] text-primary uppercase",
              "hover:bg-primary/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
            )}
          >
            {t("shortcuts.close")}
          </button>
        </div>

        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/90">
          <li>
            <span className="font-mono text-[11px] tracking-[0.12em] text-primary uppercase">
              {t("shortcuts.slidersLabel")}
            </span>
            <p className="mt-1 text-muted-foreground">{t("shortcuts.sliders")}</p>
          </li>
          <li>
            <span className="font-mono text-[11px] tracking-[0.12em] text-primary uppercase">
              {t("shortcuts.escapeLabel")}
            </span>
            <p className="mt-1 text-muted-foreground">{t("shortcuts.escape")}</p>
          </li>
          <li>
            <span className="font-mono text-[11px] tracking-[0.12em] text-primary uppercase">
              {t("shortcuts.tourLabel")}
            </span>
            <p className="mt-1 text-muted-foreground">{t("shortcuts.tour")}</p>
          </li>
        </ul>

        <p className="mt-4 font-mono text-[10px] tracking-[0.12em] text-muted-foreground/80">
          {t("shortcuts.toggleHint")}
        </p>
      </div>
    </div>
  );
}
