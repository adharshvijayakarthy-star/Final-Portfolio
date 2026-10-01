"""Fix measured rail obstructions and final Future ground visibility."""
import bpy,sys,json
from pathlib import Path
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
from geometry import B,G
from layout import instances
c=json.loads((HERE/'contract.json').read_text(encoding='utf8'))
for route in ('garden','thinker','leader','stories','future'):
    p=HERE/next(a['source'] for a in c['assets'].values() if a['owner']==route)
    bpy.ops.wm.open_mainfile(filepath=str(p),load_ui=False)
    if bpy.context.scene.get('railCorrections'):
        if route!='thinker' or bpy.context.scene.get('lintelBaseCorrected'):continue
        for lod in ('DESKTOP','MOBILE'):
            for o in bpy.data.collections['SA_T01_'+lod].objects:
                if o.type!='MESH':continue
                for v in o.data.vertices:
                    x,y,z=G(v.co)
                    if y<=.31 and abs(z+1.8)<.2 and abs(x)>1.7:v.co=B((x*.8-.35,y,z))
        bpy.context.scene['lintelBaseCorrected']=True;bpy.context.preferences.filepaths.save_version=0
        bpy.ops.wm.save_as_mainfile(filepath=str(p),compress=True)
        continue
    for lod in ('DESKTOP','MOBILE'):
        if route=='garden':
            for o in bpy.data.collections['SA_G09_'+lod].objects:
                if o.type!='MESH':continue
                count=32 if lod=='MOBILE' else 64
                for v in list(o.data.vertices)[-count:]:
                    x,y,z=G(v.co);v.co=B((x,.5,z))
        elif route=='thinker':
            for o in bpy.data.collections['SA_T01_'+lod].objects:
                if o.type!='MESH':continue
                for v in o.data.vertices:
                    x,y,z=G(v.co)
                    if y>.31:v.co=B((x*.8-.35,y,z))
        elif route=='future':
            for o in bpy.data.collections['SA_F02_'+lod].objects:
                if o.type!='MESH':continue
                for v in o.data.vertices:v.co.z+=.035
        elif route in ('leader','stories'):
            rows=instances(route,c)
            for o in bpy.data.collections['COMPOSITION_'+lod].objects:
                idx=int(o.name.rsplit('_',1)[1]);o.location=B(rows[idx]['position'])
    text=bpy.data.texts['READ_ME'];info=json.loads(text.as_string())
    info['artistNotes'].append('Measured rail corrections: Thinker partial lintel narrowed/offset within the unchanged deck footprint; Leader lesson rail +0.30 m X; Stories lamps 1/3 X=1.10/-1.60. Camera knots unchanged. These override nominal landmark placement to satisfy the 0.50 m corridor.')
    text.clear();text.write(json.dumps(info,indent=2));bpy.context.scene['railCorrections']=True;bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(p),compress=True)
