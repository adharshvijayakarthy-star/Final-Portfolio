"""Test both actual LOD compositions along the locked rails."""
import bpy,json,sys
from pathlib import Path
H=Path(__file__).resolve().parent;sys.path.insert(0,str(H))
from render_review import corridor
from produce import set_exclude
c=json.loads((H/'contract.json').read_text());rows=[]
for route in c['routes']:
    source=H/next(a['source'] for a in c['assets'].values() if a['owner']==route)
    bpy.ops.wm.open_mainfile(filepath=str(source),load_ui=False)
    for lod in ('desktop','mobile'):
        set_exclude('COMPOSITION_DESKTOP',lod=='mobile');set_exclude('COMPOSITION_MOBILE',lod=='desktop')
        violations=[v for v in corridor(route,c,True) if v.get('mobile')==(lod=='mobile')]
        rows.append({'route':route,'lod':lod,'samples':len(c['routes'][route]['knots'])*9*5,'clearanceMetres':.5,'violations':violations})
        print('RAIL',route,lod,len(violations),flush=True)
(H/'rail-validation.json').write_text(json.dumps({'routes':rows,'totalSamples':sum(x['samples'] for x in rows),'violations':sum(len(x['violations']) for x in rows)},indent=2))
