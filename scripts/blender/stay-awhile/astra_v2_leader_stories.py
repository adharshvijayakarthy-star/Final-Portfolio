"""In-place crafted geometry and lighting for Leader and Stories."""
import bpy
import json
import math
import random
import sys
from pathlib import Path
from mathutils import Vector

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from beautify_first_four import Sculpt, clear_meshes, original_parent, setup_materials, tune_light
from geometry import B


def radial_ground(a, radius, rings, seed=0):
    rng = random.Random(seed)
    points = 20 if a.low else 32
    vertices = [(0, .012, 0)]
    tones = [(.84, .82, .76, 1)]
    for ring in range(1, rings + 1):
        for i in range(points):
            angle = 2 * math.pi * i / points
            rr = radius * ring / rings * (1 + .035 * math.sin(i * 2.4 + ring) + .016 * rng.random())
            y = -.008 + .028 * (ring / rings) ** 2 + .008 * math.sin(angle * 5 + ring)
            vertices.append((math.cos(angle) * rr, y, math.sin(angle) * rr))
            tone = .75 + .09 * rng.random() - .02 * (ring == rings)
            tones.append((tone, tone * .98, tone * .91, 1))
    faces = []
    for i in range(points):
        faces.append((0, 1 + i, 1 + (i + 1) % points))
    for ring in range(1, rings):
        lo = 1 + (ring - 1) * points
        hi = 1 + ring * points
        for i in range(points):
            faces.append((lo + i, hi + i, hi + (i + 1) % points, lo + (i + 1) % points))
    a.add(vertices, faces, 'CLAY', tones=tones, smooth=True)


def leader_court(a):
    radial_ground(a, 5.85, 4 if a.low else 6, 42)
    for approach, angle in enumerate((math.pi / 2, 7 * math.pi / 6, 11 * math.pi / 6)):
        parent = original_parent('L01', a.lod, 'APPROACH', approach)
        for step in range(7):
            rng = random.Random(approach * 90 + step)
            distance = 1.3 + step * 1.08
            x = math.cos(angle) * distance + rng.uniform(-.15, .15)
            z = math.sin(angle) * distance + rng.uniform(-.13, .13)
            width = .74 + rng.uniform(-.1, .12)
            a.stone((x, -.045, z), (width, .105, .47 + rng.uniform(-.08, .08)),
                    'STONE', parent, seed=approach * 50 + step,
                    sides=5 if a.low else 7)
        for stone in range(4 if a.low else 9):
            distance = 3.1 + stone * .52
            side = -1 if stone % 2 else 1
            x = math.cos(angle) * distance + side * math.sin(angle) * .95
            z = math.sin(angle) * distance - side * math.cos(angle) * .95
            a.stone((x, -.08, z), (.2 + .06 * (stone % 3), .12, .17),
                    'STONE', seed=500 + approach * 30 + stone,
                    sides=5 if a.low else 6)


def leader_markers(a):
    for i in range(5):
        parent = original_parent('L02', a.lod, 'MARKER', i)
        a.stone((0, -.06, 0), (.32, .13, .29), 'STONE', parent, seed=i + 20,
                sides=5 if a.low else 7)
        height = .75 + .035 * (i % 3)
        a.box((0, height * .5, 0), (.15, height, .15), 'BARK', parent, tone=.67 + .03 * (i % 3))
        if not a.low:
            a.box((0, height + .025, 0), (.19, .05, .19), 'BARK', parent, tone=.76)
            a.box((0, height * .65, .081), (.075, .14, .008), 'ACCENT', parent, tone=.7)


