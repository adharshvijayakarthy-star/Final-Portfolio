"""Extend submerged T02 bases to the basin bed without moving their public anchors."""
import bpy,sys,math
from pathlib import Path
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
from geometry import G,B
p=HERE/'03-thinker.blend';bpy.ops.wm.open_mainfile(filepath=str(p),load_ui=False)
if not bpy.context.scene.get('stoneGrounding'):
    for lod in ('DESKTOP','MOBILE'):
        n=6 if lod=='MOBILE' else 10
        for o in bpy.data.collections['SA_T02_'+lod].objects:
            if o.type!='MESH':continue
            for v in o.data.vertices[:n]:
                x,y,z=G(v.co);v.co=B((x*.8/math.sin(.13),-.16,z*.8/math.sin(.13)))
            o.data.update()
    bpy.context.scene['stoneGrounding']=True;bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(p),compress=True)
