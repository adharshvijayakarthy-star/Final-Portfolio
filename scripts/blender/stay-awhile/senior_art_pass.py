"""In-place final environment refinement. Existing masters are the source.

No animation curves, required empties, camera guides or IDs are regenerated.
Sourced tree proportions and opaque botanical geometry replace weak foliage.
"""
import bpy,bmesh,json,math,random,sys
from pathlib import Path
from mathutils import Vector
H=Path(__file__).resolve().parent;R=H.parents[2];sys.path.insert(0,str(H))
from beautify_first_four import Sculpt,clear_meshes,original_parent,color
from geometry import B,G
from produce import set_exclude
from layout import instances
from mathutils.bvhtree import BVHTree
from final_polish_first_four import connected_components
C=json.loads((H/'contract.json').read_text());TREE=json.loads((H/'senior-tree-source.json').read_text())
PROVENANCE=json.loads((H/'senior-provenance.json').read_text())

def source_tree(a,center,height,seed,kind='LEAF',tier='medium',count=270,spread=1):
    rng=random.Random(seed);c=Vector(center);factor=height/4.55
    angle=rng.uniform(-math.pi,math.pi);ca,sa=math.cos(angle),math.sin(angle)
    stretch=rng.uniform(.9,1.1);lean=rng.uniform(-.09,.09)
    def transform(v):
        x,y,z=v;x=(x+lean*y)*stretch;z*=2-stretch
        return c+Vector(((ca*x-sa*z)*factor*spread,y*factor,(sa*x+ca*z)*factor*spread))
    data=TREE[tier];vs=[transform(v) for v in data['v']]
    a.add(vs,data['f'],'TREEBARK',tones=[(.88,.85,.8,1)]*len(vs),smooth=True)
    crown=rng.sample(TREE['crown'],min(count,len(TREE['crown'])))
    for j,v in enumerate(crown):
        p=transform(v);theta=rng.uniform(0,math.tau)
        if kind=='SAKURA':
            n=Vector((rng.uniform(-1,1),rng.uniform(.15,1),rng.uniform(-1,1))).normalized()
            u=n.cross(Vector((0,0,1))).normalized();w=n.cross(u)
            rad=rng.uniform(.125,.23)*(1.35 if a.low else 1)
            verts=[p+n*.015]+[p+(math.cos(k*math.tau/10)*u+math.sin(k*math.tau/10)*w)*rad*(1 if k%2 else .87) for k in range(10)]
            tone=rng.uniform(.68,1)
            a.add(verts,[(0,k+1,(k+1)%10+1) for k in range(10)],kind,tones=[(tone,tone*rng.uniform(.83,1),tone*.96,1)]*11,smooth=True)
        else:
            # Folded leaf sprays at real botanical crown points, with varying orientation.
            scale=(1.4 if tier in ('far','horizon') else .82)*(height/5.5)**.35*(1.35 if a.low else 1)
            spray(a,p,scale,rng,'FARSPRAY' if kind=='DISTANT' else 'SPRAY')

def spray(a,p,size,rng,key='SPRAY',parent=None):
    theta=rng.uniform(0,math.tau)
    u=Vector((math.cos(theta),rng.uniform(-.65,.65),math.sin(theta))).normalized()*size*.34
    v=Vector((-math.sin(theta)*.4,rng.uniform(.5,1),math.cos(theta)*.4)).normalized()*size*.55
    n=u.cross(v).normalized();p=Vector(p)
    verts=[p-u-v,p+u-v,p+u+v,p-u+v,p+n*size*.10]
    tone=rng.uniform(.78,1.18)
    a.add(verts,[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],key,parent,[(tone*.91,tone,tone*.84,1)]*5,True)

