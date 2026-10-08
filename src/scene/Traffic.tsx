import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CarModel, type CarKind } from './CarModel';
import { RING_LANES, RING_LENGTH, ringPoint } from './road';
import { useGame } from '../store/useGame';

interface AmbientCar { id: number; kind: CarKind; lane: number; s: number; speed: number; cruise: number; len: number }

const KINDS: CarKind[] = ['yellow', 'yellow', 'red', 'blue', 'green', 'van', 'truck', 'bus', 'police', 'yellow', 'blue', 'festival'];
let nextId = 1;
const MAX = 13;

/** Shared pool so drive-thru customers can merge back into city traffic */
export const traffic = {
  cars: [] as AmbientCar[],
  dirty: true,
  add(kind: CarKind, s: number, lane = 0) {
    if (this.cars.length >= MAX) {
      // drop the car farthest from camera (north road) to keep the pool bounded
      let far = 0, fz = Infinity;
      this.cars.forEach((c, i) => { const z = ringPoint(c.s).z; if (z < fz) { fz = z; far = i; } });
      this.cars.splice(far, 1);
    }
    this.cars.push({ id: nextId++, kind, lane, s, speed: 3, cruise: 3.6 + Math.random() * 1.6, len: kind === 'bus' ? 3.6 : 2 });
    this.dirty = true;
  },
  seed() {
    this.cars = [];
    for (let i = 0; i < 10; i++) this.add(KINDS[i % KINDS.length], (RING_LENGTH / 10) * i + Math.random() * 3, i % 2);
  },
};

function AmbientCarView({ car, night }: { car: AmbientCar; night: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = ref.current; if (!g) return;
    const p = ringPoint(car.s, RING_LANES[car.lane]);
    g.position.set(p.x, 0, p.z);
    g.rotation.y = p.heading - Math.PI / 2;
  });
  return <group ref={ref}><CarModel kind={car.kind} night={night} /></group>;
}

export function Traffic() {
  const night = useGame((s) => s.theme === 'night');
  const [, force] = useState(0);
  if (traffic.cars.length === 0) traffic.seed();
  useFrame((_, dtRaw) => {
    const st = useGame.getState();
    const dt = st.paused ? 0 : Math.min(dtRaw, 0.1) * st.speed;
    const jam = st.engine?.jam ?? false;
    for (const c of traffic.cars) {
      // follow the car ahead in the same lane
      let gap = Infinity;
      for (const o of traffic.cars) {
        if (o === c || o.lane !== c.lane) continue;
        let d = o.s - c.s; if (d < 0) d += RING_LENGTH;
        gap = Math.min(gap, d - (o.len + c.len) / 2);
      }
      const target = Math.max(0, Math.min(c.cruise * (jam ? 0.3 : 1), (gap - 0.6) * 1.8));
      c.speed += (target - c.speed) * Math.min(1, dt * 3);
      c.s = (c.s + c.speed * dt) % RING_LENGTH;
    }
    if (traffic.dirty) { traffic.dirty = false; force((n) => n + 1); }
  });
  return <group>{traffic.cars.map((c) => <AmbientCarView key={c.id} car={c} night={night} />)}</group>;
}
