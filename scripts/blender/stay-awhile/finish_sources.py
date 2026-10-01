"""Targeted finishing on existing meshes, preserving authored assets and Actions."""
import bpy,sys,json,math
from pathlib import Path
import numpy as np
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
from geometry import B,G,linear
from produce import set_exclude

def atlas(root,lod):
    size=512 if lod=='mobile' else 1024;p=root/'public/models/stay/v1/shared'/f'timber-paper.{lod}.png'
    if p.exists():return p
    p.parent.mkdir(parents=True,exist_ok=True);pixels=np.ones((size,size,4),dtype=np.float32)
    for y in range(size):
        for x in range(size):
            # Deliberately sparse baked grain. Blank paper; no evidence or lettering.
            base=(74,66,58) if y>=size//2 else (242,239,230)
            delta=(int(2*math.sin(x/size*128+math.sin(y/size*12))) if y>=size//2 else 0)
            pixels[y,x,:3]=[linear((v+delta)/255) for v in base]
    image=bpy.data.images.new('SA_SHARED_ATLAS_'+lod,width=size,height=size,alpha=True)
    image.pixels.foreach_set(pixels.ravel());image.filepath_raw=str(p);image.file_format='PNG';image.save();bpy.data.images.remove(image)
    return p

def main():
    root=Path(sys.argv[sys.argv.index('--')+1]);c=json.loads((HERE/'contract.json').read_text(encoding='utf8'))
    atlases={lod:atlas(root,lod) for lod in ('desktop','mobile')}
    for route in c['routes']:
        owned=[a for a in c['assets'].values() if a['owner']==route];source=HERE/owned[0]['source']
        bpy.ops.wm.open_mainfile(filepath=str(source),load_ui=False)
        if bpy.context.scene.get('finishingVersion')==1:continue
        for lod in ('desktop','mobile'):
            image=bpy.data.images.load(str(atlases[lod]),check_existing=True);image.colorspace_settings.name='sRGB'
            image.filepath=bpy.path.relpath(str(atlases[lod]),start=str(HERE))
            for key in ('BARK','PAPER'):
                original=bpy.data.materials.get('SA_M_'+key)
                if not original or original.library:continue
                mat=original if lod=='desktop' else original.copy()
                if lod=='mobile':mat.name='SA_M_'+key+'_MOBILE'
                nodes=mat.node_tree.nodes;p=nodes.get('Principled BSDF');tex=nodes.new('ShaderNodeTexImage');tex.image=image
                mat.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
                for a in owned:
                    col=bpy.data.collections[f"SA_{a['id']}_{lod.upper()}"]
                    for o in col.objects:
                        if o.type!='MESH' or not o.data.materials or o.data.materials[0].name!='SA_M_'+key:continue
                        o.data.materials[0]=mat
                        uv=o.data.uv_layers.get('UVMap') or o.data.uv_layers.new(name='UVMap')
                        for poly in o.data.polygons:
                            axis=max(range(3),key=lambda i:abs(poly.normal[i]));axes=[i for i in range(3) if i!=axis]
                            coords=[o.data.vertices[o.data.loops[i].vertex_index].co for i in poly.loop_indices]
                            lo=[min(v[i] for v in coords) for i in axes];hi=[max(v[i] for v in coords) for i in axes]
                            for li,co in zip(poly.loop_indices,coords):
                                u=(co[axes[0]]-lo[0])/max(.001,hi[0]-lo[0]);v=(co[axes[1]]-lo[1])/max(.001,hi[1]-lo[1])
                                uv.data[li].uv=(.032+u*.936,(.532 if key=='BARK' else .032)+v*.436)
        # Flatten world terrain in the authored local route zones, retaining distant relief.
        if route=='garden':
            for lod in ('DESKTOP','MOBILE'):
                for o in bpy.data.collections['SA_G01_'+lod].objects:
                    if o.type!='MESH':continue
                    for v in o.data.vertices:
                        x,y,z=G(v.co)
                        near=min(math.hypot(x-r['worldOrigin'][0],z-(r['worldOrigin'][2]-5)) for r in c['routes'].values())
                        blend=max(0,min(1,(near-18)/9));y=.13+(y-.13)*blend
                        # Lower the thinker basin floor below the opaque water surface.
                        if abs(x+62)<6.5 and abs(z+12)<5.5:y=-.15
                        v.co=B((x,y,z))
                    o.data.update()
        # F01 canopy-only simplification retains static trunk and branch silhouettes.
        if route=='future':
            for lod in ('DESKTOP','MOBILE'):
                set_exclude('09_EXPORT_DESKTOP' if lod=='DESKTOP' else '10_EXPORT_MOBILE',False)
                for o in bpy.data.collections['SA_F01_'+lod].objects:
                    if o.type!='MESH':continue
                    bpy.context.view_layer.objects.active=o
                    mod=o.modifiers.new('Budget silhouette reduction','DECIMATE');mod.ratio=.70
                    bpy.ops.object.modifier_apply(modifier=mod.name)
                set_exclude('09_EXPORT_DESKTOP' if lod=='DESKTOP' else '10_EXPORT_MOBILE',True)
        # Vertex color node for Blender rendering; export explicitly carries COLOR_0.
        for mat in bpy.data.materials:
            if mat.library or not mat.name.startswith('SA_M_') or not mat.use_nodes:continue
            if mat.name not in ('SA_M_MOSS','SA_M_STONE'):continue
            nodes=mat.node_tree.nodes;p=nodes.get('Principled BSDF');color=nodes.new('ShaderNodeVertexColor');color.layer_name='COLOR_0'
            mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[1].default_value=p.inputs['Base Color'].default_value
            mat.node_tree.links.new(color.outputs['Color'],mix.inputs[2]);mat.node_tree.links.new(mix.outputs[0],p.inputs['Base Color'])
        bpy.context.scene['finishingVersion']=1
        text=bpy.data.texts['READ_ME'];info=json.loads(text.as_string());info['artistNotes'][-1]='Shared original timber/paper atlas: 1024 desktop, 512 mobile, 32px-equivalent island gutters, packed UV0. No third-party images.'
        info['dependencies']+=['../../../public/models/stay/v1/shared/timber-paper.desktop.png','../../../public/models/stay/v1/shared/timber-paper.mobile.png']
        info['validationStatus']='Source finishing complete; see independent validation-report.json and Khronos validation.'
        text.clear();text.write(json.dumps(info,indent=2))
        bpy.context.preferences.filepaths.save_version=0
        bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
        print('FINISHED_SOURCE',route,flush=True)
if __name__=='__main__':main()
