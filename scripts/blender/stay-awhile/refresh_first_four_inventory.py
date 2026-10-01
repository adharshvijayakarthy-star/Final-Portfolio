"""Refresh first-four rows in the existing Blender delivery inventory only."""
import datetime
import hashlib
import json
import struct
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
ROUTES = {'garden', 'person', 'builder', 'thinker'}


def load(path):
    return json.loads(path.read_text(encoding='utf8'))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def glb_json(path):
    raw = path.read_bytes()
    length = struct.unpack_from('<I', raw, 12)[0]
    return json.loads(raw[20:20 + length])


contract = load(HERE / 'contract.json')
manifest = load(ROOT / 'public/models/stay/v1/asset-manifest.json')
manifest_assets = {row['assetId']: row for row in manifest['assets']}
inventory_path = HERE / 'delivery-inventory.json'
inventory = load(inventory_path)
first_validation = load(HERE / 'validation-first-four.json')
khronos = load(HERE / 'khronos-first-four.json')
motion = load(HERE / 'motion-first-four.json')
roundtrip = load(HERE / 'roundtrip-first-four.json')
assert len(first_validation['assets']) == 26
assert len(khronos['reports']) == 52 and not any(row['errors'] or row['warnings'] for row in khronos['reports'])
assert not motion['errors'] and len(roundtrip) == 8

for row in inventory['masters']:
    if row['route'] not in ROUTES:
        continue
    row['sha256'] = digest(ROOT / row['path'])
    row['matchesPreviousValidation'] = False
    row['matchesFinalFirstFourValidation'] = True

for row in inventory['assets']:
    asset_id = row['assetId']
    if contract['assets'][asset_id]['owner'] not in ROUTES:
        continue
    record = manifest_assets[asset_id]
    for lod in ('desktop', 'mobile'):
        stat = record['variants'][lod]
        path = ROOT / stat['uri'].lstrip('/').replace('models/', 'public/models/', 1)
        data = glb_json(path)
        row['variants'][lod].update({
            'path': path.relative_to(ROOT).as_posix(),
            'sha256': stat['sha256'],
            'triangles': stat['triangles'],
            'bytes': stat['byteLength'],
            'clips': stat['clips'],
            'materials': [material['name'] for material in data.get('materials', [])],
        })
        assert row['variants'][lod]['sha256'] == digest(path)
        assert stat['triangles'] <= row['variants'][lod]['triangleCap']
        assert stat['byteLength'] <= row['variants'][lod]['byteCap']

for row in inventory['posters']:
    if row['route'] not in ROUTES:
        continue
    path = ROOT / row['path']
    row['sha256'] = digest(path)
    row['bytes'] = path.stat().st_size

inventory['validation']['reportsPostdateAllExports'] = False
inventory['validation']['allSourceAndExportHashesMatchPriorValidation'] = False
inventory['validation']['firstFourFinal'] = {
    'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'masterCount': 4,
    'assetCount': 26,
    'desktopExports': 26,
    'mobileExports': 26,
    'khronosErrors': 0,
    'khronosWarnings': 0,
    'authoredClipCount': first_validation['authoredClips'],
    'motionSamples': sum(row['samples'] for row in motion['results']),
    'motionErrors': len(motion['errors']),
    'staticRoundtrips': len(roundtrip),
    'maxStaticBoundsErrorMetres': max(row['maxBoundsErrorMetres'] for row in roundtrip),
    'reference': 'scripts/blender/stay-awhile/validation-first-four.json',
}
inventory_path.write_text(json.dumps(inventory, indent=2, ensure_ascii=False), encoding='utf8')
print('FIRST_FOUR_INVENTORY_REFRESHED', inventory['validation']['firstFourFinal'])
