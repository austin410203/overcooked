import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { GameEngine } from '../game/systems/engine';
import type { VehicleType } from '../game/types';
import { LANE_Z } from '../game/data/layouts';
import { ITEM_ICON } from '../game/data/recipes';
import { mat } from './ItemMesh';
import { useGame } from '../store/useGame';

const boxG = new THREE.BoxGeometry(1, 1, 1);
const wheelG = new THREE.CylinderGeometry(0.22, 0.22, 0.16, 12);
const lampG = new THREE.SphereGeometry(0.08, 6, 5);

const STYLE: Record<VehicleType, { body: string; len: number; h: number; cabin: string }> = {
  yellow: { body: '#f6c945', len: 1.7, h: 0.5, cabin: '#fff6e0' },
  red: { body: '#e63946', len: 1.7, h: 0.5, cabin: '#fde8e8' },
  blue: { body: '#4f86c6', len: 1.8, h: 0.5, cabin: '#e3eefb' },
  green: { body: '#6bbf59', len: 1.7, h: 0.5, cabin: '#eaf7e4' },
  van: { body: '#f2efe6', len: 1.9, h: 0.95, cabin: '#cfe3f2' },
  truck: { body: '#8d6e63', len: 2.0, h: 0.6, cabin: '#f4a259' },
  vip: { body: '#1b1b22', len: 1.95, h: 0.48, cabin: '#d4af37' },
  festival: { body: '#b05bd6', len: 1.8, h: 0.55, cabin: '#ffd6f5' },
};

function Car({ engine, id }: { engine: GameEngine; id: number }) {
  const ref = useRef<THREE.Group>(null);
  const v = engine.vehicles.find((x) => x.id === id);
  const night = useGame((s) => s.theme === 'night');
  const lang = useGame((s) => s.lang);
  useGame((s) => s.tick);
  const swerve = useRef(0);
  useFrame(({ clock }) => {
    const car = engine.vehicles.find((x) => x.id === id);
    const g = ref.current;
    if (!car || !g) return;
    // failed cars that are not at front swerve out of the lane
    const target = car.phase === 'driveOut' && car.mood === 'angry' ? 0.75 : 0;
    swerve.current += (target - swerve.current) * 0.08;
    g.position.set(car.x, 0, LANE_Z(car.lane) + swerve.current);
    const idle = car.speed < 0.05;
    g.children[0].position.y = idle ? Math.sin(clock.elapsedTime * 20 + id) * 0.008 : 0;
    g.children[0].rotation.z = -Math.min(0.06, car.speed * 0.01) + (car.phase === 'ordering' ? 0.02 : 0);
  });
  if (!v) return null;
  const st = STYLE[v.type];
  const order = engine.orderOf(v);
  const rem = order ? engine.remaining(order) : [];
  const pct = order ? Math.max(0, (order.deadline - engine.time) / order.patience) : 1;
  const showBubble = order && (order.status === 'queued' || order.status === 'ready');
  return (
    <group ref={ref} position={[v.x, 0, LANE_Z(v.lane)]}>
      <group>
        <mesh geometry={boxG} material={mat(st.body)} position={[0, 0.42, 0]} scale={[st.len, st.h, 0.95]} castShadow />
        <mesh geometry={boxG} material={mat(st.cabin)} position={[v.type === 'truck' ? 0.45 : -0.05, 0.42 + st.h / 2 + 0.2, 0]} scale={[v.type === 'truck' ? 0.7 : st.len * 0.55, 0.4, 0.85]} castShadow />
        {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b], i) => (
          <mesh key={i} geometry={wheelG} material={mat('#222')} position={[a * st.len * 0.32, 0.22, b * 0.45]} rotation={[Math.PI / 2, 0, 0]} />
        ))}
        <mesh geometry={lampG} material={mat('#fff8d0', '#fff3a0', night ? 3 : 0.3)} position={[st.len / 2, 0.45, 0.3]} />
        <mesh geometry={lampG} material={mat('#fff8d0', '#fff3a0', night ? 3 : 0.3)} position={[st.len / 2, 0.45, -0.3]} />
        {v.type === 'vip' && <mesh geometry={boxG} material={mat('#d4af37', '#d4af37', 0.3)} position={[0, 0.5, 0]} scale={[st.len + 0.01, 0.06, 0.97]} />}
        {v.type === 'festival' && <mesh geometry={lampG} material={mat('#ff4fd8', '#ff4fd8', 2)} position={[0, 1.25, 0]} scale={1.6} />}
      </group>
      {showBubble && (
        <Html position={[0, 2.1, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`bubble ${order!.priority}`}>
            {order!.priority !== 'normal' && <div className="bubble-tag">{order!.priority === 'vip' ? 'VIP' : lang === 'zh' ? '急' : 'RUSH'}</div>}
            <div className="bubble-items">{rem.map((it, i) => <span key={i}>{ITEM_ICON[it]}</span>)}</div>
            <div className="bubble-bar"><i style={{ width: `${pct * 100}%`, background: pct > 0.5 ? '#5cc26b' : pct > 0.25 ? '#f4a259' : '#e63946' }} /></div>
          </div>
        </Html>
      )}
      {v.phase === 'ordering' && (
        <Html position={[0, 2.0, 0]} center style={{ pointerEvents: 'none' }}><div className="bubble think">💬</div></Html>
      )}
      {v.phase === 'driveOut' && (
        <Html position={[0, 1.9, 0]} center style={{ pointerEvents: 'none' }}><div className="mood">{v.mood === 'happy' ? '😋' : '😠'}</div></Html>
      )}
    </group>
  );
}

export function Vehicles({ engine }: { engine: GameEngine }) {
  useGame((s) => s.tick);
  return <group>{engine.vehicles.map((v) => <Car key={v.id} engine={engine} id={v.id} />)}</group>;
}
