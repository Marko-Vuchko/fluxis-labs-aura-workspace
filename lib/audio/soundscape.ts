import {
  getAudioContext,
  unlockAudioContext,
} from "@/features/boot/unlock-audio";

/** Must stay in sync with features/hud/sound-toggle.tsx */
const SOUND_STORAGE_KEY = "aura.sound";

/** C major pentatonic across two octaves - every interval stays consonant. */
const PENTATONIC_HZ = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.0, // G4
  440.0, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0, // A5
] as const;

const SLIDER_THROTTLE_MS = 90;
const ALERT_THROTTLE_MS = 420;

let lastSliderToneAt = 0;
let lastAlertToneAt = 0;

export type NodeAlertLevel = "warning" | "critical";

export type HealthBand = "stable" | "warning" | "critical";

export function healthToBand(health: number): HealthBand {
  if (!Number.isFinite(health)) {
    return "stable";
  }
  if (health > 70) {
    return "stable";
  }
  if (health >= 40) {
    return "warning";
  }
  return "critical";
}

function readSoundEnabled(): boolean {
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

function resolveContext(): AudioContext | null {
  if (!readSoundEnabled()) {
    return null;
  }
  const existing = getAudioContext();
  if (existing && existing.state !== "closed") {
    if (existing.state === "suspended") {
      void existing.resume();
    }
    return existing;
  }
  return null;
}

type ToneOptions = {
  frequency: number;
  durationSec?: number;
  type?: OscillatorType;
  peakGain?: number;
  attackSec?: number;
  releaseSec?: number;
  detuneCents?: number;
};

function playVoice(ctx: AudioContext, options: ToneOptions): void {
  const {
    frequency,
    durationSec = 0.14,
    type = "sine",
    peakGain = 0.045,
    attackSec = 0.012,
    releaseSec = 0.11,
    detuneCents = 0,
  } = options;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  if (detuneCents !== 0) {
    osc.detune.setValueAtTime(detuneCents, now);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(
    Math.max(0.0001, peakGain),
    now + attackSec,
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + Math.max(attackSec + 0.02, durationSec),
  );

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + durationSec + releaseSec + 0.02);

  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

function frequencyFromNorm(norm: number): number {
  const t = clamp01(norm);
  const maxIndex = PENTATONIC_HZ.length - 1;
  const index = Math.round(t * maxIndex);
  return PENTATONIC_HZ[index] ?? PENTATONIC_HZ[0]!;
}

/**
 * Soft pentatonic blip whose pitch follows a 0..1 slider position.
 * Throttled so fast dragging cannot stack into cacophony.
 */
export function playSliderTone(normalizedValue: number): void {
  const ctx = resolveContext();
  if (!ctx) {
    return;
  }

  const now = performance.now();
  if (now - lastSliderToneAt < SLIDER_THROTTLE_MS) {
    return;
  }
  lastSliderToneAt = now;

  playVoice(ctx, {
    frequency: frequencyFromNorm(normalizedValue),
    durationSec: 0.11,
    type: "sine",
    peakGain: 0.038,
    attackSec: 0.01,
    releaseSec: 0.09,
  });
}

/**
 * Distinct alert when a node enters warning or critical health.
 */
export function playNodeAlert(level: NodeAlertLevel): void {
  const ctx = resolveContext();
  if (!ctx) {
    return;
  }

  const now = performance.now();
  if (now - lastAlertToneAt < ALERT_THROTTLE_MS) {
    return;
  }
  lastAlertToneAt = now;

  if (level === "warning") {
    playVoice(ctx, {
      frequency: PENTATONIC_HZ[2]!,
      durationSec: 0.16,
      type: "triangle",
      peakGain: 0.05,
      attackSec: 0.008,
      releaseSec: 0.14,
    });
    window.setTimeout(() => {
      const live = resolveContext();
      if (!live) {
        return;
      }
      playVoice(live, {
        frequency: PENTATONIC_HZ[4]!,
        durationSec: 0.18,
        type: "sine",
        peakGain: 0.042,
        attackSec: 0.01,
        releaseSec: 0.16,
      });
    }, 90);
    return;
  }

  playVoice(ctx, {
    frequency: PENTATONIC_HZ[0]!,
    durationSec: 0.2,
    type: "sawtooth",
    peakGain: 0.028,
    attackSec: 0.006,
    releaseSec: 0.18,
  });
  window.setTimeout(() => {
    const live = resolveContext();
    if (!live) {
      return;
    }
    playVoice(live, {
      frequency: PENTATONIC_HZ[3]!,
      durationSec: 0.22,
      type: "triangle",
      peakGain: 0.048,
      attackSec: 0.008,
      releaseSec: 0.2,
    });
  }, 70);
  window.setTimeout(() => {
    const live = resolveContext();
    if (!live) {
      return;
    }
    playVoice(live, {
      frequency: PENTATONIC_HZ[5]!,
      durationSec: 0.28,
      type: "sine",
      peakGain: 0.055,
      attackSec: 0.01,
      releaseSec: 0.24,
    });
  }, 150);
}

/**
 * Rising pentatonic climb ending in a low power-up hit.
 * Call only from the ENTER AURA user gesture after unlockAudioContext().
 */
export function playBootSequence(): void {
  if (!readSoundEnabled()) {
    return;
  }

  let ctx: AudioContext;
  try {
    ctx = unlockAudioContext();
  } catch {
    return;
  }

  const climb = PENTATONIC_HZ.slice(0, 6);
  climb.forEach((frequency, index) => {
    window.setTimeout(() => {
      const live = resolveContext();
      if (!live) {
        return;
      }
      playVoice(live, {
        frequency,
        durationSec: 0.12 + index * 0.015,
        type: "sine",
        peakGain: 0.03 + index * 0.006,
        attackSec: 0.02,
        releaseSec: 0.12,
      });
    }, index * 70);
  });

  window.setTimeout(() => {
    const live = resolveContext() ?? ctx;
    if (!readSoundEnabled()) {
      return;
    }
    playPowerUpHit(live);
  }, climb.length * 70 + 40);
}

function playPowerUpHit(ctx: AudioContext): void {
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(110, now);
  osc.frequency.exponentialRampToValueAtTime(48, now + 0.28);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.45);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };

  const sparkle = ctx.createOscillator();
  const sparkleGain = ctx.createGain();
  sparkle.type = "triangle";
  sparkle.frequency.setValueAtTime(PENTATONIC_HZ[7]!, now + 0.02);
  sparkleGain.gain.setValueAtTime(0.0001, now);
  sparkleGain.gain.exponentialRampToValueAtTime(0.05, now + 0.03);
  sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  sparkle.connect(sparkleGain);
  sparkleGain.connect(ctx.destination);
  sparkle.start(now + 0.02);
  sparkle.stop(now + 0.4);
  sparkle.onended = () => {
    sparkle.disconnect();
    sparkleGain.disconnect();
  };
}

/** Exported for tests / diagnostics - never plays audio. */
export function __soundscapeInternals() {
  return {
    PENTATONIC_HZ,
    SLIDER_THROTTLE_MS,
    frequencyFromNorm,
    readSoundEnabled,
  };
}
