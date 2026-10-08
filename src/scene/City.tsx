import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mat } from './ItemMesh';
import { PAL, cylinder, lowSphere, rbox, sphere, unitBox } from './kit';
import { RING, RING_LENGTH, ringOutline, ringPoint } from './road';

// ---------------------------------------------------------------- helpers
function ringShape(outer: number, inner: number | null) {
  const toShape = (pts: THREE.Vector2[]) => pts.map((p) => new THREE.Vector2(p.x, -p.y));
  const shape = new THREE.Shape(toShape(ringOutline(outer)));
  if (inner !== null) shape.holes.push(new THREE.Path(toShape(ringOutline(inner)).reverse()));
  return shape;
}

/** Instanced boxes placed along the ring (dashes, curb marks, crosswalk stripes…) */
function RingInstances({ items, color, emissive }: { items: { x: number; z: number; y: number; ry: number; sx: number; sy: number; sz: number }[]; color: string; emissive?: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    const o = new THREE.Object3D();
    items.forEach((it, i) => {
      o.position.set(it.x, it.y, it.z); o.rotation.set(0, it.ry, 0); o.scale.set(it.sx, it.sy, it.sz);
      o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[unitBox, undefined, items.length]} receiveShadow>
      <meshStandardMaterial color={color} emissive={emissive ?? '#000'} roughness={0.9} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------- props
export const Tree = memo(function Tree({ x, z, s = 1, tint = 0 }: { x: number; z: number; s?: number; tint?: number }) {
  const leaf = ['#7fae5a', '#8bbb63', '#6f9f50'][tint % 3];
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh geometry={rbox(0.7, 0.3, 0.7, 0.08)} material={mat(PAL.green)} position={[0, 0.15, 0]} castShadow receiveShadow />
      <mesh geometry={rbox(0.6, 0.04, 0.6, 0.02)} material={mat('#7a5a3c')} position={[0, 0.31, 0]} />
      <mesh geometry={cylinder(0.06, 0.09, 0.9, 8)} material={mat('#7a5a3c')} position={[0, 0.75, 0]} castShadow />
      <mesh geometry={lowSphere} material={mat(leaf)} position={[0, 1.45, 0]} scale={[0.62, 0.66, 0.62]} castShadow />
      <mesh geometry={lowSphere} material={mat(leaf)} position={[0.22, 1.25, 0.12]} scale={0.38} castShadow />
      <mesh geometry={lowSphere} material={mat(leaf)} position={[-0.2, 1.3, -0.1]} scale={0.36} castShadow />
    </group>
  );
});

export const Lamp = memo(function Lamp({ x, z, night, ry = 0 }: { x: number; z: number; night: boolean; ry?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <mesh geometry={cylinder(0.12, 0.14, 0.18, 10)} material={mat(PAL.green)} position={[0, 0.09, 0]} />
      <mesh geometry={cylinder(0.04, 0.05, 2.3, 8)} material={mat(PAL.green)} position={[0, 1.25, 0]} castShadow />
      <mesh geometry={rbox(0.5, 0.06, 0.08, 0.02)} material={mat(PAL.green)} position={[0.2, 2.38, 0]} />
      <mesh geometry={rbox(0.24, 0.16, 0.24, 0.05)} material={mat(PAL.green)} position={[0.42, 2.32, 0]} />
      <mesh geometry={sphere} material={mat('#fff3c4', '#ffd27a', night ? 4 : 0.15)} position={[0.42, 2.2, 0]} scale={[0.1, 0.06, 0.1]} />
      {night && <pointLight position={[0.42, 2.0, 0]} color="#ffcf88" intensity={8} distance={6.5} decay={1.6} />}
    </group>
  );
});

function Bench({ x, z, ry }: { x: number; z: number; ry: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <mesh geometry={rbox(1.1, 0.07, 0.36, 0.03)} material={mat('#b97a4a')} position={[0, 0.38, 0]} castShadow />
      <mesh geometry={rbox(1.1, 0.3, 0.06, 0.03)} material={mat('#b97a4a')} position={[0, 0.58, -0.16]} castShadow />
      {[-0.45, 0.45].map((bx) => <mesh key={bx} geometry={rbox(0.06, 0.36, 0.34, 0.02)} material={mat(PAL.green)} position={[bx, 0.18, 0]} />)}
    </group>
  );
}

// ---------------------------------------------------------------- townhouse
interface HouseSpec { x: number; z: number; ry: number; w: number; d: number; floors: number; body: string; trim: string; awning: string; roofBox?: boolean }

const Townhouse = memo(function Townhouse({ h, night }: { h: HouseSpec; night: boolean }) {
  const floorH = 1.15;
  const H = 0.35 + h.floors * floorH;
  const cols = Math.max(2, Math.round(h.w / 1.25));
  const glass = mat(night ? '#ffe2a0' : PAL.glass, night ? '#ffc864' : undefined, night ? 0.9 : 0);
  const glassDark = mat(night ? '#3b3f52' : '#56778c');
  const frame = mat(h.trim);
  const winW = (h.w / cols) * 0.5;
  const front = h.d / 2 + 0.01;
  return (
    <group position={[h.x, 0, h.z]} rotation={[0, h.ry, 0]}>
      {/* plinth + body */}
      <mesh geometry={rbox(h.w + 0.12, 0.3, h.d + 0.12, 0.04)} material={mat(PAL.curb)} position={[0, 0.15, 0]} receiveShadow />
      <mesh geometry={rbox(h.w, H, h.d, 0.08, 2)} material={mat(h.body)} position={[0, H / 2, 0]} castShadow receiveShadow />
      {/* cornice + parapet */}
      <mesh geometry={rbox(h.w + 0.2, 0.16, h.d + 0.2, 0.05)} material={frame} position={[0, H + 0.02, 0]} castShadow />
      <mesh geometry={rbox(h.w - 0.1, 0.06, h.d - 0.1, 0.02)} material={mat('#9aa58c')} position={[0, H + 0.12, 0]} />
      {/* string-course between floors */}
      {Array.from({ length: h.floors - 1 }).map((_, f) => (
        <mesh key={f} geometry={unitBox} material={frame} position={[0, 0.35 + floorH * (f + 1), front]} scale={[h.w, 0.06, 0.04]} />
      ))}
      {/* upper floor windows */}
      {Array.from({ length: h.floors - 1 }).map((_, f) => Array.from({ length: cols }).map((__, c) => {
        const wx = -h.w / 2 + (h.w / cols) * (c + 0.5);
        const wy = 0.35 + floorH * (f + 1) + floorH * 0.5;
        const lit = night && (f * 7 + c * 3 + h.x) % 3 !== 0;
        return (
          <group key={`${f}-${c}`} position={[wx, wy, front]}>
            <mesh geometry={unitBox} material={frame} scale={[winW + 0.12, floorH * 0.62, 0.05]} />
            <mesh geometry={unitBox} material={lit ? glass : glassDark} position={[0, 0, 0.02]} scale={[winW, floorH * 0.5, 0.04]} />
            <mesh geometry={unitBox} material={frame} position={[0, 0, 0.045]} scale={[0.04, floorH * 0.5, 0.01]} />
            <mesh geometry={unitBox} material={frame} position={[0, -floorH * 0.33, 0.08]} scale={[winW + 0.2, 0.05, 0.14]} />
          </group>
        );
      }))}
      {/* ground floor shop window + door */}
      <group position={[0, 0.35 + floorH * 0.45, front]}>
        <mesh geometry={unitBox} material={mat(PAL.green)} scale={[h.w * 0.92, floorH * 0.8, 0.05]} />
        <mesh geometry={unitBox} material={glass} position={[-h.w * 0.12, 0.02, 0.03]} scale={[h.w * 0.5, floorH * 0.55, 0.03]} />
        <mesh geometry={unitBox} material={mat('#5a3d2b')} position={[h.w * 0.3, -0.06, 0.03]} scale={[0.42, floorH * 0.68, 0.03]} />
      </group>
      {/* striped awning */}
      <group position={[0, 0.35 + floorH * 0.95, front + 0.3]} rotation={[0.42, 0, 0]}>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} geometry={unitBox} material={mat(i % 2 ? PAL.white : h.awning)} position={[-h.w * 0.42 + (h.w * 0.84 / 7) * (i + 0.5), 0, 0]} scale={[h.w * 0.84 / 7, 0.05, 0.7]} castShadow />
        ))}
      </group>
      {/* rooftop details */}
      {h.roofBox && <mesh geometry={rbox(0.8, 0.5, 0.7, 0.08)} material={mat('#d9a36b')} position={[h.w * 0.2, H + 0.4, -h.d * 0.15]} castShadow />}
      <mesh geometry={rbox(0.5, 0.3, 0.4, 0.05)} material={mat(PAL.metal)} position={[-h.w * 0.25, H + 0.3, 0]} castShadow />
      {/* side windows */}
      {Array.from({ length: h.floors - 1 }).map((_, f) => (
        <mesh key={f} geometry={unitBox} material={glassDark} position={[h.w / 2 + 0.01, 0.35 + floorH * (f + 1.5), 0]} scale={[0.04, floorH * 0.45, h.d * 0.3]} />
      ))}
    </group>
  );
});

