import type {
  Character, ItemId, LevelConfig, LevelResult, MenuId, Order, Station, Vehicle, VehicleType, EventConfig,
} from '../types';
import { ASSEMBLY, BURN_TIME, COOK_RULES, DRINK_TIME, MENU_PRICE, isMenuItem } from '../data/recipes';
import { BOARD_OFFSET, LAYOUTS, WINDOW_X } from '../data/layouts';
import { UPGRADES } from '../data/levels';

export const QUEUE_GAP = 2.3;
export const SPAWN_X = -17;
export const DESPAWN_X = 17;
const PLAYER_R = 0.32;
const STATION_HALF = 0.5;
const INTERACT_RANGE = 1.25;

export type FxType = 'pickup' | 'place' | 'serve' | 'orderDone' | 'wrong' | 'fail' | 'burn' | 'ding' | 'trash' | 'order' | 'warn' | 'deny';
export interface Fx { type: FxType; x: number; z: number; text?: string; t: number }

export interface Banner { key: string; until: number; tone: 'info' | 'warn' | 'good' }

export interface Modifiers { grillSpeed: number; fryerSpeed: number; drinkSpeed: number; moveSpeed: number; patience: number }

export function modifiersFor(unlocked: string[]): Modifiers {
  const m: Modifiers = { grillSpeed: 1, fryerSpeed: 1, drinkSpeed: 1, moveSpeed: 1, patience: 1 };
  for (const u of UPGRADES) {
    if (!unlocked.includes(u.id)) continue;
    for (const [k, v] of Object.entries(u.effect)) (m as any)[k] *= v as number;
  }
  return m;
}

/** Small seeded RNG so tests are deterministic */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NORMAL_CARS: VehicleType[] = ['yellow', 'red', 'blue', 'green', 'van', 'truck'];

