import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { GameEngine } from '../game/systems/engine';
import type { VehicleType } from '../game/types';
import { ITEM_ICON } from '../game/data/recipes';
import { useGame } from '../store/useGame';
import { CarModel } from './CarModel';
import { exitMergeS, laneToWorld } from './road';
import { traffic } from './Traffic';

function Car({ engine, id }: { engine: GameEngine; id: number }) {
  const ref = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const v = engine.vehicles.find((x) => x.id === id);
  const night = useGame((s) => s.theme === 'night');
  const lang = useGame((s) => s.lang);
  useGame((s) => s.tick);
  const swerve = useRef(0);
  const born = useRef(-1);
  useFrame(({ clock }) => {
    const car = engine.vehicles.find((x) => x.id === id);
    const g = ref.current, b = body.current;
    if (!g || !b) return;
    if (!car) { g.visible = false; return; }
    if (born.current < 0) born.current = clock.elapsedTime;
    const p = laneToWorld(car.lane, car.x);
    // angry cars that leave from mid-queue pull out sideways
    const target = car.phase === 'driveOut' && car.mood === 'angry' && car.x < 10 ? 0.7 : 0;
    swerve.current += (target - swerve.current) * 0.08;
    g.position.set(p.x, 0, p.z + swerve.current);
    g.rotation.y = p.heading - Math.PI / 2;
    const grow = Math.min(1, (clock.elapsedTime - born.current) * 3);
    g.scale.setScalar(0.3 + grow * 0.7);
    const idle = car.speed < 0.05;
    b.position.y = idle ? Math.abs(Math.sin(clock.elapsedTime * 22 + id)) * 0.012 : 0;
    b.rotation.z = car.phase === 'ordering' ? 0.025 : -Math.min(0.05, car.speed * 0.008);
  });
  if (!v) return null;
  const order = engine.orderOf(v);
  const rem = order ? engine.remaining(order) : [];
  const pct = order ? Math.max(0, (order.deadline - engine.time) / order.patience) : 1;
  const showBubble = order && (order.status === 'queued' || order.status === 'ready');
  return (
    <group ref={ref}>
      <group ref={body}><CarModel kind={v.type} night={night} /></group>
      {showBubble && (
        <Html position={[0, 2.0, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`bubble ${order!.priority}`}>
            {order!.priority !== 'normal' && <div className="bubble-tag">{order!.priority === 'vip' ? 'VIP' : lang === 'zh' ? '急' : 'RUSH'}</div>}
            <div className="bubble-items">{rem.map((it, i) => <span key={i}>{ITEM_ICON[it]}</span>)}</div>
            <div className="bubble-bar"><i style={{ width: `${pct * 100}%`, background: pct > 0.5 ? '#5cc26b' : pct > 0.25 ? '#f4a259' : '#e63946' }} /></div>
          </div>
        </Html>
      )}
      {v.phase === 'ordering' && (
        <Html position={[0, 1.9, 0]} center style={{ pointerEvents: 'none' }}><div className="bubble think">💬</div></Html>
      )}
      {v.phase === 'driveOut' && v.x < 11 && (
        <Html position={[0, 1.8, 0]} center style={{ pointerEvents: 'none' }}><div className="mood">{v.mood === 'happy' ? '😋' : '😠'}</div></Html>
      )}
    </group>
  );
}

export function Vehicles({ engine }: { engine: GameEngine }) {
  useGame((s) => s.tick);
  const known = useRef(new Map<number, { type: VehicleType; lane: number; leaving: boolean }>());
  useFrame(() => {
    const seen = new Set<number>();
    for (const v of engine.vehicles) {
      seen.add(v.id);
      known.current.set(v.id, { type: v.type, lane: v.lane, leaving: v.phase === 'driveOut' });
    }
    // cars that finished the drive-thru merge back into city traffic
    for (const [id, info] of known.current) {
      if (seen.has(id)) continue;
      if (info.leaving) traffic.add(info.type, exitMergeS(info.lane), 0);
      known.current.delete(id);
    }
  });
  return <group>{engine.vehicles.map((v) => <Car key={v.id} engine={engine} id={v.id} />)}</group>;
}
