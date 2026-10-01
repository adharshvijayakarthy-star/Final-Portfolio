"""Render actual exported GLBs in the documented route composition and lighting."""
import bpy,json,struct,math,sys,bisect
from pathlib import Path
from mathutils import Vector,Quaternion
H=Path(__file__).resolve().parent;R=H.parents[2];sys.path.insert(0,str(H))
from layout import instances,camera_pose,POSTER_PROGRESS,CLIP_BANDS
from geometry import B
C=json.loads((H/'contract.json').read_text(encoding='utf8'))
args=sys.argv[sys.argv.index('--')+1:]
for route in args:
    src=H/next(a['source'] for a in C['assets'].values() if a['owner']==route)
    bpy.ops.wm.open_mainfile(filepath=str(src),load_ui=False)
    s=bpy.context.scene;camera=s.camera
    for o in list(bpy.data.objects):
        if o.type not in ('LIGHT','CAMERA'):bpy.data.objects.remove(o,do_unlink=True)
    progress=POSTER_PROGRESS[route];records=instances(route,C);assets={};subsets={}
    for aid in sorted({r['assetId'] for r in records}):
        path=R/C['assets'][aid]['path'];raw=path.read_bytes();n=struct.unpack_from('<I',raw,12)[0]
        doc=json.loads(raw[20:20+n]);binary=raw[n+28:]
        before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(path),import_pack_images=True)
        objects=set(bpy.data.objects)-before;byname={o.name:o for o in objects}
        col=bpy.data.collections.new('DELIVERED_'+aid)
        for o in objects:
            for c in list(o.users_collection):c.objects.unlink(o)
            col.objects.link(o)
            if o.animation_data:
                o.animation_data.action=None
                for t in o.animation_data.nla_tracks:t.mute=True
        assets[aid]=col
        def values(i):
            a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];size={'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']]
            off=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',size*4)
            return [struct.unpack_from('<'+'f'*size,binary,off+j*stride) for j in range(a['count'])]
        for anim in doc.get('animations',[]):
            band=CLIP_BANDS[anim['name']];frac=max(0,min(1,(progress-band[0])/(band[1]-band[0]))) if band else 0
            if anim['name']=='AURA_STRUCTURE':frac=.3*max(0,min(1,(progress-.24)/.08)) if progress<.38 else .3+.7*max(0,min(1,(progress-.38)/.11))
            duration=C['assets'][aid]['clips'][0]['duration'];time=frac*duration
            for ch in anim['channels']:
                samp=anim['samplers'][ch['sampler']];ts=[x[0] for x in values(samp['input'])];vs=values(samp['output'])
                j=min(len(ts)-2,max(0,bisect.bisect_right(ts,time)-1));f=max(0,min(1,(time-ts[j])/(ts[j+1]-ts[j])))
                o=byname[doc['nodes'][ch['target']['node']]['name']];kind=ch['target']['path']
                if kind=='rotation':
                    q=[Quaternion((v[3],v[0],-v[2],v[1])) for v in (vs[j],vs[j+1])]
                    o.rotation_mode='QUATERNION';o.rotation_quaternion=q[0].slerp(q[1],f)
                else:
                    val=[a+(b-a)*f for a,b in zip(vs[j],vs[j+1])]
                    if kind=='translation':o.location=B(val)
                    else:o.scale=(val[0],val[2],val[1])
    for r in records:
        col=assets[r['assetId']]
        if r['variantNode']:
            key=(r['assetId'],r['variantNode'])
            if key not in subsets:
                node=next(o for o in col.objects if o.name==r['variantNode']);sub=bpy.data.collections.new('SUBSET_'+r['variantNode'])
                keep=set(node.children_recursive)|{node};p=node.parent
                while p:keep.add(p);p=p.parent
                for o in keep:sub.objects.link(o)
                subsets[key]=sub
            col=subsets[key]
        o=bpy.data.objects.new('REVIEW_'+r['instanceId'],None);s.collection.objects.link(o);o.instance_type='COLLECTION';o.instance_collection=col
        o.location=B(r['position']);o.rotation_euler.z=r['rotation'][1];o.scale=r['scale']
    pos,look=camera_pose(route,progress,C,False);camera.location=B(pos);camera.rotation_euler=(Vector(B(look))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.sensor_fit='VERTICAL';camera.data.sensor_height=24;camera.data.lens=12/math.tan(math.radians(46)/2)
    s.cycles.samples=20;s.render.threads_mode='FIXED';s.render.threads=12
    s.render.resolution_x=960;s.render.resolution_y=600;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
    dest=R/'.aura-work/senior-art-pass/glb-review'/f'{route}.png';dest.parent.mkdir(exist_ok=True)
    s.render.filepath=str(dest);bpy.ops.render.render(write_still=True)
    print('DELIVERED_GLB_RENDER',route,flush=True)
