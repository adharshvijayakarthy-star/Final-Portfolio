"""Compare GLB transform samples to the reopened authored Action slots."""
import bpy,sys,json,struct,bisect,math
from pathlib import Path
from mathutils import Euler,Quaternion
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
from produce import glb_read,dump
from geometry import G
from bpy_extras.anim_utils import action_get_channelbag_for_slot

args=sys.argv[sys.argv.index('--')+1:];root=Path(args[0]);only=set(args[1:]);c=json.loads((HERE/'contract.json').read_text(encoding='utf8'));results=[];errors=[]
for route in c['routes']:
    if only and route not in only:continue
    assets=[a for a in c['assets'].values() if a['owner']==route and a['clips']]
    if not assets:continue
    bpy.ops.wm.open_mainfile(filepath=str(HERE/assets[0]['source']),load_ui=False)
    for a in assets:
        for lod in ('desktop','mobile'):
            p=root/a['path'].replace('.desktop.glb','.'+lod+'.glb');d,tail=glb_read(p);binary=tail[8:]
            def values(idx):
                ac=d['accessors'][idx];v=d['bufferViews'][ac['bufferView']];n={'SCALAR':1,'VEC3':3,'VEC4':4}[ac['type']];off=v.get('byteOffset',0)+ac.get('byteOffset',0);stride=v.get('byteStride',n*4)
                return [struct.unpack_from('<'+'f'*n,binary,off+i*stride) for i in range(ac['count'])]
            maxerr=0;compared=0
            for anim in d['animations']:
                for channel in anim['channels']:
                    target=channel['target'];name=d['nodes'][target['node']]['name'];source_name=name if lod=='desktop' else name.replace('_'+a['id']+'_','_'+a['id']+'_MOBILE')
                    obj=bpy.data.objects[source_name];strip=obj.animation_data.nla_tracks[0].strips[0];bag=action_get_channelbag_for_slot(strip.action,strip.action_slot)
                    sampler=anim['samplers'][channel['sampler']];ts=[v[0] for v in values(sampler['input'])];vs=values(sampler['output'])
                    for q in (0,.25,.5,.75,1):
                        t=q*a['clips'][0]['duration'];frame=1+t*30;index=min(len(ts)-2,max(0,bisect.bisect_right(ts,t)-1));alpha=max(0,min(1,(t-ts[index])/(ts[index+1]-ts[index])))
                        path={'translation':'location','rotation':'rotation_euler','scale':'scale'}[target['path']];src=list(getattr(obj,path))
                        for fc in bag.fcurves:
                            if fc.data_path==path:src[fc.array_index]=fc.evaluate(frame)
                        if path=='rotation_euler':
                            qq=Euler(src).to_quaternion();expected=Quaternion((qq.w,qq.x,qq.z,-qq.y))
                            left,right=vs[index],vs[index+1];left=Quaternion((left[3],*left[:3]));right=Quaternion((right[3],*right[:3]));actual=left.slerp(right,alpha)
                            error=actual.rotation_difference(expected).angle
                            error=min(error,abs(2*math.pi-error))
                        else:
                            expected=G(src) if path=='location' else src;actual=[x+(y-x)*alpha for x,y in zip(vs[index],vs[index+1])];error=max(abs(x-y) for x,y in zip(actual,expected))
                        maxerr=max(maxerr,error);compared+=1
                        # 30 fps linear glTF bake of Bezier motion: 5 mm / .005 rad
                        # interior tolerance; exact endpoint values are retained.
                        if error>.005:errors.append({'asset':a['id'],'lod':lod,'node':name,'channel':path,'q':q,'error':error})
            results.append({'assetId':a['id'],'lod':lod,'samples':compared,'maxPositionMetresOrRotationRadiansError':maxerr})
dump(HERE/('motion-first-four.json' if only else 'motion-validation.json'),{'canonicalClipFractions':[0,.25,.5,.75,1],'tolerance':.005,'results':results,'errors':errors})
print('MOTION_VALIDATION',json.dumps({'variants':len(results),'samples':sum(r['samples'] for r in results),'errors':errors}),flush=True)
