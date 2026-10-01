"""Resolve observed coplanar ground and expose the three separate Leader approaches."""
import bpy,sys,math,json
from pathlib import Path
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
from geometry import B,G
for route,source,aid in [('leader','04-leader.blend','L01'),('stories','05-stories.blend','S01')]:
    p=HERE/source;bpy.ops.wm.open_mainfile(filepath=str(p),load_ui=False)
    if bpy.context.scene.get('pathGrounding'):continue
    if route=='leader':
        for colname in ('COMPOSITION_DESKTOP','COMPOSITION_MOBILE'):
            for o in bpy.data.collections[colname].objects:
                if o.get('assetId')=='G01':o.location.z-=.02
    for lod in ('DESKTOP','MOBILE'):
        for o in bpy.data.collections[f'SA_{aid}_{lod}'].objects:
            if o.type!='MESH' or o.data.materials[0].name!='SA_M_STONE':continue
            for v in o.data.vertices:
                x,y,z=G(v.co)
                if route=='leader':
                    shoulder=min(1,max(0,(abs(x)-1.25)/2));ground=.10*shoulder*(.6+.4*math.sin(x*.7+z*.24))
                    y+=ground+.035
                else:y+=.035
                v.co=B((x,y,z))
            o.data.update()
    bpy.context.scene['pathGrounding']=True;bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(p),compress=True)
