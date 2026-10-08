import { memo } from 'react';
import { mat } from './ItemMesh';
import { cylinder, rbox, sphere, unitBox, PAL } from './kit';

export type CarKind = 'yellow' | 'red' | 'blue' | 'green' | 'van' | 'truck' | 'vip' | 'festival' | 'bus' | 'police';

interface Spec { body: string; roof?: string; len: number; wid: number; bodyH: number; cabinLen: number; cabinH: number; cabinX: number }
const SPECS: Record<CarKind, Spec> = {
  yellow:   { body: '#f2c14e', len: 1.75, wid: 0.95, bodyH: 0.42, cabinLen: 0.95, cabinH: 0.38, cabinX: -0.05 },
  red:      { body: '#d9483b', len: 1.7, wid: 0.95, bodyH: 0.42, cabinLen: 0.9, cabinH: 0.38, cabinX: -0.08 },
  blue:     { body: '#5a8fc4', len: 1.8, wid: 0.98, bodyH: 0.44, cabinLen: 1.0, cabinH: 0.38, cabinX: -0.05 },
  green:    { body: '#7bb662', len: 1.6, wid: 0.92, bodyH: 0.42, cabinLen: 0.9, cabinH: 0.42, cabinX: -0.02 },
  van:      { body: '#f4efe2', roof: '#5a8fc4', len: 2.0, wid: 1.0, bodyH: 0.5, cabinLen: 1.65, cabinH: 0.55, cabinX: -0.12 },
  truck:    { body: '#e07b39', len: 2.2, wid: 1.0, bodyH: 0.48, cabinLen: 0.65, cabinH: 0.48, cabinX: 0.6 },
  vip:      { body: '#1d1d24', len: 2.1, wid: 1.0, bodyH: 0.4, cabinLen: 1.05, cabinH: 0.34, cabinX: -0.12 },
  festival: { body: '#c06bd9', len: 1.9, wid: 1.0, bodyH: 0.5, cabinLen: 1.2, cabinH: 0.45, cabinX: -0.05 },
  bus:      { body: '#2f6b4f', roof: '#f3e6cc', len: 3.6, wid: 1.1, bodyH: 0.6, cabinLen: 3.4, cabinH: 0.55, cabinX: 0 },
  police:   { body: '#f4efe2', len: 1.85, wid: 0.98, bodyH: 0.42, cabinLen: 0.95, cabinH: 0.38, cabinX: -0.05 },
};

const WHEEL = cylinder(0.2, 0.2, 0.16, 14);
const HUB = cylinder(0.1, 0.1, 0.17, 10);

