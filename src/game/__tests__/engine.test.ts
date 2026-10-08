import { describe, it, expect } from 'vitest';
import { GameEngine } from '../systems/engine';
import { LEVELS } from '../data/levels';

const still = { x: 0, z: 0 };
function face(e: GameEngine, id: string) {
  const s = e.station(id)!;
  // stand next to station, facing it
  e.player.x = s.x; e.player.z = s.z + 0.95; e.player.dir = Math.PI;
  if (s.z > 3) { e.player.z = s.z - 0.95; e.player.dir = Math.PI; e.player.dir = Math.PI; e.player.z = s.z - 0.95; e.player.dir = 0; }
  if (s.x > 5) { e.player.x = s.x - 0.95; e.player.z = s.z; e.player.dir = Math.PI / 2; }
  if (s.x < -5) { e.player.x = s.x + 0.95; e.player.z = s.z; e.player.dir = -Math.PI / 2; }
  expect(e.focusStation()?.id).toBe(id);
}
function run(e: GameEngine, sec: number) { for (let i = 0; i < sec * 20; i++) e.update(0.05, still); }

describe('GameEngine', () => {
  it('cooks a patty, assembles a burger', () => {
    const e = new GameEngine(LEVELS[0], [], 1);
    face(e, 'st_patty'); e.interact(); expect(e.player.carrying).toBe('patty_raw');
    face(e, 'grill1'); e.interact(); expect(e.station('grill1')!.item).toBe('patty_raw');
    run(e, 5.2);
    expect(e.station('grill1')!.item).toBe('patty_cooked');
    face(e, 'grill1'); e.interact(); expect(e.player.carrying).toBe('patty_cooked');
    face(e, 'asm1'); e.interact();
    face(e, 'st_bun'); e.interact();
    face(e, 'asm1'); e.interact();
    expect(e.station('asm1')!.item).toBe('burger');
  });

  it('burns food left too long', () => {
    const e = new GameEngine(LEVELS[0], [], 1);
    face(e, 'st_potato'); e.interact();
    face(e, 'fryer1'); e.interact();
    run(e, 4 + 7 + 0.5);
    expect(e.station('fryer1')!.item).toBe('fries_burnt');
  });

  it('spawns cars that order and get served at the window', () => {
    const e = new GameEngine(LEVELS[0], [], 7);
    run(e, 8);
    const car = e.carAtWindow(0);
    expect(car).toBeDefined();
    const o = e.orderOf(car)!;
    expect(o.items.length).toBeGreaterThan(0);
    for (const it of o.items) { e.player.carrying = it; face(e, 'pickup0'); e.interact(); }
    expect(o.status).toBe('served');
    expect(e.served).toBe(1);
    expect(e.cash).toBeGreaterThan(0);
  });

  it('wrong item counts as mistake and breaks combo', () => {
    const e = new GameEngine(LEVELS[0], [], 7);
    run(e, 8);
    const o = e.orderOf(e.carAtWindow(0))!;
    const wrong = (['burger', 'fries', 'soda'] as const).find((i) => !o.items.includes(i))!;
    e.player.carrying = wrong; face(e, 'pickup0'); e.interact();
    expect(e.mistakes).toBe(1);
    expect(e.combo).toBe(0);
  });

  it('orders expire and fail', () => {
    const e = new GameEngine(LEVELS[0], [], 3);
    run(e, 120);
    expect(e.failed).toBeGreaterThan(0);
    expect(e.reputation).toBeLessThan(50);
  });

  it('awards stars by goal', () => {
    const e = new GameEngine(LEVELS[0], [], 3);
    e.served = 15; e.mistakes = 0; e.waitTotal = 15 * 10;
    expect(e.result().stars).toBe(3);
    e.served = 9; expect(e.result().stars).toBe(1);
  });

  it('every level config builds', () => {
    for (const l of LEVELS) { const e = new GameEngine(l, [], 1); run(e, 30); expect(e.stations.filter((s) => s.kind === 'pickup').length).toBe(l.lanes); }
  });
});
