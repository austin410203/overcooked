import type { FxType } from '../game/systems/engine';

let ctx: AudioContext | null = null;
function ac() {
  if (!ctx) {
    const C = window.AudioContext || (window as any).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, slide = 0, delay = 0) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(); const g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}

export function playFx(type: FxType) {
  switch (type) {
    case 'pickup': tone(520, 0.08, 'triangle', 0.08, 200); break;
    case 'place': tone(380, 0.08, 'triangle', 0.08, -80); break;
    case 'serve': tone(660, 0.1, 'square', 0.05); break;
    case 'orderDone': tone(784, 0.12, 'triangle', 0.1); tone(1046, 0.18, 'triangle', 0.1, 0, 0.1); tone(1318, 0.22, 'triangle', 0.08, 0, 0.2); break;
    case 'wrong': tone(200, 0.25, 'sawtooth', 0.07, -80); break;
    case 'fail': tone(300, 0.3, 'square', 0.06, -150); tone(220, 0.35, 'square', 0.05, -100, 0.15); break;
    case 'burn': tone(150, 0.4, 'sawtooth', 0.05, -60); break;
    case 'ding': tone(1200, 0.15, 'sine', 0.08); tone(1600, 0.2, 'sine', 0.06, 0, 0.08); break;
    case 'trash': tone(160, 0.12, 'triangle', 0.08, -60); break;
    case 'order': tone(880, 0.08, 'sine', 0.06); tone(990, 0.1, 'sine', 0.06, 0, 0.09); break;
    case 'warn': tone(440, 0.15, 'square', 0.05); tone(440, 0.15, 'square', 0.05, 0, 0.25); break;
    case 'deny': tone(140, 0.08, 'square', 0.04); break;
  }
}
export function unlockAudio() { ac(); }
