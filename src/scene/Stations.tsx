import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Station } from '../game/types';
import type { GameEngine } from '../game/systems/engine';
import { ItemMesh, mat } from './ItemMesh';
import { rbox, cylinder, unitBox, PAL } from './kit';
import { useGame } from '../store/useGame';

const TOP = 0.9;
const TMPQ = new THREE.Quaternion();
const boxG = rbox(0.98, TOP, 0.98, 0.08, 2);
const topG = rbox(1.04, 0.08, 1.04, 0.035, 2);
const plateG = new THREE.BoxGeometry(0.8, 0.04, 0.8);
const barBg = new THREE.PlaneGeometry(0.9, 0.12);
const barFg = new THREE.PlaneGeometry(1, 0.1);
const ringG = new THREE.RingGeometry(0.62, 0.72, 32);
const smokeG = new THREE.SphereGeometry(0.12, 6, 5);
const cylG = new THREE.CylinderGeometry(0.4, 0.45, TOP, 10);
const lightG = new THREE.SphereGeometry(0.07, 8, 6);
const crateG = rbox(0.85, 0.25, 0.85, 0.05, 2);
const barG = rbox(0.74, 0.025, 0.035, 0.01, 1);

const BODY: Record<Station['kind'], string> = {
  storage: '#b9855a', grill: '#555d66', fryer: '#6b7680', drink: '#d94f3d', assembly: '#e9dcc3',
  counter: '#e9dcc3', pickup: '#2f6b4f', trash: '#4b7a5f',
};

function ProgressBar({ s }: { s: Station }) {
  const fg = useRef<THREE.Mesh>(null);
  const grp = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    if (!fg.current || !grp.current) return;
    grp.current.quaternion.copy(camera.quaternion);
    if (grp.current.parent) grp.current.quaternion.premultiply(grp.current.parent.getWorldQuaternion(TMPQ).invert());
    const show = s.state === 'processing' || s.state === 'burning' || (s.state === 'ready' && s.progress > 1.05);
    grp.current.visible = show;
    if (!show) return;
    const burning = s.progress > 1;
    const p = burning ? s.progress - 1 : s.progress;
    fg.current.scale.x = Math.max(0.01, p * 0.86);
    fg.current.position.x = -0.43 + (p * 0.86) / 2;
    (fg.current.material as THREE.MeshBasicMaterial).color.set(burning ? (s.progress > 1.35 ? '#e63946' : '#f4a259') : '#5cc26b');
  });
  return (
    <group ref={grp} position={[0, 1.75, 0]}>
      <mesh geometry={barBg}><meshBasicMaterial color="#1f2a24" /></mesh>
      <mesh ref={fg} geometry={barFg} position={[0, 0, 0.01]}><meshBasicMaterial color="#5cc26b" /></mesh>
    </group>
  );
}

function Smoke({ s }: { s: Station }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current; if (!g) return;
    const on = s.state === 'burning' || s.state === 'burnt' || ((s.kind === 'grill' || s.kind === 'fryer') && s.state === 'processing');
    g.visible = on;
    if (!on) return;
    const dark = s.state === 'burning' || s.state === 'burnt';
    g.children.forEach((c, i) => {
      const t = (clock.elapsedTime * 0.8 + i / 3) % 1;
      c.position.set(Math.sin(i * 2.1 + t * 3) * 0.15, TOP + 0.2 + t * 0.9, Math.cos(i * 1.7) * 0.12);
      c.scale.setScalar(0.6 + t * 1.2);
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = (1 - t) * (dark ? 0.75 : 0.35);
      m.color.set(dark ? '#3a3a3a' : '#ffffff');
    });
  });
  return (
    <group ref={ref}>
      {[0, 1, 2].map((i) => <mesh key={i} geometry={smokeG}><meshBasicMaterial transparent depthWrite={false} /></mesh>)}
    </group>
  );
}

function Highlight({ s, engine }: { s: Station; engine: GameEngine }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = ref.current; if (!m) return;
    const focus = engine.focusStation() === s;
    const guide = engine.guide && engine.guide.stationId === s.id && engine.guide.until > engine.time;
    const warn = s.warnAt > 0 && engine.time >= s.warnAt && s.state !== 'broken';
    const broken = s.state === 'broken';
    m.visible = focus || !!guide || warn || broken;
    const mm = m.material as THREE.MeshBasicMaterial;
    const pulse = 0.5 + Math.sin(clock.elapsedTime * 8) * 0.5;
    if (broken || warn) { mm.color.set('#e63946'); mm.opacity = warn ? pulse : 0.9; }
    else if (guide) { mm.color.set('#4fc3f7'); mm.opacity = 0.5 + pulse * 0.5; }
    else { mm.color.set('#fff3b0'); mm.opacity = 0.9; }
  });
  return (
    <mesh ref={ref} geometry={ringG} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <meshBasicMaterial transparent depthWrite={false} />
    </mesh>
  );
}