const BODY = ['#e9b77f', '#9fbfc4', '#c97b62', '#e3cf8f', '#a9c09b', '#e8a07a', '#c9b3d6', '#f0c98e'];
const AWN = [PAL.tomato, PAL.green, PAL.mustard, PAL.coral];

function houses(): HouseSpec[] {
  const out: HouseSpec[] = [];
  let k = 0;
  const pick = () => { k++; return { body: BODY[k % BODY.length], trim: PAL.white, awning: AWN[k % AWN.length], roofBox: k % 3 === 0 }; };
  // north row (facing south)
  for (let x = -21; x <= 21; x += 4.3) out.push({ x, z: -15.2, ry: 0, w: 3.9, d: 3, floors: 3 + (k % 2), ...pick() });
  // south row (lower, facing north, closest to camera)
  for (let x = -21; x <= 21; x += 4.6) out.push({ x, z: 18.6, ry: Math.PI, w: 4.1, d: 2.6, floors: 2, ...pick() });
  // west & east columns
  for (let z = -9; z <= 13; z += 4.4) {
    out.push({ x: -21.2, z, ry: Math.PI / 2, w: 3.9, d: 3, floors: 3, ...pick() });
    out.push({ x: 21.2, z, ry: -Math.PI / 2, w: 3.9, d: 3, floors: 3 + (k % 2), ...pick() });
  }
  return out;
}

