"""Read-only background audit. Never saves an existing Blender project."""
import bpy, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
files=[ROOT/'scripts/blender/quick-discovery/quick-discovery-master.blend', *sorted((ROOT/'.aura-work/blender-poc').rglob('*.blend'))]
report=[]
for p in files:
    bpy.ops.wm.open_mainfile(filepath=str(p),load_ui=False)
    report.append({'path':p.relative_to(ROOT).as_posix(),'scenes':[s.name for s in bpy.data.scenes],'objects':len(bpy.data.objects),'meshes':len(bpy.data.meshes),'actions':[a.name for a in bpy.data.actions],'stayAssetRoots':[o.name for o in bpy.data.objects if o.name.startswith('SA_')],'decision':'Protected prior work; no specification-compliant Stay kit available for reuse.'})
(ROOT/'scripts/blender/stay-awhile/existing-audit.json').write_text(json.dumps(report,indent=2))
print('AUDIT_COMPLETE',json.dumps(report))
props=bpy.ops.export_scene.gltf.get_rna_type().properties
print('EXPORT_OPTIONS',[(p.identifier, [i.identifier for i in p.enum_items] if p.type=='ENUM' else p.type) for p in props if 'anim' in p.identifier or 'nla' in p.identifier])
