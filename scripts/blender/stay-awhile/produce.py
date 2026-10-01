"""Run with Blender --background --python produce.py -- --root REPOSITORY.

Resumes at the first missing master. Never overwrites an existing master.
The export phase also skips already exported GLBs. Validation is separate.
"""
import bpy, sys, json, math, hashlib, struct, argparse, datetime
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
from geometry import Asset, materials, B, G
from models import build
from layout import instances, camera_pose, POSTER_PROGRESS, LIGHT, CLIP_BANDS
from mathutils import Vector

COLLECTIONS=['00_REFERENCE','01_ENVIRONMENT','02_ARCHITECTURE','03_LANDMARKS','04_INTERACTION','05_ATMOSPHERE','06_CAMERA_GUIDES','07_LIGHT_GUIDES','08_COLLISION_GUIDES','09_EXPORT_DESKTOP','10_EXPORT_MOBILE']
VERSION='1.0.0'

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def dump(p,data):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,indent=2,ensure_ascii=False),encoding='utf8')
def empty(name,col,pos=(0,0,0)):
    o=bpy.data.objects.new(name,None);col.objects.link(o);o.location=B(pos);o.empty_display_size=.18;return o
def glb_read(p):
    data=p.read_bytes();magic,version,size=struct.unpack_from('<4sII',data)
    assert magic==b'glTF' and version==2 and size==len(data)
    n,kind=struct.unpack_from('<II',data,12);assert kind==0x4e4f534a
    return json.loads(data[20:20+n]),data[20+n:]
def canonical_names(p):
    data,tail=glb_read(p)
    for node in data.get('nodes',[]):
        if node.get('name','').startswith('SA_'):node['name']=node['name'].replace('_MOBILE','_')
    raw=json.dumps(data,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4)
    p.write_bytes(struct.pack('<4sII',b'glTF',2,20+len(raw)+len(tail))+struct.pack('<II',len(raw),0x4e4f534a)+raw+tail)

def guide_nodes(route,c,cols):
    name=route.upper();r=c['routes'][route];out=[]
    for role,pos in [('ENTRY',r['knots'][0]['start']),('EXIT',r['knots'][-1]['end'])]:out.append(empty(f'SA_{name}_{role}_00',cols['06_CAMERA_GUIDES'],pos))
    for i,k in enumerate(r['knots']):
        for role,pos in [('CAM',k['end']),('LOOK',k['look']),('TEXT',k['look'])]:
            o=empty(f'SA_{name}_{role}_{i:02}',cols['06_CAMERA_GUIDES'],pos);out.append(o)
            if role=='CAM':o['startPosition']=k['start'];o['progressBand']=k['band']
            if role=='TEXT':o['clearance']=json.dumps(k['clearance']);o['purpose']='Screen-space reading rectangle reference; no type geometry.'
    for i,(rid,rinfo) in enumerate(c['routes'].items()):
        if route=='garden':
            o=empty(f'SA_GARDEN_WORLD_{i:02}',cols['00_REFERENCE'],rinfo['worldOrigin']);o['routeId']=rid
    return out

def library_collection(asset):
    col=bpy.data.collections.new(f'LIB_{asset.id}_{asset.lod}')
    for o in asset.parts:col.objects.link(o)
    col.use_fake_user=True
    for o in asset.parts:
        if 'variant' not in o:continue
        short=o.name.replace(f'SA_{asset.id}_','').replace('MOBILE','')
        variant=bpy.data.collections.new(f'LIB_{asset.id}_{asset.lod}_{short}');variant.use_fake_user=True
        variant.objects.link(o)
        for ch in o.children_recursive:variant.objects.link(ch)

def scene_instances(route,c,cols):
    records=instances(route,c)
    required={f"LIB_{r['assetId']}_{lod}"+(('_'+r['variantNode'].split('_',2)[2]) if r['variantNode'] else '') for r in records for lod in ('desktop','mobile')}
    missing=[name for name in required if name not in bpy.data.collections]
    if missing:
        with bpy.data.libraries.load(str(HERE/'00-garden.blend'),link=True,relative=True) as (src,dst):
            assert set(missing)<=set(src.collections),(set(missing)-set(src.collections))
            dst.collections=missing
    for lod in ('desktop','mobile'):
        col=bpy.data.collections.new(f'COMPOSITION_{lod.upper()}');cols['01_ENVIRONMENT'].children.link(col)
        for r in records:
            name=f"LIB_{r['assetId']}_{lod}"+(('_'+r['variantNode'].split('_',2)[2]) if r['variantNode'] else '')
            o=empty(r['instanceId'].replace('_INSTANCE_','_MOBILEINSTANCE_') if lod=='mobile' else r['instanceId'],col,r['position'])
            o.instance_type='COLLECTION';o.instance_collection=bpy.data.collections[name];o.rotation_euler.z=r['rotation'][1]
            o['assetId']=r['assetId'];o['variantNode']=r['variantNode'] or ''
    return records

