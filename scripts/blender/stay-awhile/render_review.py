"""Blender-only composed poster renders and camera-corridor geometry checks."""
import bpy,sys,json,math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
from geometry import B
from produce import set_exclude,dump
from layout import POSTER_PROGRESS,CLIP_BANDS,camera_pose
from bpy_extras.anim_utils import action_get_channelbag_for_slot

def pose(p):
    for obj in bpy.data.objects:
        if obj.library or not obj.animation_data:continue
        for track in obj.animation_data.nla_tracks:
            clip=track.name;band=CLIP_BANDS[clip];D=obj['clipDuration']
            t=max(0,min(1,(p-band[0])/(band[1]-band[0]))) if band else 0
            if clip=='AURA_STRUCTURE':
                t=(.3*max(0,min(1,(p-.24)/.08))) if p<.38 else .3+.7*max(0,min(1,(p-.38)/.11))
            strip=track.strips[0];bag=action_get_channelbag_for_slot(strip.action,strip.action_slot)
            track.mute=True
            for fc in bag.fcurves:
                getattr(obj,fc.data_path)[fc.array_index]=fc.evaluate(1+D*t*30)
    bpy.context.view_layer.update()

def corridor(route,c,dense=False):
    scene=bpy.context.scene;violations=[]
    # Test each authored start/end plus intermediate camera positions against
    # evaluated final geometry. Dynamic route states are separately sampled.
    for p in (0,.25,.5,.75,1):
        pose(p);deps=bpy.context.evaluated_depsgraph_get();verts=[];faces=[];owners=[]
        for inst in deps.object_instances:
            obj=inst.object
            if obj.type!='MESH':continue
            mesh=obj.to_mesh();off=len(verts);M=inst.matrix_world
            verts.extend([M@v.co for v in mesh.vertices]);faces.extend([tuple(off+i for i in poly.vertices) for poly in mesh.polygons]);owners.extend([obj.name]*len(mesh.polygons));obj.to_mesh_clear()
        if not faces:violations.append({'progress':p,'error':'No composed meshes'});continue
        tree=BVHTree.FromPolygons(verts,faces)
        progress=[p]
        if dense:
            progress=[]
            for k in c['routes'][route]['knots']:
                progress.extend(k['band'][0]+(k['band'][1]-k['band'][0])*.35*q/8 for q in range(9))
        for cp in progress:
            for mobile in (False,True):
                pos,_=camera_pose(route,cp,c,mobile);point=Vector(B(pos));hit=tree.find_nearest(point)
                if hit[0] is not None and hit[3]<.5:violations.append({'geometryProgress':p,'cameraProgress':cp,'mobile':mobile,'distance':hit[3],'object':owners[hit[2]]})
    return violations

def main():
    root=Path(sys.argv[sys.argv.index('--')+1]).resolve();c=json.loads((HERE/'contract.json').read_text(encoding='utf8'))
    only=sys.argv[sys.argv.index('--')+2:];report=[]
    if only and (HERE/'poster-review.json').exists():
        report=[r for r in json.loads((HERE/'poster-review.json').read_text()) if r['route'] not in only]
    for route in c['routes']:
        if only and route not in only:continue
        source=HERE/next(a['source'] for a in c['assets'].values() if a['owner']==route)
        bpy.ops.wm.open_mainfile(filepath=str(source),load_ui=False)
        violations=corridor(route,c)
        pose(POSTER_PROGRESS[route]);scene=bpy.context.scene
        scene.cycles.samples=16;scene.render.threads_mode='FIXED';scene.render.threads=16
        scene.render.image_settings.file_format='WEBP'
        for mobile in (False,True):
            lod='mobile' if mobile else 'desktop';dest=root/'public/assets/stay/v1'/f'{route}-{lod}.webp';dest.parent.mkdir(parents=True,exist_ok=True)
            set_exclude('COMPOSITION_DESKTOP',mobile);set_exclude('COMPOSITION_MOBILE',not mobile)
            pos,look=camera_pose(route,POSTER_PROGRESS[route],c,mobile);cam=scene.camera
            cam.location=B(pos);cam.rotation_euler=(Vector(B(look))-cam.location).to_track_quat('-Z','Y').to_euler()
            scene.render.resolution_x=780 if mobile else 1600;scene.render.resolution_y=1200 if mobile else 1000
            # Blender angle is horizontal with horizontal fit; derive lens from required vertical FOV.
            cam.data.sensor_fit='VERTICAL';cam.data.sensor_height=24
            cam.data.lens=12/math.tan(math.radians(52 if mobile else 46)/2)
            scene.render.image_settings.quality=82;scene.render.filepath=str(dest)
            bpy.ops.render.render(write_still=True)
            cap=(110 if mobile else 180)*1024
            if dest.stat().st_size>cap:
                scene.render.image_settings.quality=68;bpy.data.images['Render Result'].save_render(str(dest),scene=scene)
            report.append({'route':route,'lod':lod,'path':dest.relative_to(root).as_posix(),'bytes':dest.stat().st_size,'budgetPass':dest.stat().st_size<=cap,'corridorViolations':violations})
            print('POSTER',route,lod,dest.stat().st_size,'CORRIDOR',violations,flush=True)
        dump(HERE/'poster-review.json',report)
    print('POSTERS_COMPLETE',flush=True)
if __name__=='__main__':main()
