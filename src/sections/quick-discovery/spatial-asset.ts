import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { clamp, range } from "./continuity";

type Manifest = { duration: number; fps: number; stride: number; lightingSampleFrames: number; lighting: Record<string,number[]>; sourceSHA256: string };

/** No private RAF. Blender clips are sampled by the same clock as native text.
 * The authoring scene uses Z-up; the exported camera keeps the GLTF conversion.
 */
export class SpatialAsset {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera();
  private sourceCamera: THREE.PerspectiveCamera | null = null;
  private world: GLTF | null = null;
  private embers: GLTF | null = null;
  private worldMixer: THREE.AnimationMixer | null = null;
  private emberMixer: THREE.AnimationMixer | null = null;
  private manifest: Manifest | null = null;
  private lights: { object: THREE.PointLight; samples: number[] }[] = [];
  private abort = new AbortController();
  private disposed = false;
  private width = 1;
  private height = 1;
  private up = new THREE.Vector3();
  private right = new THREE.Vector3();
  private point = new THREE.Vector3();
  private focal: { object: THREE.Object3D; stage: number }[] = [];
  private farEmbers: THREE.Object3D[] = [];
  private nearEmbers: THREE.Object3D[] = [];
  private statsClock = 0;
  private surroundings: {object:THREE.Object3D;from:number;to:number}[]=[];
  private facets:THREE.Object3D[]=[];

