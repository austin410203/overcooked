export type ItemId =
  | 'bun' | 'patty_raw' | 'patty_cooked' | 'patty_burnt'
  | 'potato' | 'fries' | 'fries_burnt'
  | 'chicken' | 'nuggets' | 'nuggets_burnt'
  | 'soda' | 'burger';

/** Items a customer can order */
export type MenuId = 'burger' | 'fries' | 'nuggets' | 'soda';

export type StationKind = 'storage' | 'grill' | 'fryer' | 'drink' | 'assembly' | 'counter' | 'pickup' | 'trash';

export type StationState = 'idle' | 'processing' | 'ready' | 'burning' | 'burnt' | 'broken';

export interface StationConfig {
  id: string;
  kind: StationKind;
  x: number;
  z: number;
  /** storage: which raw item it dispenses */
  supply?: ItemId;
  /** pickup: which lane it serves */
  lane?: number;
  /** rotation (radians) for visuals */
  rot?: number;
}

export interface Station extends StationConfig {
  item: ItemId | null;      // item currently on station
  contents: ItemId[];       // assembly ingredients
  progress: number;         // 0..1 processing, 1..2 burning
  state: StationState;
  brokenUntil: number;
  warnAt: number;
}

export type VehicleType = 'yellow' | 'red' | 'blue' | 'green' | 'van' | 'truck' | 'vip' | 'festival';

export type Priority = 'normal' | 'vip' | 'rush';

export interface Order {
  id: number;
  vehicleId: number;
  vehicleType: VehicleType;
  lane: number;
  items: MenuId[];
  delivered: MenuId[];
  createdAt: number;
  deadline: number;      // absolute game time
  patience: number;      // total seconds
  priority: Priority;
  reward: number;
  status: 'queued' | 'ready' | 'served' | 'failed';
}

export type VehiclePhase = 'driveIn' | 'ordering' | 'waiting' | 'driveOut' | 'gone';

export interface Vehicle {
  id: number;
  type: VehicleType;
  lane: number;
  x: number;
  speed: number;
  phase: VehiclePhase;
  orderId: number | null;
  orderTimer: number;
  mood: 'ok' | 'happy' | 'angry';
}

export interface Character {
  x: number;
  z: number;
  dir: number;           // facing angle
  moveSpeed: number;
  carrying: ItemId | null;
  anim: 'idle' | 'walk' | 'cook' | 'serve' | 'happy' | 'fail';
  animTimer: number;
}

export type EventType = 'rain' | 'jam' | 'breakdown' | 'rush';

export interface EventConfig {
  type: EventType;
  at: number;        // seconds since level start
  duration: number;
}

export interface Goal {
  orders: number;          // orders needed (2 stars)
  maxMistakes: number;     // for 3 stars
  avgWaitBelow?: number;   // for 3 stars
  minCombo?: number;       // for 3 stars
  vipPerfect?: boolean;    // for 3 stars
}

export interface LevelConfig {
  id: string;
  index: number;
  lanes: number;
  layout: 'standard' | 'wide';
  timeLimit: number;
  menu: MenuId[];
  maxItemsPerOrder: number;
  spawnInterval: [number, number];
  patience: number;
  vipChance: number;
  rushChance: number;
  rain: boolean;
  night: boolean;
  events: EventConfig[];
  goal: Goal;
  unlock?: string;
}

export interface Upgrade {
  id: string;
  afterLevel: number;
  effect: { grillSpeed?: number; fryerSpeed?: number; drinkSpeed?: number; moveSpeed?: number; patience?: number };
}

export interface LevelResult {
  served: number;
  failed: number;
  mistakes: number;
  avgWait: number;
  maxCombo: number;
  cash: number;
  reputation: number;
  vipServed: number;
  vipTotal: number;
  stars: number;
}
