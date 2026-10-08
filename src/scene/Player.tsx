import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GameEngine } from '../game/systems/engine';
import { ItemMesh } from './ItemMesh';
import { useGame } from '../store/useGame';
import { useCharacter } from './models';

const shadowG = new THREE.CircleGeometry(0.35, 20);

/** Procedural walk / carry / cook / happy / fail animation on the Blender chef rig. */
export function Player({ engine }: { engine: GameEngine }) {
  const root = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const { obj, pivots } = useCharacter('char_chef');
  useGame((s) => s.tick); // refresh carried item
  const carrying = engine.player.carrying;

  useFrame(({ clock }) => {
    const p = engine.player;
    const r = root.current, b = bodyRef.current;
    if (!r || !b) return;
    r.position.set(p.x, 0, p.z);
    r.rotation.y = p.dir;
    const t = clock.elapsedTime;
    const walking = p.anim === 'walk';
    const sw = walking ? Math.sin(t * 13) * 0.75 : 0;
    b.position.y = walking ? Math.abs(Math.sin(t * 13)) * 0.06 : Math.sin(t * 2.2) * 0.012;
    if (p.anim === 'happy') b.position.y = Math.abs(Math.sin(t * 16)) * 0.22;
    b.rotation.z = p.anim === 'fail' ? Math.sin(t * 30) * 0.12 : 0;
    b.rotation.x = walking ? 0.06 : 0;
    const carry = !!p.carrying;
    const busy = p.anim === 'cook' || p.anim === 'serve';
    if (pivots.legL) pivots.legL.rotation.x = sw;
    if (pivots.legR) pivots.legR.rotation.x = -sw;
    if (pivots.armL) pivots.armL.rotation.x = carry ? -2.4 : busy ? -1.2 + Math.sin(t * 30) * 0.3 : -sw * 0.7;
    if (pivots.armR) pivots.armR.rotation.x = carry ? -2.4 : busy ? -1.0 - Math.sin(t * 30) * 0.3 : sw * 0.7;
    if (pivots.armL) pivots.armL.rotation.z = p.anim === 'happy' ? -2.4 : 0;
    if (pivots.armR) pivots.armR.rotation.z = p.anim === 'happy' ? 2.4 : 0;
    if (pivots.head) {
      pivots.head.rotation.x = p.anim === 'fail' ? 0.35 : Math.sin(t * 1.7) * 0.03;
      pivots.head.rotation.z = walking ? Math.sin(t * 13) * 0.05 : 0;
    }
  });

  return (
    <group ref={root}>
      <mesh geometry={shadowG} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <meshBasicMaterial color="#000" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <group ref={bodyRef}>
        <primitive object={obj} />
        {carrying && (
          <group position={[0, 2.05, 0.05]} scale={1.15}><ItemMesh item={carrying} /></group>
        )}
      </group>
    </group>
  );
}
