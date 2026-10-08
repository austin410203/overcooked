import type { LevelConfig, Upgrade } from '../types';

const base = {
  layout: 'standard' as const,
  maxItemsPerOrder: 2,
  vipChance: 0,
  rushChance: 0,
  rain: false,
  night: false,
  events: [],
};

export const LEVELS: LevelConfig[] = [
  { ...base, id: 'L01', index: 0, lanes: 1, timeLimit: 210, menu: ['burger', 'fries', 'soda'],
    maxItemsPerOrder: 2, spawnInterval: [11, 15], patience: 70,
    goal: { orders: 15, maxMistakes: 1, avgWaitBelow: 40 } },
  { ...base, id: 'L02', index: 1, lanes: 2, timeLimit: 240, menu: ['burger', 'nuggets', 'soda'],
    spawnInterval: [8, 11], patience: 75,
    goal: { orders: 25, maxMistakes: 3 }, unlock: 'fast_grill' },
  { ...base, id: 'L03', index: 2, lanes: 2, timeLimit: 220, menu: ['burger', 'fries', 'soda'],
    spawnInterval: [9, 12], patience: 70, rain: true,
    events: [{ type: 'rain', at: 60, duration: 40 }],
    goal: { orders: 20, maxMistakes: 3, avgWaitBelow: 38 }, unlock: 'big_fryer' },
  { ...base, id: 'L04', index: 3, lanes: 2, timeLimit: 240, menu: ['burger', 'fries', 'nuggets', 'soda'],
    maxItemsPerOrder: 3, spawnInterval: [6, 9], patience: 80, night: true, rushChance: 0.15,
    events: [{ type: 'rush', at: 90, duration: 25 }, { type: 'rush', at: 170, duration: 20 }],
    goal: { orders: 35, maxMistakes: 4, minCombo: 8 }, unlock: 'quick_shoes' },
  { ...base, id: 'L05', index: 4, lanes: 3, timeLimit: 270, menu: ['burger', 'fries', 'nuggets', 'soda'],
    spawnInterval: [6, 8.5], patience: 80,
    events: [{ type: 'jam', at: 50, duration: 20 }, { type: 'jam', at: 150, duration: 20 }],
    goal: { orders: 40, maxMistakes: 4 }, unlock: 'fast_drink' },
  { ...base, id: 'L06', index: 5, lanes: 2, timeLimit: 240, menu: ['burger', 'fries', 'nuggets', 'soda'],
    spawnInterval: [7, 10], patience: 75, vipChance: 0.35,
    goal: { orders: 20, maxMistakes: 3, vipPerfect: true }, unlock: 'patient_fans' },
  { ...base, id: 'L07', index: 6, lanes: 3, layout: 'wide', timeLimit: 300, menu: ['burger', 'fries', 'nuggets', 'soda'],
    maxItemsPerOrder: 3, spawnInterval: [5.5, 7.5], patience: 85,
    goal: { orders: 50, maxMistakes: 5, minCombo: 12 } },
  { ...base, id: 'L08', index: 7, lanes: 3, timeLimit: 300, menu: ['burger', 'fries', 'nuggets', 'soda'],
    maxItemsPerOrder: 3, spawnInterval: [4.5, 6.5], patience: 85, vipChance: 0.15, rushChance: 0.1,
    events: [
      { type: 'rain', at: 40, duration: 50 }, { type: 'breakdown', at: 75, duration: 12 },
      { type: 'jam', at: 120, duration: 18 }, { type: 'breakdown', at: 170, duration: 12 },
      { type: 'rain', at: 200, duration: 60 }, { type: 'jam', at: 240, duration: 15 },
    ],
    goal: { orders: 60, maxMistakes: 5 } },
];

export const UPGRADES: Upgrade[] = [
  { id: 'fast_grill', afterLevel: 1, effect: { grillSpeed: 1.25 } },
  { id: 'big_fryer', afterLevel: 2, effect: { fryerSpeed: 1.25 } },
  { id: 'quick_shoes', afterLevel: 3, effect: { moveSpeed: 1.1 } },
  { id: 'fast_drink', afterLevel: 4, effect: { drinkSpeed: 1.4 } },
  { id: 'patient_fans', afterLevel: 5, effect: { patience: 1.1 } },
];
