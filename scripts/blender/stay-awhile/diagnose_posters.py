import bpy, sys, json, math
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
from layout import camera_pose,POSTER_PROGRESS
from render_review import pose
from geometry import B,G
c=json.loads((HERE/'contract.json').read_text(encoding='utf8'))
for route in ('stories','future'):
    source=HERE/next(a['source'] for a in c['assets'].values() if a['owner']==route)
    bpy.ops.wm.open_mainfile(filepath=str(source),load_ui=False);pose(POSTER_PROGRESS[route]);scene=bpy.context.scene;cam=scene.camera
    pos,look=camera_pose(route,POSTER_PROGRESS[route],c);cam.location=B(pos);cam.rotation_euler=(Vector(B(look))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.resolution_x=1600;scene.render.resolution_y=1000;cam.data.sensor_fit='VERTICAL';cam.data.sensor_height=24;cam.data.lens=12/math.tan(math.radians(46)/2)
    bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();frame=cam.data.view_frame(scene=scene)
    for x,y in ([(.12,.94),(.26,.94),(.5,.75)] if route=='stories' else [(.5,.74),(.5,.79),(.5,.83),(.3,.6)]):
        local=Vector((min(v.x for v in frame)+(max(v.x for v in frame)-min(v.x for v in frame))*x,max(v.y for v in frame)-(max(v.y for v in frame)-min(v.y for v in frame))*y,frame[0].z))
        direction=cam.matrix_world.to_quaternion()@local.normalized();hit,loc,normal,face,obj,matrix=scene.ray_cast(dg,cam.location,direction)
        print('RAY',route,x,y,obj.name if obj else None,face,list(G(loc)),flush=True)
        if obj and obj.type=='MESH':
            poly=obj.data.polygons[face];mat=obj.data.materials[poly.material_index]
            cols=obj.data.color_attributes
            print('DETAIL',mat.name,'normal',list(normal),'colors',[(a.name,[list(a.data[i].color) for i in (poly.vertices if a.domain=='POINT' else poly.loop_indices)]) for a in cols],flush=True)
