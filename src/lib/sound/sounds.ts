/**
 * Board and feedback sounds, synthesized with the Web Audio API.
 * Original sounds generated in code: no audio files, so nothing to license (SPEC §17.6).
 * The AudioContext is created lazily on the first sound, which always follows a user gesture.
 */

export type SoundName = "move" | "capture" | "check" | "success" | "error" | "promote";

let ctx: AudioContext | null = null;

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

/** One short tone with a fast attack and an exponential release. */
function tone(c: AudioContext, freq: number, start: number, dur: number, gain: number, type: OscillatorType = "sine") {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/** A soft wooden knock: filtered noise burst. */
function knock(c: AudioContext, start: number, gain: number, cutoff: number) {
  const len = Math.floor(c.sampleRate * 0.06);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(c.destination);
  src.start(start);
}

export function playSound(name: SoundName) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + 0.005;
  switch (name) {
    case "move":
      knock(c, t, 0.9, 1800);
      break;
    case "capture":
      knock(c, t, 1, 1100);
      knock(c, t + 0.045, 0.7, 2200);
      break;
    case "check":
      knock(c, t, 0.8, 1800);
      tone(c, 880, t + 0.02, 0.18, 0.08, "triangle");
      break;
    case "promote":
      tone(c, 660, t, 0.12, 0.08, "triangle");
      tone(c, 990, t + 0.09, 0.2, 0.08, "triangle");
      break;
    case "success":
      tone(c, 523.25, t, 0.16, 0.09, "triangle");
      tone(c, 659.25, t + 0.1, 0.16, 0.09, "triangle");
      tone(c, 783.99, t + 0.2, 0.28, 0.09, "triangle");
      break;
    case "error":
      tone(c, 220, t, 0.16, 0.09, "square");
      tone(c, 185, t + 0.12, 0.22, 0.07, "square");
      break;
  }
}

/** Short vibration on supported phones (wrong move). */
export function buzz(ms = 70) {
  try {
    navigator.vibrate?.(ms);
  } catch {}
}
