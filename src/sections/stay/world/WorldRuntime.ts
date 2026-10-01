import * as THREE from "three";
import { AssetStore, type AssetHandle } from "./AssetStore";
import { PetalSystem } from "./PetalSystem";
import { FrameProfiler } from "./FrameProfiler";
import { WaterSurface } from "./WaterSurface";
import { sampleCamera } from "./CameraController";
import type { SceneManifest, Variant } from "./types";
import { fetchJson } from "./types";
import { gardenAdapter } from "./scenes/GardenScene";
import { personAdapter } from "./scenes/PersonScene";
import { builderAdapter } from "./scenes/BuilderScene";
import { thinkerAdapter } from "./scenes/ThinkerScene";
import { leaderAdapter } from "./scenes/LeaderScene";
import { routeAdapters, type RouteAdapter } from "./scenes/RouteAdapter";

type ClipBinding = { mixer: THREE.AnimationMixer; action: THREE.AnimationAction; duration: number; band: [number, number]; root: THREE.Object3D };
type RouteScene = { group: THREE.Group; handles: AssetHandle[]; clips: ClipBinding[]; water: WaterSurface | null; petals: PetalSystem | null; sway: { node: THREE.Object3D; rotation: number; phase: number }[]; manifest: SceneManifest; objects: Map<string, THREE.Object3D[]>; adapter: RouteAdapter; deferred: Set<string> };
type TexturePreparation = { token: number; textures: THREE.Texture[]; index: number; milliseconds: number; resolve: (ready: boolean) => void };
const clamp = (value: number) => Math.min(1, Math.max(0, value));
let rendererSequence = 0;

/** Exactly one renderer for the Stay layout, independent of page remounts. */
export class WorldRuntime {
  readonly store = new AssetStore();
  readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(46, 1, .1, 220);
  private readonly light = new THREE.DirectionalLight("#fff0d6", 2);
  private readonly ambient = new THREE.HemisphereLight("#dce7d4", "#263b30", .9);
  private readonly shared = new Map<string, AssetHandle>();


  private route: RouteScene | null = null;
  private posedRoute: RouteScene | null = null;
  private posedProgress = NaN;
  private posedAtlas = NaN;
  private generation = 0;
  private frame = 0;
  private lastTime = 0;
  private ambientTime = 0;
  private progress = 0;
  private presentedProgress = 0;
  private variant: Variant | null = null;
  private narrow = false;
  private ambientPaused = false;
  private visible = true;
  private disposed = false;
  private manifestAbort: AbortController | null = null;
  private presentationListener: ((progress: number, target: number) => void) | null = null;
  private diagnosticFrames = 0;
  private diagnosticRoute: string | null = null;
  private diagnosticProgress = -1;
  private diagnosticAtlas = -1;
  private inputListener: (() => void) | null = null;
  private atlas = 0;
  private atlasTarget = 0;
  private pointer = new THREE.Vector2(10,10);
  private pointerActive = false;
  private profiler = new FrameProfiler();
  private loading = false;
  private attachmentStarted = 0;
  private firstFramePending = false;
  private preparations: TexturePreparation[] = [];
  private preparedTextures = new WeakSet<THREE.Texture>();
  private pointerMove = (event: PointerEvent) => { this.pointer.set(event.clientX / this.host.clientWidth * 2 - 1, 1 - event.clientY / this.host.clientHeight * 2); this.pointerActive = event.pointerType !== "touch"; };

  constructor(private host: HTMLElement) {
    this.scene.background = new THREE.Color("#b7c5b2");
    this.scene.fog = new THREE.FogExp2("#b7c5b2", .009);
    this.scene.add(this.ambient);
    this.light.position.set(-.65, 1.15, .55).normalize(); this.scene.add(this.light);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = .9;
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    this.renderer.domElement.dataset.stayRenderer = String(++rendererSequence);
    this.host.appendChild(this.renderer.domElement);
    this.resize();
    window.addEventListener("pointermove", this.pointerMove, { passive: true });
  }

