"""In-place Astra v2 refinement of the shared garden kit.

Run with Blender 5.2 in background. This deliberately opens the existing
master; it never calls the original master generator. Asset IDs, transform
nodes, export collections, and the linked-library structure stay intact.
"""
import bpy
import bmesh
import json
import math
import random
import sys
from pathlib import Path
from mathutils import Vector

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from beautify_first_four import Sculpt, clear_meshes, original_parent, color, terrain_height
from final_polish_first_four import connected_components


def blossom(a, center, radius, normal, parent, seed):
    """A cupped, five-lobed flower; branch placement controls the clusters."""
    rng = random.Random(seed)
    n = Vector(normal).normalized()
    u = n.cross(Vector((0, 1, 0)))
    if u.length < 0.1:
        u = n.cross(Vector((1, 0, 0)))
    u.normalize()
    v = n.cross(u).normalized()
    c = Vector(center)
    vertices = [c + n * (radius * .13)]
    tones = [(1.0, .98, .94, 1)]
    for j in range(10):
        angle = 2 * math.pi * j / 10 + rng.uniform(-.035, .035)
        r = radius * (1 if j % 2 else .54) * rng.uniform(.91, 1.08)
        vertices.append(c + r * (math.cos(angle) * u + math.sin(angle) * v) + n * (radius * (.02 if j % 2 else -.09)))
        value = rng.uniform(.82, 1.0) if j % 2 else rng.uniform(.72, .9)
        tones.append((value, value * rng.uniform(.91, 1), value * rng.uniform(.91, 1), 1))
    faces = [(0, 1 + j, 1 + ((j + 1) % 10)) for j in range(10)]
    a.add(vertices, faces, 'SAKURA', parent, tones, True)


def sakura(a):
    rng = random.Random(20260925)
    a.tube([(0, -.06, 0), (-.11, .52, .04), (-.2, 1.3, .08), (-.12, 2.2, -.04),
            (.06, 3.05, -.13), (.24, 4.05, -.24), (.19, 4.75, -.3)],
           [.48, .41, .34, .27, .2, .1, .025], 'BARK', seed=5)
    for i in range(5):
        angle = i * 2.399 + .27
        reach = .65 + .13 * (i % 2)
        a.tube([(0, .15, 0), (math.cos(angle) * .31, .1, math.sin(angle) * .31),
                (math.cos(angle) * reach, -.015, math.sin(angle) * reach)],
               [.23, .145, .018], 'BARK', seed=80 + i)
    structures = ((.28, 2.55, 2.54), (2.61, 2.35, 2.84), (4.67, 2.78, 2.32))
    for branch_index, (angle, reach, rise) in enumerate(structures):
        pivot = original_parent('G03', a.lod, 'SWAY_' + 'ABC'[branch_index])
        assert pivot is not None
        d = Vector((math.cos(angle), 0, math.sin(angle)))
        side = Vector((-d.z, 0, d.x))
        trunk = [Vector((0, -.07, 0)), d * .62 + Vector((0, .36, 0)),
                 d * (reach * .55) + Vector((0, rise * .54, 0)),
                 d * reach + Vector((0, rise, 0))]
        a.tube(trunk, [.19, .15, .085, .012], 'BARK', pivot, seed=100 + branch_index)
        count = 4 if a.low else 7
        for j in range(count):
            t = .25 + (j + .25) / (count + 1) * .65
            root = trunk[1].lerp(trunk[3], t)
            sign = -1 if j % 2 else 1
            sideways = sign * (.48 + .18 * ((j + branch_index) % 3))
            tip = root + d * (.38 + .27 * (1 - t)) + side * sideways + Vector((0, .48 + .28 * rng.random(), 0))
            a.tube([root, root.lerp(tip, .57) + Vector((0, .09, 0)), tip],
                   [.057, .032, .006], 'BARK', pivot, seed=200 + branch_index * 20 + j)
            sub_count = 2 if a.low else 4
            for k in range(sub_count):
                start = root.lerp(tip, .38 + .12 * k)
                theta = angle + sign * (.45 + .21 * k) + rng.uniform(-.2, .2)
                twig = Vector((math.cos(theta), 0, math.sin(theta)))
                end = start + twig * (.42 + .13 * (k % 2)) + Vector((0, .15 + .18 * rng.random(), 0))
                a.tube([start, end], [.017, .003], 'BARK', pivot, seed=400 + branch_index * 100 + j * 7 + k)
                flower_count = 4 if a.low else 7
                for f in range(flower_count):
                    scatter = Vector((rng.uniform(-.21, .21), rng.uniform(-.13, .2), rng.uniform(-.21, .21)))
                    center = end + scatter
                    normal = (rng.uniform(-1, 1), rng.uniform(.25, 1), rng.uniform(-1, 1))
                    radius = (.078 if a.low else .071) * rng.uniform(.72, 1.23)
                    blossom(a, center, radius, normal, pivot, 10000 + branch_index * 1000 + j * 100 + k * 10 + f)
            # The outer crown is denser, but each spray still has open sky behind it.
            for f in range(3 if a.low else 6):
                center = tip + Vector((rng.uniform(-.19, .19), rng.uniform(-.12, .21), rng.uniform(-.19, .19)))
                blossom(a, center, (.08 if a.low else .07) * rng.uniform(.8, 1.2),
                        (rng.uniform(-1, 1), rng.uniform(.3, 1), rng.uniform(-1, 1)),
                        pivot, 30000 + branch_index * 1000 + j * 20 + f)


