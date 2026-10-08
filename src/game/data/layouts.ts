import type { StationConfig } from '../types';

export interface Layout {
  /** kitchen interior bounds (walkable) */
  minX: number; maxX: number; minZ: number; maxZ: number;
  stations: StationConfig[];
}

export const LANE_Z = (lane: number) => 5.7 + lane * 1.55;
export const WINDOW_X = [4.2, 0.6, -3.0];
export const BOARD_OFFSET = 4.6;
export const SOUTH_WALL_Z = 4;

const pickups = (): StationConfig[] =>
  WINDOW_X.map((x, lane) => ({ id: `pickup${lane}`, kind: 'pickup' as const, x, z: 3.25, lane }));

const standard: Layout = {
  minX: -5.9, maxX: 5.9, minZ: -4.5, maxZ: 3.5,
  stations: [
    { id: 'st_bun', kind: 'storage', supply: 'bun', x: -5.0, z: -3.85 },
    { id: 'st_patty', kind: 'storage', supply: 'patty_raw', x: -3.85, z: -3.85 },
    { id: 'st_potato', kind: 'storage', supply: 'potato', x: -2.7, z: -3.85 },
    { id: 'st_chicken', kind: 'storage', supply: 'chicken', x: -1.55, z: -3.85 },
    { id: 'grill1', kind: 'grill', x: 0.3, z: -3.85 },
    { id: 'grill2', kind: 'grill', x: 1.45, z: -3.85 },
    { id: 'fryer1', kind: 'fryer', x: 3.5, z: -3.85 },
    { id: 'fryer2', kind: 'fryer', x: 4.65, z: -3.85 },
    { id: 'drink1', kind: 'drink', x: 5.3, z: -1.9, rot: -Math.PI / 2 },
    { id: 'drink2', kind: 'drink', x: 5.3, z: -0.75, rot: -Math.PI / 2 },
    { id: 'asm1', kind: 'assembly', x: -0.6, z: -0.6 },
    { id: 'asm2', kind: 'assembly', x: 0.55, z: -0.6 },
    { id: 'ctr1', kind: 'counter', x: -1.75, z: -0.6 },
    { id: 'ctr2', kind: 'counter', x: 1.7, z: -0.6 },
    { id: 'trash', kind: 'trash', x: -5.3, z: 0.9, rot: Math.PI / 2 },
    ...pickups(),
  ],
};

/** Level 07: long-distance stations, raw food far west, heat far east */
const wide: Layout = {
  minX: -8.9, maxX: 8.9, minZ: -4.5, maxZ: 3.5,
  stations: [
    { id: 'st_bun', kind: 'storage', supply: 'bun', x: -8.3, z: -3.0, rot: Math.PI / 2 },
    { id: 'st_patty', kind: 'storage', supply: 'patty_raw', x: -8.3, z: -1.85, rot: Math.PI / 2 },
    { id: 'st_potato', kind: 'storage', supply: 'potato', x: -8.3, z: -0.7, rot: Math.PI / 2 },
    { id: 'st_chicken', kind: 'storage', supply: 'chicken', x: -8.3, z: 0.45, rot: Math.PI / 2 },
    { id: 'grill1', kind: 'grill', x: 6.0, z: -3.85 },
    { id: 'grill2', kind: 'grill', x: 7.15, z: -3.85 },
    { id: 'fryer1', kind: 'fryer', x: 8.3, z: -2.2, rot: -Math.PI / 2 },
    { id: 'fryer2', kind: 'fryer', x: 8.3, z: -1.05, rot: -Math.PI / 2 },
    { id: 'drink1', kind: 'drink', x: -3.2, z: -3.85 },
    { id: 'drink2', kind: 'drink', x: -2.05, z: -3.85 },
    { id: 'asm1', kind: 'assembly', x: 1.6, z: -1.0 },
    { id: 'asm2', kind: 'assembly', x: 2.75, z: -1.0 },
    { id: 'ctr1', kind: 'counter', x: -4.0, z: -1.0 },
    { id: 'ctr2', kind: 'counter', x: -2.85, z: -1.0 },
    { id: 'ctr3', kind: 'counter', x: 6.2, z: 0.6 },
    { id: 'trash', kind: 'trash', x: 8.3, z: 1.6, rot: -Math.PI / 2 },
    ...pickups(),
  ],
};

export const LAYOUTS = { standard, wide };