def foliage_materials():
    for lod in ('desktop','mobile'):
        for key in ('SPRAY','FARSPRAY'):
            name='SA_M_'+key+('_MOBILE' if lod=='mobile' else '')
            m=bpy.data.materials.get(name)
            if m and m.library:continue
            if not m:m=bpy.data.materials.new(name);m.use_nodes=True
            nodes=m.node_tree.nodes;links=m.node_tree.links;nodes.clear()
            p=nodes.new('ShaderNodeBsdfPrincipled');p.name='Principled BSDF';out=nodes.new('ShaderNodeOutputMaterial');links.new(p.outputs[0],out.inputs[0])
            path=R/'public/models/stay/v1/shared'/f'senior-spray.{lod}.png'
            im=bpy.data.images.get(path.stem)
            if not im:im=bpy.data.images.load(str(path),check_existing=False);im.name=path.stem;im.pack()
            tex=nodes.new('ShaderNodeTexImage');tex.image=im;tex.extension='CLIP'
            links.new(tex.outputs['Color'],p.inputs['Base Color']);links.new(tex.outputs['Alpha'],p.inputs['Alpha'])
            p.inputs['Roughness'].default_value=.83;p.inputs['Specular IOR Level'].default_value=.18
            p.inputs['Subsurface Weight'].default_value=.035
            m.surface_render_method='DITHERED';m.use_backface_culling=False

def spray_uvs():
    for o in bpy.data.objects:
        if o.type!='MESH' or o.library:continue
        if not any(m and 'SPRAY' in m.name for m in o.data.materials):continue
        for i,m in enumerate(o.data.materials):
            if m and 'SPRAY' in m.name and 'MOBILE' in o.name:
                name=m.name.replace('_MOBILE','')+'_MOBILE'
                if name in bpy.data.materials:o.data.materials[i]=bpy.data.materials[name]
        uv=o.data.uv_layers.get('UVMap') or o.data.uv_layers.new(name='UVMap')
        coords=[(0,0),(1,0),(1,1),(0,1),(.5,.5)]
        for l in o.data.loops:uv.data[l.index].uv=coords[l.vertex_index%5]

def replace_shared():
    for lod in ('desktop','mobile'):
        low=lod=='mobile'
        clear_meshes('G03',lod);a=Sculpt('G03',lod)
        source_tree(a,(0,0,0),7.2,105,'SAKURA','mobile' if low else 'hero',260 if low else 990,1.15)
        a.flush()
        # Put upper crown geometry back under the original sway pivots, preserving world pose.
        repartition_sakura(a)
        # Distant bank uses different derived trunk shapes and irregular foliage distributions.
        clear_meshes('G11',lod);a=Sculpt('G11',lod)
        for i in range(5):
            source_tree(a,(-7.2+3.55*i,0,math.sin(i*2.3)*1.3),[6.1,7.8,5.2,6.9,5.7][i],611+i*17,'DISTANT','horizon' if low else 'far',22 if low else 82,1.16)
        a.flush()
        clear_meshes('G04',lod);a=Sculpt('G04',lod)
        for i in range(2):
            rng=random.Random(710+i);par=original_parent('G04',lod,'BUSH',i)
            for j in range(3 if low else 6):
                theta=j*2.399+i;tip=Vector((math.cos(theta)*.33,.46+.05*(j%3),math.sin(theta)*.29))
                a.tube([(0,0,0),tip],[.018,.003],'LEAF',par,sides=3)
            for j in range(17 if low else 70):
                p=(rng.uniform(-.4,.4),rng.uniform(.24,.60),rng.uniform(-.30,.30))
                spray(a,p,.48 if low else .37,rng,parent=par)
        a.flush()
        # River stones retain all four existing variant nodes.
        clear_meshes('G06',lod);a=Sculpt('G06',lod)
        for i in range(4):
            a.stone((0,-.025,0),[(.54,.31,.38),(.34,.64,.31),(.63,.19,.37),(.42,.42,.55)][i],parent=original_parent('G06',lod,'STONE',i),seed=135+i*23,sides=6 if low else 12)
        a.flush()
        for o in a.col.objects:
            if o.type=='MESH':
                for p in o.data.polygons:p.use_smooth=True
        # Graceful fern fronds replace broad triangular fan placeholders.
        clear_meshes('G10',lod);a=Sculpt('G10',lod)
        for i in range(3):
            par=original_parent('G10',lod,'FAN',i)
            for f in range(3 if low else 5):
                theta=-1.1+f*.49+i*.35;length=.8+.19*((f+i)%3)
                end=Vector((math.sin(theta)*length,.45+length*.34,math.cos(theta)*length*.38))
                a.tube([(0,0,0),end*.52+Vector((0,.18,0)),end],[.012,.008,.002],'LEAF',par,sides=3)
                for j in range(3 if low else 7):
                    t=.21+j*(.18 if low else .10);p=end*t+Vector((0,math.sin(t*math.pi)*.15,0))
                    for sign in (-1,1):
                        q=p+Vector((math.cos(theta)*sign, .14, -math.sin(theta)*sign))*(1-t)*.31
                        a.leaf(p,q,.075*(1-t)+.016,'LEAF',par,tone=.68+.04*j,seed=i*50+f*10+j)
        a.flush()
        # Replace sparse baked G01 grove; keep existing terrain and planting surfaces.
        col=bpy.data.collections[f'SA_G01_{lod.upper()}']
        for obj in list(col.objects):
            if obj.get('astraV2Grove') or obj.get('seniorGrove'):bpy.data.objects.remove(obj,do_unlink=True)
        a=Sculpt('G01',lod);a.seq=90
        for i,(x,z,h) in enumerate([(-4.75,59.4,6.2),(4.,54.1,6.7),(5.3,43.4,6.0)]):
            source_tree(a,(x,.03,z),h,310+i*113,'LEAF','far' if low else 'medium',20 if low else 330,1.2)
        a.flush()
        for o in col.objects:
            if o.type=='MESH' and 'MESH_9' in o.name:o['seniorGrove']=True

