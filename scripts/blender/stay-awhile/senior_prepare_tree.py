"""Reduce CC0 Poly Haven wood and sample its botanical crown distribution."""
import bpy,bmesh,json,numpy as np
from pathlib import Path
H=Path(__file__).resolve().parent;S=H.parents[2]/'.aura-work/senior-art-pass/sources'
d=json.loads((S/'tree_small_02.gltf').read_text());binary=(S/'tree_small_02.bin').read_bytes()
def array(i):
    a=d['accessors'][i];v=d['bufferViews'][a['bufferView']]
    dtype={5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']]
    size={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
    return np.frombuffer(binary,dtype=dtype,count=a['count']*size,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,size)
wood=[];faces=[]
for p in d['meshes'][0]['primitives']:
    vs=array(p['attributes']['POSITION']);fs=array(p['indices']).reshape(-1,3)
    if p['material']==1:
        # Source foliage supplies real crown/branch distribution; opaque leaves are rebuilt.
        centers=vs[fs[::8]].mean(axis=1)
        _,idx=np.unique(np.round(centers/.075).astype(int),axis=0,return_index=True)
        crown=centers[idx]
    elif p['material']==2:
        faces.extend((fs+len(wood)).tolist());wood.extend(vs.tolist())
mesh=bpy.data.meshes.new('SOURCE_WOOD');mesh.from_pydata(wood,[],faces);mesh.update()
bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0001);bm.to_mesh(mesh);bm.free()
obj=bpy.data.objects.new('SOURCE_WOOD',mesh);bpy.context.scene.collection.objects.link(obj)
result={'crown':crown.tolist(),'source':'https://polyhaven.com/a/tree_small_02','creator':'Rico Cilliers','license':'CC0-1.0'}
for name,target in [('hero',1400),('medium',420),('mobile',600),('far',110),('horizon',35)]:
    mesh.calc_loop_triangles()
    mod=obj.modifiers.new(name,'DECIMATE');mod.ratio=target/len(mesh.loop_triangles)
    bpy.context.view_layer.update()
    deps=bpy.context.evaluated_depsgraph_get();deps.update();m=bpy.data.meshes.new_from_object(obj.evaluated_get(deps));m.calc_loop_triangles()
    result[name]={'v':[list(v.co) for v in m.vertices],'f':[list(t.vertices) for t in m.loop_triangles]}
    print('SOURCE_LOD',name,len(m.loop_triangles),flush=True);obj.modifiers.remove(mod);bpy.data.meshes.remove(m)
(H/'senior-tree-source.json').write_text(json.dumps(result,separators=(',',':')))