def shrub(a):
    for variant in range(2):
        parent = original_parent('G04', a.lod, 'BUSH', variant)
        assert parent is not None
        rng = random.Random(400 + variant)
        spray_count = 8 if a.low else 23
        for j in range(spray_count):
            angle = j * 2.399 + variant * .53
            radius = (.27 + .21 * rng.random()) * (1 if variant else .87)
            base = Vector((0, .13, 0))
            tip = Vector((math.cos(angle) * radius, .34 + .33 * rng.random(), math.sin(angle) * radius * .78))
            if j % 3 == 0:
                a.tube([base, tip], [.025, .004], 'LEAF', parent, sides=4, seed=100 + j)
            for leaf_index in range(2 if a.low else 3):
                twist = angle + (leaf_index - 1) * .7
                start = base.lerp(tip, .62)
                end = tip + Vector((math.cos(twist) * .14, rng.uniform(-.03, .1), math.sin(twist) * .14))
                a.leaf(start, end, .085 + .02 * (j % 3), 'LEAF', parent,
                       .58 + .4 * rng.random(), 500 + j * 3 + leaf_index)
        for lobe in range(1 if a.low else 3):
            angle = lobe * 2.39 + variant * .6
            center = (math.cos(angle) * .22, .34 + .07 * (lobe % 3), math.sin(angle) * .18)
            a.crown(center, (.26, .16, .21), 'LEAF', parent, seed=610 + variant * 10 + lobe,
                    sides=4 if a.low else 6)


def distant_bank(a):
    rng = random.Random(5021)
    for index in range(5):
        x = -7.8 + index * 3.8 + rng.uniform(-.35, .35)
        height = [5.5, 7.0, 5.1, 6.35, 4.8][index]
        lean = [-.58, .43, -.19, .62, -.3][index]
        trunk = [(x, 0, 0), (x + lean * .18, height * .37, -.07),
                 (x + lean * .58, height * .68, -.24)]
        a.tube(trunk, [.22, .13, .025], 'DISTANT', seed=700 + index)
        for branch in range(2 if a.low else 3):
            direction = -1 if branch % 2 else 1
            start = Vector(trunk[1]).lerp(Vector(trunk[2]), .3 + .18 * branch)
            end = start + Vector((direction * (.71 + .2 * index % 3), height * (.15 + .03 * branch),
                                  (-.34 if branch % 2 else .29)))
            a.tube([start, end], [.07, .01], 'DISTANT', sides=4 if a.low else 5, seed=800 + index * 10 + branch)
        lobes = 2 if a.low else 4
        for lobe in range(lobes):
            offset = (-.75 + 1.5 * lobe / max(1, lobes - 1)) * (1 + .15 * (index % 3))
            center = (x + lean * .6 + offset, height * (.71 + .06 * (lobe % 2)),
                      -.19 + (.27 if lobe % 2 else -.24))
            a.crown(center, (.75 + .12 * (index % 2), .53 + .07 * (lobe % 2), .62),
                    'DISTANT', seed=900 + index * 10 + lobe, sides=4 if a.low else 6)


