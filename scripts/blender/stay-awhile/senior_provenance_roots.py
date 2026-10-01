"""Correct legacy root provenance after importing the CC0 tree source."""
import bpy
from pathlib import Path
H=Path(__file__).resolve().parent
for file,ids in [('00-garden.blend',['G01','G03','G11']),('07-future.blend',['F01'])]:
    bpy.ops.wm.open_mainfile(filepath=str(H/file),load_ui=False)
    for aid in ids:
        for infix in ('','MOBILE'):
            bpy.data.objects[f'SA_{aid}_{infix}ROOT_00']['provenance']='Poly Haven Tree Small 02 adaptation; Rico Cilliers; CC0-1.0. See READ_ME.'
    bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(H/file),compress=True)
