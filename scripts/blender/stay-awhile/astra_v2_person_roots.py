"""Bring P03 back to the locked low-root silhouette in the existing master."""
import bpy
import json
import math
import sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
from beautify_first_four import Sculpt, clear_meshes

path=HERE/'01-person.blend'
bpy.ops.wm.open_mainfile(filepath=str(path),load_ui=False)
for lod in ('desktop','mobile'):
    clear_meshes('P03',lod)
    a=Sculpt('P03',lod)
    for side in (-1,1):
        a.tube([(side*1.54,-.025,1.06),(side*1.34,.12,.62),
                (side*.98,.28,.09),(side*.52,.47,-.30),
                (side*.14,.61,-.47)],
               [.21,.18,.135,.08,.015],'BARK',seed=310+side)
        for index in range(2 if a.low else 4):
            x=side*(1.49-index*.17)
            z=.78-index*.22
            a.tube([(x,.08,z),(x+side*.11,.055,z-.16),
                    (x+side*(.18+.025*index),-.015,z-.27)],
                   [.07,.045,.008],'BARK',sides=4 if a.low else 5,
                   seed=410+index+side*9)
        # Small leaf litter and moss at the root flare give contact without
        # placing a freestanding green boulder along the reading path.
        if not a.low:
            for index in range(5):
                angle=index*2.399+side*.3
                x=side*1.39+.13*math.cos(angle)
                z=.86+.12*math.sin(angle)
                a.leaf((x,-.02,z),(x+.11*math.cos(angle),.09+.025*(index%2),
                                   z+.1*math.sin(angle)),.055,'MOSS',tone=.72,
                       seed=510+index)
    a.flush()
    print('ASTRA_PERSON_ROOT',lod,flush=True)
info=json.loads(bpy.data.texts['READ_ME'].as_string())
note='2026-09-26 Astra v2: P03 restored to the specified low 0.7 m root convergence; static camera parallax only.'
if note not in info['artistNotes']:info['artistNotes'].append(note)
txt=bpy.data.texts['READ_ME'];txt.clear();txt.write(json.dumps(info,indent=2))
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True)
