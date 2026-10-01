"""Read-only check of owned export collections and composition libraries."""
import bpy
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
contract = json.loads((HERE / 'contract.json').read_text(encoding='utf8'))
rows = []
errors = []

for route in contract['routes']:
    owned = [a for a in contract['assets'].values() if a['owner'] == route]
    source = HERE / owned[0]['source']
    bpy.ops.wm.open_mainfile(filepath=str(source), load_ui=False)
    route_rows = []
    for asset in owned:
        aid = asset['id']
        for lod in ('desktop', 'mobile'):
            export_parent = bpy.data.collections[f'09_EXPORT_DESKTOP' if lod == 'desktop' else '10_EXPORT_MOBILE']
            col = bpy.data.collections[f'SA_{aid}_{lod.upper()}']
            library = bpy.data.collections[f'LIB_{aid}_{lod}']
            meshes = [obj for obj in col.all_objects if obj.type == 'MESH']
            missing = [obj.name for obj in meshes if obj.name not in library.objects]
            root = next((obj for obj in col.objects if obj.get('assetId') == aid and obj.get('lod') == lod), None)
            if col.name not in export_parent.children:
                errors.append([route, aid, lod, 'export collection missing'])
            if not meshes or missing or root is None or root.name not in library.objects:
                errors.append([route, aid, lod, 'library or root mismatch', missing])
            route_rows.append({'assetId': aid, 'lod': lod, 'meshCount': len(meshes),
                               'libraryMeshCount': len([obj for obj in meshes if obj.name in library.objects]),
                               'root': root.name if root else None})
    composition = []
    for lod in ('DESKTOP', 'MOBILE'):
        col = bpy.data.collections[f'COMPOSITION_{lod}']
        for obj in col.objects:
            if obj.instance_type != 'COLLECTION':
                continue
            if obj.instance_collection is None or not obj.instance_collection.objects:
                errors.append([route, lod, obj.name, 'empty composition library'])
            composition.append(obj.name)
    rows.append({'route': route, 'ownedVariants': route_rows,
                 'compositionInstances': len(composition)})
    print('INCLUSION', route, len(route_rows), len(composition), flush=True)

report = {'routes': rows, 'ownedVariantCount': sum(len(row['ownedVariants']) for row in rows),
          'errors': errors}
(HERE / 'astra-v2-inclusion-check.json').write_text(json.dumps(report, indent=2), encoding='utf8')
print('INCLUSION_ERRORS', json.dumps(errors), flush=True)
if errors:
    raise SystemExit(1)
