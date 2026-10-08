import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GameEngine } from '../game/systems/engine';
import { ItemMesh, mat } from './ItemMesh';
import { useGame } from '../store/useGame';

const headG = new THREE.SphereGeometry(0.34, 14, 10);
const bodyG = new THREE.CylinderGeometry(0.2, 0.26, 0.42, 10);
const limbG = new THREE.CapsuleGeometry(0.07, 0.18, 3, 6);
const hatG = new THREE.CylinderGeometry(0.3, 0.33, 0.14, 14);
const brimG = new THREE.CylinderGeometry(0.4, 0.4, 0.03, 14);
const eyeG = new THREE.SphereGeometry(0.04, 6, 5);
const apronG = new THREE.BoxGeometry(0.34, 0.38, 0.12);
const shadowG = new THREE.CircleGeometry(0.35, 16);

export function Player({ engine }: { engine: GameEngine }) {
  const root = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const lLeg = useRef<THREE.Mesh>(null);
  const rLeg = useRef<THREE.Mesh>(null);
  const lArm = useRef<THREE.Mesh>(null);
  const rArm = useRef<THREE.Mesh>(null);
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
    const sw = walking ? Math.sin(t * 14) * 0.7 : 0;
    b.position.y = walking ? Math.abs(Math.sin(t * 14)) * 0.08 : Math.sin(t * 2) * 0.015;
    if (p.anim === 'happy') b.position.y = Math.abs(Math.sin(t * 18)) * 0.25;
    b.rotation.z = p.anim === 'fail' ? Math.sin(t * 30) * 0.15 : 0;
    b.rotation.x = p.anim === 'cook' || p.anim === 'serve' ? 0.25 : 0;
    if (lLeg.current && rLeg.current) { lLeg.current.rotation.x = sw; rLeg.current.rotation.x = -sw; }
    const carry = !!p.carrying;
    if (lArm.current && rArm.current) {
      lArm.current.rotation.x = carry ? -1.3 : -sw * 0.8;
      rArm.current.rotation.x = carry ? -1.3 : sw * 0.8;
    }
  });

  return (
    <group ref={root}>
      <mesh geometry={shadowG} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <meshBasicMaterial color="#000" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <group ref={bodyRef}>
        <mesh ref={lLeg} geometry={limbG} material={mat('#2f3e46')} position={[-0.1, 0.17, 0]} castShadow />
        <mesh ref={rLeg} geometry={limbG} material={mat('#2f3e46')} position={[0.1, 0.17, 0]} castShadow />
        <mesh geometry={bodyG} material={mat('#ee6c4d')} position={[0, 0.5, 0]} castShadow />
        <mesh ref={lArm} geometry={limbG} material={mat('#ee6c4d')} position={[-0.27, 0.58, 0]} castShadow />
        <mesh ref={rArm} geometry={limbG} material={mat('#ee6c4d')} position={[0.27, 0.58, 0]} castShadow />
        <mesh geometry={headG} material={mat('#f6d1b1')} position={[0, 1.0, 0]} castShadow />
        <mesh geometry={eyeG} material={mat('#222')} position={[-0.11, 1.03, 0.3]} />
        <mesh geometry={eyeG} material={mat('#222')} position={[0.11, 1.03, 0.3]} />
        <mesh geometry={hatG} material={mat('#fbf6ea')} position={[0, 1.3, 0]} scale={[0.95, 1.2, 0.95]} castShadow />
        <mesh geometry={headG} material={mat('#ffffff')} position={[0, 1.5, 0]} scale={[0.95, 0.55, 0.95]} castShadow />
        <mesh geometry={brimG} material={mat('#1f4d3a')} position={[0, 1.22, 0]} scale={[0.85, 2, 0.85]} />
        <mesh geometry={apronG} material={mat('#fbf6ea')} position={[0, 0.45, 0.17]} castShadow />
        <mesh geometry={headG} material={mat('#f2a7a0')} position={[-0.2, 0.95, 0.24]} scale={0.12} />
        <mesh geometry={headG} material={mat('#f2a7a0')} position={[0.2, 0.95, 0.24]} scale={0.12} />
        {carrying && (
          <group position={[0, 1.85, 0]} scale={1.3}><ItemMesh item={carrying} /></group>
        )}
      </group>
    </group>
  );
}
