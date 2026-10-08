import * as THREE from 'three';
import type { ItemId } from '../game/types';

// shared geometries/materials (never created per-frame)
const G = {
  bunTop: new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
  disc: new THREE.CylinderGeometry(0.2, 0.2, 0.06, 14),
  patty: new THREE.CylinderGeometry(0.19, 0.19, 0.07, 12),
  box: new THREE.BoxGeometry(0.26, 0.24, 0.16),
  stick: new THREE.BoxGeometry(0.035, 0.18, 0.035),
  cup: new THREE.CylinderGeometry(0.12, 0.09, 0.3, 12),
  straw: new THREE.CylinderGeometry(0.015, 0.015, 0.2, 6),
  potato: new THREE.DodecahedronGeometry(0.16, 0),
  nugget: new THREE.DodecahedronGeometry(0.08, 0),
  chicken: new THREE.IcosahedronGeometry(0.15, 0),
  basket: new THREE.CylinderGeometry(0.2, 0.16, 0.14, 8, 1, true),
  lettuce: new THREE.CylinderGeometry(0.22, 0.22, 0.025, 10),
};
const matCache = new Map<string, THREE.MeshStandardMaterial>();
export function mat(color: string, emissive?: string, ei = 0) {
  const k = color + (emissive ?? '') + ei;
  let m = matCache.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.75, flatShading: true, emissive: emissive ?? '#000', emissiveIntensity: ei });
    matCache.set(k, m);
  }
  return m;
}

const FRY_STICKS: [number, number, number][] = [[-0.08, 0.2, 0], [-0.03, 0.23, 0.03], [0.02, 0.21, -0.02], [0.07, 0.22, 0.02], [0.0, 0.25, 0.0], [-0.05, 0.19, -0.03], [0.09, 0.19, -0.03]];

export function ItemMesh({ item }: { item: ItemId }) {
  switch (item) {
    case 'bun':
      return <group><mesh geometry={G.bunTop} material={mat('#e8b86d')} position={[0, 0.04, 0]} castShadow /><mesh geometry={G.disc} material={mat('#e3a85a')} /></group>;
    case 'patty_raw': return <mesh geometry={G.patty} material={mat('#d9626b')} castShadow />;
    case 'patty_cooked': return <mesh geometry={G.patty} material={mat('#7a4a2a')} castShadow />;
    case 'patty_burnt': return <mesh geometry={G.patty} material={mat('#2a2220')} castShadow />;
    case 'burger':
      return (
        <group>
          <mesh geometry={G.disc} material={mat('#e3a85a')} position={[0, 0, 0]} />
          <mesh geometry={G.patty} material={mat('#7a4a2a')} position={[0, 0.065, 0]} />
          <mesh geometry={G.lettuce} material={mat('#7cc461')} position={[0, 0.11, 0]} />
          <mesh geometry={G.lettuce} material={mat('#f6c945')} position={[0, 0.13, 0]} scale={[0.9, 1, 0.9]} />
          <mesh geometry={G.bunTop} material={mat('#e8b86d')} position={[0, 0.14, 0]} castShadow />
        </group>
      );
    case 'potato': return <mesh geometry={G.potato} material={mat('#c8a165')} castShadow />;
    case 'fries':
    case 'fries_burnt': {
      const c = item === 'fries' ? '#f6c945' : '#4a3a20';
      return (
        <group>
          <mesh geometry={G.box} material={mat('#e63946')} position={[0, 0.1, 0]} castShadow />
          {FRY_STICKS.map((p, i) => <mesh key={i} geometry={G.stick} material={mat(c)} position={p} />)}
        </group>
      );
    }
    case 'chicken': return <mesh geometry={G.chicken} material={mat('#f2c1a0')} castShadow />;
    case 'nuggets':
    case 'nuggets_burnt': {
      const c = item === 'nuggets' ? '#d9953a' : '#3a2a1a';
      return (
        <group>
          <mesh geometry={G.basket} material={mat('#f4a259')} position={[0, 0.07, 0]} />
          {[[-0.07, 0.12, 0], [0.07, 0.12, 0.02], [0, 0.15, -0.05], [0.01, 0.14, 0.07]].map((p, i) => (
            <mesh key={i} geometry={G.nugget} material={mat(c)} position={p as [number, number, number]} castShadow />
          ))}
        </group>
      );
    }
    case 'soda':
      return (
        <group>
          <mesh geometry={G.cup} material={mat('#e8443a')} position={[0, 0.15, 0]} castShadow />
          <mesh geometry={G.disc} material={mat('#fff6e6')} position={[0, 0.31, 0]} scale={[0.62, 0.5, 0.62]} />
          <mesh geometry={G.straw} material={mat('#ffffff')} position={[0.03, 0.4, 0]} rotation={[0, 0, 0.2]} />
        </group>
      );
  }
}
