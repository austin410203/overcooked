"""Build every game asset with Blender and export GLB files.

    python3 tools/blender/build.py [out_dir] [--sheet sheet.png]
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from lib import reset, export, M, text, box
import characters, vehicles, food, stations, props

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, '.assets-raw')  # uncompressed; tools/optimize-models.mjs writes public/models
os.makedirs(OUT, exist_ok=True)

CATALOG = {
    'characters': [(f'char_{r}', (lambda r=r: characters.build(r))) for r in ('chef', 'prep', 'server', 'runner')]
                  + [(f'char_{c}', (lambda c=c: characters.build_customer(c))) for c in ('office', 'tourist')],
    'vehicles': [(f'car_{k}', (lambda k=k: vehicles.build(k))) for k in vehicles.SPEC],
    'stations': [(f'st_{k}', f) for k, f in stations.ALL.items()],
    'food': [(f'food_{k}', f) for k, f in food.ALL.items()],
    'props': [(f'prop_{k}', f) for k, f in props.ALL.items()],
}

def build_all():
    names = []
    for cat, items in CATALOG.items():
        for name, fn in items:
            reset()
            fn()
            export(os.path.join(OUT, name + '.glb'))
            names.append((cat, name))
            print('built', name)
    return names

def sheet(names, path):
    """Asset board: one labelled shelf per category, wrapped into rows."""
    reset()
    scn = bpy.context.scene
    rows = {}
    for cat, name in names:
        rows.setdefault(cat, []).append(name)
    spacing = {'characters': 1.5, 'vehicles': 3.0, 'stations': 1.55, 'food': 0.95, 'props': 2.1}
    per_row = {'characters': 6, 'vehicles': 5, 'stations': 8, 'food': 14, 'props': 8}
    row_h = {'characters': 2.2, 'vehicles': 2.4, 'stations': 2.3, 'food': 1.4, 'props': 3.2}
    scale = {'food': 2.0, 'props': 0.8}
    y = 0
    for cat in ('characters', 'vehicles', 'stations', 'food', 'props'):
        items = rows[cat]
        text(cat.upper(), 0.5, (-1.6, -y, 0.03), M('#1f4d3a', 0.5), extrude=0.03, rot=(0, 0, 0))
        for i, name in enumerate(items):
            r, c = divmod(i, per_row[cat])
            bpy.ops.import_scene.gltf(filepath=os.path.join(OUT, name + '.glb'))
            for o in bpy.context.selected_objects:
                if o.parent is None:
                    s = scale.get(cat, 1.0)
                    o.scale = (s, s, s)
                    o.location.x += 1.0 + c * spacing[cat]
                    o.location.y += -y - r * row_h[cat] - 1.0
            if i % per_row[cat] == per_row[cat] - 1 and i != len(items) - 1:
                pass
        nrows = (len(items) - 1) // per_row[cat] + 1
        y += nrows * row_h[cat] + 1.2
    box((80, 80, 0.1), (10, -y / 2, -0.05), M('#f3e6cc', 0.9), bevel=0)
    scn.render.engine = 'CYCLES'
    scn.cycles.device = 'CPU'
    scn.cycles.samples = 64
    scn.render.resolution_x = 1800
    scn.render.resolution_y = 2200
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    scn.collection.objects.link(cam)
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = max(17.5, y * 1.05)
    from mathutils import Vector
    target = Vector((7.6, -y / 2 + 0.3, 0.3))
    cam.location = target + Vector((0, -14, 22))
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scn.camera = cam
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
    sun.data.energy = 3.4
    sun.data.angle = math.radians(10)
    sun.rotation_euler = (math.radians(38), math.radians(-18), math.radians(-25))
    scn.collection.objects.link(sun)
    w = bpy.data.worlds.new('w'); scn.world = w
    bg = w.node_tree.nodes['Background']
    bg.inputs[0].default_value = (0.95, 0.88, 0.76, 1)
    bg.inputs[1].default_value = 0.9
    scn.render.filepath = path
    bpy.ops.render.render(write_still=True)

if __name__ == '__main__':
    if '--sheet-only' in sys.argv:
        names = [(c, n) for c, items in CATALOG.items() for n, _ in items]
        sheet(names, sys.argv[sys.argv.index('--sheet-only') + 1]); sys.exit(0)
    names = build_all()
    if '--sheet' in sys.argv:
        sheet(names, sys.argv[sys.argv.index('--sheet') + 1])
