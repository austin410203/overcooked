"""Ingredients and finished menu items (~0.4 m across so they read from the iso camera)."""
import math
from lib import M, box, cyl, ball, join, torus

BUN, BUN_D = '#e5a95b', '#d38f45'
SEED = '#fff3d6'


def _seeds(cx, cy, z, r, n=9):
    out = []
    for i in range(n):
        a = i * 2.4
        d = r * (0.25 + 0.65 * ((i * 37) % 10) / 10)
        out.append(ball(0.016, (cx + math.cos(a) * d, cy + math.sin(a) * d, z + 0.12 - (d / r) * 0.06), M(SEED, 0.5), scale=(1.6, 1, 0.6)))
    return out


def bun():
    p = [ball(0.2, (0, 0, 0.07), M(BUN, 0.55), scale=(1, 1, 0.62)),
         cyl(0.2, 0.07, (0, 0, 0.035), M(BUN_D, 0.6), bevel=0.03, subd=1)]
    p += _seeds(0, 0, 0.07, 0.17)
    return join(p, 'bun')


def patty(color, name):
    return join([cyl(0.19, 0.08, (0, 0, 0.04), M(color, 0.75), verts=20, bevel=0.035, seg=3, subd=1)], name)


def burger():
    p = [cyl(0.2, 0.07, (0, 0, 0.035), M(BUN_D, 0.6), bevel=0.03, subd=1),
         cyl(0.2, 0.08, (0, 0, 0.11), M('#6e4126', 0.75), verts=20, bevel=0.035, subd=1),
         box((0.36, 0.36, 0.02), (0, 0, 0.16), M('#f6c945', 0.5), bevel=0.008, rot=(0, 0, 45)),
         cyl(0.23, 0.03, (0, 0, 0.18), M('#7cc461', 0.7), verts=10, bevel=0.012),
         cyl(0.12, 0.025, (0.07, 0.03, 0.2), M('#e04a3a', 0.5), bevel=0.01),
         ball(0.2, (0, 0, 0.21), M(BUN, 0.55), scale=(1, 1, 0.62))]
    p += _seeds(0, 0, 0.21, 0.17)
    return join(p, 'burger')


def fries(burnt=False):
    stick = M('#4a3a20' if burnt else '#f6c945', 0.6)
    p = [box((0.26, 0.17, 0.24), (0, 0, 0.12), M('#e04a3a', 0.5), bevel=0.02),
         box((0.27, 0.18, 0.05), (0, 0, 0.215), M('#f2c14e', 0.5), bevel=0.01)]
    for i in range(9):
        x = -0.09 + (i % 5) * 0.045
        y = -0.03 + (i // 5) * 0.05
        p.append(box((0.03, 0.03, 0.2), (x, y, 0.27 + (i * 7 % 5) * 0.012), stick, bevel=0.008, rot=((i % 3 - 1) * 6, (i % 2) * 8 - 4, 0)))
    return join(p, 'fries_burnt' if burnt else 'fries')


def nuggets(burnt=False):
    c = M('#3a2a1a' if burnt else '#d9953a', 0.8)
    p = [cyl(0.2, 0.13, (0, 0, 0.065), M('#f4a259', 0.6), r2=0.17, bevel=0.02)]
    for (x, y, z) in ((-0.07, 0, 0.14), (0.07, 0.02, 0.14), (0, -0.07, 0.16), (0.01, 0.08, 0.15), (0, 0, 0.2)):
        p.append(ball(0.075, (x, y, z), c, scale=(1.2, 0.9, 0.7), ico=True))
    return join(p, 'nuggets_burnt' if burnt else 'nuggets')


def soda():
    red = M('#e04a3a', 0.4)
    p = [cyl(0.12, 0.32, (0, 0, 0.16), red, r2=0.15, verts=20, bevel=0.01),
         cyl(0.15, 0.06, (0, 0, 0.2), M('#fbf6ea', 0.4), r2=0.153, verts=20, bevel=0.005),
         cyl(0.16, 0.035, (0, 0, 0.335), M('#fbf6ea', 0.3), verts=20, bevel=0.015),
         cyl(0.015, 0.24, (0.04, 0, 0.44), M('#ffffff', 0.3), verts=8, bevel=0, rot=(0, 12, 0))]
    return join(p, 'soda')


def potato():
    return join([ball(0.15, (0, 0, 0.1), M('#c8a165', 0.85), scale=(1.25, 0.9, 0.75), ico=True),
                 ball(0.015, (0.08, -0.12, 0.13), M('#8a6a40')), ball(0.015, (-0.07, -0.1, 0.08), M('#8a6a40'))], 'potato')


def chicken():
    p = [ball(0.13, (0.03, 0, 0.1), M('#f2c1a0', 0.6), scale=(1.3, 1, 0.8)),
         cyl(0.03, 0.18, (-0.14, 0, 0.09), M('#fbf6ea', 0.5), verts=10, bevel=0.01, rot=(0, 80, 0)),
         ball(0.04, (-0.23, 0, 0.09), M('#fbf6ea', 0.5))]
    return join(p, 'chicken')


def lettuce():
    return join([ball(0.18, (0, 0, 0.08), M('#7cc461', 0.7), scale=(1, 1, 0.55), ico=True)], 'lettuce')


def tomato():
    return join([ball(0.14, (0, 0, 0.12), M('#e04a3a', 0.35)), cyl(0.04, 0.04, (0, 0, 0.25), M('#4f8a3a'), bevel=0.01)], 'tomato')


ALL = {
    'bun': bun, 'patty_raw': lambda: patty('#d9626b', 'patty_raw'), 'patty_cooked': lambda: patty('#6e4126', 'patty_cooked'),
    'patty_burnt': lambda: patty('#2a2220', 'patty_burnt'), 'burger': burger, 'fries': fries, 'fries_burnt': lambda: fries(True),
    'nuggets': nuggets, 'nuggets_burnt': lambda: nuggets(True), 'soda': soda, 'potato': potato, 'chicken': chicken,
    'lettuce': lettuce, 'tomato': tomato,
}
