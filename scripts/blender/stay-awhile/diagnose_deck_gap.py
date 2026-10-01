"""Identify the mesh behind dark preview pixels on Thinker's deck."""
import bpy,json,math,sys
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
from geometry import B,G
from render_review import pose
from produce import set_exclude
from layout import camera_pose
c=json.loads((HERE/'contract.json').read_text(encoding='utf8'))
bpy.ops.wm.open_mainfile(filepath=str(HERE/'03-thinker.blend'),load_ui=False)
set_exclude('COMPOSITION_DESKTOP',False);set_exclude('COMPOSITION_MOBILE',True)
pose(.58)
scene=bpy.context.scene;cam=scene.camera
loc,look=camera_pose('thinker',.58,c,False)
cam.location=B(loc);cam.rotation_euler=(Vector(B(look))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.sensor_fit='VERTICAL';cam.data.sensor_height=24
cam.data.lens=12/math.tan(math.radians(46)/2)
bpy.context.view_layer.update()
frame=cam.data.view_frame(scene=scene)
print('FRAME',[(v.x,v.y,v.z) for v in frame],flush=True)
image=bpy.data.images.load(str(HERE.parent.parent.parent/'public/assets/stay/v1/thinker-desktop.webp'))
def sample(px,py):
    ix=4*((999-py)*1600+px)
    return tuple(round(image.pixels[ix+k],3) for k in range(3))
print('BLACK_SAMPLES',[(x,y,sample(x,y)) for y in range(400,801,50) for x in range(200,1401,100)
      if max(sample(x,y))<.08],flush=True)
left=min(v.x for v in frame);right=max(v.x for v in frame)
bottom=min(v.y for v in frame);top=max(v.y for v in frame)
for px,py in [(1200,500),(1000,550),(800,600),(800,650),(600,700),(700,700),(500,750),(400,800),
              (900,535),(900,600),(800,585),(500,690),(1100,495),(900,450),(900,700),(500,500)]:
    x=left+(right-left)*px/1600
    y=top-(top-bottom)*py/1000
    direction=(cam.matrix_world.to_quaternion()@Vector((x,y,frame[0].z))).normalized()
    ok,pos,normal,face,obj,matrix=scene.ray_cast(bpy.context.evaluated_depsgraph_get(),cam.location,direction,distance=300)
    print('RAY',px,py,ok,obj.name if obj else None,G(pos) if ok else None,normal[:] if ok else None,flush=True)
    if ok and obj.name=='SA_T01_MESH_00':
        mesh=obj.data;poly=mesh.polygons[face]
        uv=mesh.uv_layers.active
        attr=mesh.color_attributes.get('COLOR_0')
        print('FACE',px,py,face,'material',mesh.materials[poly.material_index].name,
              'verts',[mesh.vertices[i].co[:] for i in poly.vertices],
              'uv',[uv.data[li].uv[:] for li in poly.loop_indices] if uv else None,
              'colors',[attr.data[i].color[:] for i in poly.vertices] if attr else None,flush=True)
