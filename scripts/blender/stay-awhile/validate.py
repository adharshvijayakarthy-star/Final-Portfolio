"""Independent reopening of the actual masters and binary exports; writes manifests."""
import bpy, sys, json, re, math, struct, hashlib, datetime
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
from produce import glb_read, sha, dump, COLLECTIONS
from layout import instances, CLIP_BANDS, POSTER_PROGRESS, camera_pose
from geometry import G

def inspect_glb(p):
    d,tail=glb_read(p);assert d['asset']['version']=='2.0'
    assert all('uri' not in b for b in d.get('buffers',[]))
    assert not d.get('cameras')
    nodes=d.get('nodes',[]);meshes=d.get('meshes',[]);acc=d.get('accessors',[])
    names=[n.get('name','') for n in nodes];assert len(names)==len(set(names))
    for name in names:assert re.fullmatch(r'SA_[A-Z0-9]+_[A-Z_]+_\d\d',name),name
    triangles=sum(acc[pr['indices']]['count']//3 for m in meshes for pr in m['primitives'])
    mins=[float('inf')]*3;maxs=[-float('inf')]*3
    def visit(i,parent):
        n=nodes[i]
        if 'matrix' in n:M=Matrix([n['matrix'][j::4] for j in range(4)])
        else:
            q=n.get('rotation',[0,0,0,1]);M=Matrix.LocRotScale(Vector(n.get('translation',[0,0,0])),Quaternion((q[3],q[0],q[1],q[2])),Vector(n.get('scale',[1,1,1])))
        M=parent@M
        if 'mesh' in n:
            for pr in meshes[n['mesh']]['primitives']:
                a=acc[pr['attributes']['POSITION']]
                for x in (a['min'][0],a['max'][0]):
                    for y in (a['min'][1],a['max'][1]):
                        for z in (a['min'][2],a['max'][2]):
                            v=M@Vector((x,y,z))
                            for j in range(3):mins[j]=min(mins[j],v[j]);maxs[j]=max(maxs[j],v[j])
        for ch in n.get('children',[]):visit(ch,M)
    for i in d['scenes'][d.get('scene',0)]['nodes']:visit(i,Matrix.Identity(4))
    clips=[]
    for anim in d.get('animations',[]):
        end=max(acc[s['input']]['max'][0] for s in anim['samplers']);start=min(acc[s['input']]['min'][0] for s in anim['samplers'])
        clips.append({'name':anim['name'],'duration':round(end-start,6),'frameCount':round((end-start)*30)+1,'channels':len(anim['channels'])})
        for ch in anim['channels']:assert '_ROOT_' not in nodes[ch['target']['node']]['name']
    return {'byteLength':p.stat().st_size,'sha256':sha(p),'triangles':triangles,'materialCount':len(d.get('materials',[])),
            'nodeNames':names,'clips':clips,'bounds':{'min':mins,'max':maxs},'uri':'/'+p.as_posix().split('/public/')[1]},d

def main():
    root=Path(sys.argv[sys.argv.index('--')+1]).resolve();c=json.loads((HERE/'contract.json').read_text(encoding='utf8'))
    errors=[];warnings=[];asset_records=[];masters=[];export_dir=root/'public/models/stay/v1'
    for route,rr in c['routes'].items():
        owned=[a for a in c['assets'].values() if a['owner']==route];src=HERE/owned[0]['source']
        bpy.ops.wm.open_mainfile(filepath=str(src),load_ui=False)
        scene=bpy.context.scene;assert scene.unit_settings.scale_length==1
        assert all(name in bpy.data.collections for name in COLLECTIONS)
        assert 'READ_ME' in bpy.data.texts
        expected_clips=[cl['name'] for a in owned for cl in a['clips']]
        actual_actions=sorted(a.name for a in bpy.data.actions if not a.library)
        if actual_actions!=sorted(expected_clips):errors.append([route,'actions',actual_actions,expected_clips])
        roots=[]
        for a in owned:
            record={'schemaVersion':1,'assetId':a['id'],'name':a['name'],'ownerRoute':route,'sourceBlend':src.relative_to(root).as_posix(),
                    'sourceSha256':sha(src),'artistVersion':'1.0.0','atlasDependencies':['/models/stay/v1/shared/timber-paper.desktop.png','/models/stay/v1/shared/timber-paper.mobile.png'],
                    'posterUrls':{lod:f'/assets/stay/v1/{route}-{lod}.webp' for lod in ('desktop','mobile')},'variants':{}}
            for idx,lod in enumerate(('desktop','mobile')):
                col=bpy.data.collections[f"SA_{a['id']}_{lod.upper()}"]
                for o in col.all_objects:
                    assert all(math.isfinite(v) for v in o.location)
                    assert all(abs(v-1)<1e-6 for v in o.scale),(o.name,o.scale)
                rootobj=next(o for o in col.objects if o.get('assetId')==a['id']);roots.append(rootobj.name)
                assert rootobj.location.length<1e-6
                p=root/a['path'].replace('.desktop.glb','.'+lod+'.glb');stat,d=inspect_glb(p)
                if stat['triangles']>a['triangles'][idx]:errors.append([a['id'],lod,'triangle cap',stat['triangles'],a['triangles'][idx]])
                if stat['byteLength']>a['kib'][idx]*1024:errors.append([a['id'],lod,'package cap',stat['byteLength'],a['kib'][idx]*1024])
                if [cl['name'] for cl in stat['clips']]!=[cl['name'] for cl in a['clips']]:errors.append([a['id'],lod,'clip names'])
                for exp,actual in zip(a['clips'],stat['clips']):
                    if abs(exp['duration']-actual['duration'])>.002:errors.append([a['id'],lod,'duration',exp,actual])
                record['variants'][lod]=stat
            # Same logical empties and translations in desktop/mobile asset files.
            ds,_=glb_read(root/a['path']);ms,_=glb_read(root/a['path'].replace('.desktop.glb','.mobile.glb'))
            dn={n['name']:n for n in ds['nodes'] if 'mesh' not in n};mn={n['name']:n for n in ms['nodes'] if 'mesh' not in n}
            if dn.keys()!=mn.keys():errors.append([a['id'],'LOD anchor names differ',list(dn.keys()-mn.keys()),list(mn.keys()-dn.keys())])
            for name in dn.keys()&mn.keys():
                if any(abs(x-y)>.01 for x,y in zip(dn[name].get('translation',[0,0,0]),mn[name].get('translation',[0,0,0]))):errors.append([a['id'],'LOD anchor differs',name])
            record['desktopUrl']=record['variants']['desktop']['uri'];record['mobileUrl']=record['variants']['mobile']['uri']
            record['atlasDependencies']=sorted({'/models/stay/v1/shared/'+Path(im['uri']).name for doc in (ds,ms) for im in doc.get('images',[]) if 'uri' in im})
            record['artistVersion']='senior-art-2026-09-27'
            record['clipNames']=[cl['name'] for cl in a['clips']];asset_records.append(record)
        # Seek forward then backward and compare matrices, including roots.
        local=[o for a in owned for o in bpy.data.collections[f"SA_{a['id']}_DESKTOP"].objects]
        frames=[1,46,91,136,181];poses={}
        for f in frames:
            scene.frame_set(f);poses[f]={o.name:[round(v,6) for row in o.matrix_local for v in row] for o in local}
        for f in reversed(frames):
            scene.frame_set(f);now={o.name:[round(v,6) for row in o.matrix_local for v in row] for o in local}
            assert poses[f]==now,(route,f,'reverse seek')
        guide_names=[o.name for o in bpy.data.collections['06_CAMERA_GUIDES'].objects if o.type=='EMPTY']
        for role in ('ENTRY','EXIT'):assert f'SA_{route.upper()}_{role}_00' in guide_names
        for i in range(len(rr['knots'])):
            for role in ('CAM','LOOK','TEXT'):assert f'SA_{route.upper()}_{role}_{i:02}' in guide_names
        clips=[dict(cl,frameCount=round(cl['duration']*30)+1,progressBand=CLIP_BANDS[cl['name']]) for a in owned for cl in a['clips']]
        inst=instances(route,c);scene_manifest={'schemaVersion':1,'routeId':route,'artistVersion':'senior-art-2026-09-27','sourceBlend':src.relative_to(root).as_posix(),
            'sourceSha256':sha(src),'specificationSha256':c['specSha256'],'exportDate':datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'ownedAssetIds':[a['id'] for a in owned],'assetIds':sorted({i['assetId'] for i in inst}),
            'instances':inst,'worldOrigin':rr['worldOrigin'],'localBounds':{'width':rr['extent'][0],'depth':rr['extent'][1]},
            'boundsExceptions':['G01 and G09 are world-scale; G11 sits beyond camera rails; F03 intentionally beyond future local zone'],
            'cameraKnots':rr['knots'],'camera':{'fov':46,'near':.1,'far':220,'roll':0},'focusAnchors':[k['look'] for k in rr['knots']],
            'contentClearanceRectangles':[k['clearance'] for k in rr['knots']],'guideNodeNames':guide_names,
            'guideAssetId':owned[0]['id'],'clips':clips,'settledPoses':[{'progress':p,'camera':camera_pose(route,p,c),
                'clipTimes':{cl['name']:cl['duration']*max(0,min(1,(p-cl['progressBand'][0])/(cl['progressBand'][1]-cl['progressBand'][0]))) if cl['progressBand'] else 0 for cl in clips}} for p in (0,.25,.5,.75,1)],
            'placementOverrides':{'leader':{'L03':{'nominal':[3,0,-7],'actual':[3.3,0,-7],'reason':'0.50 m camera corridor'}},
                'stories':{'S02-lamp1':{'nominal':[.2,0,-2],'actual':[1.1,0,-2],'reason':'0.50 m camera corridor'},
                           'S02-lamp3':{'nominal':[-.8,0,-10],'actual':[-1.6,0,-10],'reason':'0.50 m camera corridor'}}}.get(route,{}),
            'documentSocketBindings':[{'documentNode':f'SA_A02_DOCUMENT_{i:02}','socketNode':f'SA_A04_SOCKET_{i:02}','stage':'AURA_MODEL'} for i in range(9)] if route=='aura' else [],
            'posterProgress':POSTER_PROGRESS[route],'runtimeNotes':['No authored typography, scroll, visibility, foliage sway, water or AURA_CONNECTIONS clip.',
                'Only sample named child transforms; root placement belongs to the instance manifest.'],
            'validation':{'reopenedMaster':True,'reverseSeek':True,'exportStructuralRead':True}}
        dump(export_dir/route/(route+'.scene.json'),scene_manifest)
        masters.append({'route':route,'path':src.relative_to(root).as_posix(),'sha256':sha(src),'assetRoots':roots,'actions':actual_actions,'guideCount':len(guide_names),'reverseSeek':True})
        print('VALIDATED_MASTER',route,flush=True)
    protected=json.loads((HERE/'protected-baseline.json').read_text())
    changed=[r['path'] for r in protected if not (root/r['path']).is_file() or sha(root/r['path'])!=r['sha256']]
    entry=root/'.aura-work/senior-art-pass/entry-protected.json'
    entry_changes=[]
    if entry.exists():
        entry_changes=[p for p,h in json.loads(entry.read_text()).items() if not (root/p).is_file() or sha(root/p)!=h]
        if entry_changes:errors.append(['website changed during senior pass',entry_changes])
    elif changed:errors.append(['protected files changed',changed])
    manifest={'schemaVersion':1,'artistVersion':'senior-art-2026-09-27','specificationSha256':c['specSha256'],'artDirectionSpecificationSha256':'ec0ce6ca9574df3851917e8162b2cf5a68b132ba76b4f663ce75994f69056a4f','assets':asset_records}
    dump(export_dir/'asset-manifest.json',manifest)
    report={'masterCount':len(masters),'assetCount':len(asset_records),'glbCount':sum(len(a['variants']) for a in asset_records),
            'authoredClipCount':sum(len(m['actions']) for m in masters),'masters':masters,'errors':errors,'warnings':warnings,
            'protectedFileCount':len(protected),'protectedFilesChanged':changed,'currentPassWebsiteChanges':entry_changes}
    dump(HERE/'validation-report.json',report);print('VALIDATION_RESULT',json.dumps({k:v for k,v in report.items() if k!='masters'}),flush=True)
if __name__=='__main__':main()
