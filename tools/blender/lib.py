"""Tiny procedural-modelling kit on top of Blender (bpy).

Every part is a primitive + bevel (+ optional subdivision) with smooth shading,
which gives the soft "toy diorama" look of the art board. Parts are applied
(modifiers baked) so they can be joined and exported as compact GLB files.

Blender axes: Z up, -Y is the model's front. The glTF exporter converts to
three.js (Y up, +Z front). Vehicles are built facing +X.
"""
import math
import bpy
from mathutils import Vector

MATS = {}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MATS.clear()


def _lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexcol(h):
    h = h.lstrip('#')
    return tuple(_lin(int(h[i:i + 2], 16)) for i in (0, 2, 4))


def M(color, rough=0.55, metal=0.0, emit=0.0, name=None):
    """Material cached by colour+params. Emission uses the same colour."""
    key = name or f"{color}_{rough}_{metal}_{emit}"
    if key in MATS:
        return MATS[key]
    m = bpy.data.materials.new(key)
    try:
        m.use_nodes = True
    except Exception:
        pass
    b = m.node_tree.nodes.get('Principled BSDF')
    rgb = hexcol(color)
    b.inputs['Base Color'].default_value = (*rgb, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*rgb, 1)
        b.inputs['Emission Strength'].default_value = emit
    MATS[key] = m
    return m


def _finish(o, mat, bevel, seg, subd, smooth, rot, name):
    if rot != (0, 0, 0):
        o.rotation_euler = [math.radians(a) for a in rot]
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if bevel > 0:
        b = o.modifiers.new('bev', 'BEVEL')
        b.width = bevel
        b.segments = seg
        b.limit_method = 'ANGLE'
        b.angle_limit = math.radians(40)
        b.harden_normals = False
    if subd:
        s = o.modifiers.new('sub', 'SUBSURF')
        s.levels = subd
        s.render_levels = subd
    bpy.ops.object.convert(target='MESH')
    if smooth:
        bpy.ops.object.shade_smooth()
        if bevel > 0 and not subd:
            try:
                bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
            except Exception:
                pass
    else:
        bpy.ops.object.shade_flat()
    o.data.materials.clear()
    o.data.materials.append(mat)
    o.select_set(False)
    if name:
        o.name = name
    return o


def box(size, loc, mat, bevel=0.03, seg=3, subd=0, rot=(0, 0, 0), smooth=True, name=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.scale = size
    return _finish(o, mat, bevel, seg, subd, smooth, rot, name)


def cyl(r, h, loc, mat, verts=24, bevel=0.02, seg=3, subd=0, rot=(0, 0, 0), r2=None, smooth=True, name=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=loc)
    o = bpy.context.active_object
    return _finish(o, mat, bevel, seg, subd, smooth, rot, name)


def ball(r, loc, mat, scale=(1, 1, 1), seg=18, rings=10, rot=(0, 0, 0), ico=False, smooth=True, name=None):
    if ico:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=r, location=loc)
    else:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=r, location=loc)
    o = bpy.context.active_object
    o.scale = scale
    return _finish(o, mat, 0, 0, 0, smooth, rot, name)


def torus(R, r, loc, mat, rot=(0, 0, 0), name=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=32, minor_segments=12, location=loc)
    o = bpy.context.active_object
    return _finish(o, mat, 0, 0, 0, True, rot, name)


def capsule(r, h, loc, mat, rot=(0, 0, 0), name=None):
    """Vertical rounded pill (cylinder with heavy bevel + subdivision)."""
    return cyl(r, h, loc, mat, verts=16, bevel=min(r * 0.95, h * 0.45), seg=4, subd=1, rot=rot, name=name)


def text(s, size, loc, mat, extrude=0.03, rot=(90, 0, 0), name=None):
    bpy.ops.object.text_add(location=loc)
    o = bpy.context.active_object
    o.data.body = s
    o.data.size = size
    o.data.extrude = extrude
    o.data.align_x = 'CENTER'
    o.data.align_y = 'CENTER'
    o.rotation_euler = [math.radians(a) for a in rot]
    bpy.ops.object.convert(target='MESH')
    o.data.materials.clear()
    o.data.materials.append(mat)
    o.select_set(False)
    if name:
        o.name = name
    return o


def join(objs, name, origin=None):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    o = bpy.context.active_object
    o.name = name
    o.data.name = name
    if origin is not None:
        bpy.context.scene.cursor.location = Vector(origin)
        bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
        bpy.context.scene.cursor.location = Vector((0, 0, 0))
    o.select_set(False)
    return o


def export(path):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', use_selection=True, export_apply=True,
        export_yup=True, export_materials='EXPORT', export_cameras=False, export_lights=False,
    )