def lantern(a):
    # Three nested frames leave a real recess around the warm paper chamber.
    a.box((0, .055, 0), (.48, .11, .48), 'BARK', tone=.69)
    a.box((0, .15, 0), (.37, .095, .37), 'BARK', tone=.82)
    for x in (-.175, .175):
        for z in (-.175, .175):
            a.box((x, .54, z), (.045, .76, .045), 'BARK', tone=.71 + .04 * (x > 0))
    for y in (.23, .82):
        a.box((0, y, 0), (.42, .045, .42), 'BARK', tone=.75)
    for side in (-1, 1):
        a.box((side * .18, .52, 0), (.012, .49, .30), 'PAPER', tone=.84)
        a.box((0, .52, side * .18), (.30, .49, .012), 'PAPER', tone=.84)
    a.box((0, .53, 0), (.16, .27, .16), 'LIGHT', tone=.89)
    a.box((0, .95, 0), (.52, .095, .52), 'BARK', tone=.66)
    a.box((0, 1.025, 0), (.40, .055, .40), 'BARK', tone=.82)
    a.box((0, 1.075, 0), (.14, .065, .14), 'BARK', tone=.75)


def petal(a):
    # One independent mesh family per named PETAL node, including a new third variant.
    for variant in range(3):
        parent = original_parent('G12', a.lod, 'PETAL', variant)
        if parent is None:
            name = f"SA_G12_{'MOBILE' if a.low else ''}PETAL_{variant:02}"
            parent = bpy.data.objects.new(name, None)
            a.col.objects.link(parent)
            parent.parent = a.root
            main = bpy.data.collections[f'LIB_G12_{a.lod}']
            main.objects.link(parent)
            sub = bpy.data.collections.new(f'LIB_G12_{a.lod}_PETAL_{variant:02}')
            sub.use_fake_user = True
            sub.objects.link(parent)
        centers = [(0, 0, 0)] if variant != 2 else [(-.015, 0, 0), (.013, .002, .012)]
        for j, center in enumerate(centers):
            if a.low:
                radius = (.016 + variant * .006) * .9
                x, y, z = center
                vertices = [(x, y + radius * .08, z), (x - radius, y, z),
                            (x, y + radius * .2, z + radius * .65),
                            (x + radius, y, z), (x, y - radius * .05, z - radius * .7)]
                a.add(vertices, [(0, 1, 2), (0, 2, 3), (0, 3, 4), (0, 4, 1)],
                      'SAKURA', parent, [(1, 1, 1, 1)] * 5, True)
            else:
                blossom(a, center, .016 + variant * .006,
                        (.15 + .2 * variant, 1, .17 * (j + 1)), parent, 6000 + variant * 10 + j)


def water(a):
    """Shallow open pond skin with an irregular shore, without a slab sidewall."""
    rng = random.Random(711)
    n = 12 if a.low else 24
    rings = 1 if a.low else 3
    verts = [(0, .007, 0)]
    tones = [(.85, .96, 1, 1)]
    for ring in range(1, rings + 1):
        for i in range(n):
            angle = math.tau * i / n
            edge = 1 + .027 * math.sin(angle * 5 + .7) + .015 * rng.random()
            radius = ring / rings
            x = math.cos(angle) * 6 * radius * edge
            z = math.sin(angle) * 5 * radius * edge
            y = .008 - .004 * radius + .002 * math.sin(angle * 4)
            verts.append((x, y, z))
            shade = .91 + .07 * (1-radius) + .018 * rng.random()
            tones.append((shade*.82, shade*.95, shade, 1))
    faces = [(0, 1+i, 1+(i+1)%n) for i in range(n)]
    for ring in range(1, rings):
        low = 1+(ring-1)*n
        high = 1+ring*n
        for i in range(n):
            faces.append((low+i, high+i, high+(i+1)%n, low+(i+1)%n))
    a.add(verts, faces, 'WATER', tones=tones, smooth=True)


def inscription_stone(a):
    """One weathered pale stone with nine shallow, abstract face incisions."""
    n = 11 if a.low else 17
    rings = ((-.035,.55),(.13,1.0),(.46,.86),(.73,.23))
    vertices=[]; tones=[]
    for j,(height,spread) in enumerate(rings):
        for i in range(n):
            angle=math.tau*i/n
            wobble=1+.035*math.sin(i*2.7+j*.9)+.018*math.cos(i*4.1-j)
            vertices.append((.55*spread*math.cos(angle)*wobble,
                             height+.009*math.sin(i*1.8+j),
                             .36*spread*math.sin(angle)*wobble))
            shade=.88+.095*(.5+.5*math.sin(i*.88+j*.6))
            tones.append((shade*.97,shade,shade*.95,1))
    faces=[]
    for j in range(len(rings)-1):
        for i in range(n):
            faces.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    faces.append(tuple((len(rings)-1)*n+i for i in range(n)))
    a.add(vertices,faces,'STONE',tones=tones,smooth=True)
    for row in range(3):
        for col in range(3):
            x=(col-1)*.22+.025*(row-1)
            y=.29+row*.115
            z=.36*math.sqrt(max(.12,1-(x/.61)**2-((y-.27)/.66)**2))+.014
            length=.075+.017*((row+col)%3)
            width=.011 if a.low else .007
            a.add([(x-length,y-width,z),(x+length,y-width,z),
                   (x+length*.83,y+width,z),(x-length*.83,y+width,z)],
                  [(0,1,2,3)],'STONE',
                  tones=[(.34,.39,.37,1)]*4)


