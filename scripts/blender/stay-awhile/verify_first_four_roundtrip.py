"""Compare Blender source bounds with reimported final quantized GLBs."""
import bpy
import json
import sys
from pathlib import Path
from mathutils import Vector

HERE = Path(__file__).resolve().parent
ROOT = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
CONTRACT = json.loads((HERE / 'contract.json').read_text(encoding='utf8'))
KEYS = ('G01', 'G02', 'G03', 'T01')
results = []


def bounds(objects):
    def world_matrix(obj):
        local = obj.matrix_parent_inverse @ obj.matrix_basis
        return world_matrix(obj.parent) @ local if obj.parent else local
    points = [world_matrix(obj) @ vertex.co for obj in objects if obj.type == 'MESH'
              for vertex in obj.data.vertices]
    assert points
    return ([min(p[i] for p in points) for i in range(3)],
            [max(p[i] for p in points) for i in range(3)])


for asset_id in KEYS:
    asset = CONTRACT['assets'][asset_id]
    for lod in ('desktop', 'mobile'):
        bpy.ops.wm.open_mainfile(filepath=str(HERE / asset['source']), load_ui=False)
        bpy.context.scene.frame_set(1)
        bpy.context.view_layer.update()
        source = bounds(bpy.data.collections[f'SA_{asset_id}_{lod.upper()}'].objects)
        bpy.ops.wm.read_factory_settings(use_empty=True)
        glb = ROOT / asset['path'].replace('.desktop.glb', f'.{lod}.glb')
        bpy.ops.import_scene.gltf(filepath=str(glb))
        bpy.context.scene.frame_set(1)
        bpy.context.view_layer.update()
        imported = bounds(bpy.data.objects)
        error = max(abs(source[k][i] - imported[k][i]) for k in range(2) for i in range(3))
        assert error < .012, (asset_id, lod, error, source, imported)
        results.append({'assetId': asset_id, 'lod': lod, 'maxBoundsErrorMetres': error})
        print('ROUNDTRIP', asset_id, lod, error, flush=True)
(HERE / 'roundtrip-first-four.json').write_text(json.dumps(results, indent=2), encoding='utf8')
print('FIRST_FOUR_ROUNDTRIP_PASS', len(results), flush=True)
