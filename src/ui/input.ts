// Screen-relative movement → world (camera looks from +x,+z toward origin)
const FWD = (() => { const l = Math.hypot(8, 22); return { x: -8 / l, z: -22 / l }; })();
const RIGHT = { x: -FWD.z, z: FWD.x };

const keys = new Set<string>();
const joy = { x: 0, y: 0 };

export const input = {
  keys,
  setJoy(x: number, y: number) { joy.x = x; joy.y = y; },
  /** returns world-space movement vector */
  vector() {
    let sx = 0, sy = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) sy += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) sy -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) sx += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) sx -= 1;
    sx += joy.x; sy += joy.y;
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p) continue;
      const ax = p.axes[0] ?? 0, ay = p.axes[1] ?? 0;
      if (Math.hypot(ax, ay) > 0.2) { sx += ax; sy -= ay; }
    }
    return { x: RIGHT.x * sx + FWD.x * sy, z: RIGHT.z * sx + FWD.z * sy };
  },
};

export function bindKeyboard() {
  const down = (e: KeyboardEvent) => { keys.add(e.code); if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); };
  const up = (e: KeyboardEvent) => keys.delete(e.code);
  const blur = () => keys.clear();
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);
  return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
}
