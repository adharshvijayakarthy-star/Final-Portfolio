"""Compare planted height formulas with the actual terrain surface."""
import bpy,sys
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
from beautify_first_four import terrain_height
bpy.ops.wm.open_mainfile(filepath=str(HERE/'00-garden.blend'),load_ui=False)
col=bpy.data.collections['SA_G01_DESKTOP']
for obj in col.objects:
    if obj.type=='MESH':print('GROUND_MESH',obj.name,obj.get('beautyPass'),len(obj.data.vertices),flush=True)
ground=next(o for o in col.objects if o.type=='MESH' and not o.get('beautyPass'))
for x,z in [(3.55,58),(-4.7,59.5),(6.9,53),(-6.8,50.5),(4.5,43.5),(3.2,60),(2.8,70),(-5.4,54)]:
    hit,p,n,f=ground.ray_cast(Vector((x,-z,10)),Vector((0,0,-1)))
    print('GROUND',x,z,'formula',terrain_height(x,z),'actual',p.z if hit else None,'delta',terrain_height(x,z)-p.z if hit else None,flush=True)
