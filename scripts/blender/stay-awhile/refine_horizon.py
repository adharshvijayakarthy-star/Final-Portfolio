"""Correct G09 hill profiles and add the distant ground skirt within its budget."""
import bpy,sys,math
from pathlib import Path
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
from geometry import B,G
source=HERE/'00-garden.blend';bpy.ops.wm.open_mainfile(filepath=str(source),load_ui=False)
if not bpy.context.scene.get('horizonRevision'):
    for lod in ('DESKTOP','MOBILE'):
        n=7 if lod=='MOBILE' else 12;rings=3 if lod=='MOBILE' else 5
        for obj in bpy.data.collections['SA_G09_'+lod].objects:
            if obj.type!='MESH':continue
            old=obj.data;verts=[list(G(v.co)) for v in old.vertices];faces=[tuple(p.vertices) for p in old.polygons]
            for i in range(8):
                cx,cz=180*math.cos(i*math.pi/4),180*math.sin(i*math.pi/4);height=15+(i%3)*4.5
                for j in range(rings):
                    lat=-math.pi/2+.13+j/(rings-1)*(math.pi-.2);original=max(.03,math.cos(lat))
                    for q in range(n):
                        k=i*n*rings+j*n+q;x,y,z=verts[k];t=max(0,min(1,y/height));factor=max(.01,(1-t)**.65)/original
                        verts[k]=[cx+(x-cx)*factor,y,cz+(z-cz)*factor]
            # Square inner opening exactly covers the world terrain boundary.
            count=16 if lod=='MOBILE' else 32;off=len(verts)
            for radius in (88,270):
                for j in range(count):
                    angle=j*2*math.pi/count;xx,zz=math.cos(angle),math.sin(angle)
                    if radius==88:scale=radius/max(abs(xx),abs(zz))
                    else:scale=radius
                    verts.append((xx*scale,0,zz*scale))
            for j in range(count):faces.append((off+j,off+(j+1)%count,off+count+(j+1)%count,off+count+j))
            mesh=bpy.data.meshes.new(old.name+'_HILLS');mesh.from_pydata([B(v) for v in verts],[],faces);mesh.materials.append(old.materials[0])
            for p in mesh.polygons:p.use_smooth=True
            attr=mesh.color_attributes.new(name='COLOR_0',type='FLOAT_COLOR',domain='POINT')
            for a in attr.data:a.color=(1,1,1,1)
            obj.data=mesh
    bpy.context.scene['horizonRevision']=1;bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