  async attach(routeId: string, variant: Variant) {
    this.attachmentStarted = performance.now();
    this.cancelPreparations();
    this.loading = true;
    this.manifestAbort?.abort();
    const token = ++this.generation;
    if (this.variant && this.variant !== variant) {
      this.releaseRoute();
      this.shared.forEach(handle => handle.release()); this.shared.clear();
    }
    this.variant = variant;
    this.renderer.domElement.dataset.stayVariant = variant;
    delete this.renderer.domElement.dataset.stayWorkLoaded;
    delete this.renderer.domElement.dataset.stayWorkAssetError;
    this.manifestAbort = new AbortController();
    const signal = this.manifestAbort.signal;
    const manifest = await fetchJson<SceneManifest>(`/models/stay/v1/${routeId}/${routeId}.scene.json`, signal);
    if (manifest.routeId !== routeId || manifest.schemaVersion !== 1) throw new Error(`${routeId} scene contract mismatch`);
    if (token !== this.generation || this.disposed) throw new Error("Route load cancelled");
    const handles = new Map<string, AssetHandle>();
    const routeHandles: AssetHandle[] = [];
    const newShared: { key: string; handle: AssetHandle }[] = [];
    const group = new THREE.Group();
    const clips: ClipBinding[] = [];
    let water: WaterSurface | null = null;
    let petals: PetalSystem | null = null;
    try {
      // Fetch independent GLBs together. Commit ownership only after every
      // request settles, so a late or failed route cannot pin half a kit.
      const deferred = new Set(routeId === "work" ? ["W03", "W04", "W05", "W06"] : []);
      const assetIds = manifest.assetIds.filter(id => !deferred.has(id) && id !== "G12");
      if (routeId !== "contact" && manifest.instances.some(instance => instance.assetId === "G03")) assetIds.push("G12");
      const settled = await Promise.allSettled(assetIds.map(async id => {
        const key = `${id}.${variant}`;
        const cached = this.shared.get(key);
        return { id, key, handle: cached ?? await this.store.acquire(id, variant), acquired: !cached };
      }));
      const loaded = settled.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
      const failed = settled.find(result => result.status === "rejected");
      if (failed || token !== this.generation || this.disposed) {
        loaded.forEach(item => { if (item.acquired) item.handle.release(); });
        if (failed?.status === "rejected") throw failed.reason;
        throw new Error("Route load cancelled");
      }
      for (const item of loaded) {
        handles.set(item.id, item.handle);

        if (!item.acquired) continue;
        if (item.id.startsWith("G") && Number(item.id.slice(1)) <= 12) newShared.push(item);
        else routeHandles.push(item.handle);
      }
      group.name = `Stay ${routeId}`;
      group.position.set(...manifest.worldOrigin);
      const sway: RouteScene["sway"] = [];
      const objects = new Map<string, THREE.Object3D[]>();
      for (const instance of manifest.instances) {
        if (deferred.has(instance.assetId)) continue;
        const handle = handles.get(instance.assetId);
        if (!handle) throw new Error(`${routeId} instance references unloaded ${instance.assetId}`);
        this.placeInstance(instance, handle, { group, objects, sway, clips, manifest });
      }
      water = new WaterSurface(routeId, variant, objects);
      const petalKit = handles.get("G12");
      if (petalKit) petals = new PetalSystem(routeId, variant, group, objects.get("G03") ?? [], petalKit.root);
      const adapter = routeId === "garden" ? gardenAdapter : routeId === "person" ? personAdapter : routeId === "builder" ? builderAdapter : routeId === "thinker" ? thinkerAdapter : routeId === "leader" ? leaderAdapter : routeAdapters[routeId] ?? routeAdapters.contact!;
      if (routeId === "contact") sway.length = 0;
      // Prepare the incoming shaders against its own light/fog context while
      // the outgoing world remains resident. Upload large textures in bounded
      // batches on the existing scheduler instead of in the first visible draw.
      const preparationScene = new THREE.Scene();
      preparationScene.fog = this.scene.fog?.clone() ?? null;
      const preparationLight = this.light.clone(), preparationAmbient = this.ambient.clone();
      preparationAmbient.intensity = routeId === "stories" ? .3 : .9;
      preparationScene.add(preparationLight, preparationAmbient);
      adapter.evaluate(this.progress, {scene:preparationScene,light:preparationLight,objects});
      const preparationCamera = this.camera.clone();
      sampleCamera(preparationCamera,manifest,this.progress,this.narrow,this.atlas);
      const shaderStarted = performance.now();
      await this.renderer.compileAsync(group, preparationCamera, preparationScene);
      if (token !== this.generation || this.disposed) throw new Error("Route load cancelled");
      this.renderer.domElement.dataset.stayShaderPrepareMs = (performance.now()-shaderStarted).toFixed(2);
      if (!await this.prepareTextures(group,token)) throw new Error("Route load cancelled");
      if (token !== this.generation || this.disposed) throw new Error("Route load cancelled");
      this.releaseRoute();
      this.route = { group, handles: routeHandles, clips, water, petals, sway, manifest, objects, adapter, deferred };
      this.scene.add(group);
      newShared.forEach(item => this.shared.set(item.key, item.handle));
      this.light.color.set("#fff0d6");
      this.ambient.intensity = routeId === "stories" ? .3 : .9;
      this.presentedProgress = this.progress;
      this.loading = false; this.profiler.reset();
      this.firstFramePending = true;
      this.applyProgress(this.presentedProgress);
      this.host.dataset.stayResident = routeId;
      this.renderer.domElement.dataset.stayRoute = routeId;
      this.maybeLoadWork(this.progress);
      this.requestRender();
      return manifest;
    } catch (error) {
      if (token === this.generation) this.loading = false;
      for (const clip of clips) { clip.mixer.stopAllAction(); clip.mixer.uncacheRoot(clip.root); }
      water?.dispose(); petals?.dispose();
      if (this.route?.group === group) this.route = null;
      this.scene.remove(group); group.clear();
      routeHandles.forEach(handle => handle.release());
      newShared.forEach(item => { if (this.shared.get(item.key) === item.handle) this.shared.delete(item.key); item.handle.release(); });
      throw error;
    }
  }

