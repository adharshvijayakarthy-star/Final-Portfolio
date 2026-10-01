"""Verify the published Astra v2 package against source and manifest files."""
import bpy
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
ROOT = HERE.parents[2]
MODELS = ROOT / 'public/models/stay/v1'
POSTERS = ROOT / 'public/assets/stay/v1'

def read(path):
    return json.loads(path.read_text(encoding='utf8'))

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

from produce import glb_read

contract = read(HERE / 'contract.json')
manifest = read(MODELS / 'asset-manifest.json')
validation = read(HERE / 'validation-report.json')
master_audit = read(HERE / 'master-handoff-validation.json')
inclusion = read(HERE / 'astra-v2-inclusion-check.json')
poster_review = read(HERE / 'poster-review.json')
khronos = read(HERE / 'khronos-validation.json')
motion = read(HERE / 'motion-validation.json')
rails = read(HERE / 'rail-validation.json')

expected_glbs = {str((ROOT / a['path'].replace('.desktop.glb', '.' + lod + '.glb')).resolve())
                 for a in contract['assets'].values() for lod in ('desktop', 'mobile')}
actual_glbs = {str(path.resolve()) for path in MODELS.rglob('*.glb')}
assert actual_glbs == expected_glbs, (len(expected_glbs - actual_glbs), len(actual_glbs - expected_glbs))
assert len(manifest['assets']) == len(contract['assets']) == 47
assert {a['assetId'] for a in manifest['assets']} == set(contract['assets'])
assert validation['masterCount'] == 10 and validation['assetCount'] == 47
assert validation['glbCount'] == 94 and validation['authoredClipCount'] == 18
assert not validation['errors'] and not validation.get('currentPassWebsiteChanges',[])
assert len(master_audit['masters']) == 10 and not master_audit['errors']
assert inclusion['ownedVariantCount'] == 94 and not inclusion['errors']

variant_rows = []
clip_count = 0
for record in manifest['assets']:
    aid = record['assetId']
    source = ROOT / record['sourceBlend']
    assert sha(source) == record['sourceSha256']
    asset = contract['assets'][aid]
    assert record['ownerRoute'] == asset['owner'] and record['name'] == asset['name']
    assert record['clipNames'] == [clip['name'] for clip in asset['clips']]
    for index, lod in enumerate(('desktop', 'mobile')):
        path = ROOT / asset['path'].replace('.desktop.glb', '.' + lod + '.glb')
        stat = record['variants'][lod]
        data, _ = glb_read(path)
        names = [node.get('name', '') for node in data['nodes']]
        root_name = f'SA_{aid}_ROOT_00'
        root = next(node for node in data['nodes'] if node.get('name') == root_name)
        assert root['extras']['assetId'] == aid and root['extras']['lod'] == lod
        assert names == stat['nodeNames'] and len(names) == len(set(names))
        assert path.stat().st_size == stat['byteLength'] and sha(path) == stat['sha256']
        triangles = sum(data['accessors'][primitive['indices']]['count'] // 3
                        for mesh in data['meshes'] for primitive in mesh['primitives'])
        assert triangles == stat['triangles'] <= asset['triangles'][index]
        assert path.stat().st_size <= asset['kib'][index] * 1024
        assert [animation['name'] for animation in data.get('animations', [])] == record['clipNames']
        assert len(data.get('materials', [])) == stat['materialCount'] > 0
        assert all(0 <= primitive['material'] < len(data['materials'])
                   for mesh in data['meshes'] for primitive in mesh['primitives'])
        clip_count += len(data.get('animations', []))
        variant_rows.append({'assetId': aid, 'lod': lod, 'triangles': triangles,
                             'triangleCap': asset['triangles'][index],
                             'bytes': path.stat().st_size,
                             'byteCap': asset['kib'][index] * 1024})
assert len(variant_rows) == 94 and clip_count == 36

for route in contract['routes']:
    scene = read(MODELS / route / f'{route}.scene.json')
    source = ROOT / scene['sourceBlend']
    assert scene['routeId'] == route and scene['sourceSha256'] == sha(source)
    assert set(scene['ownedAssetIds']) == {a['id'] for a in contract['assets'].values() if a['owner'] == route}
    assert set(scene['assetIds']) <= set(contract['assets'])
    assert scene['cameraKnots'] == contract['routes'][route]['knots']
    assert [clip['name'] for clip in scene['clips']] == [clip['name'] for a in contract['assets'].values()
                                                      if a['owner'] == route for clip in a['clips']]

assert len(poster_review) == 20
poster_rows = []
for entry in poster_review:
    path = ROOT / entry['path']
    image = bpy.data.images.load(str(path), check_existing=False)
    dimensions = list(image.size)
    bpy.data.images.remove(image)
    expected_dimensions = [1600, 1000] if entry['lod'] == 'desktop' else [780, 1200]
    cap = (180 if entry['lod'] == 'desktop' else 110) * 1024
    assert dimensions == expected_dimensions
    assert path.stat().st_size == entry['bytes'] <= cap and entry['budgetPass']
    assert not entry['corridorViolations']
    poster_rows.append({'route': entry['route'], 'lod': entry['lod'],
                        'bytes': entry['bytes'], 'dimensions': dimensions})

assert len(khronos['reports']) == 94
assert sum(r['errors'] for r in khronos['reports']) == 0
warning_count=sum(r['warnings'] for r in khronos['reports'])
# This PBR pass uses derivative-generated tangent space to meet binary caps.
# Retain the validator's portability advisory explicitly; never suppress it.
assert all(m['code']=='MESH_PRIMITIVE_GENERATED_TANGENT_SPACE'
           for r in khronos['reports'] for m in r['messages'] if m['severity']==1)
assert len(motion['results']) == 36 and not motion['errors']
assert sum(r['samples'] for r in motion['results']) == 1210
assert rails['totalSamples'] == 5760 and rails['violations'] == 0

result = {'masterCount': 10, 'assetCount': 47, 'glbCount': 94, 'clipCount': 18,
          'animatedVariantCount': 36, 'motionSamples': 1210, 'khronosErrors': 0,
          'khronosWarnings': warning_count, 'cameraSamples': 5760, 'cameraViolations': 0,
          'posterCount': 20, 'variantRows': variant_rows, 'posterRows': poster_rows,
          'g14': [row for row in variant_rows if row['assetId'] == 'G14'],
          'protectedBaselineDifferences': validation['protectedFilesChanged'],
          'collectionLibraryInclusionErrors': inclusion['errors']}
(HERE / 'astra-v2-final-package-check.json').write_text(json.dumps(result, indent=2), encoding='utf8')
print('FINAL_PACKAGE_PASS', json.dumps({key: value for key, value in result.items()
                                       if key not in ('variantRows', 'posterRows')}), flush=True)
