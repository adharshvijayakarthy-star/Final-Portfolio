"""Reopen and validate the four delivered masters and their 52 GLBs.

Refreshes only their asset-manifest records and four scene manifests. Other
route records and files remain byte-for-byte as they were.
"""
import bpy
import datetime
import json
import math
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from produce import COLLECTIONS, dump, glb_read, sha
from validate import inspect_glb
from layout import instances

ROOT = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
CONTRACT = json.loads((HERE / 'contract.json').read_text(encoding='utf8'))
ROUTES = ('garden', 'person', 'builder', 'thinker')
manifest_path = ROOT / 'public/models/stay/v1/asset-manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf8'))
records = {record['assetId']: record for record in manifest['assets']}
assert set(records) == set(CONTRACT['assets'])
poster_review = json.loads((HERE / 'poster-review.json').read_text(encoding='utf8'))
poster_rows = {(record['route'], record['lod']): record for record in poster_review}
report = {'routes': {}, 'assets': [], 'errors': [], 'desktopExports': 0,
          'mobileExports': 0, 'beautyMeshesPresent': 0, 'authoredClips': 0}
scene_updates = {}

for route in ROUTES:
    owned = [a for a in CONTRACT['assets'].values() if a['owner'] == route]
    source = HERE / owned[0]['source']
    bpy.ops.wm.open_mainfile(filepath=str(source), load_ui=False)
    scene = bpy.context.scene
    assert scene.unit_settings.scale_length == 1
    assert all(name in bpy.data.collections for name in COLLECTIONS)
    assert 'READ_ME' in bpy.data.texts
    actual_actions = sorted(a.name for a in bpy.data.actions if not a.library)
    expected_actions = sorted(clip['name'] for asset in owned for clip in asset['clips'])
    assert actual_actions == expected_actions, (route, actual_actions, expected_actions)
    report['authoredClips'] += len(actual_actions)
    if route != 'garden':
        garden = HERE / '00-garden.blend'
        assert any(Path(bpy.path.abspath(lib.filepath)).resolve() == garden.resolve()
                   for lib in bpy.data.libraries), (route, 'Garden library missing')
    expected_instances = len(instances(route, CONTRACT))
    for lod in ('DESKTOP', 'MOBILE'):
        composition = bpy.data.collections[f'COMPOSITION_{lod}']
        actual_instances = [o for o in composition.objects if o.instance_type == 'COLLECTION']
        assert len(actual_instances) == expected_instances, (route, lod, len(actual_instances), expected_instances)
        assert all(o.instance_collection is not None for o in actual_instances)
    for lod in ('desktop', 'mobile'):
        poster = ROOT / f'public/assets/stay/v1/{route}-{lod}.webp'
        poster_row = poster_rows[route, lod]
        assert poster.is_file() and poster.stat().st_size == poster_row['bytes']
        assert poster_row['budgetPass'] and not poster_row['corridorViolations']

    source_sha = sha(source)
    scene_path = ROOT / f'public/models/stay/v1/{route}/{route}.scene.json'
    scene_manifest = json.loads(scene_path.read_text(encoding='utf8'))
    assert scene_manifest['routeId'] == route
    assert scene_manifest['ownedAssetIds'] == [a['id'] for a in owned]
    assert scene_manifest['cameraKnots'] == CONTRACT['routes'][route]['knots']
    assert scene_manifest['clips'] and route in ('builder', 'thinker') or not scene_manifest['clips']
    scene_manifest['sourceSha256'] = source_sha
    scene_manifest['exportDate'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    scene_updates[scene_path] = scene_manifest

    guide_names = {o.name for o in bpy.data.collections['06_CAMERA_GUIDES'].objects if o.type == 'EMPTY'}
    route_data = {'master': source.relative_to(ROOT).as_posix(), 'sourceSha256': source_sha,
                  'ownedAssetIds': [a['id'] for a in owned], 'collectionLinks': expected_instances * 2,
                  'linkedGarden': route != 'garden', 'actions': actual_actions,
                  'posters': [poster_rows[route, lod] for lod in ('desktop', 'mobile')]}
    report['routes'][route] = route_data

    local = [o for asset in owned
             for o in bpy.data.collections[f"SA_{asset['id']}_DESKTOP"].objects]
    frames = (1, 46, 91, 136, 181)
    poses = {}
    for frame in frames:
        scene.frame_set(frame)
        poses[frame] = {o.name: [round(value, 6) for row in o.matrix_local for value in row]
                        for o in local}
    for frame in reversed(frames):
        scene.frame_set(frame)
        current = {o.name: [round(value, 6) for row in o.matrix_local for value in row]
                   for o in local}
        assert current == poses[frame], (route, frame, 'reverse seek')
    route_data['reverseSeek'] = True

    for asset_index, asset in enumerate(owned):
        record = records[asset['id']]
        record['sourceSha256'] = source_sha
        result = {'assetId': asset['id'], 'variants': {}}
        for index, lod in enumerate(('desktop', 'mobile')):
            collection = bpy.data.collections[f"SA_{asset['id']}_{lod.upper()}"]
            source_meshes = [o for o in collection.objects if o.type == 'MESH']
            source_triangles = sum(len(poly.vertices) - 2 for obj in source_meshes
                                   for poly in obj.data.polygons)
            assert all(math.isfinite(value) for obj in collection.all_objects
                       for value in obj.location)
            assert all(all(abs(value - 1) < 1e-6 for value in obj.scale)
                       for obj in collection.all_objects)
            source_root = next(o for o in collection.objects if o.get('assetId') == asset['id'])
            assert source_root.location.length < 1e-6
            path = ROOT / asset['path'].replace('.desktop.glb', f'.{lod}.glb')
            stats, raw = inspect_glb(path)
            assert stats['triangles'] == source_triangles, (asset['id'], lod, stats['triangles'], source_triangles)
            assert stats['triangles'] <= asset['triangles'][index]
            assert stats['byteLength'] <= asset['kib'][index] * 1024
            assert [clip['name'] for clip in stats['clips']] == [clip['name'] for clip in asset['clips']]
            for actual, expected in zip(stats['clips'], asset['clips']):
                assert abs(actual['duration'] - expected['duration']) <= .002
            assert raw.get('extensionsRequired', []) == ['KHR_mesh_quantization']
            nodes = {node['name']: node for node in raw['nodes'] if 'name' in node}
            canonical = lambda name: name.replace('_MOBILE', '_') if lod == 'mobile' else name
            for obj in source_meshes:
                name = canonical(obj.name)
                assert name in nodes and 'mesh' in nodes[name], (asset['id'], lod, name)
            beauty = [o for o in source_meshes if o.get('beautyPass', 0) >= 2]
            report['beautyMeshesPresent'] += len(beauty)
            if asset_index == 0:
                assert guide_names <= set(stats['nodeNames']), (route, lod, 'guide names')
            record['variants'][lod] = stats
            record[lod + 'Url'] = stats['uri']
            result['variants'][lod] = {'path': path.relative_to(ROOT).as_posix(),
                                       'bytes': stats['byteLength'], 'byteCap': asset['kib'][index] * 1024,
                                       'triangles': stats['triangles'], 'triangleCap': asset['triangles'][index],
                                       'beautyMeshCount': len(beauty), 'clips': stats['clips']}
            report[lod + 'Exports'] += 1
        desktop, _ = glb_read(ROOT / asset['path'])
        mobile, _ = glb_read(ROOT / asset['path'].replace('.desktop.glb', '.mobile.glb'))
        desktop_anchors = {n['name']: n for n in desktop['nodes'] if 'mesh' not in n}
        mobile_anchors = {n['name']: n for n in mobile['nodes'] if 'mesh' not in n}
        assert desktop_anchors.keys() == mobile_anchors.keys(), (asset['id'], 'LOD anchor names')
        for name in desktop_anchors:
            left = desktop_anchors[name].get('translation', [0, 0, 0])
            right = mobile_anchors[name].get('translation', [0, 0, 0])
            assert all(abs(a - b) <= .01 for a, b in zip(left, right)), (asset['id'], name, 'LOD anchor')
        report['assets'].append(result)
    print('FIRST_FOUR_VALIDATED', route, flush=True)

# The historical protected baseline predates other worktree edits. Record
# mismatches, which were already present in Git status on entry to this pass.
protected = json.loads((HERE / 'protected-baseline.json').read_text(encoding='utf8'))
changed = [row['path'] for row in protected
           if not (ROOT / row['path']).is_file() or sha(ROOT / row['path']) != row['sha256']]
assert all(path.startswith('src/') for path in changed), ('unexpected protected path', changed)
report['protectedFileCount'] = len(protected)
report['historicalProtectedBaselineMismatches'] = changed

# Save only after every source, export, collection and poster check succeeded.
for path, data in scene_updates.items():
    dump(path, data)
dump(manifest_path, manifest)
dump(HERE / 'validation-first-four.json', report)
print('FIRST_FOUR_VALIDATION_RESULT', json.dumps({
    'routes': len(report['routes']), 'assets': len(report['assets']),
    'desktopExports': report['desktopExports'], 'mobileExports': report['mobileExports'],
    'beautyMeshesPresent': report['beautyMeshesPresent'],
    'authoredClips': report['authoredClips'], 'historicalProtectedBaselineMismatches': len(changed),
    'errors': report['errors']}), flush=True)