def repartition_sakura(a):
    groups={}
    for o in list(a.col.objects):
        if o.type!='MESH':continue
        key='TREEBARK' if any('TREEBARK' in m.name for m in o.data.materials) else 'SAKURA'
        attr=o.data.color_attributes['COLOR_0']
        for poly in o.data.polygons:
            pts=[o.data.vertices[i].co for i in poly.vertices];center=sum(pts,Vector())/len(pts)
            sector=int(((math.atan2(center.y,center.x)+math.pi)/math.tau)*3)%3
            par=a.root if key=='TREEBARK' and center.z<2.9 else original_parent('G03',a.lod,'SWAY_'+'ABC'[sector])
            g=groups.setdefault((par.name,key),[[],[],[]]);off=len(g[0])
            g[0].extend([G(par.matrix_local.inverted()@p) if par!=a.root else G(p) for p in pts]);g[1].append(tuple(range(off,off+len(pts))));g[2].extend([tuple(attr.data[i].color) for i in poly.vertices])
        bpy.data.objects.remove(o,do_unlink=True)
    a.groups.clear();a.seq=60
    for (par,key),(vs,fs,tones) in groups.items():a.add(vs,fs,key,bpy.data.objects[par],tones,True)
    a.flush()
    for o in a.col.objects:
        if o.type=='MESH':
            # Repartitioning duplicates face corners; weld within each pivot group.
            # This restores the connected trunk and flower normals before export.
            bm=bmesh.new();bm.from_mesh(o.data)
            bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
            bm.to_mesh(o.data);bm.free();o.data.update()
            o['seniorSource']='Poly Haven Tree Small 02 / CC0; remodeled crown'

def tree_material(lod):
    name='SA_M_TREEBARK'+('_MOBILE' if lod=='mobile' else '')
    if name not in bpy.data.materials:
        mat=bpy.data.materials.new(name);mat.use_nodes=True
    return bpy.data.materials[name]

def texture_material(mat,family,lod):
    nodes=mat.node_tree.nodes;links=mat.node_tree.links
    nodes.clear();p=nodes.new('ShaderNodeBsdfPrincipled');p.name='Principled BSDF';out=nodes.new('ShaderNodeOutputMaterial');links.new(p.outputs['BSDF'],out.inputs['Surface'])
    for kind in ('diff','nor_gl','rough'):
        path=R/'public/models/stay/v1/shared'/f'senior-{family}-{kind}.{lod}.jpg'
        name=path.stem;im=bpy.data.images.get(name)
        if not im:im=bpy.data.images.load(str(path),check_existing=False);im.name=name
        elif not im.library:
            if im.packed_file:im.unpack(method='REMOVE')
            im.filepath=str(path);im.reload()
        if not im.library:im.colorspace_settings.name='sRGB' if kind=='diff' else 'Non-Color';im.pack()
        tex=nodes.new('ShaderNodeTexImage');tex.image=im
        if kind=='diff':
            vertex=nodes.new('ShaderNodeVertexColor');vertex.layer_name='COLOR_0'
            mul=nodes.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1
            links.new(tex.outputs['Color'],mul.inputs[1]);links.new(vertex.outputs['Color'],mul.inputs[2]);links.new(mul.outputs[0],p.inputs['Base Color'])
        elif kind=='nor_gl':
            n=nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value={'ground':.28,'timber':.24,'bark':.6,'stone':.4}[family]
            links.new(tex.outputs['Color'],n.inputs['Color']);links.new(n.outputs['Normal'],p.inputs['Normal'])
        else:links.new(tex.outputs['Color'],p.inputs['Roughness'])
    p.inputs['Specular IOR Level'].default_value=.28

