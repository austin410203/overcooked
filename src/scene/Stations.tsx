import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Station } from '../game/types';
import type { GameEngine } from '../game/systems/engine';
import { ItemMesh } from './ItemMesh';
import { Model } from './models';
import { useGame } from '../store/useGame';

const TOP = 0.9;
const TMPQ = new THREE.Quaternion();
const plateG = new THREE.PlaneGeometry(0.78, 0.7);
const barBg = new THREE.PlaneGeometry(0.9, 0.12);
const barFg = new THREE.PlaneGeometry(1, 0.1);
const ringG = new THREE.RingGeometry(0.62, 0.72, 32);
const smokeG = new THREE.SphereGeometry(0.12, 6, 5);


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

/** Blender station model + live state accents (heat glow, broken tint). */
function StationBody({ s, night }: { s: Station; night: boolean }) {
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const g = glowRef.current; if (!g) return;
    const hot = (s.kind === 'grill' || s.kind === 'fryer') && (s.state === 'processing' || s.state === 'ready' || s.state === 'burning');
    g.visible = hot || (s.kind === 'drink' && s.state === 'processing');
    const m = g.material as THREE.MeshBasicMaterial;
    m.opacity = 0.25 + Math.sin(clock.elapsedTime * 6) * 0.1;
    m.color.set(s.state === 'burning' ? '#ff3b1f' : s.kind === 'drink' ? '#7fd6ff' : '#ff9a3c');
  });
  return (
    <group>
      <Model name={`st_${s.kind}`} />
      <mesh ref={glowRef} geometry={plateG} rotation={[-Math.PI / 2, 0, 0]} position={[0, TOP + 0.09, 0]} scale={[1, 1, 1]}>
        <meshBasicMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {s.kind === 'pickup' && night && <pointLight position={[0, TOP + 1.2, 0.3]} color="#ffe2a0" intensity={3} distance={3} />}
    </group>
  );
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
            <group position={[0, TOP + 0.15, 0]}><ItemMesh item={s.supply} /></group>
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
