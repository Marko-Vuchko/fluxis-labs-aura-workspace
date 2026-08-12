let sharedAudioContext: AudioContext | null = null;

/**
 * Create (once) and unlock AudioContext from a user gesture (ENTER AURA).
 * Tones are synthesized later via lib/audio/soundscape.ts - never before unlock.
 */
export function unlockAudioContext(): AudioContext {
  const AudioContextCtor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextCtor) {
    throw new Error("Web Audio API is unavailable in this browser");
  }

  if (!sharedAudioContext || sharedAudioContext.state === "closed") {
    sharedAudioContext = new AudioContextCtor();
  }

  if (sharedAudioContext.state === "suspended") {
    void sharedAudioContext.resume();
  }

  return sharedAudioContext;
}

export function getAudioContext(): AudioContext | null {
  return sharedAudioContext;
}