// ---------------------------------------------------------------- city
export function City({ night, rain }: { night: boolean; rain: boolean }) {
  const W = RING.width;
  const geo = useMemo(() => {
    const road = new THREE.ShapeGeometry(ringShape(W / 2, -W / 2), 1);
    const curbOuter = new THREE.ExtrudeGeometry(ringShape(W / 2 + 0.25, W / 2), { depth: 0.14, bevelEnabled: false, curveSegments: 1 });
    const walkOuter = new THREE.ExtrudeGeometry(ringShape(W / 2 + 1.9, W / 2 + 0.25), { depth: 0.1, bevelEnabled: false, curveSegments: 1 });
    const inner = new THREE.ShapeGeometry(ringShape(-W / 2, null), 1);
    return { road, curbOuter, walkOuter, inner };
  }, [W]);

  const marks = useMemo(() => {
    const dashes = [], yellow = [], cross = [];
    for (let s = 0; s < RING_LENGTH; s += 1.8) {
      const p = ringPoint(s, 0);
      dashes.push({ x: p.x, z: p.z, y: 0.012, ry: p.heading, sx: 0.08, sy: 0.01, sz: 0.8 });
    }
    for (let s = 0; s < RING_LENGTH; s += 2.4) {
      const p = ringPoint(s, W / 2 + 0.12);
      yellow.push({ x: p.x, z: p.z, y: 0.15, ry: p.heading, sx: 0.27, sy: 0.02, sz: 0.5 });
    }
    // crosswalks on the north road and the south road
    for (const [cx, cz] of [[-6, RING.cz - RING.hh], [6, RING.cz - RING.hh], [0, RING.cz + RING.hh]]) {
      for (let i = -3; i <= 3; i++) cross.push({ x: cx + i * 0.42, z: cz, y: 0.013, ry: 0, sx: 0.24, sy: 0.01, sz: W - 0.4 });
    }
    return { dashes, yellow, cross };
  }, [W]);

  const homeList = useMemo(houses, []);
  const outerTrees = useMemo(() => {
    const t: [number, number, number][] = [];
    let i = 0;
    for (let s = 3; s < RING_LENGTH; s += 7.3) { const p = ringPoint(s, W / 2 + 1.15); t.push([p.x, p.z, i++]); }
    return t;
  }, [W]);
  const lamps = useMemo(() => {
    const l: [number, number, number][] = [];
    for (let s = 6.6; s < RING_LENGTH; s += 7.3) { const p = ringPoint(s, W / 2 + 1.0); l.push([p.x, p.z, p.heading + Math.PI]); }
    return l;
  }, [W]);

  const asphalt = night ? PAL.asphaltNight : PAL.asphalt;
  return (
    <group>
      {/* base ground (sidewalk colour) */}
      <mesh geometry={unitBox} position={[0, -0.06, 2]} scale={[70, 0.1, 54]} receiveShadow>
        <meshStandardMaterial color={night ? '#5d5a52' : PAL.sidewalk} roughness={1} />
      </mesh>
      {/* back alleys with grass strips */}
      {[[-12.6, 3], [12.6, 3]].map(([x], i) => (
        <mesh key={i} geometry={unitBox} position={[0, -0.04, x < 0 ? -17.8 : 21.2]} scale={[70, 0.06, 2.2]} receiveShadow>
          <meshStandardMaterial color={night ? '#3f5136' : PAL.grassDark} roughness={1} />
        </mesh>
      ))}
      {/* ring road */}
      <mesh geometry={geo.road} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <meshStandardMaterial color={asphalt} roughness={rain ? 0.3 : 0.95} metalness={rain ? 0.25 : 0} />
      </mesh>
      <mesh geometry={geo.curbOuter} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={PAL.curb} roughness={0.9} />
      </mesh>
      <mesh geometry={geo.walkOuter} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial color={night ? '#8d8676' : '#efe4cb'} roughness={1} />
      </mesh>
      {/* inner block plaza */}
      <mesh geometry={geo.inner} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <meshStandardMaterial color={night ? '#80786a' : '#eadcbf'} roughness={1} />
      </mesh>
      <RingInstances items={marks.dashes} color={PAL.dash} />
      <RingInstances items={marks.yellow} color={PAL.yellowLine} />
      <RingInstances items={marks.cross} color={PAL.dash} />

      {homeList.map((h, i) => <Townhouse key={i} h={h} night={night} />)}
      {outerTrees.map(([x, z, i]) => <Tree key={i} x={x} z={z} s={0.95} tint={i} />)}
      {lamps.map(([x, z, ry], i) => <Lamp key={i} x={x} z={z} night={night} ry={ry} />)}
      <Bench x={-7.5} z={-12.3} ry={0} />
      <Bench x={7.5} z={-12.3} ry={0} />
      <Bench x={-17.6} z={8} ry={Math.PI / 2} />
      <Bench x={17.6} z={-2} ry={-Math.PI / 2} />
    </group>
  );
}
