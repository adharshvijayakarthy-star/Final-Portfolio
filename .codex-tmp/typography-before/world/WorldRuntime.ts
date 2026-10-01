import * as THREE from "three";
import { AssetStore, type AssetHandle } from "./AssetStore";
import { PetalSystem, needsPetals } from "./PetalSystem";
import { GardenVegetation } from "./GardenVegetation";
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
type RouteScene = { group: THREE.Group; handles: AssetHandle[]; clips: ClipBinding[]; petals: PetalSystem | null; vegetation: GardenVegetation | null; water: WaterSurface | null; sway: { node: THREE.Object3D; rotation: number; phase: number }[]; manifest: SceneManifest; objects: Map<string, THREE.Object3D[]>; adapter: RouteAdapter; deferred: Set<string> };
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
  private readonly treatedMaterials = new WeakSet<THREE.Material>();
  private readonly treatedGeometry = new WeakSet<THREE.BufferGeometry>();
  private route: RouteScene | null = null;
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
  private diagnosticFrames = 0;
  private diagnosticRoute: string | null = null;

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
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    this.resize();
  }

  async attach(routeId: string, variant: Variant) {
    this.detachRoute();
    const token = ++this.generation;
    if (this.variant && this.variant !== variant) {
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
    let petals: PetalSystem | null = null;
    let vegetation: GardenVegetation | null = null;
    let water: WaterSurface | null = null;
    try {
      // Fetch independent GLBs together. Commit ownership only after every
      // request settles, so a late or failed route cannot pin half a kit.
      // G12 is a shared shape with route-specific runtime density. It has no
      // authored scene instance and does not change any scene manifest.
      const deferred = new Set(routeId === "work" ? ["W03", "W04", "W05", "W06"] : []);
      const firstAssets = manifest.assetIds.filter(id => !deferred.has(id));
      const assetIds = needsPetals(routeId) ? [...firstAssets, "G12"] : firstAssets;
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
        this.treatMaterials(item.handle.root, item.id);
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
      vegetation = new GardenVegetation(routeId, variant, group, objects);
      water = new WaterSurface(routeId, variant, objects);
      if (needsPetals(routeId)) petals = new PetalSystem(handles.get("G12")!, variant, group, manifest);
      const adapter = routeId === "garden" ? gardenAdapter : routeId === "person" ? personAdapter : routeId === "builder" ? builderAdapter : routeId === "thinker" ? thinkerAdapter : routeId === "leader" ? leaderAdapter : routeAdapters[routeId] ?? routeAdapters.contact!;
      this.route = { group, handles: routeHandles, clips, petals, vegetation, water, sway, manifest, objects, adapter, deferred };
      this.scene.add(group);
      newShared.forEach(item => this.shared.set(item.key, item.handle));
      this.light.color.set("#fff0d6");
      this.ambient.intensity = routeId === "stories" ? .3 : .9;
      this.presentedProgress = this.progress;
      this.applyProgress(this.presentedProgress);
      this.maybeLoadWork(this.progress);
      return manifest;
    } catch (error) {
      for (const clip of clips) { clip.mixer.stopAllAction(); clip.mixer.uncacheRoot(clip.root); }
      petals?.dispose();
      vegetation?.dispose();
      water?.dispose();
      if (this.route?.group === group) this.route = null;
      this.scene.remove(group); group.clear();
      routeHandles.forEach(handle => handle.release());
      newShared.forEach(item => { if (this.shared.get(item.key) === item.handle) this.shared.delete(item.key); item.handle.release(); });
      throw error;
    }
  }

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
    const route = this.route;
    if (route?.manifest.routeId !== "work" || !this.variant) return;
    const thresholds: [string, number][] = [["W03", .18], ["W04", .34], ["W05", .5], ["W06", .66]];
    for (const [id, threshold] of thresholds) {
      if (progress < threshold || !route.deferred.delete(id)) continue;
      const generation = this.generation, variant = this.variant;
      void this.store.acquire(id, variant).then(handle => {
        if (this.disposed || this.generation !== generation || this.route !== route) { handle.release(); return; }
        try {
          this.treatMaterials(handle.root, id);
          for (const instance of route.manifest.instances.filter(item => item.assetId === id)) this.placeInstance(instance, handle, route);
          route.handles.push(handle);
          this.applyProgress(this.presentedProgress);
          this.renderer.domElement.dataset.stayWorkLoaded = [...new Set([...(this.renderer.domElement.dataset.stayWorkLoaded?.split(",") ?? []), id])].join(",");
          this.requestRender();
        } catch (error) {
          handle.release(); this.renderer.domElement.dataset.stayWorkAssetError = `${id}: ${String(error)}`;
        }
      }).catch(error => { this.renderer.domElement.dataset.stayWorkAssetError = `${id}: ${String(error)}`; });
    }
  }

  private applyProgress(progress: number) {
    const route = this.route;
    if (!route) return;
    sampleCamera(this.camera, route.manifest, progress, this.narrow);
    for (const clip of route.clips) {
      const q = clamp((progress - clip.band[0]) / Math.max(.0001, clip.band[1] - clip.band[0]));
      clip.action.reset(); clip.action.play(); clip.mixer.setTime(clip.duration * q);
    }
    route.adapter.evaluate(progress, { scene: this.scene, light: this.light, objects: route.objects });
  }

  private onPointerMove = (event: PointerEvent) => {
    this.route?.petals?.pointerMove(event.clientX, event.clientY, window.innerWidth, window.innerHeight);
    if (this.route?.petals) this.requestRender();
  };

  private treatMaterials(root: THREE.Object3D, assetId: string) {
    const palette: Record<string, string> = {
      SA_M_MOSS: "#628052", SA_M_LEAF: "#49693f", SA_M_DISTANT: "#597252",
      SA_M_BARK: "#6f543d", SA_M_STONE: "#877e6d", SA_M_SAKURA: "#dca9b0",
      SA_M_WATER: "#709b99", SA_M_CLAY: "#957d62", SA_M_PAPER: "#e1d1b3",
    };
    root.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        if (material instanceof THREE.MeshStandardMaterial) this.treatGeometry(node.geometry, material.name);
        if (this.treatedMaterials.has(material)) continue;
        this.treatedMaterials.add(material);
        if (!(material instanceof THREE.MeshStandardMaterial)) continue;
        const tint = palette[material.name];
        if (tint) material.color.lerp(new THREE.Color(tint), material.name === "SA_M_BARK" ? .7 : .48);
        if (assetId === "S02" && material.name === "SA_M_LIGHT") {
          material.emissive.set("#ffce88"); material.emissiveIntensity = 2.2;
        }
        if (assetId === "S02" && material.name === "SA_M_PAPER") {
          material.emissive.set("#ffdcb2"); material.emissiveIntensity = .54;
        }
        if (["SA_M_MOSS", "SA_M_STONE", "SA_M_BARK", "SA_M_CLAY"].includes(material.name)) {
          const texture = this.surfaceTexture(material.name);
          material.map = texture;
          material.roughnessMap = texture;
        }
        if (material.name === "SA_M_BARK") material.roughness = .89;
        if (material.name === "SA_M_STONE") material.roughness = .96;
        if (material.name === "SA_M_WATER") { material.roughness = .24; material.metalness = .08; }
        material.needsUpdate = true;
      }
    });
  }

  private treatGeometry(geometry: THREE.BufferGeometry, materialName: string) {
    if (this.treatedGeometry.has(geometry)) return;
    this.treatedGeometry.add(geometry);
    const positions = geometry.getAttribute("position"), colors = geometry.getAttribute("color");
    if (positions && ["SA_M_MOSS", "SA_M_STONE", "SA_M_BARK", "SA_M_CLAY"].includes(materialName) && !geometry.getAttribute("uv")) {
      const uv = new Float32Array(positions.count * 2);
      const density = materialName === "SA_M_BARK" ? .46 : materialName === "SA_M_STONE" ? .8 : .26;
      for (let index = 0; index < positions.count; index++) {
        uv[index * 2] = positions.getX(index) * density;
        uv[index * 2 + 1] = (materialName === "SA_M_BARK" ? positions.getY(index) : positions.getZ(index)) * density;
      }
      geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    }
    if (!["SA_M_MOSS", "SA_M_STONE", "SA_M_BARK"].includes(materialName)) return;
    if (!positions || !colors || colors.itemSize < 3) return;
    const noise = (x: number, z: number) => {
      const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
      const hash = (a: number, b: number) => {
        const value = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
        return value - Math.floor(value);
      };
      const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
      return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix, iz), hash(ix + 1, iz), sx), THREE.MathUtils.lerp(hash(ix, iz + 1), hash(ix + 1, iz + 1), sx), sz);
    };
    const values = new Float32Array(colors.count * 3);
    for (let index = 0; index < colors.count; index++) {
      const x = positions.getX(index), z = positions.getZ(index);
      const broad = noise(x * .18, z * .18), fine = noise(x * .82, z * .82);
      const variation = materialName === "SA_M_MOSS" ? .78 + broad * .31 + fine * .1 : .91 + broad * .15 + fine * .05;
      const warmth = materialName === "SA_M_MOSS" ? (1 - broad) * .1 : 0;
      values[index * 3] = Math.min(1, colors.getX(index) * variation * (1 + warmth));
      values[index * 3 + 1] = Math.min(1, colors.getY(index) * variation * (1 - warmth * .4));
      values[index * 3 + 2] = Math.min(1, colors.getZ(index) * variation * (1 - warmth));
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(values, 3));
  }

  private surfaceTexture(materialName: string) {
    const size = 96, data = new Uint8Array(size * size * 4);
    const hash = (x: number, y: number) => {
      const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return value - Math.floor(value);
    };
    const noise = (x: number, y: number) => {
      const px = Math.floor(x), py = Math.floor(y), fx = x - px, fy = y - py;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(px, py), hash(px + 1, py), sx),
        THREE.MathUtils.lerp(hash(px, py + 1), hash(px + 1, py + 1), sx), sy);
    };
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const stretchedY = materialName === "SA_M_BARK" ? y * .22 : y;
      const broad = noise(x / 17, stretchedY / 17), detail = noise(x / 3.7, stretchedY / 3.7);
      const value = Math.round(216 + broad * 28 + detail * 11);
      const offset = (y * size + x) * 4;
      data[offset] = value; data[offset + 1] = value; data[offset + 2] = value; data[offset + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
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
    this.applyProgress(this.presentedProgress);
    this.requestRender();
  }

  setVisible(value: boolean) { this.visible = value; if (!value) this.stopFrame(); else this.requestRender(); }
  setAmbientPaused(value: boolean) { this.ambientPaused = value; if (value) this.stopFrame(); else this.requestRender(); }
  requestRender() {
    if (this.disposed || !this.visible || this.frame) return;
    this.frame = requestAnimationFrame(this.tick);
  }
  private tick = (time: number) => {
    this.frame = 0;
    if (this.disposed || !this.visible) return;
    const dt = this.lastTime ? Math.min(.05, (time - this.lastTime) / 1000) : 0;
    this.lastTime = time;
    if (!this.ambientPaused && (this.route?.sway.length || this.route?.petals)) this.ambientTime += dt;
    // A critically damped presentation layer keeps wheel, touch and keyboard
    // scrolling native while the camera follows with continuous inertia.
    const delta = this.progress - this.presentedProgress;
    this.presentedProgress = Math.abs(delta) < .00005 ? this.progress : this.presentedProgress + delta * (1 - Math.exp(-5.5 * Math.max(dt, 1 / 120)));
    if (this.route) this.applyProgress(this.presentedProgress);
    if (!this.ambientPaused && this.route?.sway.length) {
      for (const item of this.route.sway) item.node.rotation.z = item.rotation + Math.sin(this.ambientTime * .48 + item.phase) * .012;
    }
    if (!this.ambientPaused && this.route?.petals) this.route.petals.evaluate(this.presentedProgress, this.ambientTime, this.camera);
    this.renderer.render(this.scene, this.camera);
    this.publishDiagnostics();
    if (Math.abs(this.progress - this.presentedProgress) > .00005 || (!this.ambientPaused && (this.route?.sway.length || this.route?.petals))) this.requestRender();
  };
  private publishDiagnostics() {
    const routeId = this.route?.manifest.routeId ?? null;
    const routeChanged = routeId !== this.diagnosticRoute;
    this.diagnosticRoute = routeId;
    if (!routeChanged && ++this.diagnosticFrames % 12 !== 0) return;
    const canvas = this.renderer.domElement;
    canvas.dataset.stayProgress = this.presentedProgress.toFixed(3);
    canvas.dataset.stayDrawCalls = String(this.renderer.info.render.calls);
    canvas.dataset.stayTriangles = String(this.renderer.info.render.triangles);
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
    this.manifestAbort?.abort(); this.manifestAbort = null;
    const route = this.route; this.route = null;
    if (!route) return;
    for (const clip of route.clips) { clip.mixer.stopAllAction(); clip.mixer.uncacheRoot(clip.root); }
    route.petals?.dispose();
    route.vegetation?.dispose();
    route.water?.dispose();
    this.scene.remove(route.group); route.group.clear();
    route.handles.forEach(handle => handle.release());
    this.stopFrame();
  }
  stats() { return { ...this.store.stats(), roots: this.route ? 1 : 0, frame: this.frame ? 1 : 0, geometries: this.renderer.info.memory.geometries, textures: this.renderer.info.memory.textures }; }
  dispose() {
    if (this.disposed) return;
    ++this.generation; this.detachRoute(); this.stopFrame();
    window.removeEventListener("pointermove", this.onPointerMove);
    this.shared.forEach(handle => handle.release()); this.shared.clear();
    this.store.dispose(); this.renderer.dispose(); this.renderer.domElement.remove(); this.disposed = true;
  }
}
