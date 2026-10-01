"""Small Blender-only camera comparisons for the existing route rails."""
import bpy, json, math, sys
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
from geometry import B
from render_review import pose
from produce import set_exclude
from layout import camera_pose

root=Path(sys.argv[sys.argv.index('--')+1]).resolve()
c=json.loads((HERE/'contract.json').read_text(encoding='utf8'))
out=root/'.aura-work/blender-beauty/candidates';out.mkdir(parents=True,exist_ok=True)
for route,source,values in [
    ('builder','02-builder.blend',[.22,.38,.52,.72,1.0]),
    ('thinker','03-thinker.blend',[.42,.58,.82]),
]:
    bpy.ops.wm.open_mainfile(filepath=str(HERE/source),load_ui=False)
    set_exclude('COMPOSITION_DESKTOP',False)
    set_exclude('COMPOSITION_MOBILE',True)
    sc=bpy.context.scene;sc.cycles.samples=6
    sc.render.resolution_x=800;sc.render.resolution_y=500
    sc.render.image_settings.file_format='PNG'
    cam=sc.camera;cam.data.sensor_fit='VERTICAL';cam.data.sensor_height=24
    cam.data.lens=12/math.tan(math.radians(46)/2)
    for p in values:
        pose(p)
        loc,look=camera_pose(route,p,c,False)
        cam.location=B(loc)
        cam.rotation_euler=(Vector(B(look))-cam.location).to_track_quat('-Z','Y').to_euler()
        sc.render.filepath=str(out/f'{route}-{int(p*100):02}.png')
        bpy.ops.render.render(write_still=True)
        print('CANDIDATE',route,p,flush=True)
