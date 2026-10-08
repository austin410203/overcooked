"""Vehicles, built facing +X, wheels on the ground (z=0)."""
from lib import M, box, cyl, ball, join, text

SPEC = {
    # body, length, width, body height, cabin length, cabin height, cabin x, style
    'yellow':   ('#f2c14e', 1.75, 0.96, 0.42, 0.95, 0.4, -0.05, 'taxi'),
    'blue':     ('#5a8fc4', 1.9, 1.0, 0.5, 1.15, 0.44, -0.1, 'suv'),
    'red':      ('#d9483b', 1.65, 0.95, 0.42, 0.9, 0.4, -0.1, 'hatch'),
    'green':    ('#7bb662', 1.95, 1.0, 0.5, 1.45, 0.5, -0.12, 'minivan'),
    'truck':    ('#f4efe2', 2.25, 1.0, 0.5, 0.62, 0.5, 0.72, 'box'),
    'vip':      ('#1d1d24', 2.35, 1.0, 0.4, 1.3, 0.36, -0.15, 'limo'),
    'festival': ('#f2a7c8', 2.05, 1.02, 0.55, 1.6, 0.6, -0.08, 'icecream'),
    'van':      ('#e07b39', 2.1, 1.05, 0.55, 1.7, 0.62, -0.08, 'foodtruck'),
    'bus':      ('#2f6b4f', 3.6, 1.1, 0.62, 3.4, 0.6, 0.0, 'bus'),
    'police':   ('#f4efe2', 1.85, 0.98, 0.42, 0.98, 0.4, -0.06, 'police'),
}


