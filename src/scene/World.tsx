import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GameEngine } from '../game/systems/engine';
import { BOARD_OFFSET, LANE_Z, SOUTH_WALL_Z, WINDOW_X } from '../game/data/layouts';
import { mat } from './ItemMesh';
import { useGame } from '../store/useGame';

const box = new THREE.BoxGeometry(1, 1, 1);
const plane = new THREE.PlaneGeometry(1, 1);
const cone = new THREE.ConeGeometry(0.6, 1.4, 6);
const trunk = new THREE.CylinderGeometry(0.1, 0.14, 0.7, 6);
const ball = new THREE.IcosahedronGeometry(0.55, 0);
const pole = new THREE.CylinderGeometry(0.05, 0.06, 2.4, 6);
const bulb = new THREE.SphereGeometry(0.16, 8, 6);
const tcone = new THREE.ConeGeometry(0.16, 0.42, 8);

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

function Tree({ p, s = 1 }: { p: [number, number]; s?: number }) {
  return (
    <group position={[p[0], 0, p[1]]} scale={s}>
      <mesh geometry={trunk} material={mat('#8a5a3b')} position={[0, 0.35, 0]} castShadow />
      <mesh geometry={ball} material={mat('#6aa84f')} position={[0, 1.05, 0]} castShadow />
      <mesh geometry={ball} material={mat('#7cbf5d')} position={[0.15, 1.45, 0.05]} scale={0.7} castShadow />
    </group>
  );
}

function Lamp({ p, night }: { p: [number, number]; night: boolean }) {
  return (
    <group position={[p[0], 0, p[1]]}>
      <mesh geometry={pole} material={mat('#3b4a43')} position={[0, 1.2, 0]} castShadow />
      <mesh geometry={bulb} material={mat('#fff1c1', '#ffd27a', night ? 4 : 0.2)} position={[0, 2.45, 0]} />
      {night && <pointLight position={[0, 2.3, 0]} color="#ffcf88" intensity={9} distance={7} decay={1.6} />}
    </group>
  );
}

function CityBlock({ p, w, d, h, c, night }: { p: [number, number]; w: number; d: number; h: number; c: string; night: boolean }) {
  return (
    <group position={[p[0], 0, p[1]]}>
      <mesh geometry={box} material={mat(c)} position={[0, h / 2, 0]} scale={[w, h, d]} castShadow receiveShadow />
      <mesh geometry={box} material={mat('#f8f1e2')} position={[0, h + 0.08, 0]} scale={[w + 0.1, 0.16, d + 0.1]} />
      {Array.from({ length: Math.max(1, Math.floor(h / 1.1)) }).map((_, i) => (
        <mesh key={i} geometry={box} material={mat(night ? '#ffe7a3' : '#a9cfe0', night ? '#ffcc66' : undefined, night ? (i % 2 ? 1.2 : 0.4) : 0)}
          position={[0, 0.8 + i * 1.1, d / 2 + 0.01]} scale={[w * 0.75, 0.45, 0.02]} />
      ))}
    </group>
  );
}

