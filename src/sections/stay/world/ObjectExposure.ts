import * as THREE from "three";

type Exposure = { mesh: THREE.Mesh; original: THREE.Material|THREE.Material[]; materials: THREE.Material[]; uniform: {value:number} };
const entries=new WeakMap<THREE.Object3D,Exposure[]>();

/** Continuous visibility, with the source texture's alpha test left intact.
 * Materials are owned by this route; geometry and textures remain shared. */
function forRoot(root:THREE.Object3D) {
  let list=entries.get(root);if(list)return list;
  list=[];
  root.traverse(node=>{
    if(!(node instanceof THREE.Mesh))return;
    const original=node.material,uniform={value:1};
    const sources=Array.isArray(original)?original:[original];
    const materials=sources.map(source=>{
      const material=source.clone();material.alphaHash=true;
      const hash=source.alphaHash,blend=source.transparent;
      const key=`${source.customProgramCacheKey()}|stay-continuous-exposure-v2|${hash}|${blend}`;
      material.onBeforeCompile=(shader:THREE.WebGLProgramParametersWithUniforms,renderer:THREE.WebGLRenderer)=>{
        source.onBeforeCompile.call(material,shader,renderer);shader.uniforms.stayExposure=uniform;
        shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float stayExposure;').replace('#include <alphatest_fragment>',`#include <alphatest_fragment>\n${hash||blend?'diffuseColor.a *= stayExposure;':'diffuseColor.a = stayExposure;'}`);
        // Fully visible opaque alpha-tested foliage must retain every source
        // pixel. Dither only its continuous fade, never its authored hold.
        if(!hash)shader.fragmentShader=shader.fragmentShader.replace('#include <alphahash_fragment>','if (stayExposure < 1.0) {\n#include <alphahash_fragment>\n}');
      };
      material.customProgramCacheKey=()=>key;return material;
    });
    node.material=Array.isArray(original)?materials:materials[0]!;
    list!.push({mesh:node,original,materials,uniform});
  });
  entries.set(root,list);return list;
}
export function exposeObject(root:THREE.Object3D,exposure:number) {
  root.visible=exposure>0;
  for(const item of forRoot(root))item.uniform.value=exposure;
}
export function exposeMeshes(root:THREE.Object3D,progress:number) {
  const list=forRoot(root);root.visible=progress>0;
  for(let i=0;i<list.length;i++) {
    const q=THREE.MathUtils.clamp(progress*list.length-i,0,1),item=list[i]!;
    item.uniform.value=q*q*q*(10+q*(-15+6*q));item.mesh.visible=q>0;
  }
}
export function releaseExposures(objects:Map<string,THREE.Object3D[]>) {
  for(const roots of objects.values())for(const root of roots) {
    const list=entries.get(root);if(!list)continue;
    for(const item of list){item.mesh.material=item.original;for(const material of item.materials)material.dispose();}
    entries.delete(root);
  }
}