def grove_tree(a, x, z, height, lean, seed):
    rng = random.Random(seed)
    ground = terrain_height(x, z, a.low)
    base = Vector((x, ground, z))
    top = base + Vector((lean, height * .72, -.2))
    a.tube([base + Vector((0, -.12, 0)), base + Vector((lean * .13, height * .25, 0)),
            base + Vector((lean * .55, height * .51, -.08)), top],
           [.31, .24, .15, .035], 'BARK', seed=seed)
    for root_index in range(3):
        angle = 2.4 * root_index + seed * .02
        a.tube([base + Vector((0, .14, 0)),
                base + Vector((math.cos(angle) * .36, 0, math.sin(angle) * .3))],
               [.14, .014], 'BARK', sides=4, seed=seed + root_index)
    for branch in range(3 if a.low else 4):
        angle = 2.4 * branch + seed * .08
        start = base + Vector((lean * (.22 + .08 * branch), height * (.4 + .07 * branch), -.04))
        reach = (1.08 + .19 * (branch % 2)) * (height / 5.5)
        tip = start + Vector((math.cos(angle) * reach, .62 + .17 * branch, math.sin(angle) * reach * .75))
        a.tube([start, start.lerp(tip, .57) + Vector((0, .11, 0)), tip],
               [.105, .057, .008], 'BARK', seed=seed + 30 + branch)
        twigs = []
        for twig_index in range(2 if a.low else 4):
            theta = angle + (twig_index - 1.5) * .48
            twig_tip = tip + Vector((math.cos(theta) * (.22 + .09 * (twig_index % 2)),
                                     .16 + .09 * twig_index, math.sin(theta) * .25))
            if not a.low:
                a.tube([tip, twig_tip], [.019, .003], 'BARK', sides=4,
                       seed=seed + 60 + branch * 5 + twig_index)
            twigs.append(twig_tip)
        for leaf_index in range(6 if a.low else 55):
            theta = 2.4 * leaf_index + branch
            twig_tip = twigs[leaf_index % len(twigs)]
            start_leaf = twig_tip + Vector((rng.uniform(-.36, .36), rng.uniform(-.25, .22), rng.uniform(-.31, .31)))
            end_leaf = start_leaf + Vector((math.cos(theta) * .29, .07 + rng.uniform(-.08, .14),
                                            math.sin(theta) * .26))
            a.leaf(start_leaf, end_leaf, .15 if a.low else .18, 'LEAF', tone=.72 + .27 * rng.random(),
                   seed=seed + branch * 20 + leaf_index)


