"""Import every delivered GLB with its actual external textures into empty Blender."""
import bpy,json,struct,sys,math
from pathlib import Path
from mathutils import Vector
H=Path(__file__).resolve().parent;R=H.parents[2];C=json.loads((H/'contract.json').read_text(encoding='utf8'))
rows=[];errors=[]
for aid,a in C['assets'].items():
    for lod in ('desktop','mobile'):
        path=R/a['path'].replace('.desktop.glb','.'+lod+'.glb');raw=path.read_bytes()
        d=json.loads(raw[20:20+struct.unpack_from('<I',raw,12)[0]])
        bpy.ops.wm.read_factory_settings(use_empty=True)
        try:
            bpy.ops.import_scene.gltf(filepath=str(path),import_pack_images=True)
            missing=[im.name for im in bpy.data.images if im.source=='FILE' and (im.size[0]==0 or not im.has_data)]
            triangles=sum(len(p.vertices)-2 for o in bpy.data.objects if o.type=='MESH' for p in o.data.polygons)
            expected=sum(d['accessors'][p['indices']]['count']//3 for m in d['meshes'] for p in m['primitives'])
            assert triangles==expected,(triangles,expected)
            assert not missing,missing
            assert f'SA_{aid}_ROOT_00' in bpy.data.objects
            if d.get('animations'):assert bpy.data.actions
            assert all(o.data.materials and all(m is not None for m in o.data.materials) for o in bpy.data.objects if o.type=='MESH')
            rows.append({'assetId':aid,'lod':lod,'triangles':triangles,'imagesLoaded':len(bpy.data.images),'meshObjects':len(d['meshes']),'imported':True,'missingImages':missing})
        except Exception as e:errors.append([aid,lod,str(e)])
        print('ROUNDTRIP',aid,lod,'errors',len(errors),flush=True)
(H/'senior-roundtrip.json').write_text(json.dumps({'variants':rows,'errors':errors},indent=2))
print('ROUNDTRIP_COMPLETE',len(rows),errors,flush=True)
if errors:raise SystemExit(1)