/** Detailed low-poly car built from rounded parts. Faces +x. */
export const CarModel = memo(function CarModel({ kind, night }: { kind: CarKind; night: boolean }) {
  const s = SPECS[kind];
  const y0 = 0.24;
  const bodyY = y0 + s.bodyH / 2;
  const cabY = y0 + s.bodyH + s.cabinH / 2 - 0.02;
  const glass = mat(night ? '#20304a' : '#3e5d73', night ? '#ffcf7a' : undefined, night && kind === 'bus' ? 0.6 : 0);
  const glassW = s.cabinLen - 0.16;
  const lightOn = night ? 3.5 : 0.25;
  return (
    <group>
      {/* soft contact shadow */}
      <mesh geometry={rbox(s.len + 0.15, 0.01, s.wid + 0.12, 0.005, 1)} position={[0, 0.012, 0]}>
        <meshBasicMaterial color="#000" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      {/* chassis + body */}
      <mesh geometry={rbox(s.len, s.bodyH, s.wid, 0.14, 3)} material={mat(s.body)} position={[0, bodyY, 0]} castShadow receiveShadow />
      {/* side skirt / bumpers */}
      <mesh geometry={rbox(s.len + 0.06, 0.12, s.wid + 0.04, 0.05, 2)} material={mat(PAL.darkMetal)} position={[0, y0 + 0.06, 0]} />
      {/* cabin (pillars in body colour) */}
      {kind !== 'truck' && (
        <mesh geometry={rbox(s.cabinLen, s.cabinH, s.wid - 0.08, 0.12, 3)} material={mat(s.roof ?? s.body)} position={[s.cabinX, cabY, 0]} castShadow />
      )}
      {kind === 'truck' && (
        <>
          <mesh geometry={rbox(s.cabinLen, s.cabinH, s.wid - 0.06, 0.1, 2)} material={mat(s.body)} position={[s.cabinX, cabY, 0]} castShadow />
          {/* cargo bed with crates */}
          <mesh geometry={rbox(1.25, 0.12, s.wid - 0.04, 0.03, 1)} material={mat('#8a6a4a')} position={[-0.42, y0 + s.bodyH + 0.04, 0]} />
          <mesh geometry={rbox(0.42, 0.34, 0.42, 0.04, 2)} material={mat('#d9a36b')} position={[-0.7, y0 + s.bodyH + 0.27, 0.2]} castShadow />
          <mesh geometry={rbox(0.42, 0.3, 0.42, 0.04, 2)} material={mat('#c98f58')} position={[-0.22, y0 + s.bodyH + 0.25, -0.18]} castShadow />
        </>
      )}
      {/* windows: windshield, rear, sides */}
      <mesh geometry={unitBox} material={glass} position={[s.cabinX + s.cabinLen / 2 - 0.01, cabY + 0.02, 0]} scale={[0.02, s.cabinH * 0.62, s.wid - 0.22]} />
      {kind !== 'truck' && <mesh geometry={unitBox} material={glass} position={[s.cabinX - s.cabinLen / 2 + 0.01, cabY + 0.02, 0]} scale={[0.02, s.cabinH * 0.55, s.wid - 0.24]} />}
      {[1, -1].map((side) => (
        kind === 'bus' || kind === 'van'
          ? Array.from({ length: kind === 'bus' ? 6 : 3 }).map((_, i, arr) => (
            <mesh key={`${side}${i}`} geometry={unitBox} material={glass}
              position={[s.cabinX - glassW / 2 + (glassW / arr.length) * (i + 0.5), cabY + 0.03, side * ((s.wid - 0.08) / 2 + 0.005)]}
              scale={[glassW / arr.length - 0.07, s.cabinH * 0.55, 0.02]} />
          ))
          : <mesh key={side} geometry={unitBox} material={glass} position={[s.cabinX, cabY + 0.03, side * ((s.wid - (kind === 'truck' ? 0.06 : 0.08)) / 2 + 0.005)]} scale={[glassW, s.cabinH * 0.55, 0.02]} />
      ))}
      {/* wheels */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b], i) => (
        <group key={i} position={[a * (s.len / 2 - 0.36), 0.2, b * (s.wid / 2 - 0.02)]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh geometry={WHEEL} material={mat('#23272b')} castShadow />
          <mesh geometry={HUB} material={mat('#c9cdd0')} />
        </group>
      ))}
      {/* head / tail lights */}
      {[1, -1].map((b) => (
        <group key={b}>
          <mesh geometry={sphere} material={mat('#fff8d8', '#fff1b0', lightOn)} position={[s.len / 2 - 0.01, bodyY + 0.04, b * (s.wid / 2 - 0.17)]} scale={[0.04, 0.07, 0.1]} />
          <mesh geometry={sphere} material={mat('#e5443a', '#ff3b2f', night ? 2 : 0.2)} position={[-s.len / 2 + 0.01, bodyY + 0.04, b * (s.wid / 2 - 0.15)]} scale={[0.04, 0.05, 0.09]} />
        </group>
      ))}
      {/* grille */}
      <mesh geometry={unitBox} material={mat(PAL.darkMetal)} position={[s.len / 2, bodyY - 0.06, 0]} scale={[0.02, 0.08, s.wid * 0.4]} />

      {/* ---- per-type character details ---- */}
      {kind === 'yellow' && (
        <mesh geometry={rbox(0.36, 0.13, 0.2, 0.04)} material={mat('#fff6d8', '#ffe27a', night ? 1.5 : 0.1)} position={[s.cabinX, cabY + s.cabinH / 2 + 0.07, 0]} />
      )}
      {kind === 'police' && (
        <>
          <mesh geometry={unitBox} material={mat('#23324a')} position={[0, bodyY, 0]} scale={[s.len * 0.5, 0.12, s.wid + 0.005]} />
          <mesh geometry={rbox(0.14, 0.09, 0.4, 0.03)} material={mat('#e5443a', '#ff3b2f', 2)} position={[s.cabinX, cabY + s.cabinH / 2 + 0.05, 0.12]} />
          <mesh geometry={rbox(0.14, 0.09, 0.4, 0.03)} material={mat('#3d7be5', '#3d7be5', 2)} position={[s.cabinX, cabY + s.cabinH / 2 + 0.05, -0.12]} />
        </>
      )}
      {kind === 'vip' && (
        <>
          <mesh geometry={unitBox} material={mat('#d4af37', '#d4af37', 0.35)} position={[0, bodyY + 0.06, 0]} scale={[s.len + 0.005, 0.035, s.wid + 0.005]} />
          <mesh geometry={cylinder(0.012, 0.012, 0.32, 6)} material={mat('#c9cdd0')} position={[s.len / 2 - 0.15, bodyY + 0.36, s.wid / 2 - 0.08]} />
          <mesh geometry={unitBox} material={mat('#d4af37')} position={[s.len / 2 - 0.08, bodyY + 0.46, s.wid / 2 - 0.08]} scale={[0.14, 0.09, 0.01]} />
        </>
      )}
      {kind === 'festival' && (
        <>
          <mesh geometry={rbox(0.5, 0.18, 0.5, 0.06)} material={mat('#ffd166')} position={[s.cabinX, cabY + s.cabinH / 2 + 0.1, 0]} />
          {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => (
            <mesh key={i} geometry={sphere} material={mat(['#ff4fd8', '#ffd166', '#4fd1ff', '#7cf07c', '#ff7a4f'][i], ['#ff4fd8', '#ffd166', '#4fd1ff', '#7cf07c', '#ff7a4f'][i], night ? 2.5 : 0.5)}
              position={[x, cabY + s.cabinH / 2 + 0.02, s.wid / 2 - 0.05]} scale={0.05} />
          ))}
        </>
      )}
      {kind === 'green' && (
        <mesh geometry={sphere} material={mat('#e9f5d0')} position={[0, bodyY, s.wid / 2]} scale={[0.14, 0.09, 0.01]} />
      )}
      {kind === 'van' && (
        <mesh geometry={unitBox} material={mat(PAL.coral)} position={[0, bodyY, 0]} scale={[s.len * 0.92, 0.08, s.wid + 0.005]} />
      )}
      {kind === 'bus' && (
        <>
          <mesh geometry={unitBox} material={mat(PAL.mustard)} position={[0, bodyY + 0.12, 0]} scale={[s.len + 0.005, 0.06, s.wid + 0.005]} />
          <mesh geometry={rbox(0.5, 0.12, 0.6, 0.04)} material={mat(PAL.metal)} position={[0.6, cabY + s.cabinH / 2 + 0.05, 0]} />
        </>
      )}
    </group>
  );
});