export class GameEngine {
  level: LevelConfig;
  mods: Modifiers;
  rand: () => number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };

  uid = Math.random().toString(36).slice(2);
  time = 0;
  stations: Station[];
  player: Character;
  vehicles: Vehicle[] = [];
  orders: Order[] = [];
  fx: Fx[] = [];
  banners: Banner[] = [];

  cash = 0;
  reputation = 50;
  combo = 0;
  maxCombo = 0;
  served = 0;
  failed = 0;
  mistakes = 0;
  waitTotal = 0;
  vipServed = 0;
  vipTotal = 0;

  spawned = 0;
  maxSpawn: number;
  nextSpawn = 2;
  nextId = 1;
  finished = false;
  rainLevel = 0;      // 0 none, 1 rain, 2 heavy
  jam = false;
  rush = false;
  guide: { stationId: string; until: number } | null = null;
  private eventsFired = new Set<number>();
  private eventsWarned = new Set<number>();

  constructor(level: LevelConfig, unlocked: string[] = [], seed = Date.now()) {
    this.level = level;
    this.mods = modifiersFor(unlocked);
    this.rand = mulberry32(seed);
    const layout = LAYOUTS[level.layout];
    this.bounds = { minX: layout.minX, maxX: layout.maxX, minZ: layout.minZ, maxZ: layout.maxZ };
    this.stations = layout.stations
      .filter((s) => s.kind !== 'pickup' || (s.lane ?? 0) < level.lanes)
      .filter((s) => s.supply !== 'chicken' || level.menu.includes('nuggets'))
      .filter((s) => s.supply !== 'potato' || level.menu.includes('fries'))
      .map((s) => ({ ...s, item: null, contents: [], progress: 0, state: 'idle', brokenUntil: 0, warnAt: 0 }));
    this.player = { x: 0, z: 1.5, dir: Math.PI, moveSpeed: 4.2, carrying: null, anim: 'idle', animTimer: 0 };
    this.rainLevel = level.rain ? 1 : 0;
    this.maxSpawn = Math.ceil(level.goal.orders * 1.2);
  }

  // ---------------------------------------------------------------- helpers
  get activeOrders() { return this.orders.filter((o) => o.status === 'queued' || o.status === 'ready'); }
  get avgWait() { return this.served ? this.waitTotal / this.served : 0; }
  get timeLeft() { return Math.max(0, this.level.timeLimit - this.time); }
  station(id: string) { return this.stations.find((s) => s.id === id); }

  private emit(type: FxType, x: number, z: number, text?: string) {
    this.fx.push({ type, x, z, text, t: this.time });
    if (this.fx.length > 40) this.fx.shift();
  }
  private banner(key: string, tone: Banner['tone'] = 'info', dur = 3) {
    this.banners = this.banners.filter((b) => b.until > this.time);
    this.banners.push({ key, until: this.time + dur, tone });
  }

  /** nearest interactable station in front of the player */
  focusStation(): Station | null {
    const p = this.player;
    const px = p.x + Math.sin(p.dir) * 0.55;
    const pz = p.z + Math.cos(p.dir) * 0.55;
    let best: Station | null = null;
    let bd = INTERACT_RANGE;
    for (const s of this.stations) {
      const d = Math.hypot(s.x - px, s.z - pz);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  }

  // ---------------------------------------------------------------- update
  update(dt: number, input: { x: number; z: number }) {
    if (this.finished) return;
    dt = Math.min(dt, 0.1);
    this.time += dt;
    this.updateEvents();
    this.updatePlayer(dt, input);
    this.updateStations(dt);
    this.updateSpawning();
    this.updateVehicles(dt);
    this.updateOrders();
    this.checkEnd();
  }

  private updateEvents() {
    this.level.events.forEach((e, i) => {
      if (!this.eventsWarned.has(i) && this.time >= e.at - 5) {
        this.eventsWarned.add(i);
        this.banner(`event.${e.type}.warn`, 'warn', 4);
        if (e.type === 'breakdown') this.scheduleBreakdown(e);
        this.emit('warn', 0, 0);
      }
      if (!this.eventsFired.has(i) && this.time >= e.at) {
        this.eventsFired.add(i);
        this.banner(`event.${e.type}.start`, 'warn', 3);
      }
    });
    const active = (t: EventConfig['type']) => this.level.events.some((e) => e.type === t && this.time >= e.at && this.time < e.at + e.duration);
    const base = this.level.rain ? 1 : 0;
    this.rainLevel = active('rain') ? Math.min(2, base + 1) : base;
    const wasJam = this.jam;
    this.jam = active('jam');
    if (wasJam && !this.jam) { this.nextSpawn = this.time + 0.5; this.banner('event.jam.end', 'info'); }
    this.rush = active('rush');
  }

  private scheduleBreakdown(e: EventConfig) {
    const cands = this.stations.filter((s) => s.kind === 'grill' || s.kind === 'fryer' || s.kind === 'drink');
    const s = cands[Math.floor(this.rand() * cands.length)];
    s.warnAt = e.at - 5;
    s.brokenUntil = e.at + e.duration;
  }

  private updatePlayer(dt: number, input: { x: number; z: number }) {
    const p = this.player;
    let { x: ix, z: iz } = input;
    const len = Math.hypot(ix, iz);
    if (len > 1) { ix /= len; iz /= len; }
    const rainMul = this.rainLevel === 2 ? 0.72 : this.rainLevel === 1 ? 0.86 : 1;
    const speed = p.moveSpeed * this.mods.moveSpeed * rainMul;
    if (len > 0.08) {
      let nx = p.x + ix * speed * dt;
      let nz = p.z + iz * speed * dt;
      const target = Math.atan2(ix, iz);
      let da = target - p.dir;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      p.dir += da * Math.min(1, dt * 14);
      nx = Math.min(this.bounds.maxX - PLAYER_R, Math.max(this.bounds.minX + PLAYER_R, nx));
      nz = Math.min(this.bounds.maxZ - PLAYER_R, Math.max(this.bounds.minZ + PLAYER_R, nz));
      // push out of station boxes
      for (const s of this.stations) {
        const cx = Math.max(s.x - STATION_HALF, Math.min(nx, s.x + STATION_HALF));
        const cz = Math.max(s.z - STATION_HALF, Math.min(nz, s.z + STATION_HALF));
        const dx = nx - cx, dz = nz - cz;
        const d = Math.hypot(dx, dz);
        if (d < PLAYER_R) {
          if (d > 1e-5) { nx = cx + (dx / d) * PLAYER_R; nz = cz + (dz / d) * PLAYER_R; }
          else { nz = s.z + STATION_HALF + PLAYER_R; }
        }
      }
      p.x = nx; p.z = nz;
      if (p.animTimer <= 0) p.anim = 'walk';
    } else if (p.animTimer <= 0) p.anim = 'idle';
    if (p.animTimer > 0) p.animTimer -= dt;
  }

  private heatSpeed(kind: Station['kind']) {
    return kind === 'grill' ? this.mods.grillSpeed : kind === 'fryer' ? this.mods.fryerSpeed : this.mods.drinkSpeed;
  }

  private updateStations(dt: number) {
    for (const s of this.stations) {
      if (s.brokenUntil > 0) {
        if (this.time >= s.brokenUntil) { s.brokenUntil = 0; s.warnAt = 0; this.banner('event.breakdown.fixed', 'good'); }
        else if (this.time >= s.warnAt + 5) { s.state = 'broken'; continue; }
      }
      if (s.state === 'broken') s.state = s.item ? 'processing' : 'idle';
      if (s.kind === 'grill' || s.kind === 'fryer') {
        if (!s.item) { s.state = 'idle'; s.progress = 0; continue; }
        const rule = COOK_RULES[s.kind][s.item];
        if (rule) {
          s.progress += (dt * this.heatSpeed(s.kind)) / rule.time;
          s.state = 'processing';
          if (s.progress >= 1) { s.item = rule.out; s.progress = 1; s.state = 'ready'; this.emit('ding', s.x, s.z); }
        } else if (this.isCooked(s.item)) {
          s.progress += dt / BURN_TIME;
          s.state = s.progress > 1.35 ? 'burning' : 'ready';
          if (s.progress >= 2) {
            s.item = this.burntOf(s.item); s.state = 'burnt'; s.progress = 2;
            this.emit('burn', s.x, s.z); this.reputation = Math.max(0, this.reputation - 1);
          }
        } else s.state = 'burnt';
      } else if (s.kind === 'drink') {
        if (s.state === 'processing') {
          s.progress += (dt * this.heatSpeed('drink')) / DRINK_TIME;
          if (s.progress >= 1) { s.progress = 1; s.item = 'soda'; s.state = 'ready'; this.emit('ding', s.x, s.z); }
        } else if (!s.item) { s.state = 'idle'; s.progress = 0; }
      }
    }
  }

  private isCooked(i: ItemId) { return i === 'patty_cooked' || i === 'fries' || i === 'nuggets'; }
  private burntOf(i: ItemId): ItemId { return i === 'patty_cooked' ? 'patty_burnt' : i === 'fries' ? 'fries_burnt' : 'nuggets_burnt'; }

  // ---------------------------------------------------------------- vehicles
  private updateSpawning() {
    if (this.jam || this.spawned >= this.maxSpawn) return;
    if (this.time > this.level.timeLimit - 25) return;
    if (this.time < this.nextSpawn) return;
    // choose lane with shortest queue
    let lane = 0, best = Infinity;
    for (let l = 0; l < this.level.lanes; l++) {
      const n = this.vehicles.filter((v) => v.lane === l && v.phase !== 'driveOut').length + this.rand() * 0.5;
      if (n < best) { best = n; lane = l; }
    }
    if (best >= 5) { this.nextSpawn = this.time + 2; return; }
    const r = this.rand();
    const vip = r < this.level.vipChance;
    const type: VehicleType = vip ? 'vip' : this.rand() < 0.08 ? 'festival' : NORMAL_CARS[Math.floor(this.rand() * NORMAL_CARS.length)];
    this.vehicles.push({ id: this.nextId++, type, lane, x: SPAWN_X, speed: 0, phase: 'driveIn', orderId: null, orderTimer: 0, mood: 'ok' });
    this.spawned++;
    const [a, b] = this.level.spawnInterval;
    const fit = (this.level.timeLimit - 30) / this.maxSpawn / ((a + b) / 2);
    let interval = (a + this.rand() * (b - a)) * Math.min(1, fit);
    if (this.rush) interval *= 0.5;
    this.nextSpawn = this.time + interval;
  }

  windowX(lane: number) { return WINDOW_X[lane]; }

  private updateVehicles(dt: number) {
    const jamMul = this.jam ? 0.35 : 1;
    for (let lane = 0; lane < this.level.lanes; lane++) {
      const wx = this.windowX(lane);
      const board = wx - BOARD_OFFSET;
      const queue = this.vehicles.filter((v) => v.lane === lane && v.phase !== 'driveOut' && v.phase !== 'gone').sort((a, b) => b.x - a.x);
      queue.forEach((v, i) => {
        let target = wx - i * QUEUE_GAP;
        if (v.orderId === null) target = Math.min(target, board);
        // never overlap car ahead
        if (i > 0) target = Math.min(target, queue[i - 1].x - QUEUE_GAP);
        if (v.phase === 'ordering') {
          v.orderTimer -= dt;
          v.speed = 0;
          if (v.orderTimer <= 0) this.createOrder(v);
          return;
        }
        const dist = target - v.x;
        const maxSpeed = 7 * jamMul;
        const desired = Math.max(0, Math.min(maxSpeed, dist * 2.2));
        v.speed += (desired - v.speed) * Math.min(1, dt * 4);
        v.x = Math.min(target, v.x + v.speed * dt);
        if (v.orderId === null && Math.abs(v.x - board) < 0.05 && v.phase === 'driveIn') {
          v.phase = 'ordering'; v.orderTimer = 1.0;
        }
      });
    }
    for (const v of this.vehicles) {
      if (v.phase !== 'driveOut') continue;
      v.speed = Math.min(9, v.speed + dt * 8);
      v.x += v.speed * dt;
      if (v.x > DESPAWN_X) v.phase = 'gone';
    }
    this.vehicles = this.vehicles.filter((v) => v.phase !== 'gone');
  }

  private createOrder(v: Vehicle) {
    const lvl = this.level;
    const count = 1 + Math.floor(this.rand() * lvl.maxItemsPerOrder);
    const items: MenuId[] = [];
    for (let i = 0; i < count; i++) items.push(lvl.menu[Math.floor(this.rand() * lvl.menu.length)]);
    const priority = v.type === 'vip' ? 'vip' : this.rand() < lvl.rushChance ? 'rush' : 'normal';
    const patience = lvl.patience * this.mods.patience * (priority === 'vip' ? 0.8 : priority === 'rush' ? 0.65 : 1) + items.length * 8;
    const reward = items.reduce((s, i) => s + MENU_PRICE[i], 0) * (priority === 'vip' ? 2 : priority === 'rush' ? 1.5 : 1);
    const o: Order = {
      id: this.nextId++, vehicleId: v.id, vehicleType: v.type, lane: v.lane, items, delivered: [],
      createdAt: this.time, deadline: this.time + patience, patience, priority, reward, status: 'queued',
    };
    if (priority === 'vip') this.vipTotal++;
    this.orders.push(o);
    v.orderId = o.id;
    v.phase = 'waiting';
    this.emit('order', this.windowX(v.lane) - BOARD_OFFSET, 6);
  }

  /** vehicle currently stopped at a lane's pickup window */
  carAtWindow(lane: number): Vehicle | undefined {
    const wx = this.windowX(lane);
    return this.vehicles.find((v) => v.lane === lane && v.phase === 'waiting' && Math.abs(v.x - wx) < 0.15);
  }
  orderOf(v: Vehicle | undefined) { return v ? this.orders.find((o) => o.id === v.orderId) : undefined; }

  private updateOrders() {
    for (const o of this.orders) {
      if (o.status !== 'queued' && o.status !== 'ready') continue;
      if (this.time >= o.deadline) this.failOrder(o);
    }
    // auto-deliver staged items at pickup windows
    for (const s of this.stations) {
      if (s.kind !== 'pickup') continue;
      const car = this.carAtWindow(s.lane!);
      const o = this.orderOf(car);
      if (!car || !o) continue;
      o.status = 'ready';
      for (let i = s.contents.length - 1; i >= 0; i--) {
        const it = s.contents[i];
        if (isMenuItem(it) && this.remaining(o).includes(it)) {
          o.delivered.push(it); s.contents.splice(i, 1);
        }
      }
      if (this.remaining(o).length === 0) this.completeOrder(o, car);
    }
  }

  remaining(o: Order): MenuId[] {
    const left = [...o.items];
    for (const d of o.delivered) { const i = left.indexOf(d); if (i >= 0) left.splice(i, 1); }
    return left;
  }

  private completeOrder(o: Order, v: Vehicle) {
    o.status = 'served';
    this.served++;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const wait = this.time - o.createdAt;
    this.waitTotal += wait;
    const onTime = o.deadline - this.time > o.patience * 0.4 ? 100 : 0;
    const mult = 1 + Math.min(this.combo - 1, 10) * 0.1;
    const gain = Math.round((o.reward + onTime) * mult);
    this.cash += gain;
    this.reputation = Math.min(100, this.reputation + (o.priority === 'vip' ? 5 : 3));
    if (o.priority === 'vip') this.vipServed++;
    v.phase = 'driveOut'; v.mood = 'happy';
    this.player.anim = 'happy'; this.player.animTimer = 0.6;
    this.emit('orderDone', this.windowX(o.lane), 5, `+$${gain}`);
    if (this.combo >= 3 && this.combo % 3 === 0) this.banner('comboBanner', 'good', 1.5);
  }

  private failOrder(o: Order) {
    o.status = 'failed';
    this.failed++;
    this.combo = 0;
    this.reputation = Math.max(0, this.reputation - (o.priority === 'vip' ? 15 : 6));
    this.cash = Math.max(0, this.cash - (o.priority === 'vip' ? 80 : 20));
    const v = this.vehicles.find((x) => x.id === o.vehicleId);
    if (v) { v.phase = 'driveOut'; v.mood = 'angry'; }
    this.emit('fail', this.windowX(o.lane), 5, o.priority === 'vip' ? '-$80' : '-$20');
  }

  private checkEnd() {
    const allDone = this.spawned >= this.maxSpawn && this.vehicles.length === 0;
    const goalDone = this.served >= this.level.goal.orders && this.activeOrders.length === 0 && this.time > 5;
    if (this.time >= this.level.timeLimit || allDone || goalDone) {
      for (const o of this.activeOrders) { o.status = 'failed'; this.failed++; }
      this.finished = true;
    }
  }

  // ---------------------------------------------------------------- actions
  interact() {
    if (this.finished) return;
    const s = this.focusStation();
    const p = this.player;
    if (!s) return;
    const fail = () => { this.emit('deny', s.x, s.z); };
    if (s.state === 'broken') { this.emit('deny', s.x, s.z, '🔧'); return; }
    const hold = p.carrying;
    const take = (item: ItemId) => { p.carrying = item; this.emit('pickup', s.x, s.z); };
    switch (s.kind) {
      case 'storage':
        if (!hold) take(s.supply!);
        else if (hold === s.supply) { p.carrying = null; this.emit('place', s.x, s.z); }
        else fail();
        return;
      case 'grill':
      case 'fryer': {
        const rules = COOK_RULES[s.kind];
        if (hold && !s.item && rules[hold]) { s.item = hold; p.carrying = null; s.progress = 0; s.state = 'processing'; this.cookAnim(); this.emit('place', s.x, s.z); }
        else if (!hold && s.item) { take(s.item); s.item = null; s.progress = 0; s.state = 'idle'; }
        else fail();
        return;
      }
      case 'drink':
        if (!hold && s.item) { take(s.item); s.item = null; s.state = 'idle'; s.progress = 0; }
        else if (!hold && s.state === 'idle') { s.state = 'processing'; s.progress = 0; this.cookAnim(); this.emit('place', s.x, s.z); }
        else fail();
        return;
      case 'assembly': {
        if (hold) {
          const recipe = ASSEMBLY.find((r) => r.needs.includes(hold));
          if (recipe && !s.item && !s.contents.includes(hold)) {
            s.contents.push(hold); p.carrying = null; this.emit('place', s.x, s.z);
            const done = ASSEMBLY.find((r) => r.needs.every((n) => s.contents.includes(n)));
            if (done) { s.contents = []; s.item = done.out; this.cookAnim(); this.emit('ding', s.x, s.z); }
          } else if (!s.item && s.contents.length === 0) { s.item = hold; p.carrying = null; this.emit('place', s.x, s.z); }
          else fail();
        } else if (s.item) { take(s.item); s.item = null; }
        else if (s.contents.length) take(s.contents.pop()!);
        return;
      }
      case 'counter':
        if (hold && !s.item) { s.item = hold; p.carrying = null; this.emit('place', s.x, s.z); }
        else if (!hold && s.item) { take(s.item); s.item = null; }
        else fail();
        return;
      case 'pickup': {
        if (!hold) { if (s.contents.length) take(s.contents.pop()!); return; }
        if (!isMenuItem(hold)) { this.wrong(s, hold); return; }
        const car = this.carAtWindow(s.lane!);
        const o = this.orderOf(car);
        if (o && !this.remaining(o).includes(hold)) { this.wrong(s, hold); return; }
        if (!o && s.contents.length >= 3) { fail(); return; }
        s.contents.push(hold); p.carrying = null;
        p.anim = 'serve'; p.animTimer = 0.35;
        this.emit('serve', s.x, s.z);
        this.updateOrders();
        return;
      }
      case 'trash':
        if (hold) { p.carrying = null; this.emit('trash', s.x, s.z); }
        return;
    }
  }

  private wrong(s: Station, _item: ItemId) {
    this.player.carrying = null;
    this.mistakes++;
    this.combo = 0;
    this.reputation = Math.max(0, this.reputation - 2);
    this.cash = Math.max(0, this.cash - 10);
    this.player.anim = 'fail'; this.player.animTimer = 0.6;
    this.emit('wrong', s.x, s.z, '✗');
  }

  private cookAnim() { this.player.anim = 'cook'; this.player.animTimer = 0.3; }

  setGuide(kind: Station['kind']) {
    const s = this.stations.filter((x) => x.kind === kind).sort((a, b) =>
      Math.hypot(a.x - this.player.x, a.z - this.player.z) - Math.hypot(b.x - this.player.x, b.z - this.player.z))[0];
    if (s) this.guide = { stationId: s.id, until: this.time + 2.5 };
  }

  // ---------------------------------------------------------------- debug
  debugSpawn() { this.nextSpawn = this.time; this.maxSpawn++; }
  debugAddTime(sec: number) { this.time = Math.max(0, this.time - sec); }
  debugServeAll() {
    for (let l = 0; l < this.level.lanes; l++) {
      const car = this.carAtWindow(l); const o = this.orderOf(car);
      if (car && o) { o.delivered = [...o.items]; this.completeOrder(o, car); }
    }
  }
  debugFinish() { this.time = this.level.timeLimit; }

  // ---------------------------------------------------------------- result
  result(): LevelResult {
    const g = this.level.goal;
    let stars = 0;
    if (this.served >= Math.ceil(g.orders * 0.6)) stars = 1;
    if (this.served >= g.orders) stars = 2;
    if (stars === 2 && this.mistakes <= g.maxMistakes
      && (g.avgWaitBelow === undefined || this.avgWait < g.avgWaitBelow)
      && (g.minCombo === undefined || this.maxCombo >= g.minCombo)
      && (!g.vipPerfect || this.vipServed === this.vipTotal)) stars = 3;
    return {
      served: this.served, failed: this.failed, mistakes: this.mistakes, avgWait: this.avgWait,
      maxCombo: this.maxCombo, cash: this.cash, reputation: this.reputation,
      vipServed: this.vipServed, vipTotal: this.vipTotal, stars,
    };
  }
}
