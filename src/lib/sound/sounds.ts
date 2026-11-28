/**
 * Board and feedback sounds: small WAV files in public/sounds/, original and CC0
 * (made by scripts/gen-sounds.mjs, a physical model of wood; see public/sounds/README.md).
 *
 * Files are fetched once (preloadSounds) and decoded on the first sound, which always follows a user
 * gesture, so the AudioContext is never created before the browser allows it.
 * Muting is a device preference kept in localStorage and applies to every board.
 */

export type SoundName = "move" | "capture" | "check" | "success" | "error" | "promote";

const NAMES: SoundName[] = ["move", "capture", "check", "success", "error", "promote"];
const SOUND_KEY = "diloul:sound";
/** Overall level: the files peak around -5 dB, played a little lower still. */
const VOLUME = 0.7;

let ctx: AudioContext | null = null;
const raw = new Map<SoundName, Promise<ArrayBuffer | null>>();
const decoded = new Map<SoundName, Promise<AudioBuffer | null>>();

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function fetchRaw(name: SoundName) {
  let p = raw.get(name);
  if (!p) {
    p = fetch(`/sounds/${name}.wav`)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null);
    raw.set(name, p);
  }
  return p;
}

/** Downloads the sound files in the background (call on mount of a board). Nothing is decoded yet. */
export function preloadSounds() {
  if (typeof window === "undefined" || !isSoundOn()) return;
  NAMES.forEach(fetchRaw);
}

function buffer(c: AudioContext, name: SoundName) {
  let p = decoded.get(name);
  if (!p) {
    p = fetchRaw(name).then((bytes) => (bytes ? c.decodeAudioData(bytes.slice(0)).catch(() => null) : null));
    decoded.set(name, p);
  }
  return p;
}

/** Whether sounds are on for this device (default on). */
export function isSoundOn(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

const listeners = new Set<() => void>();

export function setSoundOn(on: boolean) {
  try {
    if (on) localStorage.removeItem(SOUND_KEY);
    else localStorage.setItem(SOUND_KEY, "off");
  } catch {}
  if (on) preloadSounds();
  listeners.forEach((fn) => fn());
}

/** For useSyncExternalStore: re-render when sounds are switched on or off. */
export function subscribeSound(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function playSound(name: SoundName) {
  if (!isSoundOn()) return;
  const c = audio();
  if (!c) return;
  const asked = performance.now();
  void buffer(c, name).then((buf) => {
    // The very first sound may wait for decoding; if that took too long, skip it rather than play late.
    if (!buf || performance.now() - asked > 250) return;
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.value = VOLUME;
    src.connect(g).connect(c.destination);
    src.start();
  });
}

/** Short vibration on supported phones (wrong move). */
export function buzz(ms = 70) {
  try {
    navigator.vibrate?.(ms);
  } catch {}
}