  /** Typography observes the rendered camera; it never changes the rail or scroll. */
  observePresentation(listener: ((progress: number, target: number) => void) | null) {
    this.presentationListener = listener;
  }
  observeInput(listener: (() => void) | null) { this.inputListener = listener; }
  isPresenting(routeId: string) { return !this.loading && this.route?.manifest.routeId === routeId; }
  setAtlas(open: boolean) { this.atlasTarget = open ? 1 : 0; this.requestRender(); }

  setProgress(progress: number) {
    this.progress = clamp(progress);
    this.renderer.domElement.dataset.stayTargetProgress = this.progress.toFixed(3);
    this.maybeLoadWork(this.progress);
    this.requestRender();
  }

  private placeInstance(instance: SceneManifest["instances"][number], handle: AssetHandle,
    route: Pick<RouteScene, "group" | "objects" | "sway" | "clips" | "manifest">) {
    const source = instance.variantNode ? handle.root.getObjectByName(instance.variantNode) : handle.root;
    if (!source) throw new Error(`${instance.assetId} missing instance node ${instance.variantNode}`);
    const placed = new THREE.Group(); placed.name = instance.instanceId;
    placed.position.set(...instance.position);
    placed.rotation.set(...instance.rotation);
    placed.scale.set(...instance.scale);
    const object = source.clone(true);
    placed.add(object); route.group.add(placed);
    if (route.manifest.routeId === "stories" && instance.assetId === "S02") {
      const lantern = new THREE.PointLight("#f6ad5f", this.variant === "mobile" ? 1.8 : 2.6, 4.5, 2);
      lantern.position.set(0, 1.2, 0); placed.add(lantern);
    }
    route.objects.set(instance.assetId, [...route.objects.get(instance.assetId) ?? [], placed]);
    object.traverse(node => {
      if (node.name.includes("SWAY")) route.sway.push({ node, rotation: node.rotation.z, phase: route.sway.length * 1.7 });
    });
    for (const animation of handle.animations) {
      const contract = route.manifest.clips.find(item => item.name === animation.name);
      // A null band is an authored event pose, held at frame zero until an
      // interaction triggers it. It is not a scroll driven clip.
      if (!contract?.progressBand) continue;
      const mixer = new THREE.AnimationMixer(object);
      const action = mixer.clipAction(animation);
      action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.play();
      route.clips.push({ mixer, action, duration: contract.duration, band: contract.progressBand, root: object });
    }
  }

