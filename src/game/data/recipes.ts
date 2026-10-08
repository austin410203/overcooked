import type { ItemId, MenuId } from '../types';

/** Raw → processed rules for heat stations */
export const COOK_RULES: Record<'grill' | 'fryer', Partial<Record<ItemId, { out: ItemId; burnt: ItemId; time: number }>>> = {
  grill: { patty_raw: { out: 'patty_cooked', burnt: 'patty_burnt', time: 5 } },
  fryer: {
    potato: { out: 'fries', burnt: 'fries_burnt', time: 4 },
    chicken: { out: 'nuggets', burnt: 'nuggets_burnt', time: 5 },
  },
};
/** seconds after ready before item burns */
export const BURN_TIME = 7;
export const DRINK_TIME = 2.5;

/** Assembly recipes: ingredients (any order) → product */
export const ASSEMBLY: { needs: ItemId[]; out: ItemId }[] = [
  { needs: ['bun', 'patty_cooked'], out: 'burger' },
];

export const MENU_ITEMS: MenuId[] = ['burger', 'fries', 'nuggets', 'soda'];
export const isMenuItem = (i: ItemId): i is MenuId => (MENU_ITEMS as string[]).includes(i);

export const MENU_PRICE: Record<MenuId, number> = { burger: 60, fries: 35, nuggets: 45, soda: 25 };

export const ITEM_ICON: Record<ItemId, string> = {
  bun: '🍞', patty_raw: '🥩', patty_cooked: '🍖', patty_burnt: '💩',
  potato: '🥔', fries: '🍟', fries_burnt: '🟫',
  chicken: '🐔', nuggets: '🍗', nuggets_burnt: '⬛',
  soda: '🥤', burger: '🍔',
};

export const ITEM_COLOR: Record<ItemId, string> = {
  bun: '#e8b86d', patty_raw: '#d9626b', patty_cooked: '#7a4a2a', patty_burnt: '#2a2220',
  potato: '#c8a165', fries: '#f6c945', fries_burnt: '#4a3a20',
  chicken: '#f2c1a0', nuggets: '#d9953a', nuggets_burnt: '#3a2a1a',
  soda: '#e8443a', burger: '#d98b3a',
};
