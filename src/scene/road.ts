import * as THREE from 'three';
import { LANE_Z } from '../game/data/layouts';

/**
 * Ring road that wraps the whole restaurant block (one-way, two lanes).
 * Travel order: west side southbound → south side eastbound → east side northbound → north side westbound.
 */
export const RING = { cx: 0, cz: 1.5, hw: 14.2, hh: 10.6, r: 4.2, width: 3.4 };
export const RING_LANES = [-0.8, 0.8]; // lateral offsets (negative = inner lane)

interface Sample { x: number; z: number; tx: number; tz: number; s: number }
const samples: Sample[] = [];
let ringLength = 0;

(function build() {
  const { cx, cz, hw, hh, r } = RING;
  const pts: [number, number][] = [];
  const line = (x0: number, z0: number, x1: number, z1: number, n: number) => {
    for (let i = 0; i < n; i++) pts.push([x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n]);
  };
  const arc = (ox: number, oz: number, a0: number, a1: number, n: number) => {
    for (let i = 0; i < n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push([ox + Math.cos(a) * r, oz + Math.sin(a) * r]); }
  };
  // west side heading +z
  line(cx - hw, cz - hh + r, cx - hw, cz + hh - r, 40);
  arc(cx - hw + r, cz + hh - r, Math.PI, Math.PI / 2, 16);           // SW
  line(cx - hw + r, cz + hh, cx + hw - r, cz + hh, 50);               // south heading +x
  arc(cx + hw - r, cz + hh - r, Math.PI / 2, 0, 16);                  // SE
  line(cx + hw, cz + hh - r, cx + hw, cz - hh + r, 40);               // east heading -z
  arc(cx + hw - r, cz - hh + r, 0, -Math.PI / 2, 16);                 // NE
  line(cx + hw - r, cz - hh, cx - hw + r, cz - hh, 50);               // north heading -x
  arc(cx - hw + r, cz - hh + r, -Math.PI / 2, -Math.PI, 16);          // NW
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];
    const [nx, nz] = pts[(i + 1) % pts.length];
    const len = Math.hypot(nx - x, nz - z);
    samples.push({ x, z, tx: (nx - x) / len, tz: (nz - z) / len, s });
    s += len;
  }
  ringLength = s;
})();

export const RING_LENGTH = ringLength;

/** Point on ring at arc length s with lateral offset (positive = outward) */
export function ringPoint(s: number, offset = 0) {
  s = ((s % ringLength) + ringLength) % ringLength;
  let lo = 0, hi = samples.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (samples[m].s <= s) lo = m; else hi = m - 1; }
  const a = samples[lo], b = samples[(lo + 1) % samples.length];
  const segLen = (lo + 1 < samples.length ? b.s : ringLength) - a.s;
  const t = segLen > 0 ? (s - a.s) / segLen : 0;
  const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
  const tx = a.tx, tz = a.tz;
  return { x: x - tz * offset, z: z + tx * offset, heading: Math.atan2(tx, tz) };
}

export function ringNearestS(x: number, z: number) {
  let best = 0, bd = Infinity;
  for (const p of samples) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; best = p.s; } }
  return best;
}

/** Ring outline polyline (for meshes) */
export function ringOutline(offset: number) {
  return samples.map((p) => new THREE.Vector2(p.x - p.tz * offset, p.z + p.tx * offset));
}

// ---------------------------------------------------------------- drive-thru mapping
// Engine works in 1-D lane x from SPAWN_X (-17) to DESPAWN_X (17).
export const ENTRY_X = -10.5;
export const EXIT_X = 10.5;
const INNER = RING.cx - RING.hw - RING_LANES[0]; // west inner lane x (= -13.4)
const EAST_INNER = RING.cx + RING.hw + RING_LANES[0];
const v = new THREE.Vector2();

function bezier(p0: [number, number], p1: [number, number], p2: [number, number], t: number) {
  const u = 1 - t;
  v.set(u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]);
  const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
  const dz = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  return { x: v.x, z: v.y, heading: Math.atan2(dx, dz) };
}

/** Converts an engine lane position into world position + heading */
export function laneToWorld(lane: number, x: number) {
  const lz = LANE_Z(lane);
  if (x < ENTRY_X) {
    const t = Math.max(0, (x + 17) / (ENTRY_X + 17));
    return bezier([INNER, lz - 6.5], [INNER, lz], [ENTRY_X, lz], t);
  }
  if (x > EXIT_X) {
    const t = Math.min(1, (x - EXIT_X) / (17 - EXIT_X));
    return bezier([EXIT_X, lz], [EAST_INNER, lz], [EAST_INNER, lz - 6.5], t);
  }
  return { x, z: lz, heading: Math.PI / 2 };
}

/** Where on the ring an exiting drive-thru car merges back */
export function exitMergeS(lane: number) {
  return ringNearestS(EAST_INNER, LANE_Z(lane) - 6.5);
}
