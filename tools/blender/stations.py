"""Kitchen stations: 1 x 1 m footprint, work surface at 0.9 m, front faces -Y."""
from lib import M, box, cyl, ball, join, torus

TOP = 0.9
WOOD = '#c9884f'
WOOD_D = '#a96d3c'
STEEL = '#c9cdd0'
STEEL_D = '#8d969c'


def cabinet(parts, top_col=STEEL, doors=2, body=WOOD):
    parts.append(box((0.98, 0.94, 0.12), (0, 0, 0.06), M('#3a3f45', 0.7), bevel=0.03))                     # kick plate
    parts.append(box((0.98, 0.94, TOP - 0.18), (0, 0, 0.12 + (TOP - 0.18) / 2), M(body, 0.65), bevel=0.04))
    parts.append(box((1.04, 1.0, 0.07), (0, 0, TOP - 0.03), M(top_col, 0.3, 0.6 if top_col == STEEL else 0), bevel=0.025))
    w = 0.9 / doors
    for i in range(doors):
        x = -0.45 + w * (i + 0.5)
        parts.append(box((w - 0.05, 0.03, TOP - 0.32), (x, -0.475, 0.12 + (TOP - 0.2) / 2), M(WOOD_D, 0.6), bevel=0.015))
        parts.append(box((0.03, 0.03, 0.14), (x + (w / 2 - 0.08) * (1 if i % 2 else -1), -0.5, 0.6), M(STEEL_D, 0.3, 0.8), bevel=0.01))


def grill():
    p = []
    cabinet(p, top_col='#3a3f45', body='#5d656c')
    p.append(box((0.84, 0.8, 0.05), (0, 0.02, TOP + 0.02), M('#1c1f22', 0.5), bevel=0.01))
    for i in range(7):
        p.append(box((0.8, 0.025, 0.025), (0, -0.33 + i * 0.11, TOP + 0.06), M('#6b7076', 0.35, 0.7), bevel=0.006))
    for i, x in enumerate((-0.3, -0.1, 0.1, 0.3)):
        p.append(cyl(0.045, 0.05, (x, -0.5, 0.75), M('#e04a3a' if i % 2 else '#f2c14e', 0.4), verts=14, bevel=0.012, rot=(90, 0, 0)))
    p.append(box((0.98, 0.1, 0.35), (0, 0.45, TOP + 0.17), M('#5d656c', 0.4, 0.4), bevel=0.03))  # backsplash
    return join(p, 'grill')


def fryer():
    p = []
    cabinet(p, top_col=STEEL, body='#9aa3a9')
    p.append(box((0.8, 0.7, 0.06), (0, 0.02, TOP + 0.01), M('#2b2f33', 0.4), bevel=0.01))
    p.append(box((0.74, 0.62, 0.02), (0, 0.02, TOP + 0.04), M('#e8b84a', 0.15, emit=0.25), bevel=0.0))   # hot oil
    for x in (-0.19, 0.19):
        p.append(box((0.32, 0.5, 0.14), (x, 0.0, TOP + 0.12), M(STEEL, 0.3, 0.8), bevel=0.02))
        p.append(box((0.04, 0.32, 0.03), (x, -0.4, TOP + 0.22), M('#2b2f33', 0.5), bevel=0.012, rot=(-25, 0, 0)))
    p.append(box((0.98, 0.1, 0.4), (0, 0.45, TOP + 0.2), M(STEEL, 0.3, 0.6), bevel=0.03))
    p.append(box((0.3, 0.02, 0.1), (0, 0.39, TOP + 0.28), M('#1e1e1e', 0.4, emit=0.4), bevel=0.01))
    return join(p, 'fryer')


