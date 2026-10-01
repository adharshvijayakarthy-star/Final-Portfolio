const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),THREE=require('three');
const directory=path.join(__dirname,'petal-test-modules');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'package.json'),'{"type":"commonjs"}');
fs.writeFileSync(path.join(directory,'PetalSystem.js'),ts.transpileModule(fs.readFileSync('src/sections/stay/world/PetalSystem.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const {PetalSystem}=require('./petal-test-modules/PetalSystem');
global.window={innerHeight:900};
function deliveredKit(variant){
 const bytes=fs.readFileSync(`public/models/stay/v1/garden/petal-kit.${variant}.glb`),length=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+length).toString()),bin=bytes.subarray(28+length);
 const node=g.nodes.find(n=>n.mesh!==undefined),primitive=g.meshes[node.mesh].primitives[0],a=g.accessors[primitive.attributes.POSITION],view=g.bufferViews[a.bufferView];
 assert.equal(a.componentType,5122,'real G12 uses quantized Int16 positions');
 const values=new Int16Array(a.count*3),start=(view.byteOffset??0)+(a.byteOffset??0),stride=view.byteStride??6;
 for(let i=0;i<a.count;i++)for(let k=0;k<3;k++)values[i*3+k]=bin.readInt16LE(start+i*stride+k*2);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(values,3,!!a.normalized));
 const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());mesh.scale.fromArray(node.scale??[1,1,1]);const kit=new THREE.Group();kit.add(mesh);return kit;
}
const records=[];
for(const variant of ['desktop','mobile']){
 const kit=deliveredKit(variant),group=new THREE.Group(),tree=new THREE.Group(),blossom=new THREE.Mesh(new THREE.BoxGeometry(4,3,3),new THREE.MeshBasicMaterial());blossom.material.name='SA_M_SAKURA';blossom.position.set(2,5,-10);tree.add(blossom);group.add(tree);
 const petals=new PetalSystem('person',variant,group,[tree],kit),mesh=group.getObjectByName('Stay canopy petals');assert(mesh,'instanced petal exists');
 assert(mesh.geometry.getAttribute('position').array instanceof Float32Array,'runtime positions are expanded before metre transforms');mesh.geometry.computeBoundingBox();const size=mesh.geometry.boundingBox.getSize(new THREE.Vector3());assert(size.toArray().every(Number.isFinite)&&Math.max(...size.toArray())>.99,'delivered geometry has real nonzero extent');
 const camera=new THREE.PerspectiveCamera(46,1.6,.1,220);camera.position.set(0,1.6,12);camera.lookAt(0,2,-10);camera.updateMatrixWorld();
 const pointer=new THREE.Vector2(10,10);for(let i=0;i<60;i++)petals.update(i/60,camera,pointer,false);
 const report=petals.diagnostics();assert(report.visible>0,'actual-sized geometry projects into the reading camera');assert(report.maxPixels<=9.01,'near-camera coverage is bounded');assert(report.shape.every(Number.isFinite));assert(report.count<=(variant==='mobile'?24:64));
 const stable=petals.seeds.slice();petals.dispose();const repeated=new PetalSystem('person',variant,group,[tree],kit);assert.deepEqual(repeated.seeds,stable,'emission origins and phases are deterministic');repeated.dispose();
 const contact=new PetalSystem('contact',variant,group,[tree],kit);assert.equal(contact.diagnostics().count,0,'Contact has no particles');contact.dispose();records.push({variant,shape:report.shape,count:report.count,maxPixels:report.maxPixels});
}
fs.writeFileSync(path.join(__dirname,'petal-geometry-results.json'),JSON.stringify({source:'Actual delivered quantized desktop/mobile G12 buffers; synthetic canopy/camera for geometry regression only',records},null,2));console.log('PASS: real quantized G12 geometry remains finite and nonzero, deterministic origins, bounded pixel size, mobile limits, Contact zero. Browser visibility is verified separately.');
