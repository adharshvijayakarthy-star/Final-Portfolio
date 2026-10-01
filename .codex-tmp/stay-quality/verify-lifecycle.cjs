const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ts=require('typescript');
const THREE=require('three');
const root=process.cwd(),output=path.join(__dirname,'lifecycle-modules');
fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'package.json'),'{"type":"commonjs"}');
const files=['types','WorldRuntime','AssetStore','PetalSystem','WaterSurface','FrameProfiler','CameraController','narrative-score','scenes/GardenScene','scenes/PersonScene','scenes/BuilderScene','scenes/ThinkerScene','scenes/LeaderScene','scenes/RouteAdapter'];
for(const name of files){const dest=path.join(output,name+'.js');fs.mkdirSync(path.dirname(dest),{recursive:true});let compiled=ts.transpileModule(fs.readFileSync(path.join(root,'src/sections/stay/world',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;if(name==='WorldRuntime')compiled=compiled.replace('require("three")','require("./three-fixture")');fs.writeFileSync(dest,compiled);}
fs.writeFileSync(path.join(output,'three-fixture.js'),'module.exports=global.__stayThreeFixture;');
global.ImageBitmap=class ImageBitmap {};
global.window=new EventTarget();window.devicePixelRatio=1;
global.matchMedia=()=>({matches:false});
let frames=new Map(),sequence=0,maximumFrames=0,time=0;
global.requestAnimationFrame=callback=>{const id=++sequence;frames.set(id,callback);maximumFrames=Math.max(maximumFrames,frames.size);return id;};
global.cancelAnimationFrame=id=>frames.delete(id);
const textures=new Set(),geometries=new Set();let compileGate=null;
let seeks=0;
const seek=THREE.AnimationMixer.prototype.setTime;
THREE.AnimationMixer.prototype.setTime=function(time){seeks++;return seek.call(this,time);};
class Canvas extends EventTarget{dataset={};setAttribute(){}remove(){}}
class Renderer {
  domElement=new Canvas();info={render:{calls:0,triangles:0},memory:{geometries:0,textures:0}};renders=0;uploads=0;
  setPixelRatio(){}setSize(){}
  async compileAsync(){if(compileGate){const gate=compileGate;compileGate=null;await gate.promise;}}
  initTexture(texture){if(!textures.has(texture)){textures.add(texture);texture.addEventListener('dispose',()=>textures.delete(texture));this.uploads++;}}
  render(scene){this.renders++;scene.traverse(node=>{if(node instanceof THREE.Mesh&&!geometries.has(node.geometry)){geometries.add(node.geometry);node.geometry.addEventListener('dispose',()=>geometries.delete(node.geometry));}});this.info.memory={geometries:geometries.size,textures:textures.size};this.info.render.calls=geometries.size;}
  dispose(){textures.clear();geometries.clear();}
}
global.__stayThreeFixture={...THREE,WebGLRenderer:Renderer};
const manifest=JSON.parse(fs.readFileSync('public/models/stay/v1/asset-manifest.json','utf8'));
const byUri=new Map(manifest.assets.flatMap(asset=>Object.values(asset.variants).map(variant=>[variant.uri,{asset,variant}])));
const requests=new Map();
global.fetch=async(url,{signal}={})=>{requests.set(url,(requests.get(url)||0)+1);if(signal?.aborted)throw new Error('aborted');if(url.endsWith('.json'))return{ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,'public',url),'utf8'))};return{ok:true,arrayBuffer:async()=>Uint8Array.from(Buffer.from(url)).buffer};};
const {GLTFLoader}=require('three/addons/loaders/GLTFLoader.js');
GLTFLoader.prototype.parseAsync=async function(buffer){const url=Buffer.from(buffer).toString(),record=byUri.get(url);assert(record,`fixture URI ${url}`);const group=new THREE.Group();for(const name of record.variant.nodeNames){const node=new THREE.Group();node.name=name;group.add(node);}const texture=new THREE.Texture({width:64,height:64});const material=new THREE.MeshStandardMaterial({map:texture});group.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material));return{scene:group,animations:record.variant.clips.map(clip=>new THREE.AnimationClip(clip.name,clip.duration,[new THREE.NumberKeyframeTrack('.position[x]',[0,clip.duration],[0,1])]))};};
const {WorldRuntime}=require('./lifecycle-modules/WorldRuntime');
const {AssetStore}=require('./lifecycle-modules/AssetStore');
const host={clientWidth:1366,clientHeight:599,dataset:{},appendChild(){}};
const turn=()=>new Promise(resolve=>setImmediate(resolve));
async function pumpUntil(promise){let completed=false,result,error;promise.then(value=>{result=value;completed=true;},reason=>{error=reason;completed=true;});for(let i=0;i<500&&!completed;i++){await turn();const current=[...frames];frames.clear();time+=16.7;current.forEach(([,callback])=>callback(time));}assert(completed,'bounded preparation completed');if(error)throw error;return result;}
async function drain(count=3){for(let i=0;i<count;i++){await turn();const current=[...frames];frames.clear();time+=16.7;current.forEach(([,callback])=>callback(time));}}
(async()=>{
  const store=new AssetStore(),uri=manifest.assets[0].variants.desktop.uri,before=requests.get(uri)||0;
  const [a,b]=await Promise.all([store.acquire(manifest.assets[0].assetId,'desktop'),store.acquire(manifest.assets[0].assetId,'desktop')]);
  assert.equal((requests.get(uri)||0)-before,1,'concurrent acquisition deduplicates fetch');
  assert.equal(store.stats().references,2);a.release();a.release();assert.equal(store.stats().references,1);b.release();await turn();assert.equal(store.stats().entries,0);store.dispose();
  const world=new WorldRuntime(host),routes=['person','builder','thinker','leader','stories','work','future','aura','contact'];
  await pumpUntil(world.attach('builder','desktop'));world.setProgress(.5);await drain();
  const still=seeks;
  for(let i=0;i<10;i++){world.requestRender();await drain(1);}
  assert.equal(seeks,still,'stationary reading does not re-seek authored clips');
  world.resize();await drain();assert(seeks>still,'resize invalidates the pose');
  const resized=seeks;world.setProgress(.6);await drain();assert(seeks>resized,'new score seeks authored clips');
  await pumpUntil(world.attach('garden','desktop'));world.setAmbientPaused(true);await drain();
  const cycles=[];
  for(let i=0;i<20;i++){
    const route=routes[i%routes.length];await pumpUntil(world.attach(route,'desktop'));world.setProgress(1);await drain(40);
    const away=world.stats();assert.equal(away.roots,1);assert.equal(away.entries,away.references,'one owner per retained handle');
    await pumpUntil(world.attach('garden','desktop'));world.setProgress(.5);await drain();const back=world.stats();assert.equal(back.roots,1);assert(back.entries<=14,'bounded shared kit plus Garden handles');cycles.push({cycle:i+1,route,away,back});
  }
  const stable=cycles.slice(9).map(c=>c.back.entries);assert.equal(new Set(stable).size,1,'shared retention reaches a plateau');
  let resolveGate;compileGate={promise:new Promise(resolve=>{resolveGate=resolve;})};const old=world.attach('stories','desktop').catch(error=>error);await turn();await turn();const latest=world.attach('contact','desktop');resolveGate();await pumpUntil(latest);await old;assert.equal(world.renderer.domElement.dataset.stayRoute,'contact','late generation cannot commit');
  world.setProgress(.5);await drain();assert.equal(world.stats().frame,0,'paused/static route idles after input');
  world.setVisible(false);const renders=world.renderer.renders;world.requestRender();await drain();assert.equal(world.renderer.renders,renders,'hidden world does no drawing');world.setVisible(true);await drain();
  const pending=world.attach('aura','mobile').catch(error=>error);await turn();world.dispose();await pumpUntil(pending);await drain();assert.equal(world.stats().entries,0);assert.equal(world.stats().references,0);assert.equal(world.stats().roots,0);assert.equal(frames.size,0);assert.equal(maximumFrames,1,'only one scheduled frame');
  fs.writeFileSync(path.join(__dirname,'lifecycle-results.json'),JSON.stringify({environment:'Node fixture with real controllers/store and mocked browser, loader and renderer; not GPU or browser acceptance',cycles,concurrency:'deduplicated fetch and idempotent release',cancellation:'late generation and disposal during preparation passed',poseCaching:'stationary clips are not re-evaluated; resize and score changes invalidate',maximumFrames,disposed:world.stats()},null,2));
  console.log('PASS: 20 controller/store route-and-return cycles, bounded ownership, single scheduled frame, concurrent acquisition, stale generation, hidden drawing and final disposal. Renderer/loader are fixtures.');
})().catch(error=>{console.error(error);process.exitCode=1;});