function StationBody({ s, night }: { s: Station; night: boolean }) {
  const body = mat(BODY[s.kind]);
  switch (s.kind) {
    case 'trash':
      return (
        <group>
          <mesh geometry={cylG} material={body} position={[0, TOP / 2, 0]} castShadow receiveShadow />
          <mesh geometry={topG} material={mat('#2f5a44')} position={[0, TOP, 0]} scale={[0.85, 1, 0.85]} />
        </group>
      );
    case 'storage':
      return (
        <group>
          <mesh geometry={boxG} material={body} position={[0, TOP / 2, 0]} castShadow receiveShadow />
          <mesh geometry={crateG} material={mat('#d9a36b')} position={[0, TOP + 0.12, 0]} />
          {[-0.3, 0, 0.3].map((z) => <mesh key={z} geometry={unitBox} material={mat('#b9855a')} position={[0, TOP + 0.13, z]} scale={[0.87, 0.2, 0.04]} />)}
          <mesh geometry={rbox(0.5, 0.18, 0.04, 0.02)} material={mat(PAL.white)} position={[0, TOP * 0.55, 0.5]} />
        </group>
      );
    default: {
      const topC = s.kind === 'grill' ? '#2b2f33' : s.kind === 'fryer' ? '#c9a227' : s.kind === 'pickup' ? '#f4a259' : s.kind === 'drink' ? '#f2f2f2' : '#f8f1e2';
      const glow = s.kind === 'grill' && s.state === 'processing' ? '#ff5a1f' : undefined;
      return (
        <group>
          <mesh geometry={boxG} material={body} position={[0, TOP / 2, 0]} castShadow receiveShadow />
          <mesh geometry={topG} material={mat(topC)} position={[0, TOP, 0]} receiveShadow />
          {(s.kind === 'grill' || s.kind === 'fryer') && (
            <mesh geometry={plateG} material={mat(s.kind === 'grill' ? '#1a1a1a' : '#e8c35a', glow, glow ? 0.8 : 0)} position={[0, TOP + 0.05, 0]} />
          )}
          {s.kind === 'grill' && [-0.24, -0.08, 0.08, 0.24].map((z) => (
            <mesh key={z} geometry={barG} material={mat('#6b7076')} position={[0, TOP + 0.085, z]} />
          ))}
          {s.kind === 'grill' && [-0.3, -0.1, 0.1, 0.3].map((x) => (
            <mesh key={x} geometry={cylinder(0.04, 0.04, 0.05, 10)} material={mat(PAL.tomato)} position={[x, TOP * 0.55, 0.5]} rotation={[Math.PI / 2, 0, 0]} />
          ))}
          {s.kind === 'fryer' && (
            <>
              <mesh geometry={rbox(0.6, 0.14, 0.6, 0.04)} material={mat('#c9cdd0')} position={[0, TOP + 0.1, 0]} />
              <mesh geometry={rbox(0.08, 0.04, 0.42, 0.015)} material={mat(PAL.ink)} position={[0, TOP + 0.24, -0.34]} />
              <mesh geometry={unitBox} material={mat('#f6d365', '#f6a623', s.state === 'processing' ? 0.6 : 0)} position={[0, TOP + 0.06, 0]} scale={[0.55, 0.04, 0.55]} />
            </>
          )}
          {s.kind === 'pickup' && (
            <mesh geometry={rbox(0.9, 0.05, 0.6, 0.02)} material={mat(PAL.white)} position={[0, TOP + 0.06, 0]} />
          )}
          {s.kind === 'assembly' && (
            <mesh geometry={rbox(0.7, 0.04, 0.55, 0.02)} material={mat('#c9945e')} position={[0, TOP + 0.05, 0]} />
          )}
          {s.kind === 'drink' && (
            <group>
              <mesh geometry={boxG} material={mat('#c73e2f')} position={[0, TOP + 0.45, -0.3]} scale={[0.9, 1, 0.35]} castShadow />
              <mesh geometry={lightG} material={mat('#9be7ff', '#9be7ff', night ? 2 : 0.6)} position={[0, TOP + 0.75, -0.12]} />
              {[-0.22, 0, 0.22].map((x, i) => (
                <group key={x}>
                  <mesh geometry={cylinder(0.03, 0.03, 0.12, 8)} material={mat(PAL.metal)} position={[x, TOP + 0.38, -0.12]} />
                  <mesh geometry={rbox(0.16, 0.1, 0.03, 0.02)} material={mat(['#e5443a', '#f2c14e', '#7bb662'][i])} position={[x, TOP + 0.6, -0.12]} />
                </group>
              ))}
            </group>
          )}
          {s.kind === 'pickup' && (
            <mesh geometry={lightG} material={mat('#ffe066', '#ffe066', night ? 2.5 : 0.5)} position={[0, TOP + 0.3, 0.4]} scale={1.5} />
          )}
        </group>
      );
    }
  }
}

export function Stations({ engine }: { engine: GameEngine }) {
  useGame((s) => s.tick); // re-render on HUD tick to refresh items
  const night = useGame((s) => s.theme === 'night');
  return (
    <group>
      {engine.stations.map((s) => (
        <group key={s.id} position={[s.x, 0, s.z]} rotation={[0, s.rot ?? 0, 0]}>
          <StationBody s={s} night={night} />
          <Highlight s={s} engine={engine} />
          <ProgressBar s={s} />
          <Smoke s={s} />
          {s.kind === 'storage' && s.supply && (
            <group position={[0, TOP + 0.3, 0]}><ItemMesh item={s.supply} /></group>
          )}
          {s.item && (
            <group position={[0, TOP + 0.08 + (s.kind === 'drink' ? 0 : 0.02), s.kind === 'drink' ? 0.15 : 0]}><ItemMesh item={s.item} /></group>
          )}
          {s.contents.map((it, i) => (
            <group key={i} position={[s.kind === 'pickup' ? (i - 1) * 0.3 : 0, TOP + 0.06 + (s.kind === 'pickup' ? 0 : i * 0.09), 0]}>
              <ItemMesh item={it} />
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}
