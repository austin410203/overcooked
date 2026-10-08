import { create } from 'zustand';
import { GameEngine } from '../game/systems/engine';
import { LEVELS, UPGRADES } from '../game/data/levels';
import type { LevelResult } from '../game/types';
import type { Lang } from '../ui/i18n';

export type Screen = 'menu' | 'levels' | 'game' | 'result';
export type Theme = 'day' | 'night';

interface SaveData { stars: Record<string, number>; best: Record<string, number>; lang: Lang; theme: Theme; sound: boolean }

const KEY = 'drive-thru-dash-v1';
function load(): SaveData {
  const def: SaveData = { stars: {}, best: {}, lang: navigatorLang(), theme: 'day', sound: true };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...def, ...JSON.parse(raw) };
  } catch { /* storage unavailable */ }
  return def;
}
function navigatorLang(): Lang {
  try { return navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en'; } catch { return 'zh'; }
}
function save(d: SaveData) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* ignore */ } }

export function unlockedUpgrades(stars: Record<string, number>) {
  return UPGRADES.filter((u) => (stars[LEVELS[u.afterLevel].id] ?? 0) > 0).map((u) => u.id);
}
export function isLevelUnlocked(index: number, stars: Record<string, number>) {
  return index === 0 || (stars[LEVELS[index - 1].id] ?? 0) > 0;
}

interface GameState extends SaveData {
  screen: Screen;
  levelIndex: number;
  engine: GameEngine | null;
  paused: boolean;
  speed: number;
  tick: number;
  debug: boolean;
  zoom: number;
  lastResult: (LevelResult & { newUnlock?: string; levelIndex: number }) | null;
  setScreen: (s: Screen) => void;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  toggleSound: () => void;
  startLevel: (i: number) => void;
  restart: () => void;
  quit: () => void;
  setPaused: (p: boolean) => void;
  cycleSpeed: () => void;
  bump: () => void;
  finishLevel: () => void;
  toggleDebug: () => void;
  setZoom: (z: number) => void;
  resetProgress: () => void;
}

const persisted = (s: GameState): SaveData => ({ stars: s.stars, best: s.best, lang: s.lang, theme: s.theme, sound: s.sound });

export const useGame = create<GameState>((set, get) => ({
  ...load(),
  screen: 'menu',
  levelIndex: 0,
  engine: null,
  paused: false,
  speed: 1,
  tick: 0,
  debug: false,
  zoom: 1,
  lastResult: null,
  setScreen: (screen) => set({ screen }),
  setLang: (lang) => { set({ lang }); save(persisted(get())); },
  toggleLang: () => get().setLang(get().lang === 'zh' ? 'en' : 'zh'),
  setTheme: (theme) => { set({ theme }); save(persisted(get())); },
  toggleTheme: () => get().setTheme(get().theme === 'day' ? 'night' : 'day'),
  toggleSound: () => { set({ sound: !get().sound }); save(persisted(get())); },
  startLevel: (i) => {
    const level = LEVELS[i];
    const engine = new GameEngine(level, unlockedUpgrades(get().stars));
    set({ levelIndex: i, engine, screen: 'game', paused: false, speed: 1, lastResult: null, ...(level.night ? { theme: 'night' as Theme } : {}) });
  },
  restart: () => get().startLevel(get().levelIndex),
  quit: () => set({ engine: null, screen: 'levels', paused: false }),
  setPaused: (paused) => set({ paused }),
  cycleSpeed: () => set({ speed: get().speed === 1 ? 1.5 : get().speed === 1.5 ? 0.75 : 1 }),
  bump: () => set({ tick: get().tick + 1 }),
  finishLevel: () => {
    const { engine, levelIndex, stars, best } = get();
    if (!engine) return;
    const r = engine.result();
    const id = LEVELS[levelIndex].id;
    const before = unlockedUpgrades(stars);
    const nextStars = { ...stars, [id]: Math.max(stars[id] ?? 0, r.stars) };
    const nextBest = { ...best, [id]: Math.max(best[id] ?? 0, r.cash) };
    const after = unlockedUpgrades(nextStars);
    const newUnlock = after.find((u) => !before.includes(u));
    set({ stars: nextStars, best: nextBest, lastResult: { ...r, newUnlock, levelIndex }, screen: 'result' });
    save(persisted(get()));
  },
  toggleDebug: () => set({ debug: !get().debug }),
  setZoom: (z) => set({ zoom: Math.min(1.5, Math.max(0.75, z)) }),
  resetProgress: () => { set({ stars: {}, best: {} }); save(persisted(get())); },
}));