def replace_old_grove():
    """Remove the five sphere-crown G01 trees and spend fewer triangles on three varied trees."""
    for lod in ('desktop', 'mobile'):
        collection = bpy.data.collections[f'SA_G01_{lod.upper()}']
        ground = next(obj for obj in collection.objects if obj.name == f"SA_G01_{'MOBILE' if lod == 'mobile' else ''}MESH_00")
        if not ground.get('astraV2Decimated'):
            modifier = ground.modifiers.new('ASTRA_TERRAIN_REDUCTION', 'DECIMATE')
            modifier.ratio = .69 if lod == 'desktop' else .74
            depsgraph = bpy.context.evaluated_depsgraph_get()
            reduced = bpy.data.meshes.new_from_object(ground.evaluated_get(depsgraph),
                preserve_all_data_layers=True, depsgraph=depsgraph)
            ground.modifiers.remove(modifier)
            ground.data = reduced
            ground['astraV2Decimated'] = True
        if lod == 'desktop' and not ground.get('astraV2Decimated2'):
            modifier = ground.modifiers.new('ASTRA_TERRAIN_REDUCTION_2', 'DECIMATE')
            modifier.ratio = .72
            depsgraph = bpy.context.evaluated_depsgraph_get()
            reduced = bpy.data.meshes.new_from_object(ground.evaluated_get(depsgraph),
                preserve_all_data_layers=True, depsgraph=depsgraph)
            ground.modifiers.remove(modifier)
            ground.data = reduced
            ground['astraV2Decimated2'] = True
        for obj in list(collection.objects):
            if obj.get('astraV2Grove'):
                bpy.data.objects.remove(obj, do_unlink=True)
        for obj in list(collection.objects):
            if obj.type != 'MESH' or obj.get('astraV2Grove'):
                continue
            mesh = obj.data
            doomed = set()
            for component in connected_components(mesh):
                if max(mesh.vertices[index].co.z for index in component) > 1.15:
                    doomed.update(component)
            if not doomed:
                continue
            bm = bmesh.new(); bm.from_mesh(mesh); bm.verts.ensure_lookup_table()
            bmesh.ops.delete(bm, geom=[bm.verts[index] for index in doomed], context='VERTS')
            bm.to_mesh(mesh); bm.free(); mesh.update()
            if not mesh.polygons:
                bpy.data.objects.remove(obj, do_unlink=True)
        a = Sculpt('G01', lod)
        a.seq = 90
        grove_tree(a, -4.75, 59.4, 5.4, -.46, 109)
        grove_tree(a, 4.0, 54.1, 5.8, .38, 208)
        grove_tree(a, 5.3, 43.4, 6.1, -.52, 307)
        a.flush()
        for obj in collection.objects:
            if obj.type == 'MESH' and obj.name.startswith(f"SA_G01_{'MOBILE' if a.low else ''}MESH_9"):
                obj['astraV2Grove'] = True
        print('ASTRA_GROVE', lod, flush=True)


def tune_materials():
    palette = {'MOSS': '49664B', 'LEAF': '779166', 'BARK': '6D5542',
               'STONE': '62665D', 'SAKURA': 'F2D3D8', 'DISTANT': '61785E',
               'WATER': '315F64', 'PAPER': 'DED3BB', 'LIGHT': 'ECC88B'}
    for key, hex_value in palette.items():
        m = bpy.data.materials.get('SA_M_' + key)
        if m is None or m.library:
            continue
        value = color(hex_value)
        m.diffuse_color = value
        p = m.node_tree.nodes.get('Principled BSDF')
        mix = next((n for n in m.node_tree.nodes if n.type == 'MIX_RGB' and n.blend_type == 'MULTIPLY'), None)
        if mix and not mix.inputs[1].is_linked:
            mix.inputs[1].default_value = value
        elif p and not p.inputs['Base Color'].is_linked:
            p.inputs['Base Color'].default_value = value
        if p:
            p.inputs['Roughness'].default_value = {'MOSS': .94, 'LEAF': .81, 'BARK': .79,
                'STONE': .91, 'SAKURA': .76, 'DISTANT': .94, 'WATER': .36,
                'PAPER': .91}.get(key, .82)


def main():
    source = HERE / '00-garden.blend'
    bpy.ops.wm.open_mainfile(filepath=str(source), load_ui=False)
    for aid, author in [('G03', sakura), ('G04', shrub), ('G07', water),
                        ('G11', distant_bank), ('G08', lantern), ('G12', petal),
                        ('G14', inscription_stone)]:
        for lod in ('desktop', 'mobile'):
            clear_meshes(aid, lod)
            sculpt = Sculpt(aid, lod)
            author(sculpt)
            sculpt.flush()
            if aid == 'G07':
                for obj in sculpt.col.objects:
                    if obj.type == 'MESH' and not obj.library:
                        obj.visible_shadow = False
            print('ASTRA_SHARED', aid, lod, flush=True)
    replace_old_grove()
    tune_materials()
    world = bpy.context.scene.world
    world.node_tree.nodes['Background'].inputs[0].default_value = (.45, .54, .48, 1)
    world.node_tree.nodes['Background'].inputs[1].default_value = .66
    scene = bpy.context.scene
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = .18
    info = json.loads(bpy.data.texts['READ_ME'].as_string())
    note = '2026-09-25 Astra v2: new branch-led Sakura blossoms, structural shrubs, varied distant tree silhouettes, crafted shared lantern and three petal variants. Original authored IDs and pivots retained. Visual references: https://japanesegarden.org/garden-spaces/tea-garden/ and https://polyhaven.com/a/tree_small_02. References only; no external models or textures used.'
    if note not in info['artistNotes']:
        info['artistNotes'].append(note)
    txt = bpy.data.texts['READ_ME']; txt.clear(); txt.write(json.dumps(info, indent=2))
    scene['astraVersion'] = 2
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)


if __name__ == '__main__':
    main()
