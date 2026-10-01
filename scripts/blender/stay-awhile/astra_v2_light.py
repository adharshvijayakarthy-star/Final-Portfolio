"""Route-specific natural sky and soft photographic fill for the Blender masters."""
import bpy
import sys
from pathlib import Path
from mathutils import Vector

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
from geometry import B

RIG={
    'garden':('00-garden.blend',(.34,.55,.69),.72,(1,.88,.75),1.65),
    'person':('01-person.blend',(.37,.58,.71),.73,(1,.87,.76),1.72),
    'builder':('02-builder.blend',(.4,.57,.67),.75,(1,.86,.71),1.65),
    'thinker':('03-thinker.blend',(.37,.56,.69),.71,(1,.87,.78),1.65),
    'leader':('04-leader.blend',(.37,.57,.7),.72,(1,.85,.72),1.75),
    'stories':('05-stories.blend',(.16,.27,.38),.48,(1,.68,.49),.78),
    'work':('06-work.blend',(.37,.52,.64),.77,(1,.85,.7),1.63),
    'future':('07-future.blend',(.43,.68,.87),.85,(1,.92,.78),1.75),
    'aura':('08-aura.blend',(.34,.49,.61),.73,(1,.84,.69),1.68),
    'contact':('09-contact.blend',(.44,.65,.79),.79,(1,.9,.77),1.65),
}

def apply(route):
    source,sky,ambient,suncolor,sunenergy=RIG[route]
    path=HERE/source
    bpy.ops.wm.open_mainfile(filepath=str(path),load_ui=False)
    scene=bpy.context.scene
    background=scene.world.node_tree.nodes['Background']
    background.inputs[0].default_value=(*sky,1)
    background.inputs[1].default_value=ambient
    sun=next(o for o in bpy.data.objects if o.type=='LIGHT' and o.data.type=='SUN' and not o.library)
    sun.data.color=suncolor
    sun.data.energy=sunenergy
    sun.data.angle=.4 if route not in ('stories','thinker') else .54
    if route in ('garden','person','leader','work','future','contact'):
        name=f'SA_{route.upper()}_ASTRA_FILL_00'
        fill=bpy.data.objects.get(name)
        if fill is None:
            data=bpy.data.lights.new(name,'AREA')
            fill=bpy.data.objects.new(name,data)
            bpy.data.collections['07_LIGHT_GUIDES'].objects.link(fill)
        fill.location=B((-4.5,7.5,2.5))
        fill.rotation_euler=(Vector(B((0,1,-6)))-fill.location).to_track_quat('-Z','Y').to_euler()
        fill.data.energy=220 if route!='work' else 330
        fill.data.shape='DISK'
        fill.data.size=9
        fill.data.color=(.82,.91,1)
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True)
    print('ASTRA_LIGHT',route,flush=True)

if __name__=='__main__':
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else RIG.keys()
    for route in args:apply(route)
