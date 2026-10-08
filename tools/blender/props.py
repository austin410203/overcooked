"""Street props and restaurant set pieces."""
from lib import M, box, cyl, ball, join, text

GREEN = '#1f4d3a'


def tree(variant=0):
    leaf = ['#7fae5a', '#8bbb63', '#6f9f50'][variant % 3]
    p = [box((0.72, 0.72, 0.3), (0, 0, 0.15), M(GREEN, 0.6), bevel=0.06),
         box((0.62, 0.62, 0.04), (0, 0, 0.31), M('#6b4a32', 0.9), bevel=0.01),
         cyl(0.07, 1.0, (0, 0, 0.8), M('#7a5a3c', 0.8), r2=0.05, verts=10, bevel=0.01)]
    for (x, y, z, r) in ((0, 0, 1.55, 0.55), (0.28, 0.1, 1.3, 0.36), (-0.25, -0.12, 1.35, 0.34), (0.05, 0.22, 1.85, 0.32)):
        p.append(ball(r, (x, y, z), M(leaf, 0.8), ico=True))
    return join(p, f'tree{variant}')


def lamp():
    g = M(GREEN, 0.45, 0.3)
    p = [cyl(0.13, 0.2, (0, 0, 0.1), g, verts=12, bevel=0.03),
         cyl(0.05, 2.4, (0, 0, 1.3), g, verts=10, bevel=0.01),
         ball(0.07, (0, 0, 2.5), g),
         box((0.5, 0.05, 0.05), (0.2, 0, 2.45), g, bevel=0.015),
         cyl(0.16, 0.18, (0.42, 0, 2.36), g, r2=0.06, verts=14, bevel=0.02),
         ball(0.09, (0.42, 0, 2.24), M('#fff3c4', 0.2, emit=3), scale=(1, 1, 0.6))]
    return join(p, 'lamp')


def traffic_light():
    g = M('#2b2f33', 0.5)
    p = [cyl(0.05, 2.2, (0, 0, 1.1), g, verts=10, bevel=0.01),
         box((0.24, 0.2, 0.62), (0, 0, 2.3), M('#3a3f45', 0.5), bevel=0.05)]
    for i, c in enumerate(('#e04a3a', '#f2c14e', '#5cc26b')):
        p.append(ball(0.07, (0, -0.1, 2.48 - i * 0.18), M(c, 0.3, emit=1.2 if i == 2 else 0.2), scale=(1, 0.5, 1)))
        p.append(box((0.18, 0.08, 0.03), (0, -0.13, 2.55 - i * 0.18), g, bevel=0.01, rot=(30, 0, 0)))
    return join(p, 'traffic_light')


def planter():
    p = [box((1.2, 0.5, 0.4), (0, 0, 0.2), M('#c46d4a', 0.7), bevel=0.05),
         box((1.1, 0.42, 0.04), (0, 0, 0.4), M('#6b4a32', 0.9), bevel=0.01)]
    for i in range(6):
        x = -0.45 + i * 0.18
        p.append(ball(0.14, (x, (i % 2) * 0.08 - 0.04, 0.5), M('#6f9f50', 0.8), ico=True))
        p.append(ball(0.05, (x + 0.04, -0.12, 0.62), M(['#e86a5a', '#f2c14e', '#f29ac0'][i % 3], 0.5)))
    return join(p, 'planter')


def bench():
    wood = M('#b97a4a', 0.7)
    p = [box((1.2, 0.4, 0.06), (0, 0, 0.42), wood, bevel=0.02),
         box((1.2, 0.06, 0.3), (0, 0.2, 0.68), wood, bevel=0.02, rot=(-10, 0, 0))]
    for x in (-0.5, 0.5):
        p.append(box((0.06, 0.4, 0.42), (x, 0, 0.21), M(GREEN, 0.5, 0.3), bevel=0.02))
    return join(p, 'bench')


