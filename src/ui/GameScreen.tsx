import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store/useGame';
import { GameCanvas } from '../scene/GameCanvas';
import { bindKeyboard, input } from './input';
import { useT } from './i18n';
import { Toggles, goalText } from './Screens';
import { ITEM_ICON } from '../game/data/recipes';
import type { GameEngine } from '../game/systems/engine';
import type { StationKind } from '../game/types';
import { unlockAudio } from '../utils/audio';

const SHORTCUTS: StationKind[] = ['grill', 'fryer', 'drink', 'pickup'];
const VEHICLE_ICON: Record<string, string> = { yellow: '🚕', red: '🚗', blue: '🚙', green: '🚗', van: '🚐', truck: '🛻', vip: '🖤', festival: '🎉' };

function fmt(sec: number) { const s = Math.ceil(sec); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

function TopHud({ engine }: { engine: GameEngine }) {
  const t = useT();
  useGame((s) => s.tick);
  const low = engine.timeLeft < 30;
  return (
    <div className="hud-top">
      <div className="hud-chip"><label>{t('day_n', { n: engine.level.index + 1 })}</label><b>{t(engine.level.id)}</b></div>
      <div className={`hud-chip ${low ? 'danger' : ''}`}><label>{t('time')}</label><b>⏱ {fmt(engine.timeLeft)}</b></div>
      <div className="hud-chip"><label>{t('cash')}</label><b>💰 ${engine.cash}</b></div>
      <div className="hud-chip"><label>{t('rep')}</label>
        <div className="rep-bar"><i style={{ width: `${engine.reputation}%` }} /></div>
      </div>
      <div className={`hud-chip combo ${engine.combo >= 3 ? 'hot' : ''}`}><label>{t('combo')}</label><b>x{engine.combo}</b></div>
    </div>
  );
}

function Objective({ engine }: { engine: GameEngine }) {
  const t = useT();
  useGame((s) => s.tick);
  const g = engine.level.goal;
  const focus = engine.focusStation();
  const hold = engine.player.carrying;
  return (
    <div className="hud-left">
      <div className="card">
        <div className="card-title">{t('objective')}</div>
        <div className="obj-main">{t('objServe', { n: g.orders })}</div>
        <div className="obj-progress"><i style={{ width: `${Math.min(100, (engine.served / g.orders) * 100)}%` }} /><span>{engine.served} / {g.orders}</span></div>
        <div className="obj-sub">{t('obj3')}: {goalText(t, g)}</div>
        <div className="obj-stats">✗ {engine.mistakes} · ⌛ {engine.avgWait.toFixed(0)}{t('sec')} · 🔥 {engine.maxCombo}</div>
      </div>
      <div className="card holding">
        <div className="card-title">{t('holding')}</div>
        <div className="hold-item">{hold ? <>{ITEM_ICON[hold]} {t(hold)}</> : <span className="muted">{t('empty')}</span>}</div>
        {focus && <div className="focus">→ {t('st_' + focus.kind)}{focus.supply ? ` · ${t(focus.supply)}` : ''}{focus.lane !== undefined ? ` · ${t('lane', { n: focus.lane + 1 })}` : ''}</div>}
      </div>
    </div>
  );
}

function OrderQueue({ engine }: { engine: GameEngine }) {
  const t = useT();
  useGame((s) => s.tick);
  const orders = [...engine.activeOrders].sort((a, b) => a.deadline - b.deadline);
  return (
    <div className="hud-right">
      <div className="card-title light">{t('orders')} ({orders.length})</div>
      {orders.length === 0 && <div className="order-card empty">{t('noOrders')}</div>}
      {orders.slice(0, 6).map((o) => {
        const pct = Math.max(0, (o.deadline - engine.time) / o.patience);
        const atWindow = engine.carAtWindow(o.lane)?.id === o.vehicleId;
        return (
          <div key={o.id} className={`order-card ${o.priority} ${pct < 0.25 ? 'urgent' : ''} ${atWindow ? 'at-window' : ''}`}>
            <div className="order-head">
              <span className="veh">{VEHICLE_ICON[o.vehicleType]}</span>
              <span className="lane-tag">{t('lane', { n: o.lane + 1 })}</span>
              {o.priority !== 'normal' && <span className="prio">{t(o.priority)}</span>}
              <span className="secs">{Math.ceil(o.deadline - engine.time)}{t('sec')}</span>
            </div>
            <div className="order-items">
              {(() => { const pool = [...o.delivered]; return o.items.map((it, i) => {
                const k = pool.indexOf(it); const done = k >= 0; if (done) pool.splice(k, 1);
                return <span key={i} className={done ? 'done' : ''} title={t(it)}>{ITEM_ICON[it]}</span>;
              }); })()}
            </div>
            <div className="order-bar"><i style={{ width: `${pct * 100}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

function Banners({ engine }: { engine: GameEngine }) {
  const t = useT();
  useGame((s) => s.tick);
  const list = engine.banners.filter((b) => b.until > engine.time).slice(-2);
  return <div className="banners">{list.map((b, i) => <div key={b.key + i} className={`banner ${b.tone}`}>{t(b.key)}</div>)}</div>;
}

function Tutorial({ engine }: { engine: GameEngine }) {
  const t = useT();
  useGame((s) => s.tick);
  if (engine.level.index !== 0 || engine.time > 40) return null;
  const step = engine.time < 10 ? 'tutorial1' : engine.time < 22 ? 'tutorial2' : engine.time < 32 ? 'tutorial3' : 'tutorial4';
  return <div className="tutorial">💡 {t(step)}</div>;
}

function BottomBar({ engine }: { engine: GameEngine }) {
  const t = useT();
  const { setPaused, speed, cycleSpeed } = useGame();
  return (
    <div className="hud-bottom">
      <button className="btn small" onClick={() => setPaused(true)}>⏸ {t('pause')}</button>
      <button className="btn small" onClick={cycleSpeed}>⏩ {t('speed')} x{speed}</button>
      <div className="shortcuts">
        {SHORTCUTS.map((k, i) => (
          <button key={k} className="btn small ghost" onClick={() => engine.setGuide(k)}><kbd>{i + 1}</kbd> {t('st_' + k)}</button>
        ))}
      </div>
      <Toggles compact />
    </div>
  );
}

function PauseMenu() {
  const t = useT();
  const { setPaused, restart, quit } = useGame();
  return (
    <div className="overlay">
      <div className="modal">
        <h2>{t('paused')}</h2>
        <button className="btn primary big" onClick={() => setPaused(false)}>{t('resume')}</button>
        <button className="btn" onClick={restart}>{t('restart')}</button>
        <button className="btn" onClick={quit}>{t('quit')}</button>
        <div className="modal-settings"><Toggles /></div>
        <p className="keys">{t('keys')}</p>
      </div>
    </div>
  );
}

function DebugPanel({ engine }: { engine: GameEngine }) {
  const t = useT();
  useGame((s) => s.tick);
  return (
    <div className="debug">
      <div className="card-title">{t('debug')}</div>
      <div className="debug-grid">
        <span>t={engine.time.toFixed(1)}</span><span>cars={engine.vehicles.length}</span>
        <span>spawned={engine.spawned}/{engine.maxSpawn}</span><span>rain={engine.rainLevel}</span>
        <span>jam={String(engine.jam)}</span><span>rush={String(engine.rush)}</span>
      </div>
      <div className="debug-btns">
        <button onClick={() => engine.debugSpawn()}>+ car</button>
        <button onClick={() => engine.debugServeAll()}>serve window</button>
        <button onClick={() => engine.debugAddTime(30)}>+30s</button>
        <button onClick={() => { engine.cash += 500; }}>+$500</button>
        <button onClick={() => { engine.rainLevel = engine.rainLevel ? 0 : 2; }}>rain</button>
        <button onClick={() => { engine.player.moveSpeed = engine.player.moveSpeed > 5 ? 4.2 : 7; }}>speed</button>
        <button onClick={() => { engine.served = engine.level.goal.orders; engine.debugFinish(); }}>win</button>
        <button onClick={() => engine.debugFinish()}>end</button>
      </div>
    </div>
  );
}

function TouchControls({ engine }: { engine: GameEngine }) {
  const t = useT();
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef<number | null>(null);
  const move = (cx: number, cy: number) => {
    const r = base.current!.getBoundingClientRect();
    let dx = (cx - (r.left + r.width / 2)) / (r.width / 2);
    let dy = (cy - (r.top + r.height / 2)) / (r.height / 2);
    const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    setKnob({ x: dx, y: dy });
    input.setJoy(dx, -dy);
  };
  const end = () => { active.current = null; setKnob({ x: 0, y: 0 }); input.setJoy(0, 0); };
  return (
    <div className="touch">
      <div ref={base} className="joy"
        onPointerDown={(e) => { active.current = e.pointerId; (e.target as HTMLElement).setPointerCapture(e.pointerId); move(e.clientX, e.clientY); }}
        onPointerMove={(e) => { if (active.current === e.pointerId) move(e.clientX, e.clientY); }}
        onPointerUp={end} onPointerCancel={end}>
        <div className="joy-knob" style={{ transform: `translate(${knob.x * 34}px, ${knob.y * 34}px)` }} />
      </div>
      <button className="act" onPointerDown={(e) => { e.preventDefault(); unlockAudio(); engine.interact(); }}>{t('interact')}</button>
    </div>
  );
}

export function GameScreen() {
  const engine = useGame((s) => s.engine);
  const paused = useGame((s) => s.paused);
  const debug = useGame((s) => s.debug);
  const theme = useGame((s) => s.theme);
  const [touch] = useState(() => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));

  useEffect(() => bindKeyboard(), []);
  useEffect(() => {
    if (!engine) return;
    const onKey = (e: KeyboardEvent) => {
      const st = useGame.getState();
      if (e.repeat) return;
      if (e.code === 'Escape' || e.code === 'KeyP') { st.setPaused(!st.paused); return; }
      if (e.code === 'Backquote') { st.toggleDebug(); return; }
      if (st.paused) return;
      unlockAudio();
      if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') engine.interact();
      const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
      if (n >= 0) engine.setGuide(SHORTCUTS[n]);
    };
    window.addEventListener('keydown', onKey);
    // gamepad buttons (A interact, Start pause)
    let raf = 0; const prev: boolean[] = [];
    const poll = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const p = pads && pads[0];
      if (p) {
        const press = (i: number) => p.buttons[i]?.pressed && !prev[i];
        if (press(0) || press(1)) engine.interact();
        if (press(9)) { const st = useGame.getState(); st.setPaused(!st.paused); }
        p.buttons.forEach((b, i) => { prev[i] = b.pressed; });
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => { window.removeEventListener('keydown', onKey); cancelAnimationFrame(raf); };
  }, [engine]);

  if (!engine) return null;
  return (
    <div className={`game-screen ${theme}`}>
      <GameCanvas key={engine.uid} engine={engine} />
      <TopHud engine={engine} />
      <Objective engine={engine} />
      <OrderQueue engine={engine} />
      <Banners engine={engine} />
      <Tutorial engine={engine} />
      <BottomBar engine={engine} />
      {touch && <TouchControls engine={engine} />}
      {debug && <DebugPanel engine={engine} />}
      {paused && <PauseMenu />}
    </div>
  );
}
