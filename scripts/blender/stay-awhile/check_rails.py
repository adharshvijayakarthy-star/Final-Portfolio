"""Dense camera rails against five authored geometry states, both camera tiers."""
import bpy,sys,json
from pathlib import Path
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
from render_review import corridor
from produce import dump
c=json.loads((HERE/'contract.json').read_text(encoding='utf8'));rows=[]
for route in c['routes']:
    p=HERE/next(a['source'] for a in c['assets'].values() if a['owner']==route)
    bpy.ops.wm.open_mainfile(filepath=str(p),load_ui=False);issues=corridor(route,c,True)
    rows.append({'route':route,'samples':len(c['routes'][route]['knots'])*9*2*5,'clearanceMetres':.5,'violations':issues})
    print('RAIL',route,len(issues),flush=True)
dump(HERE/'rail-validation.json',{'routes':rows,'totalSamples':sum(r['samples'] for r in rows),'violations':sum(len(r['violations']) for r in rows)})