def cone():
    p = [box((0.36, 0.36, 0.05), (0, 0, 0.025), M('#2b2f33', 0.6), bevel=0.015),
         cyl(0.15, 0.48, (0, 0, 0.29), M('#f28c28', 0.5), r2=0.03, verts=16, bevel=0.01),
         cyl(0.115, 0.07, (0, 0, 0.27), M('#fbf6ea', 0.4), r2=0.095, verts=16, bevel=0.0)]
    return join(p, 'cone')


def barrier():
    p = []
    for x in (-0.55, 0.55):
        p.append(box((0.08, 0.4, 0.06), (x, 0, 0.03), M('#2b2f33'), bevel=0.02))
        p.append(box((0.06, 0.06, 0.8), (x, 0, 0.4), M('#fbf6ea', 0.5), bevel=0.02))
    for z in (0.55, 0.75):
        p.append(box((1.2, 0.05, 0.14), (0, 0, z), M('#f28c28', 0.5), bevel=0.02))
        for i in range(3):
            p.append(box((0.12, 0.055, 0.14), (-0.4 + i * 0.4, 0, z), M('#fbf6ea', 0.5), bevel=0.0, rot=(0, 30, 0)))
    return join(p, 'barrier')


def hydrant():
    r = M('#d9483b', 0.4)
    p = [cyl(0.12, 0.45, (0, 0, 0.25), r, verts=14, bevel=0.03),
         ball(0.12, (0, 0, 0.48), r, scale=(1, 1, 0.7)),
         cyl(0.05, 0.3, (0, 0, 0.32), r, verts=10, bevel=0.01, rot=(0, 90, 0)),
         cyl(0.16, 0.05, (0, 0, 0.03), r, verts=14, bevel=0.01)]
    return join(p, 'hydrant')


def umbrella_table():
    p = [cyl(0.4, 0.05, (0, 0, 0.72), M('#fbf6ea', 0.5), verts=20, bevel=0.015),
         cyl(0.04, 0.72, (0, 0, 0.36), M('#3a3f45', 0.4), verts=10, bevel=0.01),
         cyl(0.25, 0.04, (0, 0, 0.02), M('#3a3f45', 0.4), verts=16, bevel=0.01),
         cyl(0.025, 1.6, (0, 0, 1.4), M('#3a3f45', 0.4), verts=8, bevel=0)]
    p.append(cyl(0.95, 0.35, (0, 0, 2.05), M('#e04a3a', 0.6), r2=0.02, verts=8, bevel=0.0))
    p.append(cyl(0.97, 0.06, (0, 0, 1.86), M('#fbf6ea', 0.6), verts=8, bevel=0.0))
    for (x, y) in ((0.7, 0), (-0.7, 0)):
        p.append(box((0.38, 0.38, 0.05), (x, y, 0.45), M(GREEN, 0.5), bevel=0.02))
        p.append(box((0.05, 0.38, 0.4), (x + (0.17 if x > 0 else -0.17), y, 0.65), M(GREEN, 0.5), bevel=0.02))
        for dx in (-0.15, 0.15):
            for dy in (-0.15, 0.15):
                p.append(cyl(0.02, 0.45, (x + dx, y + dy, 0.22), M('#3a3f45'), verts=8, bevel=0))
    return join(p, 'umbrella_table')


def menu_board():
    g = M(GREEN, 0.5)
    p = [cyl(0.06, 1.0, (0, 0, 0.5), g, verts=10, bevel=0.01),
         box((1.2, 0.14, 0.85), (0, 0, 1.4), g, bevel=0.05),
         box((1.06, 0.04, 0.68), (0, -0.07, 1.38), M('#fbf6ea', 0.6), bevel=0.02),
         box((0.4, 0.12, 0.18), (0, 0, 1.92), M('#e04a3a', 0.4), bevel=0.05)]
    for i, c in enumerate(('#f2c14e', '#e04a3a', '#7bb662')):
        p.append(box((0.28, 0.03, 0.22), (-0.34 + i * 0.34, -0.1, 1.48), M(c, 0.5), bevel=0.02))
        p.append(box((0.26, 0.03, 0.04), (-0.34 + i * 0.34, -0.1, 1.22), M('#3a3f45', 0.5), bevel=0.01))
    p.append(box((0.22, 0.12, 0.3), (0.45, -0.12, 0.85), M('#3a3f45', 0.4), bevel=0.04))              # speaker
    for z in (0.92, 0.85, 0.78):
        p.append(box((0.14, 0.02, 0.02), (0.45, -0.185, z), M('#1e1e1e'), bevel=0.0))
    return join(p, 'menu_board')


