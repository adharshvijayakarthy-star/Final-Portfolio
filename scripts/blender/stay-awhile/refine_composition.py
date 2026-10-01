"""Repair observed composition gaps; simplify only the specified mobile sheets."""
import bpy,sys,json
from pathlib import Path
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
from produce import scene_instances,set_exclude

root=Path(sys.argv[sys.argv.index('--')+1]);c=json.loads((HERE/'contract.json').read_text(encoding='utf8'))
for route in c['routes']:
    source=HERE/next(a['source'] for a in c['assets'].values() if a['owner']==route)
    bpy.ops.wm.open_mainfile(filepath=str(source),load_ui=False)
    if bpy.context.scene.get('compositionRevision')==1:continue
    # Only placement collections are rebuilt. All meshes and Actions are preserved.
    for name in ('COMPOSITION_DESKTOP','COMPOSITION_MOBILE'):
        col=bpy.data.collections[name]
        for obj in list(col.objects):bpy.data.objects.remove(obj,do_unlink=True)
        bpy.data.collections.remove(col)
    scene_instances(route,c,{name:bpy.data.collections[name] for name in ['01_ENVIRONMENT']})
    set_exclude('COMPOSITION_MOBILE',True)
    if route=='aura':
        for obj in bpy.data.collections['SA_A02_MOBILE'].objects:
            if obj.type!='MESH':continue
            old=obj.data;verts=[tuple(v.co) for v in old.vertices[:8]]
            faces=[list(p.vertices) for p in old.polygons if max(p.vertices)<8]
            uvs=[[tuple(old.uv_layers.active.data[i].uv) for i in p.loop_indices] for p in old.polygons if max(p.vertices)<8]
            mesh=bpy.data.meshes.new(old.name+'_LOW');mesh.from_pydata(verts,[],faces);mesh.materials.append(old.materials[0]);uv=mesh.uv_layers.new(name='UVMap')
            for poly,values in zip(mesh.polygons,uvs):
                for li,value in zip(poly.loop_indices,values):uv.data[li].uv=value
            attr=mesh.color_attributes.new(name='COLOR_0',type='FLOAT_COLOR',domain='POINT')
            for color in attr.data:color.color=(1,1,1,1)
            obj.data=mesh
    bpy.context.scene['compositionRevision']=1;bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True);print('COMPOSITION_REFINED',route,flush=True)