  constructor(private canvas: HTMLCanvasElement, private fail: () => void) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x06060a, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.scene.fog = new THREE.Fog(0x06060a,29,49);
    this.scene.add(new THREE.HemisphereLight(0xe2dbd0,0x170b0d,1.2));
    void this.load();
  }

  private async fetchFile(name: string) {
    const response=await fetch(`/models/quick-discovery/${name}`,{signal:this.abort.signal});
    if(!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
    return response;
  }

  private async load() {
    // Sequential parsing limits the transient memory peak on smaller devices.
    try {
      this.manifest=await (await this.fetchFile("motion-manifest.json")).json() as Manifest;
      const world=await new GLTFLoader().parseAsync(await (await this.fetchFile("quick-world.glb")).arrayBuffer(),"");
      if(this.disposed){this.release(world.scene);return;}
      this.world=world;this.scene.add(world.scene);
      this.sourceCamera=world.cameras[0] as THREE.PerspectiveCamera;
      if(!this.sourceCamera?.isPerspectiveCamera || !world.animations.length) throw new Error("Animated world has no authored camera or clips");
      this.worldMixer=new THREE.AnimationMixer(world.scene);
      for(const clip of world.animations) this.worldMixer.clipAction(clip).setLoop(THREE.LoopOnce,1).play().clampWhenFinished=true;
      for(const [name,samples] of Object.entries(this.manifest.lighting)) {
        const object=world.scene.getObjectByName(name);
        if(object instanceof THREE.PointLight) this.lights.push({object,samples});
      }
      world.scene.traverse(obj=>{
        if(obj.name.startsWith("Peripheral_Facet"))this.facets.push(obj);
        const window=obj.name.startsWith("Build_Rib")?[1.4,5.3]:obj.name.startsWith("Action_Path")?[3.5,5.4]:obj.name==="Workshop_Surround"?[4.5,11.6]:obj.name.startsWith("Archive_Sheet")?[10.6,12.4]:obj.name==="Future_Horizon"?[11.6,13.4]:null;
        if(window)this.surroundings.push({object:obj,from:window[0]!,to:window[1]!});
        const index=["Planner_World","Papers_World","MUN_World","SNRLED_World","AURA_World"].indexOf(obj.name);
        if(index>=0) this.focal.push({object:obj,stage:6+index});
        if((obj.name==="Continuity_Frame"||obj.name.startsWith("Workshop_")) && obj instanceof THREE.Mesh && !Array.isArray(obj.material)) {
          obj.material=obj.material.clone();obj.material.transparent=true;obj.material.depthWrite=false;
        }
        if(obj instanceof THREE.Mesh) obj.frustumCulled=false; // Morph bounds change substantially.
      });
      const embers=await new GLTFLoader().parseAsync(await (await this.fetchFile("quick-embers.glb")).arrayBuffer(),"");
      if(this.disposed){this.release(embers.scene);return;}
      this.embers=embers;this.scene.add(embers.scene);
      this.emberMixer=new THREE.AnimationMixer(embers.scene);
      for(const clip of embers.animations) this.emberMixer.clipAction(clip).play();
      embers.scene.traverse(obj=>{
        if(!(obj instanceof THREE.Mesh))return;
        (obj.name.startsWith("Ember_Far")?this.farEmbers:this.nearEmbers).push(obj);
        for(const m of Array.isArray(obj.material)?obj.material:[obj.material]) {m.depthWrite=false;m.side=THREE.DoubleSide;}
      });
      this.canvas.dataset["asset"]="ready";
      this.canvas.dataset["clips"]=String(world.animations.length+embers.animations.length);
      this.canvas.dataset["source"]=this.manifest.sourceSHA256;
    } catch(error) {
      if(!this.disposed){this.canvas.dataset["asset"]="failed";console.error("AURA animated world failed",error);this.fail();}
    }
  }

  resize(width:number,height:number) {
    this.width=width;this.height=height;
    this.renderer.setPixelRatio(Math.min(width<761?1:1.5,devicePixelRatio));
    this.renderer.setSize(width,height,false);
  }

  draw(journey:number, x:number,y:number, seconds:number) {
    if(this.disposed||!this.worldMixer||!this.sourceCamera||!this.manifest)return;
    const mobile=this.width<761;
    const time=Math.min(this.manifest.duration-.001,journey*this.manifest.stride/this.manifest.fps);
    this.worldMixer.setTime(time);
    this.emberMixer?.setTime(seconds%24);
    // Retain source camera pose. Only responsive framing and damped pointer
    // influence are added here; the camera trajectory is in the Blender clip.
    this.sourceCamera.updateWorldMatrix(true,false);
    this.camera.copy(this.sourceCamera,false);
    this.sourceCamera.getWorldPosition(this.camera.position);
    this.sourceCamera.getWorldQuaternion(this.camera.quaternion);
    // The persistent ribbon is absent during the logger: no unrelated red ring.
    const ribbon=this.world?.scene.getObjectByName("Continuity_Frame");
    if(ribbon instanceof THREE.Mesh && !Array.isArray(ribbon.material)) {
      const alpha=1-range(journey,6.78,7.02)*(1-range(journey,7.95,8.15));
      ribbon.material.opacity=clamp(alpha);ribbon.visible=alpha>.001;
    }
    const quiet=range(journey,11.75,12.22)*(1-range(journey,12.85,13.2));
    this.surroundings.forEach(({object,from,to})=>{object.visible=journey>from&&journey<to&&(!mobile||!object.name.startsWith("Archive_Sheet")||Number(object.name.slice(-2))%3===0);});
    this.facets.forEach(obj=>{obj.scale.setScalar(1-quiet*.65);obj.visible=true;});
    const fog=this.scene.fog as THREE.Fog;fog.near=29+quiet*18;fog.far=49+quiet*28;
    this.camera.aspect=this.width/this.height;
    this.camera.near=.1;this.camera.far=150;
    this.up.set(0,1,0).applyQuaternion(this.camera.quaternion);
    this.right.set(1,0,0).applyQuaternion(this.camera.quaternion);
    if(mobile) {
      this.camera.position.x*=.35;
      this.camera.position.y=22+(this.camera.position.y-22)*.35;
      this.camera.position.z*=.35;
      this.camera.fov=47;
      const entry=1-clamp(journey*1.7);
      this.camera.position.addScaledVector(this.right,2.7*(1-entry)).addScaledVector(this.up,4.6*(1-entry));
    } else {
      this.camera.position.addScaledVector(this.right,x*.24).addScaledVector(this.up,y*.13);
    }
    this.camera.updateProjectionMatrix();
    this.lights.forEach(({object,samples})=>{
      const at=time*this.manifest!.fps/this.manifest!.lightingSampleFrames;
      const i=Math.min(samples.length-2,Math.floor(at)),t=at-i;
      object.intensity=(samples[i]!+(samples[i+1]!-samples[i]!)*clamp(t))/(4*Math.PI);
      if(!mobile){object.position.x+=x*.15;object.position.z-=y*.12;}
    });
    // Cull whole distant project groups, never swap visible compositions.
    this.focal.forEach(({object,stage})=>{
      object.visible=journey>stage-.3&&journey<stage+1.2;
      if(object.name==="Papers_World")object.position.x+=range(journey-stage,.35,.52)*2.1;
    });
    const workshop=this.world?.scene.getObjectByName("Workshop_Surround");
    const workshopAlpha=range(journey,4.65,5.1)*(1-range(journey,5.65,6)) + range(journey,10.65,10.85)*(1-range(journey,11.2,11.48));
    if(workshop){
      workshop.visible=workshopAlpha>.001;
      workshop.children.forEach(obj=>{if(obj instanceof THREE.Mesh&&!Array.isArray(obj.material))obj.material.opacity=workshopAlpha*.55;});
    }
    this.farEmbers.forEach((obj,i)=>{obj.scale.multiplyScalar(1-quiet*.35);obj.visible=!mobile||i%3===0;});
    this.nearEmbers.forEach((obj,i)=>{
      obj.scale.multiplyScalar(1-quiet*.5);obj.visible=!mobile||i%2===0;
      if(!mobile){obj.position.x+=x*.08;obj.position.z-=y*.05;}
    });
    this.renderer.render(this.scene,this.camera);
    // AnimationMixer may skip unchanged tracks while scroll is stationary.
    // Restore the responsive graph offset so it can never accumulate offscreen.
    this.focal.forEach(({object,stage})=>{if(object.name==="Papers_World")object.position.x-=range(journey-stage,.35,.52)*2.1;});
    if(seconds-this.statsClock>.5){
      this.statsClock=seconds;
      this.canvas.dataset["time"]=time.toFixed(3);
      this.canvas.dataset["calls"]=String(this.renderer.info.render.calls);
      this.canvas.dataset["triangles"]=String(this.renderer.info.render.triangles);
      const task=this.world?.scene.getObjectByName("Planner_Task_06");
      if(task){task.getWorldPosition(this.point);this.canvas.dataset["sample"]=this.point.toArray().map(n=>n.toFixed(3)).join(",");}
    }
  }

  private release(root:THREE.Object3D) {
    const materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
    root.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.geometry.dispose();(Array.isArray(obj.material)?obj.material:[obj.material]).forEach(m=>materials.add(m));}});
    materials.forEach(m=>{Object.values(m).forEach(v=>{if(v instanceof THREE.Texture)textures.add(v);});m.dispose();});
    textures.forEach(t=>{t.dispose();if(typeof ImageBitmap!=="undefined"&&t.image instanceof ImageBitmap)t.image.close();});
  }

  dispose() {
    this.disposed=true;this.abort.abort();
    this.worldMixer?.stopAllAction();this.emberMixer?.stopAllAction();
    if(this.world){this.worldMixer?.uncacheRoot(this.world.scene);this.release(this.world.scene);}
    if(this.embers){this.emberMixer?.uncacheRoot(this.embers.scene);this.release(this.embers.scene);}
    // React Strict Mode reuses this canvas during its setup/cleanup/setup cycle.
    // Forcing context loss poisons the next renderer and blanks every animation.
    // GPU buffers, textures and renderer caches have already been released above.
    this.scene.clear();this.renderer.dispose();
  }
}