def build(kind):
    col, L, W, H, CL, CH, CX, style = SPEC[kind]
    body = M(col, 0.35)
    glass = M('#2e4a5e', 0.08, 0.2)
    dark = M('#2b2f33', 0.6)
    chrome = M('#c9cdd0', 0.25, 0.8)
    parts = []
    y0 = 0.22
    bz = y0 + H / 2
    parts.append(box((L, W, H), (0, 0, bz), body, bevel=0.16, seg=4))
    parts.append(box((L + 0.06, W + 0.04, 0.12), (0, 0, y0 + 0.07), dark, bevel=0.05))           # skirt/bumpers
    cz = y0 + H + CH / 2 - 0.03
    if style != 'box':
        parts.append(box((CL, W - 0.1, CH), (CX, 0, cz), body if style not in ('bus',) else M('#f3e6cc', 0.4), bevel=0.13, seg=4))
    # glass: windshield, rear, sides (split for vans/bus)
    gw = CL - 0.2
    parts.append(box((0.04, W - 0.26, CH * 0.62), (CX + CL / 2 - 0.02, 0, cz + 0.02), glass, bevel=0.015, rot=(0, -12, 0)))
    if style not in ('box',):
        parts.append(box((0.04, W - 0.28, CH * 0.55), (CX - CL / 2 + 0.02, 0, cz + 0.02), glass, bevel=0.015))
    n = {'bus': 6, 'minivan': 3, 'foodtruck': 2, 'icecream': 2, 'limo': 3}.get(style, 2)
    if style == 'box':
        n = 1
    for side in (1, -1):
        seg_w = gw / n
        for i in range(n):
            x = CX - gw / 2 + seg_w * (i + 0.5)
            parts.append(box((seg_w - 0.06, 0.04, CH * 0.55), (x, side * ((W - 0.1) / 2 + 0.005), cz + 0.03), glass, bevel=0.015))
    # wheels with hubcaps
    for sx in (1, -1):
        for sy in (1, -1):
            x = sx * (L / 2 - 0.38) if style != 'bus' else sx * (L / 2 - 0.6)
            parts.append(cyl(0.21, 0.18, (x, sy * (W / 2 - 0.02), 0.21), M('#202326', 0.8), verts=20, bevel=0.05, rot=(90, 0, 0)))
            parts.append(cyl(0.11, 0.19, (x, sy * (W / 2 - 0.02), 0.21), chrome, verts=16, bevel=0.02, rot=(90, 0, 0)))
    # lights & grille
    for sy in (1, -1):
        parts.append(ball(0.07, (L / 2 - 0.03, sy * (W / 2 - 0.18), bz + 0.05), M('#fff4c8', 0.2, emit=1.5), scale=(0.5, 1.2, 0.8)))
        parts.append(box((0.04, 0.16, 0.08), (-L / 2 + 0.02, sy * (W / 2 - 0.16), bz + 0.05), M('#e5443a', 0.3, emit=0.8), bevel=0.02))
        parts.append(box((0.08, 0.04, 0.03), (CX + CL / 2 - 0.1, sy * (W / 2 + 0.02), cz - 0.08), dark, bevel=0.01))  # mirrors
    parts.append(box((0.03, W * 0.42, 0.1), (L / 2, 0, bz - 0.06), dark, bevel=0.015))
    parts.append(box((0.02, 0.22, 0.07), (L / 2 + 0.02, 0, y0 + 0.08), M('#f4efe2', 0.5), bevel=0.01))  # plate

    # ---- style details ----
    if style == 'taxi':
        parts.append(box((0.38, 0.22, 0.13), (CX, 0, cz + CH / 2 + 0.08), M('#fff6d8', 0.4, emit=0.6), bevel=0.04))
        parts.append(box((L * 0.6, 0.02, 0.06), (0, W / 2 + 0.005, bz + 0.04), M('#2b2f33'), bevel=0.0))
        parts.append(box((L * 0.6, 0.02, 0.06), (0, -W / 2 - 0.005, bz + 0.04), M('#2b2f33'), bevel=0.0))
    if style == 'suv':
        for x in (-0.3, 0.2):
            parts.append(box((0.04, W - 0.2, 0.04), (CX + x, 0, cz + CH / 2 + 0.05), dark, bevel=0.01))
        parts.append(box((0.6, W - 0.25, 0.04), (CX - 0.05, 0, cz + CH / 2 + 0.08), dark, bevel=0.01))
    if style == 'minivan':
        parts.append(box((0.3, 0.02, 0.02), (-0.1, W / 2 + 0.01, cz - 0.05), chrome, bevel=0.005))
    if style == 'box':
        parts.append(box((1.45, W + 0.04, 1.0), (-0.38, 0, y0 + H + 0.42), M('#fbf6ea', 0.5), bevel=0.06))
        parts.append(box((0.6, 0.02, 0.35), (-0.38, W / 2 + 0.03, y0 + H + 0.5), M('#e04a3a', 0.5), bevel=0.01))
        parts.append(box((CL, W - 0.06, CH), (CX, 0, cz), body, bevel=0.12, seg=4))
    if style == 'limo':
        parts.append(box((L + 0.01, W + 0.01, 0.04), (0, 0, bz + 0.08), M('#d4af37', 0.3, 0.8), bevel=0.0))
        parts.append(cyl(0.012, 0.3, (L / 2 - 0.18, W / 2 - 0.06, bz + 0.38), chrome, verts=8, bevel=0))
        parts.append(box((0.16, 0.01, 0.1), (L / 2 - 0.1, W / 2 - 0.06, bz + 0.48), M('#d4af37', 0.4), bevel=0))
    if style == 'icecream':
        top = cz + CH / 2
        parts.append(cyl(0.16, 0.34, (CX - 0.25, 0, top + 0.17), M('#e8b86d', 0.6), r2=0.03, verts=16, bevel=0.01, rot=(180, 0, 0)))
        parts.append(ball(0.2, (CX - 0.25, 0, top + 0.4), M('#fbe3ef', 0.5)))
        parts.append(ball(0.15, (CX - 0.25, 0, top + 0.58), M('#f29ac0', 0.5)))
        parts.append(ball(0.05, (CX - 0.25, 0, top + 0.73), M('#e04a3a', 0.3)))
        parts.append(box((0.9, 0.02, 0.32), (CX - 0.2, W / 2 + 0.01, cz), M('#fbf6ea', 0.5), bevel=0.02))
    if style == 'foodtruck':
        parts.append(box((0.95, 0.03, 0.38), (CX - 0.15, W / 2 + 0.02, cz - 0.02), M('#3a3f45', 0.4), bevel=0.02))
        for i in range(5):
            parts.append(box((0.2, 0.42, 0.03), (CX - 0.55 + 0.2 * i, W / 2 + 0.2, cz + CH / 2 - 0.02),
                             M('#fbf6ea' if i % 2 else '#e04a3a', 0.6), bevel=0.005, rot=(25, 0, 0)))
        parts.append(box((0.8, 0.5, 0.18), (CX - 0.2, 0, cz + CH / 2 + 0.12), M('#f2c14e', 0.5), bevel=0.05))
        parts.append(ball(0.12, (CX - 0.2, -0.02, cz + CH / 2 + 0.3), M('#d98b3a', 0.5), scale=(1, 1, 0.6)))
    if style == 'bus':
        parts.append(box((L + 0.01, W + 0.01, 0.07), (0, 0, bz + 0.14), M('#e3b04b', 0.4), bevel=0.0))
        parts.append(box((0.7, 0.6, 0.12), (0.7, 0, cz + CH / 2 + 0.06), M('#8d969c', 0.4), bevel=0.04))
        parts.append(box((0.04, 0.5, 0.14), (L / 2 + 0.01, 0, cz + CH / 2 - 0.08), M('#1e1e1e', 0.4, emit=0.3), bevel=0.01))
    if style == 'police':
        parts.append(box((L * 0.55, W + 0.01, H * 0.5), (0.02, 0, bz), M('#23324a', 0.4), bevel=0.06))
        parts.append(box((0.14, 0.2, 0.09), (CX, 0.12, cz + CH / 2 + 0.05), M('#e5443a', 0.3, emit=2), bevel=0.03))
        parts.append(box((0.14, 0.2, 0.09), (CX, -0.12, cz + CH / 2 + 0.05), M('#3d7be5', 0.3, emit=2), bevel=0.03))
    return join(parts, f'car_{kind}')
