// Generates the board and feedback sounds as small WAV files in public/sounds/.
//
// Original sounds made here from a physical model (damped wood resonances plus a short contact noise),
// so they belong to the project and are released under CC0 1.0 (see public/sounds/README.md).
// We do not use the Lichess sounds: their licence (COPYING.md in lichess-org/lila) lists them as non-free.
//
// Usage: node scripts/gen-sounds.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const RATE = 44100;
const OUT = new URL("../public/sounds/", import.meta.url);

/** Deterministic noise, so the files are identical on every run. */
let seed = 1234567;
const rand = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32) * 2 - 1;

const buffer = (seconds) => new Float32Array(Math.ceil(seconds * RATE));

/** A damped sine resonance (one vibration mode of the wood) starting at `at` seconds. */
function mode(buf, at, freq, tau, amp) {
  const start = Math.floor(at * RATE);
  for (let i = start; i < buf.length; i++) {
    const t = (i - start) / RATE;
    const env = Math.exp(-t / tau) * Math.min(1, t / 0.0004); // 0.4 ms attack: no digital click
    if (env < 1e-5 && t > 0.01) break;
    buf[i] += amp * env * Math.sin(2 * Math.PI * freq * t);
  }
}

/** The contact: a very short noise burst through a band-pass filter. */
function contact(buf, at, center, q, tau, amp) {
  const w0 = (2 * Math.PI * center) / RATE;
  const alpha = Math.sin(w0) / (2 * q);
  const a0 = 1 + alpha;
  const b0 = alpha / a0, b2 = -alpha / a0, a1 = (-2 * Math.cos(w0)) / a0, a2 = (1 - alpha) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const start = Math.floor(at * RATE);
  for (let i = start; i < buf.length; i++) {
    const t = (i - start) / RATE;
    if (t > tau * 12) break;
    const x = rand() * Math.exp(-t / tau);
    const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    buf[i] += amp * y;
  }
}

/** A wooden piece set down on a wooden board: a soft, short "tok". */
function tok(buf, at, { pitch = 1, amp = 1, bright = 1 } = {}) {
  contact(buf, at, 1900 * pitch, 0.8, 0.0009, 0.45 * amp * bright);
  mode(buf, at, 160 * pitch, 0.03, 0.3 * amp); // board body
  mode(buf, at, 480 * pitch, 0.024, 0.6 * amp);
  mode(buf, at, 1120 * pitch, 0.012, 0.22 * amp * bright);
  mode(buf, at, 2080 * pitch, 0.005, 0.07 * amp * bright);
}

/** A soft wooden mallet note (marimba-like: the bar's partials are 1 and ~3.9 times the note). */
function mallet(buf, at, freq, { amp = 1, length = 0.3 } = {}) {
  contact(buf, at, Math.min(freq * 3, 6000), 1.2, 0.0009, 0.25 * amp);
  mode(buf, at, freq, length, 0.6 * amp);
  mode(buf, at, freq * 3.93, length / 5, 0.14 * amp);
  mode(buf, at, freq * 9.2, length / 14, 0.04 * amp);
}

/** Gentle low-pass, then scale to the target peak and fade the tail. */
function finish(buf, peak) {
  let y = 0;
  const k = 1 - Math.exp((-2 * Math.PI * 5000) / RATE);
  for (let i = 0; i < buf.length; i++) buf[i] = y += k * (buf[i] - y);
  const max = buf.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
  const fade = Math.floor(0.012 * RATE);
  for (let i = 0; i < buf.length; i++) {
    const tail = i > buf.length - fade ? (buf.length - i) / fade : 1;
    buf[i] = (buf[i] / max) * peak * tail;
  }
  return buf;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const head = Buffer.alloc(44);
  head.write("RIFF", 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write("WAVEfmt ", 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20); // PCM
  head.writeUInt16LE(1, 22); // mono
  head.writeUInt32LE(RATE, 24);
  head.writeUInt32LE(RATE * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write("data", 36);
  head.writeUInt32LE(data.length, 40);
  return Buffer.concat([head, data]);
}

const sounds = {
  // Normal move: one soft knock.
  move: () => {
    const b = buffer(0.13);
    tok(b, 0);
    return finish(b, 0.55);
  },
  // Capture: the taken piece is knocked, then the piece lands, a bit fuller.
  capture: () => {
    const b = buffer(0.17);
    tok(b, 0, { pitch: 1.25, amp: 0.45, bright: 1.3 });
    tok(b, 0.034, { pitch: 0.92, amp: 1, bright: 1.15 });
    return finish(b, 0.62);
  },
  // Check: the knock plus a short high wooden tick.
  check: () => {
    const b = buffer(0.2);
    tok(b, 0);
    mallet(b, 0.05, 1568, { amp: 0.28, length: 0.06 });
    return finish(b, 0.55);
  },
  // Correct move: two quick rising mallet notes (G5, C6).
  success: () => {
    const b = buffer(0.42);
    mallet(b, 0, 784, { amp: 0.8, length: 0.16 });
    mallet(b, 0.085, 1047, { amp: 1, length: 0.22 });
    return finish(b, 0.4);
  },
  // Wrong move: two low, muted notes going down (E4, C4). Soft, never a buzzer.
  error: () => {
    const b = buffer(0.34);
    mallet(b, 0, 330, { amp: 1, length: 0.09 });
    mallet(b, 0.11, 262, { amp: 0.9, length: 0.12 });
    return finish(b, 0.42);
  },
  // Promotion and stars: three rising notes (C6, E6, G6).
  promote: () => {
    const b = buffer(0.5);
    mallet(b, 0, 1047, { amp: 0.8, length: 0.14 });
    mallet(b, 0.075, 1319, { amp: 0.9, length: 0.16 });
    mallet(b, 0.15, 1568, { amp: 1, length: 0.24 });
    return finish(b, 0.38);
  },
};

mkdirSync(OUT, { recursive: true });
for (const [name, make] of Object.entries(sounds)) {
  const file = new URL(`${name}.wav`, OUT);
  const bytes = wav(make());
  writeFileSync(file, bytes);
  console.log(`${name}.wav  ${(bytes.length / 1024).toFixed(1)} kB`);
}