def drink():
    p = []
    cabinet(p, top_col=STEEL, body='#2f6b4f', doors=1)
    p.append(box((0.9, 0.5, 0.95), (0, 0.18, TOP + 0.47), M('#d9483b', 0.4), bevel=0.06))
    p.append(box((0.82, 0.04, 0.32), (0, -0.08, TOP + 0.75), M('#2b2f33', 0.3, emit=0.15), bevel=0.02))
    p.append(box((0.5, 0.02, 0.12), (0, -0.1, TOP + 0.78), M('#ffd166', 0.4, emit=1.2), bevel=0.01))
    for i, (x, c) in enumerate(((-0.26, '#e04a3a'), (0, '#f2c14e'), (0.26, '#7bb662'))):
        p.append(box((0.18, 0.12, 0.12), (x, -0.12, TOP + 0.45), M(c, 0.4), bevel=0.03))
        p.append(cyl(0.025, 0.1, (x, -0.13, TOP + 0.34), M(STEEL_D, 0.3, 0.8), verts=10, bevel=0.005))
    p.append(box((0.8, 0.35, 0.03), (0, -0.15, TOP + 0.05), M('#3a3f45', 0.4), bevel=0.01))       # drip tray
    return join(p, 'drink')


def assembly():
    p = []
    cabinet(p, top_col='#f3e6cc', body=WOOD)
    p.append(box((0.72, 0.5, 0.04), (0, 0, TOP + 0.04), M('#c9945e', 0.6), bevel=0.012))         # cutting board
    for i, c in enumerate(('#7cc461', '#e04a3a', '#f6c945')):
        p.append(box((0.18, 0.16, 0.08), (-0.3 + i * 0.3, 0.38, TOP + 0.06), M(STEEL, 0.3, 0.7), bevel=0.02))
        p.append(box((0.15, 0.13, 0.03), (-0.3 + i * 0.3, 0.38, TOP + 0.1), M(c, 0.6), bevel=0.01))
    return join(p, 'assembly')


def counter():
    p = []
    cabinet(p, top_col='#f3e6cc')
    return join(p, 'counter')


def storage():
    """Ingredient fridge drawer unit; the ingredient model sits on top in-game."""
    p = []
    cabinet(p, top_col=STEEL, body='#e9eef0', doors=1)
    p.append(box((0.84, 0.04, 0.5), (0, -0.47, 0.5), M('#bfe3ef', 0.35), bevel=0.02))        # glass door
    for z in (0.35, 0.55):
        p.append(box((0.76, 0.02, 0.015), (0, -0.48, z), M(STEEL_D, 0.3, 0.6), bevel=0.0))
    p.append(box((0.82, 0.82, 0.14), (0, 0, TOP + 0.06), M('#d9a36b', 0.7), bevel=0.03))          # crate
    for y in (-0.3, 0, 0.3):
        p.append(box((0.84, 0.04, 0.12), (0, y, TOP + 0.07), M('#b9855a', 0.7), bevel=0.01))
    return join(p, 'storage')


def pickup():
    p = []
    cabinet(p, top_col='#f3e6cc', body='#2f6b4f')
    p.append(box((0.9, 0.6, 0.04), (0, 0, TOP + 0.03), M('#fbf6ea', 0.5), bevel=0.012))
    p.append(box((0.22, 0.16, 0.3), (0.32, 0.25, TOP + 0.17), M('#b98a5a', 0.8), bevel=0.02))     # paper bag
    p.append(box((0.22, 0.17, 0.04), (0.32, 0.25, TOP + 0.3), M('#9a6e44', 0.8), bevel=0.01))
    p.append(ball(0.06, (-0.35, 0.3, TOP + 0.12), M('#f2c14e', 0.3, 0.8)))                         # service bell
    p.append(cyl(0.08, 0.02, (-0.35, 0.3, TOP + 0.05), M('#3a3f45'), bevel=0.005))
    return join(p, 'pickup')


def trash():
    p = [cyl(0.36, 0.78, (0, 0, 0.39), M('#3d4a44', 0.55), r2=0.4, verts=24, bevel=0.03),
         cyl(0.42, 0.08, (0, 0, 0.8), M('#2b332f', 0.5), verts=24, bevel=0.03),
         box((0.24, 0.06, 0.06), (0, 0, 0.87), M('#2b332f', 0.5), bevel=0.02),
         box((0.28, 0.02, 0.18), (0, -0.39, 0.45), M('#7bb662', 0.5), bevel=0.01, rot=(4, 0, 0))]
    return join(p, 'trash')


ALL = {'grill': grill, 'fryer': fryer, 'drink': drink, 'assembly': assembly, 'counter': counter,
       'storage': storage, 'pickup': pickup, 'trash': trash}