def set_exclude(name,value):
    def walk(lc):
        if lc.name==name:lc.exclude=value
        for child in lc.children:walk(child)
    walk(bpy.context.view_layer.layer_collection)

def render_rig(route,cols,c):
    scene=bpy.context.scene
    world=bpy.data.worlds.new('SA_ENVIRONMENT');scene.world=world;world.use_nodes=True
    world.node_tree.nodes['Background'].inputs[0].default_value=(.72,.76,.65,1)
    world.node_tree.nodes['Background'].inputs[1].default_value=.65
    sun=bpy.data.lights.new('SA_LIGHT_SUN','SUN');sun.energy=2*LIGHT[route];sun.angle=.15
    light=bpy.data.objects.new(f'SA_{route.upper()}_LIGHT_00',sun);cols['07_LIGHT_GUIDES'].objects.link(light)
    light.rotation_euler=Vector((.45,-.3,-.8)).to_track_quat('-Z','Y').to_euler()
    camera=bpy.data.cameras.new('SA_PREVIEW_CAMERA');camera.clip_start=.1;camera.clip_end=400;camera.lens_unit='FOV';camera.angle=math.radians(46)
    o=bpy.data.objects.new(f'SA_{route.upper()}_PREVIEW_00',camera);cols['06_CAMERA_GUIDES'].objects.link(o);scene.camera=o
    pos,look=camera_pose(route,POSTER_PROGRESS[route],c);o.location=B(pos);o.rotation_euler=(Vector(B(look))-o.location).to_track_quat('-Z','Y').to_euler()
    scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
    scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
    scene.view_settings.view_transform='Standard';scene.view_settings.look='None';scene.view_settings.exposure=0;scene.view_settings.gamma=1
    scene.render.image_settings.file_format='WEBP';scene.render.image_settings.quality=84

def make_master(route,c,root):
    records=[a for a in c['assets'].values() if a['owner']==route];dest=HERE/records[0]['source']
    if dest.exists():print('RESUME_KEEP_MASTER',dest.name,flush=True);return
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene;scene.name='SA_'+route.upper();scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1;scene.render.fps=30;scene.frame_end=181
    cols={}
    for name in COLLECTIONS:
        col=bpy.data.collections.new(name);scene.collection.children.link(col);cols[name]=col
    mats=materials()
    for rec in records:
        for lod in ('desktop','mobile'):
            a=build(Asset(rec['id'],lod,mats,cols['09_EXPORT_DESKTOP' if lod=='desktop' else '10_EXPORT_MOBILE']))
            a.root['purpose']=rec['Purpose and visual form'];a.root['provenance']='Original procedural modeling from supplied Part I. No third-party mesh.'
            library_collection(a)
        print('MODELED',rec['id'],rec['name'],flush=True)
    guide_nodes(route,c,cols);scene_instances(route,c,cols);render_rig(route,cols,c)
    text=bpy.data.texts.new('READ_ME');text.write(json.dumps({'version':VERSION,'purpose':route+' Stay Awhile asset master',
        'assetIds':[a['id'] for a in records],'provenance':'Original deterministic geometry based on Part I / Appendix B of '+c['specification'],
        'coordinateConvention':'Metric, scale 1. Specification glTF (x,y,z) authored Blender (x,-z,y). Export Y-up exactly once.',
        'exportProcess':'blender --background --python scripts/blender/stay-awhile/produce.py -- --root <repository> --export-only',
        'dependencies':[] if route=='garden' else ['//00-garden.blend (linked shared library collections)'],
        'validationStatus':'Generated; see validation-report.json and export inventory for independent reopened-source checks.',
        'artistNotes':['Unlettered geometry; no private evidence. No browser animation authored.',
          'One Action per logical clip with separate object slots for parts and LODs. Library collections are instanced, never baked into prop GLBs.',
          'Camera/reference empties exported in the first owned asset pair; scene.json identifies their asset container.',
          'World-scale G01/G09 and distant G11/F03 intentionally extend outside local route extent.',
          'Material/vertex-color baseline; no external textures. Timber atlas detail remains a separate finishing requirement.']},indent=2))
    set_exclude('09_EXPORT_DESKTOP',True);set_exclude('10_EXPORT_MOBILE',True);set_exclude('COMPOSITION_MOBILE',True)
    scene.frame_set(181);bpy.ops.wm.save_as_mainfile(filepath=str(dest),compress=True)
    print('MASTER_SAVED',dest.name,flush=True)

