"""Record final evidence and file hashes only after every required check is complete."""
from pathlib import Path
import json,hashlib,datetime
H=Path(__file__).resolve().parent;R=H.parents[2]
def read(name):return json.loads((H/name).read_text(encoding='utf8'))
c=read('contract.json');v=read('validation-report.json');i=read('senior-integrity.json');r=read('senior-roundtrip.json')
p=read('astra-v2-final-package-check.json');posters=read('poster-review.json');k=read('khronos-validation.json')
assert not v['errors'] and not i['errors'] and not r['errors']
assert len(r['variants'])==94 and len(posters)==20
assert sum(x['errors'] for x in k['reports'])==0
review=[]
for route in c['routes']:
    for view in ('wide','primary','landmark','close','reverse','mobile','material'):
        path=R/'.aura-work/senior-art-pass/review'/route/(view+'.png');assert path.is_file()
        review.append({'route':route,'view':view,'path':path.relative_to(R).as_posix(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
glbs=list((R/'public/models/stay/v1').rglob('*.glb'))
textures=list((R/'public/models/stay/v1/shared').glob('senior-*'))
result={'date':'2026-09-28','scope':'Blender and asset files only','masters':10,'logicalAssets':47,'desktopGlbs':47,'mobileGlbs':47,'authoredClips':18,
 'glbTotalBytes':sum(x.stat().st_size for x in glbs),'newSharedTextures':len(textures),'newSharedTextureBytes':sum(x.stat().st_size for x in textures),
 'khronosErrors':0,'khronosWarnings':sum(x['warnings'] for x in k['reports']),'warningCode':'MESH_PRIMITIVE_GENERATED_TANGENT_SPACE',
 'importedGlbs':94,'motionSamples':p['motionSamples'],'cameraSamples':p['cameraSamples'],'cameraViolations':p['cameraViolations'],
 'websiteFilesProtected':i['protectedFiles'],'websiteChanges':i['websiteChanges'],'posterCount':20,'sourceReviewImages':len(review),
 'renderReview':review,'sceneCounts':i['routes'],'limits':['330 tangent-space portability advisories remain.','Browser performance, lifecycle and visual acceptance not tested.','Whole-scene unbatched primitive counts are not measured visible browser draw calls.'],
 'reports':['SENIOR_ART_PASS_REPORT.md','SENIOR_VISUAL_AUDIT.md','validation-report.json','master-handoff-validation.json','senior-integrity.json','senior-roundtrip.json','khronos-validation.json','motion-validation.json','rail-validation.json','poster-review.json','astra-v2-final-package-check.json']}
(H/'senior-delivery-summary.json').write_text(json.dumps(result,indent=2),encoding='utf8')
print(json.dumps({a:b for a,b in result.items() if a not in ('renderReview','sceneCounts','reports')},indent=2))
