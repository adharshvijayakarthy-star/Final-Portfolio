"""Read-only inspection of first-four beauty collections and render instances."""
import bpy, json, sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
ROUTES={'garden':'00-garden.blend','person':'01-person.blend','builder':'02-builder.blend','thinker':'03-thinker.blend'}
OWNED={'garden':['G01','G02','G03','G04','G05','G06','G07','G11','G14'],
       'person':['P01','P02','P03'],'builder':['B01','B02','B03','B05'],
       'thinker':['T01','T02']}

def active_mesh_names():
    deps=bpy.context.evaluated_depsgraph_get()
    return {instance.object.original.name for instance in deps.object_instances if instance.object.type=='MESH'}

def exclude(name,value):
    def walk(layer):
        if layer.name==name:layer.exclude=value
        for child in layer.children:walk(child)
    walk(bpy.context.view_layer.layer_collection)

out={}
for route,source in ROUTES.items():
    bpy.ops.wm.open_mainfile(filepath=str(HERE/source),load_ui=False)
    rec={'source':source,'beautyVersion':bpy.context.scene.get('beautyPassVersion'),
         'collections':{},'composition':{},'materials':{}}
    for aid in OWNED[route]:
        for lod in ('desktop','mobile'):
            ac=bpy.data.collections[f'SA_{aid}_{lod.upper()}']
            lib=bpy.data.collections[f'LIB_{aid}_{lod}']
            beauty=[o for o in ac.objects if o.get('beautyPass',0)>=2]
            missing=[o.name for o in beauty if o.name not in lib.objects]
            variants={}
            for vc in bpy.data.collections:
                if not vc.name.startswith(f'LIB_{aid}_{lod}_'):continue
                expected=[o.name for o in beauty if o.parent and o.parent.name in vc.objects]
                absent=[n for n in expected if n not in vc.objects]
                if expected or absent:variants[vc.name]={'beautyMeshCount':len(expected),'missing':absent}
            rec['collections'][f'{aid}:{lod}']={'beautyMeshCount':len(beauty),'missingFromLibrary':missing,
                   'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in ac.objects if o.type=='MESH'),
                   'variants':variants}
    for lod in ('desktop','mobile'):
        exclude('COMPOSITION_DESKTOP',lod!='desktop')
        exclude('COMPOSITION_MOBILE',lod!='mobile')
        names=active_mesh_names()
        rec['composition'][lod]={f'{aid}':sum(1 for n in names if n.startswith(f'SA_{aid}_') and 'MESH' in n)
                                 for aid in OWNED[route]}
    if route=='garden':
        for key in ('SA_M_BARK','SA_M_STONE','SA_M_MOSS','SA_M_SAKURA','SA_M_WATER'):
            m=bpy.data.materials.get(key)
            if not m:continue
            p=m.node_tree.nodes.get('Principled BSDF')
            rec['materials'][key]={'base':list(p.inputs['Base Color'].default_value),
                                  'links':[(l.from_node.name,l.from_socket.name,l.to_node.name,l.to_socket.name) for l in m.node_tree.links]}
    out[route]=rec
    print('INSPECTED',route,flush=True)
path=HERE/'beauty-inspection.json'
path.write_text(json.dumps(out,indent=2),encoding='utf8')
print('WROTE',path,flush=True)