def export_master(route,c,root,refresh=False,asset_id=None):
    records=[a for a in c['assets'].values() if a['owner']==route];source=HERE/records[0]['source']
    bpy.ops.wm.open_mainfile(filepath=str(source),load_ui=False)
    set_exclude('09_EXPORT_DESKTOP',False);set_exclude('10_EXPORT_MOBILE',False)
    set_exclude('COMPOSITION_DESKTOP',True);set_exclude('COMPOSITION_MOBILE',True)
    guides=[o for o in bpy.data.collections['06_CAMERA_GUIDES'].objects if o.type=='EMPTY']
    for index,rec in enumerate(records):
        if asset_id and rec['id']!=asset_id:continue
        for lod in ('desktop','mobile'):
            out=root/rec['path'].replace('.desktop.glb','.'+lod+'.glb')
            if out.exists() and not refresh:print('RESUME_KEEP_GLB',out.name,flush=True);continue
            bpy.ops.object.select_all(action='DESELECT')
            selected=list(bpy.data.collections[f"SA_{rec['id']}_{lod.upper()}"].all_objects)+(guides if index==0 else [])
            for o in selected:o.select_set(True)
            bpy.context.view_layer.objects.active=selected[0];bpy.context.scene.frame_set(1)
            staging=HERE/'staging'/route;staging.mkdir(parents=True,exist_ok=True);tmp=staging/out.name
            bpy.ops.export_scene.gltf(filepath=str(tmp),export_format='GLB',use_selection=True,
                export_yup=True,export_apply=True,export_cameras=False,export_lights=False,export_extras=True,
                export_animations=bool(rec['clips']),export_animation_mode='NLA_TRACKS',export_merge_animation='NLA_TRACK',
                export_frame_range=False,export_force_sampling=True,export_frame_step=1,export_anim_slide_to_zero=True,
                export_optimize_animation_size=True,export_normals=True,export_tangents=False,export_texcoords=True,
                export_vertex_color='ACTIVE',
                export_image_format='AUTO')
            canonical_names(tmp)
            from glb_finish import finish
            duration=rec['clips'][0]['duration'] if rec['clips'] else None
            def endpoint(name,channel):
                source_name=name if lod=='desktop' else name.replace('_'+rec['id']+'_','_'+rec['id']+'_MOBILE')
                obj=bpy.data.objects.get(source_name)
                if obj is None:return None
                frame=1+duration*30;bpy.context.scene.frame_set(int(frame),subframe=frame%1)
                if channel=='translation':return G(obj.location)
                if channel=='rotation':
                    q=obj.rotation_euler.to_quaternion();return (q.x,q.z,-q.y,q.w)
                if channel=='scale':return obj.scale
            from senior_material_export import describe
            finish(tmp,duration,endpoint if duration else None,quantize=True,material_settings=describe(bpy.data.materials))
            data,_=glb_read(tmp)
            names=[a.get('name') for a in data.get('animations',[])];expected=[a['name'] for a in rec['clips']]
            assert names==expected,(rec['id'],lod,names,expected)
            out.parent.mkdir(parents=True,exist_ok=True);tmp.replace(out)
            print('EXPORTED',out.relative_to(root),out.stat().st_size,flush=True)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--root',required=True);ap.add_argument('--export-only',action='store_true');ap.add_argument('--route');ap.add_argument('--refresh-exports',action='store_true')
    ap.add_argument('--asset');args=ap.parse_args(sys.argv[sys.argv.index('--')+1:]);root=Path(args.root).resolve()
    assert (root/'package.json').exists() and (root/'scripts/blender').is_dir()
    c=json.loads((HERE/'contract.json').read_text(encoding='utf8'));assert sha(root/c['specification'])==c['specSha256']
    for route in c['routes']:
        if args.route and route!=args.route:continue
        if args.asset and c['assets'][args.asset]['owner']!=route:continue
        if not args.export_only:make_master(route,c,root)
        export_master(route,c,root,args.refresh_exports,args.asset)
    print('PRODUCTION_PASS_COMPLETE',flush=True)
if __name__=='__main__':main()
