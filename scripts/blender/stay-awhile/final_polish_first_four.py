"""Small, evidence-led finishing edits to the existing first-four masters.

The script keeps every asset root, collection, guide, action and camera rail.
It is idempotent and does not regenerate a scene or a kit.
"""
import bpy
import json
import math
import sys
from collections import deque
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from beautify_first_four import Sculpt, terrain_height
from geometry import B, G


def connected_components(mesh):
    adjacency = [set() for _ in mesh.vertices]
    for edge in mesh.edges:
        u, v = edge.vertices
        adjacency[u].add(v)
        adjacency[v].add(u)
    unseen = set(range(len(mesh.vertices)))
    while unseen:
        start = unseen.pop()
        group = {start}
        queue = deque((start,))
        while queue:
            for neighbor in adjacency[queue.popleft()]:
                if neighbor not in group:
                    group.add(neighbor)
                    unseen.discard(neighbor)
                    queue.append(neighbor)
        yield group


def triangle_count(collection):
    return sum(len(poly.vertices) - 2 for obj in collection.objects if obj.type == 'MESH'
               for poly in obj.data.polygons)


def garden():
    bpy.ops.wm.open_mainfile(filepath=str(HERE / '00-garden.blend'), load_ui=False)
    scene = bpy.context.scene
    if scene.get('finalPolishVersion', 0) >= 1:
        garden_edge_completion()
        return

    # Narrow the six existing stepping stones in each kit and ease their
    # centers into a slight weave. The kit pivots and scene instances remain.
    for lod in ('DESKTOP', 'MOBILE'):
        col = bpy.data.collections[f'SA_G02_{lod}']
        for obj in col.objects:
            if obj.type != 'MESH' or not obj.get('beautyPass') or obj.get('finalPathPolish'):
                continue
            mesh = obj.data
            if not mesh.materials or mesh.materials[0].name != 'SA_M_STONE':
                continue
            stones = []
            for group in connected_components(mesh):
                points = [G(mesh.vertices[i].co) for i in group]
                span_x = max(v[0] for v in points) - min(v[0] for v in points)
                if span_x > .75:
                    stones.append((sum(v[2] for v in points) / len(points), group))
            stones.sort(reverse=True)
            for index, (_, group) in enumerate(stones):
                center_x = sum(G(mesh.vertices[i].co)[0] for i in group) / len(group)
                offset = (-.12, .10, -.05, .13, -.10, .07)[index % 6]
                for i in group:
                    x, y, z = G(mesh.vertices[i].co)
                    mesh.vertices[i].co = B((center_x + (x - center_x) * .84 + offset, y, z))
            attr = mesh.color_attributes.get('COLOR_0')
            if attr:
                for color in attr.data:
                    r, g, b, alpha = color.color
                    color.color = (r * .96, g * .92, b * .88, alpha)
            mesh.update()
            obj['finalPathPolish'] = True

    # A short continuation and grouped planting are on the actual delivered
    # G01 terrain. The corridor center stays clear; the far focal view gains
    # a path destination and the shoulders gain a few low, grounded islands.
    groups = [
        (-2.4, 65.2), (-3.2, 67.4), (-2.7, 70.5), (-4.0, 74.0),
        (-3.0, 78.4), (-5.0, 81.0), (2.45, 64.2), (3.2, 66.3),
        (3.6, 69.0), (2.7, 72.1), (4.5, 75.5), (2.7, 78.3),
        (5.4, 82.0), (6.2, 67.2), (5.6, 71.1), (6.3, 75.2),
        (7.0, 78.0), (-6.5, 72.5),
    ]
    for lod, low in (('desktop', False), ('mobile', True)):
        sculpt = Sculpt('G01', lod)
        sculpt.seq = 70
        count = 4 if low else 7
        for i in range(count):
            x = (-.14, .12, -.09, .18, -.12, .08, -.16)[i]
            z = 65.55 - i * .71
            height = terrain_height(x, z, low)
            sculpt.stone((x, height - .047, z),
                         (.56 + .055 * (i % 3), .075, .25 + .015 * (i % 2)),
                         'STONE', seed=2410 + i, sides=5 if low else 7)
        selected = (0, 2, 4, 6, 8, 10, 13, 16) if low else range(len(groups))
        for i in selected:
            x, z = groups[i]
            height = terrain_height(x, z, low)
            width = .46 + .10 * (i % 3)
            sculpt.crown((x, height + .17, z), (width, .23, width * .73),
                         'MOSS' if i % 4 else 'LEAF', seed=2490 + i,
                         sides=4 if low else 5)
            leaf_count = 1 if low else 2
            for j in range(leaf_count):
                angle = i * 2.399 + j * 1.7
                start = (x + .20 * math.cos(angle), height + .015,
                         z + .20 * math.sin(angle))
                end = (start[0] + .20 * math.cos(angle), height + .22,
                       start[2] + .20 * math.sin(angle))
                sculpt.leaf(start, end, .048, 'LEAF', tone=.72 + .04 * (i % 3), seed=i + j)
        sculpt.flush()
        tris = triangle_count(bpy.data.collections[f'SA_G01_{lod.upper()}'])
        limit = 5000 if low else 18000
        assert tris <= limit, ('G01 triangle cap', lod, tris, limit)
        print('GARDEN_G01_TRIANGLES', lod, tris, limit, flush=True)
    scene['finalPolishVersion'] = 1
    save('00-garden.blend')


