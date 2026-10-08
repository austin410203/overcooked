import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { GameEngine, Fx } from '../game/systems/engine';
import { useGame } from '../store/useGame';
import { World } from './World';
import { Stations } from './Stations';
import { Player } from './Player';
import { Vehicles } from './Vehicles';
import { input } from '../ui/input';
import { playFx } from '../utils/audio';

function CameraRig({ engine }: { engine: GameEngine }) {
  const { camera, size } = useThree();
  const zoom = useGame((s) => s.zoom);
  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    const worldW = engine.level.layout === 'wide' ? 30 : 23;
    const worldH = 16;
    cam.zoom = Math.min(size.width / worldW, size.height / worldH) * zoom;
    cam.position.set(8, 20, 22);
    cam.lookAt(0, 0, 2.2);
    cam.updateProjectionMatrix();
  }, [camera, size, zoom, engine]);
  return null;
}

function Lights() {
  const night = useGame((s) => s.theme === 'night');
  const { scene } = useThree();
  useEffect(() => {
    const bg = new THREE.Color(night ? '#141a2e' : '#f6ecd9');
    scene.background = bg;
    scene.fog = new THREE.Fog(bg, 45, 80);
  }, [night, scene]);
  return (
    <>
      <hemisphereLight args={[night ? '#5a6aa8' : '#fff6e0', night ? '#1a2030' : '#c9b48f', night ? 0.7 : 1.1]} />
      <directionalLight
        position={night ? [-10, 18, 6] : [10, 20, 8]} intensity={night ? 0.35 : 1.7} color={night ? '#9fb4ff' : '#fff1d6'}
        castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-22} shadow-camera-right={22}
        shadow-camera-top={18} shadow-camera-bottom={-18} shadow-bias={-0.0005}
      />
    </>
  );
}

/** Runs the simulation, pushes HUD ticks and consumes fx */
function Loop({ engine }: { engine: GameEngine }) {
  const acc = useRef(0);
  const seenFx = useRef(0);
  useFrame((_, dt) => {
    const st = useGame.getState();
    if (st.paused || engine.finished) return;
    engine.update(dt * st.speed, input.vector());
    for (const f of engine.fx) {
      if (f.t > seenFx.current) { if (st.sound) playFx(f.type); }
    }
    if (engine.fx.length) seenFx.current = engine.fx[engine.fx.length - 1].t;
    acc.current += dt;
    if (acc.current > 0.1) { acc.current = 0; st.bump(); }
    if (engine.finished) setTimeout(() => useGame.getState().finishLevel(), 600);
  });
  return null;
}

function FloatingFx({ engine }: { engine: GameEngine }) {
  useGame((s) => s.tick);
  const recent: Fx[] = engine.fx.filter((f) => f.text && engine.time - f.t < 1.2);
  return (
    <>
      {recent.map((f) => (
        <Html key={`${f.t}-${f.x}`} position={[f.x, 2.4, f.z]} center style={{ pointerEvents: 'none' }}>
          <div className={`float-text ${f.type}`}>{f.text}</div>
        </Html>
      ))}
    </>
  );
}

export function GameCanvas({ engine }: { engine: GameEngine }) {
  const setZoom = useGame((s) => s.setZoom);
  return (
    <Canvas
      orthographic shadows dpr={[1, 2]}
      camera={{ position: [12, 20, 21], near: 0.1, far: 200, zoom: 40 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onWheel={(e) => setZoom(useGame.getState().zoom * (e.deltaY > 0 ? 0.94 : 1.06))}
    >
      <CameraRig engine={engine} />
      <Lights />
      <World engine={engine} />
      <Stations engine={engine} />
      <Player engine={engine} />
      <Vehicles engine={engine} />
      <FloatingFx engine={engine} />
      <Loop engine={engine} />
    </Canvas>
  );
}
