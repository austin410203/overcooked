import { memo } from 'react';
import * as THREE from 'three';
import { Model } from './models';

export type CarKind = 'yellow' | 'red' | 'blue' | 'green' | 'van' | 'truck' | 'vip' | 'festival' | 'bus' | 'police';

const shadowG = new THREE.PlaneGeometry(1, 1);

/** Blender-built vehicle (tools/blender/vehicles.py), faces +x. */
export const CarModel = memo(function CarModel({ kind }: { kind: CarKind; night?: boolean }) {
  const len = kind === 'bus' ? 3.8 : 2.3;
  return (
    <group>
      <mesh geometry={shadowG} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} scale={[len, 1.2, 1]}>
        <meshBasicMaterial color="#000" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <Model name={`car_${kind}`} />
    </group>
  );
});