def set_materials():
    for lod in ('desktop','mobile'):
        m=tree_material(lod)
        if not m.library:texture_material(m,'bark',lod)
    for m in list(bpy.data.materials):
        if m.library or not m.use_nodes:continue
        key=m.name.split('SA_M_')[-1].replace('_MOBILE','')
        lod='mobile' if 'MOBILE' in m.name else 'desktop'
        family={'BARK':'timber','STONE':'stone','MOSS':'ground'}.get(key)
        if family:texture_material(m,family,lod)
        if key in ('LEAF','DISTANT','SAKURA'):
            p=m.node_tree.nodes.get('Principled BSDF');v=color({'LEAF':'74975C','DISTANT':'567952','SAKURA':'EAC0CB'}[key])
            for n in m.node_tree.nodes:
                if n.type=='MIX_RGB' and not n.inputs[1].is_linked:n.inputs[1].default_value=v
            if p:
                if not p.inputs['Base Color'].is_linked:p.inputs['Base Color'].default_value=v
                p.inputs['Roughness'].default_value=.78
                p.inputs['Subsurface Weight'].default_value=.06
    # Source tree uses the dedicated bark material, distinct from sawn cedar.
    for o in bpy.data.objects:
        if o.type!='MESH' or o.library:continue
        if o.get('seniorSource') or o.get('seniorGrove'):
            for i,m in enumerate(o.data.materials):
                if m and 'TREEBARK' in m.name:o.data.materials[i]=tree_material('mobile' if 'MOBILE' in o.name else 'desktop')

def uv_and_surface(route):
    for rec in C['assets'].values():
        if rec['owner']!=route:continue
        aid=rec['id']
        for li,lod in enumerate(('desktop','mobile')):
            col=bpy.data.collections[f'SA_{aid}_{lod.upper()}'];meshes=[o for o in col.objects if o.type=='MESH']
            # Small edge bevels on architecture are applied only while budget permits.
            total=sum(tris(o) for o in meshes)
            for obj in meshes:
                if not obj.get('seniorEdges') and any(m and 'BARK' in m.name and 'TREEBARK' not in m.name for m in obj.data.materials) and aid not in ('G01','G03','G11','P03','F01'):
                    if total+tris(obj)*2.6 < rec['triangles'][li]*.96:
                        before=tris(obj);mod=obj.modifiers.new('Craft edge light','BEVEL');mod.width=.009 if aid not in ('B06','A02') else .002;mod.segments=1
                        mod.affect='EDGES';mod.limit_method='ANGLE';apply_modifier(obj,mod);total+=tris(obj)-before;obj['seniorEdges']=True
                mesh=obj.data
                if aid=='G01' and any('MOSS' in m.name or 'STONE' in m.name for m in mesh.materials):
                    for poly in mesh.polygons:poly.use_smooth=True
                uv=mesh.uv_layers.get('UVMap') or mesh.uv_layers.new(name='UVMap')
                textured=any(m and any(n.type=='TEX_IMAGE' and n.image and n.image.name.startswith('senior-') for n in m.node_tree.nodes) for m in mesh.materials if m and m.use_nodes)
                if not textured:continue
                attr=mesh.color_attributes.get('COLOR_0')
                if attr is None:
                    attr=mesh.color_attributes.new(name='COLOR_0',type='FLOAT_COLOR',domain='POINT')
                    for v in attr.data:v.color=(1,1,1,1)
                for poly in mesh.polygons:
                    mat=mesh.materials[poly.material_index] if mesh.materials else None
                    family=mat.name if mat else ''
                    for loop in poly.loop_indices:
                        co=mesh.vertices[mesh.loops[loop].vertex_index].co
                        if 'TREEBARK' in family:val=(co.x*1.8+co.y*.7,co.z*.5)
                        elif 'BARK' in family:
                            # Major axis determines grain so beams and posts differ correctly.
                            axis=max(range(3),key=lambda n:obj.dimensions[n]);cross=(axis+1)%3
                            val=(co[cross]*.4+.22,co[axis]*.25)
                        else:
                            n=poly.normal;axis=max(range(3),key=lambda i:abs(n[i]));axes=[i for i in range(3) if i!=axis]
                            scale=.33 if 'MOSS' in family else .8
                            val=(co[axes[0]]*scale,co[axes[1]]*scale)
                        uv.data[loop].uv=val
                if 'MOSS' in ' '.join(m.name for m in mesh.materials):
                    # Restrained broad patches vary the ground rather than increasing noise.
                    for i,v in enumerate(mesh.vertices):
                        if attr.domain!='POINT':break
                        q=.86+.12*math.sin(v.co.x*.37+math.sin(v.co.y*.19))*math.cos(v.co.y*.43)
                        attr.data[i].color=(q*.93,q,q*.9,1)

