import * as THREE from "three";

/** Identical static background meshes share a draw. Matrices, geometry, colors
 * and materials remain authored; animated and visibility-scored kits are excluded. */
export class StaticBatches {
  private batches: THREE.InstancedMesh[] = [];
  constructor(group: THREE.Group, objects: Map<string, THREE.Object3D[]>) {
    group.updateMatrixWorld(true);
    const inverse=group.matrixWorld.clone().invert();
    const transform=new THREE.Matrix4();
    for(const id of ["G02","G04","G05","G06","G11"]) {
      const buckets=new Map<THREE.BufferGeometry,Map<THREE.Material|THREE.Material[],THREE.Mesh[]>>();
      for(const root of objects.get(id)??[])root.traverse(node=>{
        if(!(node instanceof THREE.Mesh)||!node.visible||node instanceof THREE.SkinnedMesh||node instanceof THREE.InstancedMesh)return;
        for(let parent:THREE.Object3D|null=node;parent&&parent!==root.parent;parent=parent.parent)if(parent.name.includes("SWAY")||!parent.visible)return;
        let materials=buckets.get(node.geometry);if(!materials){materials=new Map();buckets.set(node.geometry,materials);}
        const items=materials.get(node.material);if(items)items.push(node);else materials.set(node.material,[node]);
      });
      for(const materials of buckets.values())for(const meshes of materials.values()) {
        if(meshes.length<3)continue;
        const source=meshes[0]!,batch=new THREE.InstancedMesh(source.geometry,source.material,meshes.length);
        batch.name=`Stay static ${id}`;batch.castShadow=source.castShadow;batch.receiveShadow=source.receiveShadow;
        for(let i=0;i<meshes.length;i++){const mesh=meshes[i]!;transform.multiplyMatrices(inverse,mesh.matrixWorld);batch.setMatrixAt(i,transform);mesh.visible=false;}
        batch.computeBoundingSphere();batch.matrixAutoUpdate=false;group.add(batch);this.batches.push(batch);
      }
    }
  }
  get count() { return this.batches.length; }
  dispose() { for(const batch of this.batches){batch.parent?.remove(batch);batch.dispose();}this.batches.length=0; }
}
