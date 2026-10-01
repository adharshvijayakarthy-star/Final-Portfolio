"""Fast source-master triangle/material preflight before binary export."""
import bpy
import json
import sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
contract=json.loads((HERE/'contract.json').read_text(encoding='utf8'))
errors=[]
for route in contract['routes']:
    source=next(a['source'] for a in contract['assets'].values() if a['owner']==route)
    bpy.ops.wm.open_mainfile(filepath=str(HERE/source),load_ui=False)
    for record in (a for a in contract['assets'].values() if a['owner']==route):
        for index,lod in enumerate(('desktop','mobile')):
            col=bpy.data.collections[f"SA_{record['id']}_{lod.upper()}"]
            meshes=[o for o in col.all_objects if o.type=='MESH' and not o.library]
            tris=0
            for obj in meshes:
                obj.data.calc_loop_triangles()
                tris+=len(obj.data.loop_triangles)
            cap=record['triangles'][index]
            materials=len({m.name for obj in meshes for m in obj.data.materials if m})
            line=(route,record['id'],lod,tris,cap,materials)
            print('ASTRA_PREFLIGHT',*line,flush=True)
            if tris>cap:errors.append(line)
print('ASTRA_PREFLIGHT_ERRORS',json.dumps(errors),flush=True)
if errors: raise SystemExit(1)
