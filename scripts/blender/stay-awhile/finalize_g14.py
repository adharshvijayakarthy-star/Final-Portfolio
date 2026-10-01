"""Complete only the mobile G14 face detail in the existing Garden master."""
import bpy
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from beautify_first_four import Sculpt, clear_meshes
from astra_v2_shared import inscription_stone

source = HERE / '00-garden.blend'
bpy.ops.wm.open_mainfile(filepath=str(source), load_ui=False)
assert 'READ_ME' in bpy.data.texts
assert bpy.data.objects.get('SA_G14_ROOT_00')
assert bpy.data.objects.get('SA_G14_MOBILEROOT_00')
assert not [a for a in bpy.data.actions if not a.library]

clear_meshes('G14', 'mobile')
sculpt = Sculpt('G14', 'mobile')
inscription_stone(sculpt)
sculpt.flush()

info = json.loads(bpy.data.texts['READ_ME'].as_string())
note = ('2026-09-26 G14 finalization: nine abstract face grooves now appear in the '
        'mobile stone as well as the previously saved desktop stone; export and '
        'package validation are recorded in the external completion report.')
if note not in info['artistNotes']:
    info['artistNotes'].append(note)
info['validationStatus'] = ('G14 source detail saved. See '
                            'PROJECT_AURA_STAY_AWHILE_ASTRA_V2_FINAL_COMPLETION_REPORT.md '
                            'for the final export and package validation results.')
txt = bpy.data.texts['READ_ME']
txt.clear()
txt.write(json.dumps(info, indent=2))

bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
print('G14_MOBILE_FINALIZED', source, flush=True)
