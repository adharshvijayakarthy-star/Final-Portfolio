"""Read-only package checks and preview sheets; never alters production assets."""
from pathlib import Path
import json, hashlib, struct, re
from zipfile import ZipFile
from xml.etree import ElementTree as E
from PIL import Image, ImageOps, ImageDraw

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
def read(p): return json.loads(p.read_text(encoding='utf-8'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def dump(p,v): p.write_text(json.dumps(v,indent=2,ensure_ascii=False),encoding='utf-8')

def main():
    c=read(HERE/'contract.json'); manifest=read(ROOT/'public/models/stay/v1/asset-manifest.json')
    previous=read(HERE/'validation-report.json'); issues=[]
    doc=ROOT/c['specification']; ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    with ZipFile(doc) as z: body=E.fromstring(z.read('word/document.xml')).find('w:body',ns)
    text=lambda el: ''.join(t.text or '' for t in el.findall('.//w:t',ns))
    lines=[]
    for el in body:
        if el.tag.endswith('}p'): lines.append(text(el))
        elif el.tag.endswith('}tbl'):
            lines.extend(' | '.join(text(cell) for cell in row.findall('w:tc',ns)) for row in el.findall('w:tr',ns))
    assert sha(doc)==c['specSha256'], 'Specification changed since contract extraction'
    assert lines==(HERE/'spec-extract.txt').read_text(encoding='utf-8').splitlines(), 'Stored extraction differs from current DOCX'
    records={a['assetId']:a for a in manifest['assets']}; assert set(records)==set(c['assets'])
    assets=[]; exported_clips=[]
    for aid,a in c['assets'].items():
        record=records[aid]; row={'assetId':aid,'expected':a['name'],'actual':record['name'],'sourceBlend':record['sourceBlend'],'variants':{},'status':'COMPLETE'}
        assert sha(ROOT/record['sourceBlend'])==record['sourceSha256']
        for j,lod in enumerate(('desktop','mobile')):
            p=ROOT/a['path'].replace('.desktop.glb','.'+lod+'.glb'); b=p.read_bytes()
            magic,version,length=struct.unpack_from('<4sII',b); assert (magic,version,length)==(b'glTF',2,len(b))
            n,kind=struct.unpack_from('<II',b,12); assert kind==0x4e4f534a
            d=json.loads(b[20:20+n]); s=record['variants'][lod]; assert sha(p)==s['sha256']
            names=[node.get('name','') for node in d['nodes']]
            assert names==s['nodeNames'] and len(set(names))==len(names)
            assert f'SA_{aid}_ROOT_00' in names
            root_node=next(node for node in d['nodes'] if node.get('name')==f'SA_{aid}_ROOT_00')
            assert root_node['extras']['assetId']==aid and root_node['extras']['lod']==lod
            assert all(re.fullmatch(r'SA_[A-Z0-9]+_[A-Z_]+_\d\d',name) for name in names)
            assert not d.get('cameras') and not d.get('extensionsRequired')
            assert all('uri' not in buf for buf in d.get('buffers',[]))
            assert all('uri' not in im for im in d.get('images',[]))
            materials=d.get('materials',[]); assert materials
            primitives=[pr for m in d['meshes'] for pr in m['primitives']]
            assert all(0<=pr['material']<len(materials) for pr in primitives)
            triangles=sum(d['accessors'][pr['indices']]['count']//3 for pr in primitives)
            assert triangles==s['triangles'] and triangles<=a['triangles'][j]
            assert len(b)==s['byteLength'] and len(b)<=a['kib'][j]*1024
            clips=[]
            for an in d.get('animations',[]):
                duration=max(d['accessors'][sp['input']]['max'][0] for sp in an['samplers'])-min(d['accessors'][sp['input']]['min'][0] for sp in an['samplers'])
                clips.append({'name':an['name'],'duration':round(duration,6),'targetNodes':len(set(ch['target']['node'] for ch in an['channels']))})
            assert [x['name'] for x in clips]==[x['name'] for x in a['clips']]
            assert all(abs(x['duration']-y['duration'])<.002 for x,y in zip(clips,a['clips']))
            row['variants'][lod]={'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p),'triangles':triangles,'triangleCap':a['triangles'][j],'bytes':len(b),'byteCap':a['kib'][j]*1024,'clips':clips,'materials':[m['name'] for m in materials]}
        assets.append(row)
        for cl in a['clips']: exported_clips.append(dict(cl,route=a['owner'],sourceBlend=row['sourceBlend'],assetId=aid,exportStatus='desktop + mobile verified'))
    masters=[]
    for m in previous['masters']:
        assert sha(ROOT/m['path'])==m['sha256']; masters.append({'route':m['route'],'path':m['path'],'sha256':m['sha256'],'matchesPreviousValidation':True})
    scenes=[]
    required=['schemaVersion','routeId','artistVersion','sourceBlend','sourceSha256','specificationSha256','exportDate','ownedAssetIds','assetIds','instances','cameraKnots','localBounds','camera','focusAnchors','contentClearanceRectangles','guideNodeNames','guideAssetId','clips','settledPoses','posterProgress']
    for route in c['routes']:
        p=ROOT/f'public/models/stay/v1/{route}/{route}.scene.json'; d=read(p)
        missing=[key for key in required if key not in d]
        assert d['routeId']==route and d['sourceSha256']==sha(ROOT/d['sourceBlend'])
        assert set(d['ownedAssetIds'])=={a['id'] for a in c['assets'].values() if a['owner']==route}
        assert set(d['assetIds'])<=set(c['assets'])
        assert d['schemaVersion']==1 and d['specificationSha256']==c['specSha256']
        assert d['cameraKnots']==c['routes'][route]['knots']
        expected_clips=[cl for a in c['assets'].values() if a['owner']==route for cl in a['clips']]
        assert [cl['name'] for cl in d['clips']]==[cl['name'] for cl in expected_clips]
        for cl,ex in zip(d['clips'],expected_clips):
            assert cl['duration']==ex['duration'] and cl['frameCount']==round(ex['duration']*30)+1
        assert len(d['contentClearanceRectangles'])==len(d['cameraKnots'])
        assert len(d['settledPoses'])==5
        guide_container=records[d['guideAssetId']]
        for lod in ('desktop','mobile'):
            assert set(d['guideNodeNames'])<=set(guide_container['variants'][lod]['nodeNames'])
        scenes.append({'route':route,'path':p.relative_to(ROOT).as_posix(),'keys':list(d),'missingFields':missing})
    baseline=read(HERE/'protected-baseline.json')
    protected={'count':len(baseline),'changed':[r['path'] for r in baseline if not (ROOT/r['path']).is_file() or sha(ROOT/r['path'])!=r['sha256']]}
    posters=[]; qa=HERE/'handoff-review'; qa.mkdir(exist_ok=True)
    for route in c['routes']:
        canvas=Image.new('RGB',(1300,820),'#202525'); draw=ImageDraw.Draw(canvas)
        for j,lod in enumerate(('desktop','mobile')):
            p=ROOT/f'public/assets/stay/v1/{route}-{lod}.webp'
            with Image.open(p) as im:
                assert im.size==((1600,1000) if lod=='desktop' else (780,1200)); im.load()
                assert p.stat().st_size<=(180 if lod=='desktop' else 110)*1024
                preview=ImageOps.contain(im,(800,750) if j==0 else (480,750)); canvas.paste(preview,((0 if j==0 else 820),45))
                posters.append({'route':route,'lod':lod,'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p),'dimensions':list(im.size),'bytes':p.stat().st_size})
            draw.text((10 if j==0 else 830,15),route.upper()+' / '+lod,fill='white')
        canvas.save(qa/(route+'.png'))
    kh=read(HERE/'khronos-validation.json'); khpaths={r['path'].replace('\\','/') for r in kh['reports']}
    assert khpaths=={v['path'] for a in assets for v in a['variants'].values()}
    validation={'khronosFiles':len(khpaths),'khronosErrors':sum(r['errors'] for r in kh['reports']),'khronosWarnings':sum(r['warnings'] for r in kh['reports']), 'reportsPostdateAllExports':(HERE/'khronos-validation.json').stat().st_mtime>=max((ROOT/p).stat().st_mtime for p in khpaths),'allSourceAndExportHashesMatchPriorValidation':True}
    result={'specification':{'path':doc.name,'sha256':sha(doc),'freshExtractionMatches':True},'masters':masters,'assets':assets,'authoredClips':exported_clips,'sceneManifests':scenes,'posters':posters,'protectedFiles':protected,'validation':validation,'stagingFiles':[p.relative_to(ROOT).as_posix() for p in (HERE/'staging').rglob('*') if p.is_file()]}
    # Retain the completed audit/frontier and entry-to-final change ledger on refresh.
    inventory_path=HERE/'delivery-inventory.json'
    if inventory_path.exists(): result={**read(inventory_path),**result}
    dump(inventory_path,result)
    print(json.dumps({'masters':len(masters),'assets':len(assets),'glbs':sum(len(a['variants']) for a in assets),'clips':len(exported_clips),'scenes':len(scenes),'posters':len(posters),'protected':protected,'validation':validation,'missingManifestFields':{s['route']:s['missingFields'] for s in scenes if s['missingFields']}}))

if __name__=='__main__':main()