def drive_thru_arch():
    red = M('#d9483b', 0.45)
    p = [box((0.3, 0.3, 2.6), (-1.5, 0, 1.3), red, bevel=0.06),
         box((0.3, 0.3, 2.6), (1.5, 0, 1.3), red, bevel=0.06),
         box((3.6, 0.42, 0.8), (0, 0, 2.85), M(GREEN, 0.5), bevel=0.08),
         box((3.4, 0.05, 0.62), (0, -0.21, 2.85), M('#f2c14e', 0.4), bevel=0.02)]
    p.append(text('DRIVE THRU', 0.42, (0, -0.25, 2.85), M('#d9483b', 0.4), extrude=0.03))
    for x in (-1.5, 1.5):
        p.append(box((0.42, 0.42, 0.1), (x, 0, 0.05), M('#3a3f45'), bevel=0.03))
    return join(p, 'drive_thru_arch')


def pylon():
    p = [box((0.9, 0.9, 0.3), (0, 0, 0.15), M('#d9c8a4', 0.8), bevel=0.05),
         box((0.24, 0.24, 3.8), (0, 0, 2.0), M(GREEN, 0.5), bevel=0.05),
         box((1.3, 0.35, 1.7), (0, 0, 4.3), M('#d9483b', 0.45), bevel=0.1),
         box((1.1, 0.05, 1.5), (0, -0.18, 4.3), M('#f2c14e', 0.4, emit=0.15), bevel=0.04)]
    # burger icon
    p.append(ball(0.32, (0, -0.24, 4.55), M('#e5a95b', 0.5), scale=(1, 0.4, 0.55)))
    p.append(box((0.62, 0.12, 0.1), (0, -0.24, 4.38), M('#6e4126', 0.6), bevel=0.04))
    p.append(box((0.66, 0.1, 0.04), (0, -0.24, 4.31), M('#7cc461', 0.6), bevel=0.015))
    p.append(box((0.58, 0.12, 0.12), (0, -0.24, 4.22), M('#d38f45', 0.6), bevel=0.05))
    p.append(text('DRIVE', 0.24, (0, -0.24, 3.85), M('#1f4d3a', 0.4), extrude=0.02))
    return join(p, 'pylon')


def kiosk():
    p = [box((1.0, 1.0, 0.1), (0, 0, 0.05), M('#3a3f45'), bevel=0.03),
         box((0.95, 0.95, 1.6), (0, 0, 0.9), M('#e9dcc3', 0.6), bevel=0.06),
         box((0.7, 0.04, 0.6), (0, -0.48, 1.25), M('#a9d3e6', 0.1, 0.1), bevel=0.02),
         box((1.15, 1.15, 0.2), (0, 0, 1.8), M('#d9483b', 0.45), bevel=0.06),
         box((0.8, 0.3, 0.06), (0, -0.55, 0.95), M('#c9884f', 0.6), bevel=0.02)]
    return join(p, 'kiosk')


ALL = {
    'tree0': lambda: tree(0), 'tree1': lambda: tree(1), 'tree2': lambda: tree(2), 'lamp': lamp,
    'traffic_light': traffic_light, 'planter': planter, 'bench': bench, 'cone': cone, 'barrier': barrier,
    'hydrant': hydrant, 'umbrella_table': umbrella_table, 'menu_board': menu_board,
    'drive_thru_arch': drive_thru_arch, 'pylon': pylon, 'kiosk': kiosk,
}