def garden_edge_completion():
    scene = bpy.context.scene
    if scene.get('finalPolishVersion', 0) >= 2:
        print('KEEP garden', flush=True)
        return
    # Final focal render showed a bare 1.5-2 m strip beside the final stones.
    # Six grouped patches give the short path a planted edge; beyond them the
    # clearing remains open. Sample G01 separately for both delivered LODs.
    patches = [(-1.88, 63.0), (1.82, 64.1), (-1.73, 65.4),
               (2.05, 66.6), (-2.08, 68.4), (1.92, 70.5)]
    for lod, low in (('desktop', False), ('mobile', True)):
        sculpt = Sculpt('G01', lod)
        sculpt.seq = 80
        selected = (0, 1, 3, 4) if low else range(len(patches))
        for i in selected:
            x, z = patches[i]
            height = terrain_height(x, z, low)
            sculpt.crown((x, height + .19, z),
                         (.54 + .06 * (i % 3), .27, .42 + .04 * (i % 2)),
                         'MOSS' if i % 2 else 'LEAF', seed=2800 + i,
                         sides=4 if low else 5)
        sculpt.flush()
        tris = triangle_count(bpy.data.collections[f'SA_G01_{lod.upper()}'])
        limit = 5000 if low else 18000
        assert tris <= limit, ('G01 triangle cap', lod, tris, limit)
        print('GARDEN_FINAL_TRIANGLES', lod, tris, limit, flush=True)
    scene['finalPolishVersion'] = 2
    save('00-garden.blend')


def builder():
    bpy.ops.wm.open_mainfile(filepath=str(HERE / '02-builder.blend'), load_ui=False)
    scene = bpy.context.scene
    if scene.get('finalPolishVersion', 0) >= 1:
        print('KEEP builder', flush=True)
        return
    # The seven thin decorative beam strips were coplanar with the timber.
    # Camera rays identified them as the nearly black central roof bar.
    removed = []
    for lod in ('DESKTOP', 'MOBILE'):
        for obj in list(bpy.data.collections[f'SA_B03_{lod}'].objects):
            if obj.type == 'MESH' and obj.get('beautyPass') == 3:
                removed.append(obj.name)
                bpy.data.objects.remove(obj, do_unlink=True)
    assert len(removed) == 14, removed
    scene['finalPolishVersion'] = 1
    save('02-builder.blend')
    print('BUILDER_REMOVED_COPLANAR_TRIM', len(removed), flush=True)


def thinker():
    bpy.ops.wm.open_mainfile(filepath=str(HERE / '03-thinker.blend'), load_ui=False)
    scene = bpy.context.scene
    if scene.get('finalPolishVersion', 0) >= 1:
        print('KEEP thinker', flush=True)
        return
    # The last original deck plank has a malformed near edge in both LODs.
    # It overlaps neighboring planks and creates the solid black wedge.
    for lod in ('DESKTOP', 'MOBILE'):
        obj = next(o for o in bpy.data.collections[f'SA_T01_{lod}'].objects
                   if o.type == 'MESH' and not o.get('beautyPass'))
        mesh = obj.data
        candidates = []
        for poly in mesh.polygons:
            points = [mesh.vertices[i].co for i in poly.vertices]
            if (len(points) == 4 and all(abs(v.z - .3) < .006 for v in points)
                    and max(v.y for v in points) - min(v.y for v in points) > 3.5
                    and max(v.x for v in points) > 1.95
                    and min(v.x for v in points) < 1.3):
                candidates.append(poly)
        assert len(candidates) == 1, ('last deck plank', lod, len(candidates))
        group = next(group for group in connected_components(mesh)
                     if set(candidates[0].vertices).issubset(group))
        changed = 0
        for i in group:
            v = mesh.vertices[i]
            if v.co.y < 1.8 or v.co.x >= 1.4:
                continue
            if v.co.x < 1.1:
                v.co.x = 1.704
            elif v.co.x < 1.245:
                v.co.x = 1.986
            else:
                v.co.x = 2.0
            changed += 1
        assert changed >= 2, ('deck repair', lod, changed)
        mesh.update()
        obj['finalDeckPlankRepair'] = True
        print('THINKER_REPAIRED_VERTICES', lod, changed, flush=True)
    scene['finalPolishVersion'] = 1
    save('03-thinker.blend')


def save(name):
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(HERE / name), compress=True)
    print('FINAL_POLISHED', name, flush=True)


if __name__ == '__main__':
    for route in ('garden', 'builder', 'thinker'):
        globals()[route]()
