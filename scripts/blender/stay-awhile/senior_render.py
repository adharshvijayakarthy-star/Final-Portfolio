"""Render six camera checks per Stay route for Astra v2 visual review."""
import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Vector

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from geometry import B
from layout import camera_pose, POSTER_PROGRESS
from produce import set_exclude
from render_review import pose

args = sys.argv[sys.argv.index('--') + 1:]
root = Path(args[0]).resolve()
only = set(a for a in args[1:] if not a.startswith('view='))
selected_views = {a.split('=', 1)[1] for a in args[1:] if a.startswith('view=')}
hidden_assets = {a.split('=', 1)[1] for a in args[1:] if a.startswith('hide=')}
contract = json.loads((HERE / 'contract.json').read_text(encoding='utf8'))
out = root / '.aura-work' / 'senior-art-pass' / 'review'
views = [('wide', .12, False), ('primary', .42, False),
         ('landmark', .64, False), ('close', .84, False),
         ('reverse', .72, False), ('mobile', .64, True), ('material', .9, False)]
details={
 'garden':((2.6,1.1,-6.2),(1.6,.45,-8)),
 'person':((-1,1.15,-7.6),(-2.2,.4,-9)),
 'builder':((1.8,1.7,-3.6),(0,.95,-4.8)),
 'thinker':((-2,1.3,-4.6),(-2.8,.47,-5.7)),
 'leader':((2.4,1.6,-5.6),(3.3,1,-7)),
 'stories':((2.2,1.3,-.8),(1.1,.8,-2)),
 'work':((-.8,1.8,-.8),(-2.2,.98,-2)),
 'future':((2.1,1.6,-35.8),(1,1,-38)),
 'aura':((1.7,1.7,-6.7),(0,1.3,-9)),
 'contact':((4,1.2,-1.9),(3,.3,-3))}

for route in contract['routes']:
    if only and route not in only:
        continue
    record = next(a for a in contract['assets'].values() if a['owner'] == route)
    bpy.ops.wm.open_mainfile(filepath=str(HERE / record['source']), load_ui=False)
    scene = bpy.context.scene
    if hidden_assets:
        for obj in scene.objects:
            if obj.get('assetId') in hidden_assets and obj.instance_type == 'COLLECTION':
                obj.hide_render = True
    scene.cycles.samples = 20
    scene.render.threads_mode = 'FIXED'
    scene.render.threads = 16
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.camera.data.sensor_fit = 'VERTICAL'
    scene.camera.data.sensor_height = 24
    for name, progress, mobile in views:
        if selected_views and name not in selected_views:
            continue
        if name == 'close' and route == 'future':
            progress = .91
        if name == 'medium' and route == 'work':
            progress = .38
        progress = POSTER_PROGRESS[route] if name == 'primary' else progress
        pose(progress)
        set_exclude('COMPOSITION_DESKTOP', mobile)
        set_exclude('COMPOSITION_MOBILE', not mobile)
        position, look = camera_pose(route, progress, contract, mobile)
        if name == 'material':position,look=details[route]
        if name == 'reverse':
            look, _ = camera_pose(route, .27, contract, False)
            position = [position[0] + 1.5, position[1], position[2]]
        scene.camera.location = B(position)
        scene.camera.rotation_euler = (Vector(B(look)) - scene.camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.camera.data.lens = 12 / math.tan(math.radians(38 if name=='material' else 52 if mobile else 46) / 2)
        scene.render.resolution_x = 600 if mobile else 960
        scene.render.resolution_y = 900 if mobile else 600
        suffix = '.hide-' + '-'.join(sorted(hidden_assets)) if hidden_assets else ''
        destination = out / route / (name + suffix + '.png')
        destination.parent.mkdir(parents=True, exist_ok=True)
        scene.render.filepath = str(destination)
        bpy.ops.render.render(write_still=True)
        print('ASTRA_VIEW', route, name, destination, flush=True)
print('ASTRA_VIEWS_COMPLETE', flush=True)

