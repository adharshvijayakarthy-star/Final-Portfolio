"""Open final masters without saving; record structural handoff evidence."""
import bpy, json, sys, re, hashlib
from pathlib import Path
HERE=Path(__file__).resolve().parent; sys.path.insert(0,str(HERE))
from produce import COLLECTIONS
from geometry import G
from bpy_extras.anim_utils import action_get_channelbag_for_slot
c=json.loads((HERE/'contract.json').read_text(encoding='utf8')); rows=[]
for route,r in c['routes'].items():
    assets=[a for a in c['assets'].values() if a['owner']==route]; p=HERE/assets[0]['source']; before=hashlib.sha256(p.read_bytes()).hexdigest()
    bpy.ops.wm.open_mainfile(filepath=str(p),load_ui=False)
    scene=bpy.context.scene; local=[o for o in bpy.data.objects if not o.library]
    info=json.loads(bpy.data.texts['READ_ME'].as_string())
    errors=[]
    for key in ['version','purpose','assetIds','provenance','coordinateConvention','exportProcess','dependencies','validationStatus','artistNotes']:
        if not info.get(key) and key!='dependencies': errors.append('READ_ME missing '+key)
    missing_collections=[n for n in COLLECTIONS if n not in bpy.data.collections]
    bad_names=[o.name for o in local if not re.fullmatch(r'SA_[A-Z0-9]+_[A-Z_]+_\d\d',o.name)]
    expected=[cl for a in assets for cl in a['clips']]; actions=[]
    for action in bpy.data.actions:
        if action.library:continue
        keys=[]
        for layer in action.layers:
            for strip in layer.strips:
                for slot in action.slots:
                    bag=strip.channelbag(slot)
                    if bag:
                        for fc in bag.fcurves:keys.extend(k.co.x for k in fc.keyframe_points)
        duration=(max(keys)-min(keys))/scene.render.fps if keys else 0
        actions.append({'name':action.name,'duration':round(duration,6),'slots':len(action.slots),'keyFrames':[min(keys),max(keys)] if keys else []})
    assert sorted(a['name'] for a in actions)==sorted(a['name'] for a in expected)
    for e in expected:assert abs(next(a['duration'] for a in actions if a['name']==e['name'])-e['duration'])<.002
    guides=[]
    for i,k in enumerate(r['knots']):
        for role,pos in [('CAM',k['end']),('LOOK',k['look']),('TEXT',k['look'])]:
            name=f'SA_{route.upper()}_{role}_{i:02}'; obj=bpy.data.objects.get(name)
            assert obj is not None and max(abs(x-y) for x,y in zip(G(obj.location),pos))<.0001
            guides.append(name)
    for role in ['ENTRY','EXIT']:assert bpy.data.objects.get(f'SA_{route.upper()}_{role}_00')
    owned=[]
    for a in assets:
        variants={}
        for lod in ['DESKTOP','MOBILE']:
            col=bpy.data.collections[f"SA_{a['id']}_{lod}"]; meshes=[o for o in col.all_objects if o.type=='MESH']
            assert meshes
            missing_materials=[o.name for o in meshes if not o.data.materials or any(m is None for m in o.data.materials)]
            assert not missing_materials
            variants[lod.lower()]={'meshCount':len(meshes),'materials':sorted({m.name for o in meshes for m in o.data.materials}),'uvMeshes':sum(bool(o.data.uv_layers) for o in meshes),'vertexColorMeshes':sum(bool(o.data.color_attributes) for o in meshes)}
        owned.append({'assetId':a['id'],'variants':variants})
    libraries=[{'path':lib.filepath,'exists':Path(bpy.path.abspath(lib.filepath)).is_file()} for lib in bpy.data.libraries]
    assert all(x['exists'] and x['path'].startswith('//') for x in libraries)
    images=[{'name':im.name,'path':im.filepath,'packed':bool(im.packed_file),'size':list(im.size),'colorSpace':im.colorspace_settings.name} for im in bpy.data.images if im.source=='FILE']
    assert not missing_collections and not bad_names and not errors
    assert scene.unit_settings.system=='METRIC' and scene.unit_settings.scale_length==1 and scene.render.fps==30
    assert hashlib.sha256(p.read_bytes()).hexdigest()==before
    rows.append({'route':route,'path':p.name,'sha256':before,'opened':True,'collections':list(COLLECTIONS),'assetIds':[a['id'] for a in assets],'assets':owned,'actions':actions,'guideCount':len(guides)+2,'libraries':libraries,'images':images,'readMe':info,'unrelatedObjects':bad_names,'errors':errors})
    print('AUDIT_OPENED',route,'actions',len(actions),flush=True)
(HERE/'master-handoff-validation.json').write_text(json.dumps({'masters':rows,'errors':[],'savedMasters':False},indent=2),encoding='utf8')
print('MASTER_AUDIT_COMPLETE',len(rows),flush=True)
