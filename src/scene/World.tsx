import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GameEngine } from '../game/systems/engine';
import { BOARD_OFFSET, LANE_Z, SOUTH_WALL_Z, WINDOW_X } from '../game/data/layouts';
import { mat } from './ItemMesh';
import { useGame } from '../store/useGame';
import { City, Tree } from './City';
import { PAL, cylinder, rbox, sphere, unitBox, unitPlane } from './kit';
import { ENTRY_X, RING } from './road';

function signTexture(lines: string[], bg: string, fg: string) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = bg; g.fillRect(0, 0, 512, 256);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 92px "Baloo 2", "Noto Sans TC", sans-serif';
  g.fillText(lines[0], 256, lines[1] ? 100 : 128);
  if (lines[1]) { g.font = '800 54px "Noto Sans TC", "Baloo 2", sans-serif'; g.fillText(lines[1], 256, 196); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Rain({ engine }: { engine: GameEngine }) {
  const N = 1400;
  const { geo, pos } = useMemo(() => {
    const pos = new Float32Array(N * 6);
    for (let i = 0; i < N; i++) {
      const x = (Math.random() - 0.5) * 50, y = Math.random() * 14, z = (Math.random() - 0.5) * 40;
      pos.set([x, y, z, x + 0.05, y - 0.45, z + 0.05], i * 6);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geo, pos };
  }, []);
  const ref = useRef<THREE.LineSegments>(null);
  useFrame((_, dt) => {
    const l = ref.current; if (!l) return;
    l.visible = engine.rainLevel > 0;
    if (!l.visible) return;
    const active = engine.rainLevel === 2 ? N : N / 2;
    l.geometry.setDrawRange(0, active * 2);
    const v = 18 * Math.min(dt, 0.05);
    for (let i = 0; i < active; i++) {
      const o = i * 6;
      pos[o + 1] -= v; pos[o + 4] -= v;
      if (pos[o + 4] < 0) { pos[o + 1] += 14; pos[o + 4] += 14; }
    }
    (l.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });
  return (
    <lineSegments ref={ref} geometry={geo}>
      <lineBasicMaterial color="#a8c8e8" transparent opacity={0.55} />
    </lineSegments>
  );
}


/** Catenary of light bulbs between two posts */
function StringLights({ a, b, night, n = 12 }: { a: [number, number, number]; b: [number, number, number]; night: boolean; n?: number }) {
  const pts = useMemo(() => Array.from({ length: n + 1 }).map((_, i) => {
    const t = i / n;
    return new THREE.Vector3(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * 0.45, a[2] + (b[2] - a[2]) * t);
  }), [a, b, n]);
  const wire = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.012, 4), [pts]);
  return (
    <group>
      <mesh geometry={wire} material={mat(PAL.ink)} />
      {pts.slice(1, -1).map((p, i) => (
        <mesh key={i} geometry={sphere} position={[p.x, p.y - 0.07, p.z]} scale={0.065}
          material={mat('#fff4cf', '#ffcf6b', night ? 3 : 0.35)} />
      ))}
    </group>
  );
}

function Planter({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh geometry={rbox(0.55, 0.45, 0.55, 0.08)} material={mat(PAL.terracottaDark)} position={[0, 0.25, 0]} castShadow />
      <mesh geometry={sphere} material={mat('#6f9f50')} position={[0, 0.65, 0]} scale={[0.32, 0.3, 0.32]} castShadow />
      <mesh geometry={sphere} material={mat('#e86a5a')} position={[0.1, 0.85, 0.1]} scale={0.06} />
    </group>
  );
}

