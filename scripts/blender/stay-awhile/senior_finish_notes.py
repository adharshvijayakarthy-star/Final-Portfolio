"""Write portable provenance and validation pointers without touching scene geometry."""
import bpy,json
from pathlib import Path
H=Path(__file__).resolve().parent;C=json.loads((H/'contract.json').read_text(encoding='utf8'))
p=json.loads((H/'senior-provenance.json').read_text())
p[0]['modification']='Trunk retopology by reduction; sampled crown points; varied proportions. Source diffuse/opacity atlas cropped into masked leaf sprays. Sakura crown remodeled as opaque geometry.'
p[2]['modification']='Recolored to restrained grey-green; downsampled PBR maps.'
(H/'senior-provenance.json').write_text(json.dumps(p,indent=2))
for route in C['routes']:
    path=H/next(a['source'] for a in C['assets'].values() if a['owner']==route)
    bpy.ops.wm.open_mainfile(filepath=str(path),load_ui=False)
    text=bpy.data.texts['READ_ME'];info=json.loads(text.as_string())
    info['seniorArtPass']['date']='2026-09-27';info['seniorArtPass']['provenance']=p
    info['seniorArtPass']['validationStatus']='See SENIOR_ART_PASS_REPORT.md, validation-report.json, senior-integrity.json, senior-roundtrip.json, motion-validation.json, rail-validation.json and khronos-validation.json. Offline evidence does not establish browser acceptance.'
    info['seniorArtPass']['sourceCorrection']='G09 hill relief softened and pushed outward; continuous skirt shares ground PBR. G01 redundant ground edges reduced within 2 cm vertex deviation. Root, pivot, Action and camera contracts retained.'
    info['seniorArtPass']['foliage']='Green foliage uses double-sided alpha-mask sprays with cutoff 0.45 in GLB; mobile has independently reduced geometry and 128x256 foliage texture. Sakura uses opaque petal geometry.'
    info['artistNotes']=list(dict.fromkeys(info['artistNotes']))
    text.clear();text.write(json.dumps(info,indent=2))
    bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True)
    print('NOTES',route,flush=True)