function Rain({ engine }: { engine: GameEngine }) {
  const N = 900;
  const { geo, pos } = useMemo(() => {
    const pos = new Float32Array(N * 6);
    for (let i = 0; i < N; i++) {
      const x = (Math.random() - 0.5) * 40, y = Math.random() * 14, z = (Math.random() - 0.5) * 30;
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

export function World({ engine }: { engine: GameEngine }) {
  const night = useGame((s) => s.theme === 'night');
  const lang = useGame((s) => s.lang);
  const lvl = engine.level;
  const b = engine.bounds;
  const lanes = lvl.lanes;
  const roadMinZ = SOUTH_WALL_Z + 0.9;
  const roadMaxZ = LANE_Z(lanes - 1) + 0.8;
  const signTex = useMemo(() => signTexture(lang === 'zh' ? ['DRIVE THRU', '得來速'] : ['DRIVE', 'THRU'], night ? '#1f4d3a' : '#1f4d3a', '#ffd166'), [lang, night]);
  const boardTex = useMemo(() => signTexture(['MENU', lang === 'zh' ? '點餐' : 'ORDER HERE'], '#2f3e46', '#fff3d6'), [lang]);
  const W = b.maxX - b.minX + 0.6, D = b.maxZ - b.minZ + 1;
  const cx = (b.maxX + b.minX) / 2, cz = (b.maxZ + b.minZ) / 2 + 0.25;
  const wallC = mat(night ? '#c9b48f' : '#f2e3c6');
  const wallH = 1.05;

  // south wall segments with gaps at pickup windows
  const southSegs = useMemo(() => {
    const xs = WINDOW_X.slice(0, lanes).sort((a, c) => a - c);
    const segs: [number, number][] = [];
    let start = b.minX - 0.3;
    for (const x of xs) { segs.push([start, x - 0.55]); start = x + 0.55; }
    segs.push([start, b.maxX + 0.3]);
    return segs;
  }, [lanes, b.minX, b.maxX]);

  const night2 = night;
  return (
    <group>
      {/* ground */}
      <mesh geometry={plane} rotation={[-Math.PI / 2, 0, 0]} scale={[60, 44, 1]} position={[0, -0.01, 0]} receiveShadow>
        <meshStandardMaterial color={night2 ? '#3a4a3a' : '#cfe0a8'} roughness={1} />
      </mesh>
      {/* drive-thru road */}
      <mesh geometry={plane} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, (roadMinZ + roadMaxZ) / 2]} scale={[44, roadMaxZ - roadMinZ, 1]} receiveShadow>
        <meshStandardMaterial color={night2 ? '#2b2f36' : '#5d6670'} roughness={engine.rainLevel ? 0.35 : 0.95} metalness={engine.rainLevel ? 0.2 : 0} />
      </mesh>
      {Array.from({ length: lanes - 1 }).map((_, l) => (
        Array.from({ length: 18 }).map((__, i) => (
          <mesh key={`${l}-${i}`} geometry={plane} rotation={[-Math.PI / 2, 0, 0]} position={[-20 + i * 2.4, 0.012, (LANE_Z(l) + LANE_Z(l + 1)) / 2]} scale={[1.2, 0.08, 1]}>
            <meshBasicMaterial color="#f6ecd9" />
          </mesh>
        ))
      ))}
      {/* curb / sidewalk */}
      <mesh geometry={box} material={mat('#e9dcc3')} position={[0, 0.06, roadMinZ - 0.4]} scale={[44, 0.12, 0.8]} receiveShadow />
      <mesh geometry={box} material={mat('#e9dcc3')} position={[0, 0.06, roadMaxZ + 0.5]} scale={[44, 0.12, 1]} receiveShadow />
      {/* back loop road */}
      <mesh geometry={plane} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, b.minZ - 3]} scale={[44, 2.6, 1]} receiveShadow>
        <meshStandardMaterial color={night2 ? '#2b2f36' : '#6b737c'} roughness={0.95} />
      </mesh>
      {/* stripes on back road */}
      {Array.from({ length: 18 }).map((_, i) => (
        <mesh key={i} geometry={plane} rotation={[-Math.PI / 2, 0, 0]} position={[-20 + i * 2.4, 0.01, b.minZ - 3]} scale={[1.2, 0.08, 1]}>
          <meshBasicMaterial color="#f6ecd9" />
        </mesh>
      ))}

      {/* kitchen floor */}
      <mesh geometry={plane} rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.02, cz]} scale={[W, D, 1]} receiveShadow>
        <meshStandardMaterial color={night2 ? '#d8c7a3' : '#f6ecd9'} roughness={0.9} />
      </mesh>
      {Array.from({ length: Math.ceil(W / 1.2) * Math.ceil(D / 1.2) }).map((_, i) => {
        const cols = Math.ceil(W / 1.2);
        const xi = i % cols, zi = Math.floor(i / cols);
        if ((xi + zi) % 2) return null;
        const x = b.minX - 0.3 + xi * 1.2 + 0.6, z = b.minZ - 0.25 + zi * 1.2 + 0.6;
        if (x > b.maxX + 0.3 || z > b.maxZ + 0.75) return null;
        return <mesh key={i} geometry={plane} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.025, z]} scale={[1.2, 1.2, 1]}><meshStandardMaterial color={night2 ? '#cbb994' : '#eadcc0'} /></mesh>;
      })}
      {/* walls */}
      <mesh geometry={box} material={wallC} position={[cx, wallH, b.minZ - 0.45]} scale={[W + 0.3, wallH * 2, 0.3]} castShadow receiveShadow />
      <mesh geometry={box} material={wallC} position={[b.minX - 0.45, wallH / 2, cz]} scale={[0.3, wallH, D]} castShadow receiveShadow />
      <mesh geometry={box} material={wallC} position={[b.maxX + 0.45, wallH / 2, cz]} scale={[0.3, wallH, D]} castShadow receiveShadow />
      {southSegs.map(([a, c], i) => (
        <mesh key={i} geometry={box} material={wallC} position={[(a + c) / 2, wallH / 2, SOUTH_WALL_Z]} scale={[c - a, wallH, 0.3]} castShadow receiveShadow />
      ))}
      {/* awnings above windows */}
      {WINDOW_X.slice(0, lanes).map((x, i) => (
        <group key={i} position={[x, 0, SOUTH_WALL_Z + 0.4]}>
          <mesh geometry={box} material={mat(i % 2 ? '#f4a259' : '#ee6c4d')} position={[0, 2.0, 0]} scale={[1.6, 0.12, 1.0]} rotation={[0.25, 0, 0]} castShadow />
          <mesh geometry={pole} material={mat('#3b4a43')} position={[-0.75, 1.0, 0.4]} scale={[0.6, 0.85, 0.6]} />
          <mesh geometry={pole} material={mat('#3b4a43')} position={[0.75, 1.0, 0.4]} scale={[0.6, 0.85, 0.6]} />
        </group>
      ))}
      {/* menu boards */}
      {WINDOW_X.slice(0, lanes).map((x, l) => (
        <group key={l} position={[x - BOARD_OFFSET, 0, LANE_Z(l) - 0.95]}>
          <mesh geometry={pole} material={mat('#3b4a43')} position={[0, 0.6, 0]} scale={[1, 0.5, 1]} />
          <mesh geometry={box} position={[0, 1.4, 0]} scale={[1.1, 0.7, 0.1]} castShadow>
            <meshStandardMaterial map={boardTex} emissive={night ? '#ffffff' : '#000'} emissiveMap={boardTex} emissiveIntensity={night ? 0.6 : 0} />
          </mesh>
        </group>
      ))}
      {/* tall sign */}
      <group position={[b.minX - 2.2, 0, SOUTH_WALL_Z - 0.6]}>
        <mesh geometry={pole} material={mat('#2f3e46')} position={[0, 2.4, 0]} scale={[2, 2, 2]} castShadow />
        <mesh geometry={box} position={[0, 4.8, 0]} scale={[2.6, 1.3, 0.25]} rotation={[0, 0.35, 0]} castShadow>
          <meshStandardMaterial map={signTex} emissive="#ffffff" emissiveMap={signTex} emissiveIntensity={night ? 1.1 : 0.05} />
        </mesh>
        {night && <pointLight position={[0, 4.5, 1]} color="#ffd166" intensity={10} distance={8} />}
      </group>
      {/* neon strip (night market feel) */}
      <mesh geometry={box} position={[cx, 2.15, b.minZ - 0.28]} scale={[W, 0.08, 0.06]}>
        <meshStandardMaterial color="#ff4fd8" emissive="#ff4fd8" emissiveIntensity={night ? 2.5 : 0.2} />
      </mesh>
      {/* kitchen lights at night */}
      {night && <pointLight position={[cx - W / 4, 3.2, cz]} color="#ffe2b0" intensity={18} distance={11} decay={1.4} />}
      {night && <pointLight position={[cx + W / 4, 3.2, cz]} color="#ffe2b0" intensity={18} distance={11} decay={1.4} />}

      {/* decorations */}
      {[[-14, -2], [-15, 2], [14, -1.5], [15.5, 2.2], [-12, -9.5], [-6, -9.8], [3, -10], [11, -9.6], [-17, 12.5], [-9, 12.8], [0, 13], [9, 12.6], [17, 12]].map((p, i) => (
        <Tree key={i} p={p as [number, number]} s={0.9 + (i % 3) * 0.15} />
      ))}
      {[[-10, roadMinZ - 0.4], [-2, roadMinZ - 0.4], [8.5, roadMinZ - 0.4], [-12, roadMaxZ + 0.6], [0, roadMaxZ + 0.6], [12, roadMaxZ + 0.6]].map((p, i) => (
        <Lamp key={i} p={p as [number, number]} night={night} />
      ))}
      {[[-18, -13, 4, 3, 4.5, '#e8a87c'], [-12, -13.5, 4, 3, 3.2, '#9fc5c8'], [-5, -13.2, 5, 3, 5.4, '#f2c57c'], [3, -13.5, 4, 3, 3.8, '#c98b8b'], [10, -13, 5, 3, 4.8, '#a7c4a0'], [17, -13.5, 4, 3, 3.4, '#e7b9a0'],
        [-16, 16.5, 5, 3, 3.6, '#c2b0d9'], [-6, 16.8, 6, 3, 4.6, '#f0b67f'], [6, 16.5, 5, 3, 3.2, '#9fc5c8'], [15, 16.8, 5, 3, 5.0, '#e8a87c']].map((d, i) => (
        <CityBlock key={i} p={[d[0] as number, d[1] as number]} w={d[2] as number} d={d[3] as number} h={d[4] as number} c={d[5] as string} night={night} />
      ))}
      {[[-16, LANE_Z(0) - 0.95], [-15, LANE_Z(0) - 0.95], [14.5, roadMaxZ + 0.4]].map((p, i) => (
        <mesh key={i} geometry={tcone} material={mat('#f28c28')} position={[p[0], 0.21, p[1]]} castShadow />
      ))}
      <mesh geometry={cone} material={mat('#5b9a49')} position={[-19, 0.7, -4]} castShadow />
      <Rain engine={engine} />
    </group>
  );
}
