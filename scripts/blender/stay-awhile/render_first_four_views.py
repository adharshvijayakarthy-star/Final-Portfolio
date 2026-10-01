"""Render the authored wide, medium and focal camera positions for art review."""
import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Vector

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from geometry import B
from layout import camera_pose
from produce import set_exclude
from render_review import pose

ARGS = sys.argv[sys.argv.index('--') + 1:]
ROOT = Path(ARGS[0]).resolve()
ONLY = set(ARGS[1:])
OUT = ROOT / '.aura-work' / 'blender-beauty' / 'final-views'
OUT.mkdir(parents=True, exist_ok=True)
CONTRACT = json.loads((HERE / 'contract.json').read_text(encoding='utf8'))
VIEWS = {
    'garden': ('00-garden.blend', [('wide', .12), ('medium', .55), ('focal', .78)]),
    'person': ('01-person.blend', [('wide', .15), ('medium', .60), ('focal', .80)]),
    'builder': ('02-builder.blend', [('wide', .22), ('medium', .52), ('focal', .72)]),
    'thinker': ('03-thinker.blend', [('wide', .28), ('medium', .58), ('focal', .82)]),
}
for route, (source, views) in VIEWS.items():
    if ONLY and route not in ONLY:
        continue
    bpy.ops.wm.open_mainfile(filepath=str(HERE / source), load_ui=False)
    scene = bpy.context.scene
    scene.cycles.samples = 8
    scene.render.threads_mode = 'FIXED'
    scene.render.threads = 16
    scene.render.resolution_x = 960
    scene.render.resolution_y = 600
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    camera = scene.camera
    camera.data.sensor_fit = 'VERTICAL'
    camera.data.sensor_height = 24
    camera.data.lens = 12 / math.tan(math.radians(46) / 2)
    for name, progress in views:
        pose(progress)
        set_exclude('COMPOSITION_DESKTOP', False)
        set_exclude('COMPOSITION_MOBILE', True)
        location, look = camera_pose(route, progress, CONTRACT, False)
        camera.location = B(location)
        camera.rotation_euler = (Vector(B(look)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(OUT / f'{route}-{name}.png')
        bpy.ops.render.render(write_still=True)
        print('VIEW', route, name, scene.render.filepath, flush=True)
print('VIEWS_COMPLETE', flush=True)