def leader_rail(a):
    for x in (-1.28, 1.28):
        a.stone((x, -.06, 0), (.36, .15, .34), 'STONE', seed=100 + int(x * 10))
        a.box((x, .66, 0), (.095, 1.32, .095), 'BARK', tone=.68)
        a.box((x, 1.31, 0), (.16, .07, .16), 'BARK', tone=.78)
    a.box((0, 1.26, 0), (2.75, .09, .1), 'BARK', tone=.74)
    a.box((0, .72, -.055), (2.6, .07, .08), 'BARK', tone=.61)
    for slot in range(5):
        x = -.98 + slot * .49
        a.box((x, 1.19, -.07), (.025, .18, .075), 'BARK', tone=.72)
        if slot in (0, 2, 4):
            parent = original_parent('L03', a.lod, 'HOLDER', slot // 2)
            a.box((0, 0, 0), (.62, .37, .025), 'BARK', parent, tone=.78)
            a.box((0, 0, .018), (.54, .29, .008), 'PAPER', parent, tone=.96)
            a.box((0, .17, .025), (.11, .024, .026), 'ACCENT', parent, tone=.82)


def story_path(a):
    bays = [(-1, -2), (2, -6), (-2, -10), (1, -14)]
    for index, (bx, bz) in enumerate(bays):
        parent = original_parent('S01', a.lod, 'BAY', index)
        for stone in range(4 if a.low else 8):
            angle = stone * 2.399
            radius = .45 + .21 * (stone % 3)
            x, z = math.cos(angle) * radius, math.sin(angle) * radius
            a.stone((x, -.045, z), (.69, .1, .48), 'STONE', parent,
                    seed=index * 17 + stone, sides=5 if a.low else 7)
        for edge in range(1 if a.low else 5):
            theta = edge * 2.4 + index
            x, z = math.cos(theta) * 1.35, math.sin(theta) * 1.2
            a.stone((x, -.06, z), (.2, .1, .17), 'STONE', parent,
                    seed=200 + index * 10 + edge, sides=5)
    points = [(0, 4)] + bays + [(0, -19)]
    for section, (start, end) in enumerate(zip(points, points[1:])):
        for step in range(1, 7 if a.low else 8):
            t = step / (7 if a.low else 8)
            rng = random.Random(section * 80 + step)
            x = start[0] + (end[0] - start[0]) * t + rng.uniform(-.14, .14)
            z = start[1] + (end[1] - start[1]) * t
            a.stone((x, -.055, z), (.77 + .07 * (step % 2), .11, .41 + rng.uniform(-.06, .06)),
                    'STONE', seed=500 + section * 10 + step,
                    sides=5 if a.low else 7)


def story_lantern(a):
    width = .45
    a.stone((0, -.07, 0), (.64, .17, .59), 'STONE', seed=25, sides=5 if a.low else 8)
    a.box((0, .13, 0), (.47, .17, .47), 'BARK', tone=.61)
    for x in (-.2, .2):
        for z in (-.2, .2):
            a.box((x, .82, z), (.048, 1.2, .048), 'BARK', tone=.68)
    for y in (.27, 1.36):
        a.box((0, y, 0), (.48, .065, .48), 'BARK', tone=.72)
    for side in (-1, 1):
        a.box((side * .205, .81, 0), (.012, .84, .33), 'PAPER', tone=.77)
        a.box((0, .81, side * .205), (.33, .84, .012), 'PAPER', tone=.77)
    a.box((0, .78, 0), (.17, .38, .17), 'LIGHT', tone=.92)
    a.box((0, 1.49, 0), (.59, .13, .59), 'BARK', tone=.61)
    a.box((0, 1.58, 0), (.37, .055, .37), 'BARK', tone=.76)
    shutter = original_parent('S02', a.lod, 'SHUTTER', 0)
    a.box((width * .38, 0, 0), (.37, .8, .02), 'BARK', shutter, tone=.67)
    a.box((width * .38, 0, .014), (.3, .69, .008), 'PAPER', shutter, tone=.83)


def story_screens(a):
    for index in range(3):
        parent = original_parent('S03', a.lod, 'SCREEN', index)
        for x in (-.92, .92):
            a.stone((x, -.07, 0), (.3, .14, .31), 'STONE', parent,
                    seed=600 + index * 10 + int(x * 10), sides=5)
            a.box((x, 1.1, 0), (.095, 2.2, .105), 'BARK', parent, tone=.58 + .04 * index)
        for y in (.12, 2.12):
            a.box((0, y, 0), (1.95, .085, .11), 'BARK', parent, tone=.65)
        for rib in range(2 if a.low else 4):
            x = -.48 + rib * (1.0 / max(1, (1 if a.low else 3)))
            a.box((x, 1.14, -.018), (.032, 1.82, .045), 'BARK', parent, tone=.69)
        a.box((-.45 if index % 2 else .45, 1.18, .012), (.57, 1.35, .012),
              'PAPER', parent, tone=.64)
        for leaf in range(8 if a.low else 25):
            rng = random.Random(index * 100 + leaf)
            side = -1 if index % 2 else 1
            x = side * (.79 + rng.uniform(-.08, .16))
            y = .15 + rng.random() * 1.84
            z = rng.uniform(-.1, .14)
            a.leaf((x, y, z), (x + side * rng.uniform(.12, .3), y + rng.uniform(.05, .2),
                               z + rng.uniform(-.15, .15)), .07 if a.low else .1,
                   'LEAF', parent, tone=.68 + .29 * rng.random(), seed=index * 40 + leaf)


ART = {
    'leader': ('04-leader.blend', [('L01', leader_court), ('L02', leader_markers), ('L03', leader_rail)]),
    'stories': ('05-stories.blend', [('S01', story_path), ('S02', story_lantern), ('S03', story_screens)]),
}


def save_route(route):
    source, definitions = ART[route]
    path = HERE / source
    bpy.ops.wm.open_mainfile(filepath=str(path), load_ui=False)
    setup_materials()
    tune_light(route)
    if route == 'stories':
        scene = bpy.context.scene
        scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.23, .30, .27, 1)
        scene.world.node_tree.nodes['Background'].inputs[1].default_value = .52
        sun = next(o for o in bpy.data.objects if o.type == 'LIGHT' and o.data.type == 'SUN' and not o.library)
        sun.data.energy = .95
        sun.data.color = (1, .79, .61)
        for index, (x, z) in enumerate(((-1, -2), (2, -6), (-2, -10), (1, -14))):
            name = f'SA_STORIES_GLOW_{index:02}'
            light = bpy.data.objects.get(name)
            if light is None:
                data = bpy.data.lights.new(name, 'POINT')
                light = bpy.data.objects.new(name, data)
                bpy.data.collections['07_LIGHT_GUIDES'].objects.link(light)
            light.location = B((x + 1.2, 1.05, z))
            light.data.energy = 85
            light.data.shadow_soft_size = .55
            light.data.color = (1, .66, .34)
    for aid, author in definitions:
        for lod in ('desktop', 'mobile'):
            clear_meshes(aid, lod)
            sculpt = Sculpt(aid, lod)
            author(sculpt)
            sculpt.flush()
            print('ASTRA_ROUTE_ASSET', route, aid, lod, flush=True)
    info = json.loads(bpy.data.texts['READ_ME'].as_string())
    note = '2026-09-25 Astra v2: crafted physical landmarks, stone-ground paths, richer planting, and route-specific natural light. No third-party model assets; research: https://japanesegarden.org/garden-spaces/tea-garden/.'
    if note not in info['artistNotes']:
        info['artistNotes'].append(note)
    txt = bpy.data.texts['READ_ME']; txt.clear(); txt.write(json.dumps(info, indent=2))
    bpy.context.scene['astraVersion'] = 2
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(path), compress=True)
    print('ASTRA_ROUTE_SAVED', route, flush=True)


if __name__ == '__main__':
    only = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ART.keys()
    for route in only:
        save_route(route)
