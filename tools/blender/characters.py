"""Chibi characters. Exported as separate named nodes so three.js can animate
them: legL, legR, body, armL, armR, head (pivots at the joints)."""
from lib import M, box, cyl, ball, capsule, join, torus

SKIN = '#f3c9a5'
SKIN_DARK = '#d9a07a'

ROLES = {
    # name: jacket, pants, hat style, hat colour, accent (scarf/apron), hair
    'chef':   dict(jacket='#fbf6ea', pants='#3a3f45', hat='toque', hatc='#ffffff', accent='#e04a3a', apron='#fbf6ea', hair='#5a3b28'),
    'prep':   dict(jacket='#2f6b4f', pants='#3a3f45', hat='cap', hatc='#2f6b4f', accent='#f2c14e', apron='#e9dcc3', hair='#3a2a20'),
    'server': dict(jacket='#d9483b', pants='#2c3138', hat='cap', hatc='#d9483b', accent='#fbf6ea', apron='#3a3f45', hair='#6b4430'),
    'runner': dict(jacket='#e07b39', pants='#4a5160', hat='hair', hatc='#7a4a2a', accent='#fbf6ea', apron=None, hair='#7a4a2a'),
}


def build(role):
    r = ROLES[role]
    skin, jacket, pants = M(SKIN, 0.6), M(r['jacket'], 0.7), M(r['pants'], 0.75)
    shoe = M('#2a2522', 0.5)
    parts = {}

    # legs (pivot at hip)
    for side, x in (('L', 0.1), ('R', -0.1)):
        leg = capsule(0.085, 0.36, (x, 0, 0.27), pants)
        sh = box((0.15, 0.22, 0.1), (x, -0.03, 0.06), shoe, bevel=0.045, seg=3)
        parts['leg' + side] = join([leg, sh], 'leg' + side, origin=(x, 0, 0.42))

    # torso: soft rounded body + apron + collar/scarf + buttons
    body = [
        cyl(0.21, 0.42, (0, 0, 0.62), jacket, verts=24, bevel=0.12, seg=4, subd=1, r2=0.17),
        torus(0.13, 0.04, (0, 0, 0.83), M(r['accent'], 0.6)),
    ]
    if r['apron']:
        body.append(box((0.26, 0.04, 0.3), (0, -0.19, 0.57), M(r['apron'], 0.75), bevel=0.03))
        body.append(box((0.12, 0.015, 0.07), (0, -0.215, 0.53), M('#e4d2ad', 0.8), bevel=0.01))
    for z in (0.75, 0.66):
        body.append(ball(0.018, (0.06, -0.205, z), M('#c9a227', 0.4)))
    if role == 'runner':  # delivery bag strap
        body.append(box((0.04, 0.42, 0.03), (0, 0, 0.66), M('#3a2a20'), rot=(0, 35, 0), bevel=0.01))
    parts['body'] = join(body, 'body', origin=(0, 0, 0.42))

    # arms (pivot at shoulder) with round hands
    for side, x in (('L', 0.24), ('R', -0.24)):
        arm = capsule(0.07, 0.3, (x, 0, 0.65), jacket)
        hand = ball(0.07, (x, 0, 0.47), skin)
        parts['arm' + side] = join([arm, hand], 'arm' + side, origin=(x, 0, 0.8))

    # head: big round chibi head, face, hair and role hat
    hz = 1.14
    head = [ball(0.35, (0, 0, hz), skin, scale=(1, 0.95, 0.93), seg=22, rings=14)]
    eye, white = M('#1e1b1a', 0.3), M('#ffffff', 0.2)
    for x in (0.115, -0.115):
        head.append(ball(0.05, (x, -0.29, hz - 0.01), eye, scale=(0.85, 0.6, 1.15)))
        head.append(ball(0.016, (x + 0.015, -0.32, hz + 0.025), white))
        head.append(ball(0.05, (x * 1.55, -0.26, hz - 0.1), M('#f29a93', 0.7), scale=(1.2, 0.5, 0.7)))
        head.append(ball(0.06, (x * 2.6, 0, hz - 0.02), skin, scale=(0.5, 1, 1)))  # ears
    head.append(ball(0.03, (0, -0.31, hz - 0.12), M('#9c4a3a', 0.6), scale=(1.4, 0.5, 0.6)))  # mouth
    hair = M(r['hair'], 0.7)
    head.append(ball(0.34, (0, 0.03, hz + 0.06), hair, scale=(1.02, 0.98, 0.8)))      # hair cap
    head.append(ball(0.12, (0.13, -0.24, hz + 0.18), hair, scale=(1.1, 0.6, 0.6)))    # fringe
    head.append(ball(0.11, (-0.1, -0.25, hz + 0.2), hair, scale=(1.1, 0.6, 0.55)))
    hatm = M(r['hatc'], 0.65)
    if r['hat'] == 'toque':
        head.append(cyl(0.27, 0.12, (0, 0, hz + 0.27), hatm, bevel=0.03))
        head.append(cyl(0.24, 0.22, (0, 0, hz + 0.43), hatm, bevel=0.06, subd=1, r2=0.3))
        for (x, y) in ((0.12, 0), (-0.12, 0), (0, 0.12), (0, -0.1)):
            head.append(ball(0.17, (x, y, hz + 0.6), hatm))
    elif r['hat'] == 'cap':
        head.append(ball(0.31, (0, 0.02, hz + 0.12), hatm, scale=(1.05, 1.05, 0.72)))
        head.append(cyl(0.22, 0.03, (0, -0.25, hz + 0.1), hatm, bevel=0.012, rot=(0, 0, 0)))
        head.append(ball(0.04, (0, 0.02, hz + 0.34), M('#fbf6ea', 0.6)))
    else:  # tousled hair
        for (x, y, z) in ((0.15, 0.05, 0.25), (-0.12, 0.1, 0.27), (0, -0.08, 0.3), (0.05, 0.18, 0.22)):
            head.append(ball(0.15, (x, y, hz + z), hair, ico=True))
    parts['head'] = join(head, 'head', origin=(0, 0, 0.88))
    return parts


def build_customer(kind):
    """Static customer figure (used for pedestrians / outdoor seating)."""
    looks = {
        'office': dict(jacket='#2f3e5a', pants='#2c3138', hair='#2a211c', hatc='#2f3e5a'),
        'tourist': dict(jacket='#7bb662', pants='#c9a27a', hair='#6b4430', hatc='#e9d29a'),
    }[kind]
    ROLES['_tmp'] = dict(jacket=looks['jacket'], pants=looks['pants'], hat='hair' if kind == 'office' else 'cap',
                         hatc=looks['hatc'], accent='#fbf6ea', apron=None, hair=looks['hair'])
    p = build('_tmp')
    del ROLES['_tmp']
    return p