export function World({ engine }: { engine: GameEngine }) {
  const night = useGame((s) => s.theme === 'night');
  const lang = useGame((s) => s.lang);
  const lanes = engine.level.lanes;
  const b = engine.bounds;
  const laneMinZ = SOUTH_WALL_Z + 0.75;
  const laneMaxZ = LANE_Z(lanes - 1) + 0.8;
  const signTex = useMemo(() => signTexture(lang === 'zh' ? ['DRIVE THRU', '得來速'] : ['DRIVE', 'THRU'], '#1f4d3a', '#ffd166'), [lang]);
  const boardTex = useMemo(() => signTexture(['MENU', lang === 'zh' ? '點餐' : 'ORDER HERE'], '#2f3e46', '#fff3d6'), [lang]);
  const W = b.maxX - b.minX + 0.6, D = b.maxZ - b.minZ + 1;
  const cx = (b.maxX + b.minX) / 2, cz = (b.maxZ + b.minZ) / 2 + 0.25;
  const wallH = 1.0;
  const wall = mat(night ? '#c46d4a' : PAL.terracotta);
  const cap = mat(PAL.white);
  const lanesX0 = RING.cx - RING.hw + RING.width / 2 - 0.4;

  const southSegs = useMemo(() => {
    const xs = WINDOW_X.slice(0, lanes).sort((a, c) => a - c);
    const segs: [number, number][] = [];
    let start = b.minX - 0.3;
    for (const x of xs) { segs.push([start, x - 0.55]); start = x + 0.55; }
    segs.push([start, b.maxX + 0.3]);
    return segs;
  }, [lanes, b.minX, b.maxX]);

  const tiles = useMemo(() => {
    const t: [number, number, boolean][] = [];
    for (let x = b.minX - 0.3; x < b.maxX + 0.3 - 0.01; x += 1) for (let z = b.minZ - 0.25; z < b.maxZ + 0.75 - 0.01; z += 1)
      t.push([x + 0.5, z + 0.5, (Math.round(x) + Math.round(z)) % 2 === 0]);
    return t;
  }, [b]);

  return (
    <group>
      <City night={night} rain={engine.rainLevel > 0} />

      {/* drive-thru lanes connect to the ring road on both ends */}
      <mesh geometry={unitBox} position={[0, 0.02, (laneMinZ + laneMaxZ) / 2]} scale={[-lanesX0 * 2, 0.03, laneMaxZ - laneMinZ]} receiveShadow>
        <meshStandardMaterial color={night ? PAL.asphaltNight : PAL.asphalt} roughness={engine.rainLevel ? 0.3 : 0.95} metalness={engine.rainLevel ? 0.2 : 0} />
      </mesh>
      {Array.from({ length: lanes - 1 }).map((_, l) => Array.from({ length: 11 }).map((__, i) => (
        <mesh key={`${l}-${i}`} geometry={unitPlane} rotation={[-Math.PI / 2, 0, 0]} position={[ENTRY_X + i * 2.1, 0.042, (LANE_Z(l) + LANE_Z(l + 1)) / 2]} scale={[1.0, 0.07, 1]}>
          <meshBasicMaterial color={PAL.dash} />
        </mesh>
      )))}
      {/* lane arrows */}
      {Array.from({ length: lanes }).map((_, l) => (
        <mesh key={l} geometry={unitPlane} rotation={[-Math.PI / 2, 0, -Math.PI / 4]} position={[ENTRY_X + 1.2, 0.043, LANE_Z(l)]} scale={[0.35, 0.35, 1]}>
          <meshBasicMaterial color={PAL.yellowLine} />
        </mesh>
      ))}
      {/* curb between lanes and building */}
      <mesh geometry={rbox(-lanesX0 * 2 - 3, 0.12, 0.3, 0.04)} material={mat(PAL.curb)} position={[0, 0.06, laneMinZ - 0.1]} receiveShadow />
      <mesh geometry={rbox(-lanesX0 * 2 - 3, 0.12, 0.3, 0.04)} material={mat(PAL.curb)} position={[0, 0.06, laneMaxZ + 0.12]} receiveShadow />

      {/* restaurant floor: terracotta checker */}
      <mesh geometry={rbox(W + 0.6, 0.16, D + 0.5, 0.06)} material={mat(PAL.green)} position={[cx, 0.06, cz]} receiveShadow />
      {tiles.map(([x, z, dark], i) => (
        <mesh key={i} geometry={unitPlane} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.145, z]} scale={[0.98, 0.98, 1]} receiveShadow>
          <meshStandardMaterial color={dark ? (night ? '#b8694a' : PAL.terracottaDark) : (night ? '#cf8462' : '#e49a72')} roughness={0.85} />
        </mesh>
      ))}

      {/* walls with white caps */}
      <mesh geometry={rbox(W + 0.3, wallH * 1.8, 0.3, 0.06)} material={wall} position={[cx, wallH * 0.9, b.minZ - 0.45]} castShadow receiveShadow />
      <mesh geometry={rbox(W + 0.42, 0.1, 0.42, 0.04)} material={cap} position={[cx, wallH * 1.8 + 0.03, b.minZ - 0.45]} />
      {[b.minX - 0.45, b.maxX + 0.45].map((x) => (
        <group key={x}>
          <mesh geometry={rbox(0.3, wallH, D, 0.06)} material={wall} position={[x, wallH / 2, cz]} castShadow receiveShadow />
          <mesh geometry={rbox(0.42, 0.1, D + 0.1, 0.04)} material={cap} position={[x, wallH + 0.03, cz]} />
        </group>
      ))}
      {southSegs.map(([a, c], i) => (
        <group key={i}>
          <mesh geometry={rbox(c - a, wallH, 0.3, 0.06)} material={wall} position={[(a + c) / 2, wallH / 2, SOUTH_WALL_Z]} castShadow receiveShadow />
          <mesh geometry={rbox(c - a + 0.08, 0.1, 0.42, 0.04)} material={cap} position={[(a + c) / 2, wallH + 0.03, SOUTH_WALL_Z]} />
        </group>
      ))}
      {/* back-wall shelf with jars (like a real kitchen line) */}
      <mesh geometry={rbox(W * 0.5, 0.06, 0.25, 0.02)} material={mat('#b97a4a')} position={[cx - W * 0.15, 1.45, b.minZ - 0.22]} />
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} geometry={cylinder(0.07, 0.07, 0.2, 10)} material={mat(['#e3b04b', '#d9483b', '#7bb662', PAL.white][i % 4])} position={[cx - W * 0.38 + i * (W * 0.46 / 8), 1.58, b.minZ - 0.22]} />
      ))}

      {/* pickup windows: awning + frame */}
      {WINDOW_X.slice(0, lanes).map((x, i) => (
        <group key={i} position={[x, 0, SOUTH_WALL_Z]}>
          {[-0.6, 0.6].map((dx) => <mesh key={dx} geometry={rbox(0.14, 2.1, 0.36, 0.04)} material={mat(PAL.green)} position={[dx, 1.05, 0]} castShadow />)}
          <group position={[0, 2.15, 0.45]} rotation={[0.35, 0, 0]}>
            {Array.from({ length: 6 }).map((_, k) => (
              <mesh key={k} geometry={unitBox} material={mat(k % 2 ? PAL.white : (i % 2 ? PAL.green : PAL.tomato))} position={[-0.7 + 0.28 * k + 0.14, 0, 0]} scale={[0.28, 0.05, 1.0]} castShadow />
            ))}
          </group>
          <mesh geometry={rbox(1.0, 0.24, 0.06, 0.03)} material={mat(PAL.green)} position={[0, 2.45, 0.05]} />
          <mesh geometry={sphere} material={mat('#ffe066', '#ffe066', night ? 2.5 : 0.5)} position={[0, 2.45, 0.1]} scale={0.07} />
        </group>
      ))}

      {/* menu boards beside each lane's ordering spot */}
      {WINDOW_X.slice(0, lanes).map((x, l) => (
        <group key={l} position={[x - BOARD_OFFSET, 0, laneMinZ - 0.35 - l * 0.0]}>
          <mesh geometry={rbox(0.14, 1.0, 0.14, 0.03)} material={mat(PAL.green)} position={[0, 0.5, 0]} />
          <mesh geometry={rbox(1.15, 0.8, 0.12, 0.04)} material={mat(PAL.green)} position={[0, 1.35, 0]} castShadow />
          <mesh geometry={unitPlane} position={[0, 1.35, 0.065]} scale={[1.0, 0.65, 1]}>
            <meshStandardMaterial map={boardTex} emissive="#ffffff" emissiveMap={boardTex} emissiveIntensity={night ? 0.7 : 0.05} />
          </mesh>
          <mesh geometry={rbox(0.32, 0.18, 0.1, 0.03)} material={mat(PAL.coral)} position={[0, 1.83, 0]} />
          <mesh geometry={unitBox} position={[0, 1.83, 0.05]} scale={[0.2, 0.05, 0.02]} material={mat('#fff', '#fff', 0.2)} />
        </group>
      ))}

      {/* pylon sign at the drive-thru entrance */}
      <group position={[ENTRY_X - 1.0, 0, SOUTH_WALL_Z - 0.6]}>
        <mesh geometry={rbox(0.9, 0.3, 0.9, 0.06)} material={mat(PAL.curb)} position={[0, 0.15, 0]} />
        <mesh geometry={cylinder(0.12, 0.14, 4.4, 10)} material={mat(PAL.green)} position={[0, 2.4, 0]} castShadow />
        <group position={[0, 4.6, 0]} rotation={[0, 0.4, 0]}>
          <mesh geometry={rbox(2.8, 1.5, 0.3, 0.12)} material={mat(PAL.mustard)} castShadow />
          <mesh geometry={unitPlane} position={[0, 0, 0.16]} scale={[2.5, 1.25, 1]}>
            <meshStandardMaterial map={signTex} emissive="#ffffff" emissiveMap={signTex} emissiveIntensity={night ? 1.1 : 0.05} />
          </mesh>
        </group>
        {night && <pointLight position={[0, 4.4, 1.2]} color="#ffd166" intensity={10} distance={8} />}
      </group>

      {/* string lights over the kitchen */}
      {[b.minX - 0.45, b.maxX + 0.45].map((x) => (
        <mesh key={x} geometry={cylinder(0.05, 0.06, 2.8, 8)} material={mat(PAL.ink)} position={[x, 1.4, b.minZ - 0.45]} castShadow />
      ))}
      <StringLights a={[b.minX - 0.45, 2.75, b.minZ - 0.45]} b={[b.maxX + 0.45, 2.75, b.minZ - 0.45]} night={night} n={Math.round(W)} />
      {[b.minX - 0.45, b.maxX + 0.45].map((x) => (
        <mesh key={'p' + x} geometry={cylinder(0.05, 0.06, 2.6, 8)} material={mat(PAL.ink)} position={[x, 1.3, SOUTH_WALL_Z]} castShadow />
      ))}
      <StringLights a={[b.minX - 0.45, 2.55, SOUTH_WALL_Z]} b={[b.minX - 0.45, 2.75, b.minZ - 0.45]} night={night} n={6} />
      <StringLights a={[b.maxX + 0.45, 2.55, SOUTH_WALL_Z]} b={[b.maxX + 0.45, 2.75, b.minZ - 0.45]} night={night} n={6} />

      {/* planters & trees inside the block */}
      <Planter x={b.minX - 0.45} z={b.minZ - 1.1} />
      <Planter x={b.maxX + 0.45} z={b.minZ - 1.1} />
      <Tree x={b.minX - 2.0} z={b.minZ - 1.8} s={1.1} tint={1} />
      <Tree x={b.maxX + 2.0} z={b.minZ - 1.8} s={1.1} tint={2} />
      <Tree x={b.maxX + 2.2} z={1.2} s={0.9} />
      <Tree x={b.minX - 2.2} z={-0.6} s={0.9} tint={2} />

      {/* kitchen lights at night */}
      {night && <pointLight position={[cx - W / 4, 3.2, cz]} color="#ffe2b0" intensity={18} distance={11} decay={1.4} />}
      {night && <pointLight position={[cx + W / 4, 3.2, cz]} color="#ffe2b0" intensity={18} distance={11} decay={1.4} />}
      <mesh geometry={unitBox} visible={false} />
      <Rain engine={engine} />
    </group>
  );
}