  private maybeLoadWork(progress: number) {
    if (this.loading) return;
    const route = this.route;
    if (route?.manifest.routeId !== "work" || !this.variant) return;
    const thresholds: [string, number][] = [["W03", .18], ["W04", .34], ["W05", .5], ["W06", .66]];
    for (const [id, threshold] of thresholds) {
      if (progress < threshold || !route.deferred.delete(id)) continue;
      const generation = this.generation, variant = this.variant;
      void this.store.acquire(id, variant).then(async handle => {
        if (this.disposed || this.generation !== generation || this.route !== route) { handle.release(); return; }
        const staging = {group:new THREE.Group(),objects:new Map<string,THREE.Object3D[]>(),sway:[] as RouteScene["sway"],clips:[] as ClipBinding[],manifest:route.manifest};
        staging.group.position.copy(route.group.position);
        try {
          for (const instance of route.manifest.instances.filter(item => item.assetId === id)) this.placeInstance(instance, handle, staging);
          await this.renderer.compileAsync(staging.group,this.camera,this.scene);
          if (!await this.prepareTextures(staging.group,generation) || this.disposed || this.generation !== generation || this.route !== route) throw new Error("Station load cancelled");
          route.group.add(...staging.group.children);
          staging.objects.forEach((objects,key)=>route.objects.set(key,[...route.objects.get(key)??[],...objects]));
          route.sway.push(...staging.sway); route.clips.push(...staging.clips);
          route.handles.push(handle);
          this.posedRoute = null;
          this.applyProgress(this.presentedProgress);
          this.renderer.domElement.dataset.stayWorkLoaded = [...new Set([...(this.renderer.domElement.dataset.stayWorkLoaded?.split(",") ?? []), id])].join(",");
          this.requestRender();
        } catch (error) {
          staging.clips.forEach(clip=>{clip.mixer.stopAllAction();clip.mixer.uncacheRoot(clip.root);});
          staging.group.clear(); handle.release();
          if (this.generation === generation && this.route === route) this.renderer.domElement.dataset.stayWorkAssetError = `${id}: ${String(error)}`;
        }
      }).catch(error => { if (this.generation === generation && this.route === route) this.renderer.domElement.dataset.stayWorkAssetError = `${id}: ${String(error)}`; });
    }
  }

