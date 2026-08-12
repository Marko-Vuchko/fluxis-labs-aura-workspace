"use client";

import { Volume2, VolumeX } from "lucide-react";
import {
  useCallback,
  useSyncExternalStore,
} from "react";

import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

export const SOUND_STORAGE_KEY = "aura.sound";
const SOUND_EVENT = "aura-sound-change";

function readStoredSoundEnabled(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const stored = window.localStorage.getItem(SOUND_STORAGE_KEY);
    if (stored === "0" || stored === "false") {
      return false;
    }
    if (stored === "1" || stored === "true") {
      return true;
    }
  } catch {
    return true;
  }

  return true;
}

function subscribeSound(onStoreChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === SOUND_STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(SOUND_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SOUND_EVENT, onStoreChange);
  };
}

function persistSoundEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // Ignore quota / private mode failures; in-memory listeners still update via event.
  }
  window.dispatchEvent(new Event(SOUND_EVENT));
}

export type SoundToggleProps = {
  className?: string;
};

/**
 * Speaker icon that persists mute preference and drives the Web Audio soundscape.
 */
export function SoundToggle({ className }: SoundToggleProps) {
  const { t } = useLanguage();
  const enabled = useSyncExternalStore(
    subscribeSound,
    readStoredSoundEnabled,
    () => true,
  );

  const toggle = useCallback(() => {
    persistSoundEnabled(!enabled);
  }, [enabled]);

  const label = enabled ? t("ui.soundOn") : t("ui.soundOff");

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={enabled}
      title={label}
      onClick={toggle}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md border border-primary/25",
        "bg-[#070b14]/70 text-primary/90 backdrop-blur-sm transition-colors",
        "hover:bg-primary/10 hover:text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
        !enabled && "text-muted-foreground",
        className,
      )}
    >
      {enabled ? (
        <Volume2 className="size-4" aria-hidden />
      ) : (
        <VolumeX className="size-4" aria-hidden />
      )}
    </button>
  );
}
