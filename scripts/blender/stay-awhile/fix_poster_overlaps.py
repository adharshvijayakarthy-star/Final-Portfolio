"""Only the two confirmed coplanar poster defects; no new geometry or Actions."""
import bpy,sys,json,hashlib
from pathlib import Path
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
from layout import instances
c=json.loads((HERE/'contract.json').read_text(encoding='utf8')); changes=[]
for route in ('stories','future'):
    source=HERE/next(a['source'] for a in c['assets'].values() if a['owner']==route)
    bpy.ops.wm.open_mainfile(filepath=str(source),load_ui=False)
    if bpy.context.scene.get('handoffCoplanarFix'):continue
    before=hashlib.sha256(source.read_bytes()).hexdigest(); changed=[]
    if route=='stories':
        for lod in ('DESKTOP','MOBILE'):
            for obj in bpy.data.collections['SA_S01_'+lod].objects:
                if obj.type=='MESH' and obj.parent and 'BAY' in obj.parent.name:
                    # Bay slab tops and connecting path slabs both occupied Y=.015.
                    # Raise bay geometry 1 cm, retaining its ground penetration.
                    for v in obj.data.vertices:v.co.z+=.01
                    obj.data.update();changed.append(obj.name)
        note='Handoff review: raised S01 bay slabs 0.01 m above overlapping path tops; fixed black coplanar patches without adding geometry.'
    else:
        expected=next(x for x in instances(route,c) if x['assetId']=='G09')
        for lod in ('DESKTOP','MOBILE'):
            for obj in bpy.data.collections['COMPOSITION_'+lod].objects:
                if obj.get('assetId')=='G09':obj.location.z=expected['position'][1];changed.append(obj.name)
        note='Handoff review: Future G09 instance Y=-0.51 m, placing skirt 0.01 m beneath the overlapping terrain; fixes black horizontal strip. Shared G09 geometry unchanged.'
    text=bpy.data.texts['READ_ME'];info=json.loads(text.as_string());info['artistNotes'].append(note);text.clear();text.write(json.dumps(info,indent=2))
    bpy.context.scene['handoffCoplanarFix']=True;bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
    changes.append({'route':route,'source':source.name,'beforeSha256':before,'afterSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'objects':changed,'reason':note})
(HERE/'poster-overlap-corrections.json').write_text(json.dumps(changes,indent=2),encoding='utf8')
print('TARGETED_CORRECTIONS',json.dumps(changes),flush=True)