  private prepareTextures(group: THREE.Object3D, token: number) {
    if (token !== this.generation || this.disposed) return Promise.resolve(false);
    const textures = new Set<THREE.Texture>();
    group.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        for (const value of Object.values(material)) if (value instanceof THREE.Texture && !this.preparedTextures.has(value)) textures.add(value);
      }
    });
    if (!textures.size) return Promise.resolve(token === this.generation && !this.disposed);
    return new Promise<boolean>(resolve => {
      this.preparations.push({token,textures:[...textures],index:0,milliseconds:0,resolve});
      this.requestRender();
    });
  }
  private advancePreparation() {
    const task = this.preparations[0];
    if (!task) return;
    if (task.token !== this.generation || this.disposed) { this.preparations.shift(); task.resolve(false); return; }
    const start = performance.now();
    let uploaded = 0;
    while (task.index < task.textures.length && uploaded < 2 && performance.now()-start < 4) {
      const texture = task.textures[task.index++]!;
      if (this.preparedTextures.has(texture)) continue;
      this.renderer.initTexture(texture); this.preparedTextures.add(texture); uploaded++;
    }
    task.milliseconds += performance.now()-start;
    if (task.index === task.textures.length) {
      this.preparations.shift();
      this.renderer.domElement.dataset.stayTexturePrepareMs = task.milliseconds.toFixed(2);
      task.resolve(true);
    }
  }
  private cancelPreparations() { this.preparations.splice(0).forEach(task=>task.resolve(false)); }

  private applyProgress(progress: number) {
    const route = this.route;
    if (!route) return;
    if (this.posedRoute === route && this.posedProgress === progress && this.posedAtlas === this.atlas) return;
    this.posedRoute = route; this.posedProgress = progress; this.posedAtlas = this.atlas;
    sampleCamera(this.camera, route.manifest, progress, this.narrow, this.atlas);
    for (const clip of route.clips) {
      const q = clamp((progress - clip.band[0]) / Math.max(.0001, clip.band[1] - clip.band[0]));
      clip.action.enabled = true; clip.action.paused = false;
      clip.mixer.setTime(clip.duration * q);
    }
    route.adapter.evaluate(progress, { scene: this.scene, light: this.light, objects: route.objects });
  }

  resize() {
    if (this.disposed) return;
    const width = Math.max(1, this.host.clientWidth), height = Math.max(1, this.host.clientHeight);
    this.narrow = width < 768 || matchMedia("(pointer: coarse)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    this.renderer.setPixelRatio(saveData ? 1 : Math.min(window.devicePixelRatio || 1, this.narrow ? 1.25 : 1.5));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.posedRoute = null;
    if (!this.loading) this.applyProgress(this.presentedProgress);
    this.requestRender();
  }

  setVisible(value: boolean) { this.visible = value; if (!value) this.stopFrame(); else this.requestRender(); }
  setAmbientPaused(value: boolean) { this.ambientPaused = value; this.requestRender(); }
  requestRender() {
    if (this.disposed || !this.visible || this.frame) return;
    this.frame = requestAnimationFrame(this.tick);
  }
  private tick = (time: number) => {
    this.frame = 0;
    if (this.disposed || !this.visible) return;
    const started = performance.now();
    const interval = this.lastTime ? time - this.lastTime : 0;
    const dt = Math.min(.05, interval / 1000);
    this.lastTime = time;
    this.advancePreparation();
    this.inputListener?.();
    if (!this.ambientPaused && this.route) this.ambientTime += dt;
    // A critically damped presentation layer keeps wheel, touch and keyboard
    // scrolling native while the camera follows with continuous inertia.
    const delta = this.progress - this.presentedProgress;
    this.presentedProgress = Math.abs(delta) > .065 || Math.abs(delta) < .00005 ? this.progress : this.presentedProgress + delta * (1 - Math.exp(-16 * Math.max(dt, 1 / 120)));
    this.atlas += (this.atlasTarget - this.atlas) * (1 - Math.exp(-6 * Math.max(dt, 1 / 120)));
    if (Math.abs(this.atlasTarget - this.atlas) < .0001) this.atlas = this.atlasTarget;
    if (this.route && !this.loading) this.applyProgress(this.presentedProgress);
    if (!this.ambientPaused && (this.route?.petals || this.route?.sway.length)) {
      for (const item of this.route.sway) item.node.rotation.z = item.rotation + Math.sin(this.ambientTime * .48 + item.phase) * .012;
    }
    if (!this.ambientPaused) this.route?.petals?.update(this.ambientTime, this.camera, this.pointer, this.pointerActive);
    if (!this.ambientPaused) this.route?.water?.update(this.ambientTime);
    this.renderer.render(this.scene, this.camera);
    const completed = performance.now();
    const frameCost = completed - started;
    if (this.firstFramePending && !this.loading) {
      this.firstFramePending = false;
      this.renderer.domElement.dataset.stayFirstFrameMs = frameCost.toFixed(2);
      this.renderer.domElement.dataset.stayAttachmentMs = (completed - this.attachmentStarted).toFixed(2);
    }
    this.profiler.record(interval, frameCost);
    if (this.route) this.presentationListener?.(this.presentedProgress, this.progress);
    this.publishDiagnostics();
    if (this.preparations.length || Math.abs(this.atlasTarget - this.atlas) > .0001 || Math.abs(this.progress - this.presentedProgress) > .00005 || (!this.ambientPaused && (this.route?.petals || this.route?.sway.length || this.route?.water?.animated))) this.requestRender();
  };
  private publishDiagnostics() {
    const routeId = this.route?.manifest.routeId ?? null;
    const routeChanged = routeId !== this.diagnosticRoute;
    this.diagnosticRoute = routeId;
    ++this.diagnosticFrames;
    const settledScore = this.presentedProgress === this.progress && this.diagnosticProgress !== this.presentedProgress;
    const settledAtlas = this.atlas === this.atlasTarget && this.diagnosticAtlas !== this.atlas;
    if (!routeChanged && !settledScore && !settledAtlas && this.diagnosticFrames % 12 !== 0) return;
    this.diagnosticProgress = this.presentedProgress; this.diagnosticAtlas = this.atlas;
    const canvas = this.renderer.domElement;
    canvas.dataset.stayProgress = this.presentedProgress.toFixed(3);
    canvas.dataset.stayDrawCalls = String(this.renderer.info.render.calls);
    canvas.dataset.stayTriangles = String(this.renderer.info.render.triangles);
    canvas.dataset.stayAtlas = this.atlas.toFixed(3);
    canvas.dataset.stayEmitters = String(this.route?.petals?.emitterCount ?? 0);
    canvas.dataset.stayPetals = JSON.stringify(this.route?.petals?.diagnostics() ?? {count:0,visible:0,nearCanopy:0,maxPixels:0,zones:[]});
    canvas.dataset.stayScheduler = "single";
    canvas.dataset.stayAmbient = this.ambientPaused ? "paused" : (this.route?.petals || this.route?.sway.length || this.route?.water?.animated) ? "active" : "idle";
    const perf = this.profiler.stats();
    canvas.dataset.stayTiming = JSON.stringify(perf);
    if (routeChanged) canvas.dataset.stayLoads = JSON.stringify(this.store.metrics());
    if (this.diagnosticFrames % 60 === 0 || routeChanged) {
      const textures = new Set<THREE.Texture>();
      this.route?.group.traverse(node => {
        if (!(node instanceof THREE.Mesh)) return;
        for (const material of Array.isArray(node.material)?node.material:[node.material]) {
          for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
        }
      });
      let bytes = 0;
      textures.forEach(texture => { const data=texture.image as {width?:number;height?:number}|undefined; bytes+=(data?.width??0)*(data?.height??0)*4*(texture.generateMipmaps?4/3:1); });
      canvas.dataset.stayTextureBytes = String(Math.round(bytes));
    }
    const camera = this.camera.position;
    canvas.dataset.stayCamera = `${camera.x.toFixed(2)},${camera.y.toFixed(2)},${camera.z.toFixed(2)}`;
    const instances = this.route?.objects.get("G10");
    if (instances) {
      let visibility = "";
      for (let index = 0; index < instances.length; index++) visibility += `${index ? "," : ""}${instances[index]!.visible}`;
      canvas.dataset.stayG10Visible = visibility;
    } else delete canvas.dataset.stayG10Visible;
    const stats = this.stats();
    canvas.dataset.stayResources = `${stats.entries},${stats.references},${stats.roots},${stats.geometries},${stats.textures}`;
  }
  private stopFrame() { cancelAnimationFrame(this.frame); this.frame = 0; this.lastTime = 0; }
  detachRoute() {
    ++this.generation;
    this.cancelPreparations();
    this.manifestAbort?.abort(); this.manifestAbort = null;
    this.loading = false;
    this.releaseRoute();
    delete this.host.dataset.stayResident;
    this.stopFrame();
  }
  private releaseRoute() {
    const route = this.route; this.route = null;
    this.posedRoute = null;
    if (!route) return;
    for (const clip of route.clips) { clip.mixer.stopAllAction(); clip.mixer.uncacheRoot(clip.root); }
    route.water?.dispose(); route.petals?.dispose();
    this.scene.remove(route.group); route.group.clear();
    route.handles.forEach(handle => handle.release());
  }
  stats() { return { ...this.store.stats(), roots: this.route ? 1 : 0, frame: this.frame ? 1 : 0, geometries: this.renderer.info.memory.geometries, textures: this.renderer.info.memory.textures }; }
  dispose() {
    if (this.disposed) return;
    ++this.generation; this.detachRoute(); this.stopFrame();
    this.shared.forEach(handle => handle.release()); this.shared.clear();
    window.removeEventListener("pointermove", this.pointerMove); this.store.dispose(); this.renderer.dispose(); this.renderer.domElement.remove(); this.disposed = true;
  }
}