def tris(o):o.data.calc_loop_triangles();return len(o.data.loop_triangles)
def apply_modifier(o,m):
    bpy.context.view_layer.update();d=bpy.context.evaluated_depsgraph_get();d.update()
    mesh=bpy.data.meshes.new_from_object(o.evaluated_get(d),preserve_all_data_layers=True,depsgraph=d);o.modifiers.remove(m);o.data=mesh

def future_canopy():
    for lod in ('desktop','mobile'):
        clear_meshes('F01',lod);a=Sculpt('F01',lod)
        for i in range(6):
            source_tree(a,((-5.2 if i<3 else 5.4),0,-(i%3)*5),[7.1,7.8,6.3][i%3],1200+i*89,'LEAF','far' if a.low else 'medium',65 if a.low else 235,1.18)
        a.flush()

def round_stones(route):
    for rec in C['assets'].values():
        if rec['owner']!=route:continue
        if rec['id'] not in ('G06','G14','C02','F03','T02','P02','B01'):continue
        for li,lod in enumerate(('desktop','mobile')):
            col=bpy.data.collections[f"SA_{rec['id']}_{lod.upper()}"]
            total=sum(tris(o) for o in col.objects if o.type=='MESH')
            for obj in col.objects:
                if obj.type!='MESH' or obj.get('seniorStone'):continue
                if not all('STONE' in m.name for m in obj.data.materials):continue
                if total+tris(obj)*3<rec['triangles'][li]*.98:
                    before=tris(obj);m=obj.modifiers.new('Eroded stone','SUBSURF');m.levels=1;m.render_levels=1;apply_modifier(obj,m);total+=tris(obj)-before
                for p in obj.data.polygons:p.use_smooth=True
                obj['seniorStone']=True

def lighting(route):
    s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=32;s.cycles.use_denoising=True
    s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=.55
    bg=s.world.node_tree.nodes.get('Background');bg.inputs[0].default_value=(.38,.5,.59,1);bg.inputs[1].default_value=.7
    sun=next(o for o in bpy.data.objects if o.type=='LIGHT' and o.data.type=='SUN' and not o.library)
    sun.data.energy=2.3;sun.data.angle=.12;sun.data.color=(1,.9,.77)
    sun.rotation_euler=Vector((-.42,.18,-.64)).to_track_quat('-Z','Y').to_euler()
    if route=='stories':bg.inputs[0].default_value=(.10,.18,.28,1);bg.inputs[1].default_value=.55;sun.data.energy=.65;sun.data.color=(1,.7,.45);s.view_settings.exposure=.4
    if route=='thinker':sun.data.angle=.28;sun.data.energy=1.8
    if route=='future':bg.inputs[1].default_value=.85

