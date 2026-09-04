// Tiny synthesized UI sound effects — no audio files, no licensing to worry
// about, just short Web Audio blips. One shared AudioContext, created lazily
// on first real user gesture (browsers block audio before that anyway).

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

const SFX_PREF_KEY = "study-buddy-sfx-on";

export function sfxEnabled(): boolean {
  try {
    const v = localStorage.getItem(SFX_PREF_KEY);
    return v === null ? true : v === "true";
  } catch {
    return true;
  }
}

export function setSfxEnabled(on: boolean) {
  try {
    localStorage.setItem(SFX_PREF_KEY, String(on));
  } catch {
    // ignore
  }
}

/** Short blip envelope, tuned per call site. Silent no-op if audio is unavailable/disabled. */
function blip(freq: number, durationMs: number, type: OscillatorType, peakGain: number) {
  if (!sfxEnabled()) return;
  const audioCtx = getCtx();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;

  const now = audioCtx.currentTime;
  const dur = durationMs / 1000;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peakGain, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

/** General-purpose UI click — node select, buttons, sending a message. */
export function playClick() {
  blip(720, 70, "triangle", 0.12);
}

/** A touch brighter/higher — picking a starter prompt or a hopeful action (hint, shield). */
export function playSelect() {
  blip(920, 90, "sine", 0.1);
}

/** Two-note quick rise — a correct/XP-awarding moment. */
export function playSuccess() {
  if (!sfxEnabled()) return;
  const audioCtx = getCtx();
  if (!audioCtx) return;
  blip(660, 90, "triangle", 0.12);
  setTimeout(() => blip(990, 120, "triangle", 0.12), 80);
}

/** Low, short thud — a wrong answer / HP loss moment. */
export function playFail() {
  blip(180, 140, "sawtooth", 0.1);
}
