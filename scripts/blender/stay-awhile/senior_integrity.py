"""Compare current authored guides/actions with the recoverable entry masters."""
import bpy,json,sys,hashlib
from pathlib import Path
H=Path(__file__).resolve().parent;R=H.parents[2];sys.path.insert(0,str(H))
from produce import set_exclude
C=json.loads((H/'contract.json').read_text(encoding='utf8'))
base=R/'.aura-work/senior-art-pass/baseline/scripts/blender/stay-awhile'

def snapshot(path):
    bpy.ops.wm.open_mainfile(filepath=str(path),load_ui=False)
    out={'actions':{},'guides':{},'pivots':{}}
    for a in bpy.data.actions:
        if a.library:continue
        channels=[]
        for layer in a.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for fc in bag.fcurves:
                        channels.append([fc.data_path,fc.array_index,fc.extrapolation,[[list(k.co),list(k.handle_left),list(k.handle_right),k.interpolation,k.handle_left_type,k.handle_right_type] for k in fc.keyframe_points]])
        out['actions'][a.name]=channels
    for o in bpy.data.collections['06_CAMERA_GUIDES'].objects:
        out['guides'][o.name]=[list(o.location),list(o.rotation_euler),list(o.scale)]
    for o in bpy.data.objects:
        if o.library or o.type!='EMPTY' or o.instance_type=='COLLECTION':continue
        if any(c.name.startswith('SA_') for c in o.users_collection):
            out['pivots'][o.name]=[o.parent.name if o.parent else None,list(o.location),list(o.rotation_euler),list(o.scale)]
    return out

rows=[];errors=[]
for route in C['routes']:
    src=next(a['source'] for a in C['assets'].values() if a['owner']==route)
    original=snapshot(base/src);current=snapshot(H/src)
    for key in original:
        if original[key]!=current[key]:errors.append([route,key])
    visible={}
    for lod,cap in [('desktop',160000),('mobile',55000)]:
        set_exclude('COMPOSITION_DESKTOP',lod=='mobile');set_exclude('COMPOSITION_MOBILE',lod=='desktop')
        bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
        total=0;calls=0
        for inst in deps.object_instances:
            if inst.object.type!='MESH':continue
            mesh=inst.object.to_mesh();mesh.calc_loop_triangles();total+=len(mesh.loop_triangles)
            calls+=len({p.material_index for p in mesh.polygons});inst.object.to_mesh_clear()
        visible[lod]={'triangles':total,'triangleCap':cap,'unbatchedPrimitiveInstances':calls}
        if total>cap:errors.append([route,lod,'composed triangle cap',total,cap])
    rows.append({'route':route,'actionsUnchanged':original['actions']==current['actions'],'guidesUnchanged':original['guides']==current['guides'],'pivotsUnchanged':original['pivots']==current['pivots'],'composition':visible})
    print('INTEGRITY',route,visible,flush=True)
entry=json.loads((R/'.aura-work/senior-art-pass/entry-protected.json').read_text())
changed=[p for p,h in entry.items() if not (R/p).is_file() or hashlib.sha256((R/p).read_bytes()).hexdigest()!=h]
if changed:errors.append(['website hashes changed',changed])
(H/'senior-integrity.json').write_text(json.dumps({'routes':rows,'protectedFiles':len(entry),'websiteChanges':changed,'errors':errors},indent=2))
print('INTEGRITY_ERRORS',errors,flush=True)