def placement(route):
    records=instances(route,C)
    missing=set()
    for r in records:
        if not r.get('seniorPlacement'):continue
        for lod in ('desktop','mobile'):
            name=f"LIB_{r['assetId']}_{lod}"+(('_'+r['variantNode'].split('_',2)[2]) if r['variantNode'] else '')
            if name not in bpy.data.collections:missing.add(name)
    if missing:
        with bpy.data.libraries.load(str(H/'00-garden.blend'),link=True,relative=True) as (src,dst):dst.collections=list(missing)
    for lod in ('desktop','mobile'):
        col=bpy.data.collections['COMPOSITION_'+lod.upper()]
        groundinst=next(o for o in col.objects if o.get('assetId')=='G01')
        ground=next(o for o in groundinst.instance_collection.objects if o.type=='MESH' and o.name.endswith('MESH_00'))
        tree=BVHTree.FromPolygons([groundinst.matrix_world@v.co for v in ground.data.vertices],[list(p.vertices) for p in ground.data.polygons])
        for r in records:
            if not r.get('seniorPlacement'):continue
            name=r['instanceId'].replace('_INSTANCE_','_MOBILEINSTANCE_') if lod=='mobile' else r['instanceId']
            obj=bpy.data.objects.get(name)
            if not obj:obj=bpy.data.objects.new(name,None);col.objects.link(obj)
            lib=f"LIB_{r['assetId']}_{lod}"+(('_'+r['variantNode'].split('_',2)[2]) if r['variantNode'] else '')
            obj.instance_type='COLLECTION';obj.instance_collection=bpy.data.collections[lib]
            obj.location=B(r['position']);hit=tree.ray_cast(Vector((obj.location.x,obj.location.y,30)),Vector((0,0,-1)))
            if hit[0] is not None:obj.location.z=hit[0].z-.015
            obj.rotation_euler.z=r['rotation'][1];obj.scale=r['scale'];obj['assetId']=r['assetId'];obj['variantNode']=r['variantNode'] or '';obj['seniorPlacement']=True
    # Save actual grounded transforms as manifest overrides without touching camera guides.
    positions={}
    for o in bpy.data.collections['COMPOSITION_DESKTOP'].objects:
        if o.get('seniorPlacement'):positions[o.name]=G(o.location)
    path=H/'senior-grounded-placements.json';allpos=json.loads(path.read_text()) if path.exists() else {};allpos[route]=positions;path.write_text(json.dumps(allpos,indent=2))

def notes(route,path):
    if route=='garden':
        baseline=R/'.aura-work/senior-art-pass/baseline/scripts/blender/stay-awhile/00-garden.blend'
        names=['SA_BEAUTY_TIMBER_DESKTOP','SA_BEAUTY_TIMBER_MOBILE']
        missing=[n for n in names if n not in bpy.data.images]
        if missing:
            with bpy.data.libraries.load(str(baseline),link=False) as (src,dst):dst.images=missing
        for n in names:
            if n in bpy.data.images:bpy.data.images[n].use_fake_user=True
    info=json.loads(bpy.data.texts['READ_ME'].as_string());info['seniorArtPass']={'date':'2026-09-26','sourceBibleSha256':'ec0ce6ca9574df3851917e8162b2cf5a68b132ba76b4f663ce75994f69056a4f','provenance':PROVENANCE,'validationStatus':'Pending final export and visual review','scope':'Blender source, textures, GLB assets and manifests only'}
    info['artistNotes'].append('Senior pass: CC0 botanical source adaptation, shared image PBR, refined edge light and foreground foliage. Required roots, guides and authored Actions preserved.')
    t=bpy.data.texts['READ_ME'];t.clear();t.write(json.dumps(info,indent=2));bpy.context.scene['seniorArtPass']=1
    bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True)

def main():
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else list(C['routes'])
    for route in C['routes']:
        if route not in args:continue
        path=H/next(a['source'] for a in C['assets'].values() if a['owner']==route)
        bpy.ops.wm.open_mainfile(filepath=str(path),load_ui=False)
        for lod in ('desktop','mobile'):tree_material(lod)
        foliage_materials()
        if route=='garden':replace_shared()
        if route=='future':future_canopy()
        set_materials();round_stones(route)
        from senior_details import refine
        refine(route,sys.modules[__name__])
        spray_uvs();placement(route);lighting(route);notes(route,path)
        print('SENIOR_SAVED',route,flush=True)
if __name__=='__main__':main()
