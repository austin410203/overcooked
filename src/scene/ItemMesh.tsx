import * as THREE from 'three';
import type { ItemId } from '../game/types';
import { Model } from './models';

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

/** Food items are Blender models (tools/blender/food.py). */
export function ItemMesh({ item }: { item: ItemId }) {
  return <Model name={`food_${item}`} />;
}
