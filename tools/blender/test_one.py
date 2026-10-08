import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from lib import reset, export
import characters

reset()
characters.build('chef')
out = sys.argv[-1]
export(out + '/chef.glb')

# quick look render
scn = bpy.context.scene
scn.render.engine = 'CYCLES'
scn.cycles.samples = 24
scn.cycles.device = 'CPU'
scn.render.resolution_x = 400
scn.render.resolution_y = 400
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
scn.collection.objects.link(cam)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 2.0
cam.location = (2.2, -3.2, 2.6)
cam.rotation_euler = (math.radians(62), 0, math.radians(35))
scn.camera = cam
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
sun.data.energy = 4
sun.rotation_euler = (math.radians(40), math.radians(15), math.radians(30))
scn.collection.objects.link(sun)
w = bpy.data.worlds.new('w'); scn.world = w
w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.9, 0.85, 0.75, 1)
w.node_tree.nodes['Background'].inputs[1].default_value = 0.8
scn.render.filepath = out + '/chef.png'
bpy.ops.render.render(write_still=True)
