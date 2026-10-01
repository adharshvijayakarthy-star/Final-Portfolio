import * as THREE from "three";
import type { Variant } from "./types";

const density: Record<string, number> = { garden: 8, person: 5, builder: 2, thinker: 2, leader: 4, stories: 6, work: 3, future: 3, aura: 4, contact: 0 };
const seed = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** Each emission zone is an actual authored blossom canopy. G12 is instanced
 * once; typed state and the world's scheduler own the small air disturbance. */
export class PetalSystem {
  private mesh: THREE.InstancedMesh | null = null;
  private seeds = new Float32Array(0);
  private air = new Float32Array(0);
  private object = new THREE.Object3D();
  private point = new THREE.Vector3();
  private projected = new THREE.Vector3();
  private lastPointer = new THREE.Vector2(10, 10);
  private pointerEnergy = 0;
  private previousTime = 0;
  private visible = 0;
  private nearCanopy = 0;
  private maximumPixels = 0;
  private projectedSamples = new Float32Array(18);
  private shape: number[] = [];
  private zones: { min: number[]; max: number[] }[] = [];
  readonly emitterCount: number;
  constructor(routeId: string, variant: Variant, group: THREE.Group, trees: THREE.Object3D[], kit: THREE.Object3D) {
    const anchors: THREE.Vector3[] = [];
    const routeDensity = density[routeId] ?? 0;
    const perTree = routeDensity ? variant === "mobile" ? Math.max(1, Math.ceil(routeDensity * .45)) : routeDensity : 0;
    group.updateMatrixWorld(true);
    const inverse = group.matrixWorld.clone().invert();
    for (const tree of trees) {
      if (!perTree) break;
      const blossoms: THREE.Mesh[] = [];
      tree.traverse(node => {
        if (!(node instanceof THREE.Mesh)) return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        if (materials.some(material => material.name === "SA_M_SAKURA")) blossoms.push(node);
      });
      if (!blossoms.length) continue;
      const bounds = new THREE.Box3();
      blossoms.forEach(blossom => bounds.union(new THREE.Box3().setFromObject(blossom)));
      bounds.applyMatrix4(inverse);
      this.zones.push({ min: bounds.min.toArray(), max: bounds.max.toArray() });
      const upperCanopy = bounds.min.y + (bounds.max.y - bounds.min.y) * .45;
      for (let i = 0; i < perTree && anchors.length < (variant === "mobile" ? 24 : 64); i++) {
        const candidate = new THREE.Vector3(), exposed = new THREE.Vector3();
        let best = -Infinity;
        // Release from the exposed face of the actual blossom canopy.
        for (let attempt = 0; attempt < 48; attempt++) {
          const blossom = blossoms[Math.floor(seed(anchors.length + attempt * 7 + 19) * blossoms.length)]!;
          const vertices = blossom.geometry.getAttribute("position");
          if (!vertices) continue;
          const vertex = Math.floor(seed(anchors.length * 37 + attempt * 13 + 7) * vertices.count);
          candidate.fromBufferAttribute(vertices, vertex).applyMatrix4(blossom.matrixWorld).applyMatrix4(inverse);
          const score = candidate.z + (candidate.y >= upperCanopy ? 100 : 0);
          if (score > best) { best = score; exposed.copy(candidate); }
        }
        if (best !== -Infinity) anchors.push(exposed.clone());
      }
    }
    this.emitterCount = this.zones.length;
    let source: THREE.Mesh | null = null;
    kit.updateMatrixWorld(true);
    kit.traverse(node => { if (!source && node instanceof THREE.Mesh && node.geometry.getAttribute("position")) source = node; });
    const selected = source as THREE.Mesh | null;
    if (!selected || !anchors.length) return;
    // G12 POSITION is quantized Int16. Transforming that buffer in place rounds
    // metre-sized coordinates to zero. Expand only the runtime clone first.
    const positions = selected.geometry.getAttribute("position");
    const coordinates = new Float32Array(positions.count * 3);
    for (let i=0;i<positions.count;i++) { coordinates[i*3]=positions.getX(i); coordinates[i*3+1]=positions.getY(i); coordinates[i*3+2]=positions.getZ(i); }
    const geometry = selected.geometry.clone();
    geometry.setAttribute("position",new THREE.BufferAttribute(coordinates,3));
    geometry.applyMatrix4(selected.matrixWorld);
    geometry.computeBoundingBox(); geometry.center();
    const size = new THREE.Vector3(); geometry.boundingBox!.getSize(size);
    const extent = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(extent) || extent <= 0) { geometry.dispose(); return; }
    geometry.scale(1 / extent, 1 / extent, 1 / extent);
    this.shape = [size.x/extent,size.y/extent,size.z/extent];
    const material = new THREE.MeshBasicMaterial({ color: "#ffd1df", side: THREE.DoubleSide, toneMapped: false, depthWrite: false });
    this.mesh = new THREE.InstancedMesh(geometry, material, anchors.length);
    this.mesh.name = "Stay canopy petals"; this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.seeds = new Float32Array(anchors.length * 8);
    this.air = new Float32Array(anchors.length * 6);
    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i]!;
      const phase = ((i % perTree) + seed(i + 3) * .6) / perTree;
      const layer = i % 24 === 0 ? 2 : i % 3 === 0 ? 0 : 1;
      this.seeds.set([anchor.x, anchor.y, anchor.z, phase, seed(i + 39), seed(i + 85), layer, perTree], i * 8);
    }
    group.add(this.mesh);
  }
  update(time: number, camera: THREE.Camera, pointer: THREE.Vector2, pointerActive: boolean) {
    if (!this.mesh) return;
    const dt = Math.min(.05, Math.max(0, time - this.previousTime)); this.previousTime = time;
    const moving = pointerActive && pointer.distanceToSquared(this.lastPointer) > .000002;
    this.pointerEnergy = moving ? 1 : Math.max(0, this.pointerEnergy - dt * 3);
    this.lastPointer.copy(pointer);
    camera.updateMatrixWorld();
    const axes = camera.matrixWorld.elements, projection = camera.projectionMatrix.elements[5]!, height = window.innerHeight;
    this.visible = 0; this.nearCanopy = 0; this.maximumPixels = 0;
    for (let i = 0; i < this.mesh.count; i++) {
      const k = i * 8, a = i * 6, phase = this.seeds[k + 3]!, wind = this.seeds[k + 4]!, turn = this.seeds[k + 5]!, layer = this.seeds[k + 6]!;
      const life = (layer === 0 ? 18 : layer === 2 ? 11 : 14) + wind * 4;
      const age = (time + phase * life) % life, q = age / life;
      if (q < .01) for (let axis = 0; axis < 6; axis++) this.air[a + axis] = 0;
      this.point.set(this.seeds[k]! + Math.sin(age * .55 + wind * 6) * q * .5 + q * (wind - .5) * 1.4,
        this.seeds[k + 1]! - (.18 * q + .82 * q * q) * (this.seeds[k + 1]! + .12),
        this.seeds[k + 2]! + q * .9 + Math.sin(age * .42 + phase * 6) * q * .25);
      this.projected.copy(this.point).applyMatrix4(this.mesh.parent!.matrixWorld).project(camera);
      const dx = this.projected.x - pointer.x, dy = this.projected.y - pointer.y, d2 = dx * dx + dy * dy;
      const force = pointerActive && this.pointerEnergy > 0 && this.projected.z > -1 && this.projected.z < 1 && d2 < .025
        ? (1 - d2 / .025) * this.pointerEnergy * .45 * dt / Math.max(.025, Math.sqrt(d2)) : 0;
      for (let axis = 0; axis < 3; axis++) {
        const velocity = Math.max(-.18, Math.min(.18, this.air[a + 3 + axis]! + (axes[axis]! * dx + axes[4 + axis]! * dy) * force));
        this.air[a + 3 + axis] = velocity * Math.exp(-dt * 3);
        this.air[a + axis] = (this.air[a + axis]! + velocity * dt) * Math.exp(-dt * 1.8);
      }
      this.point.x += this.air[a]!; this.point.y += this.air[a + 1]!; this.point.z += this.air[a + 2]!;
      this.projected.copy(this.point).applyMatrix4(this.mesh.parent!.matrixWorld);
      const distance = Math.max(.5, this.projected.distanceTo(camera.position));
      const naturalSize = layer === 0 ? .065 + turn * .018 : layer === 2 ? .125 : .085 + turn * .025;
      const scale = Math.min(naturalSize, 9 * distance / (height * projection * .5)) * Math.min(1, age * 3, (life - age) * 3);
      this.projected.project(camera);
      if (i < 6) { this.projectedSamples[i*3]=this.projected.x; this.projectedSamples[i*3+1]=this.projected.y; this.projectedSamples[i*3+2]=this.projected.z; }
      if (Math.abs(this.projected.x) < 1 && Math.abs(this.projected.y) < 1 && Math.abs(this.projected.z) < 1 && scale > .01) {
        this.visible++; if (q < .25) this.nearCanopy++;
        this.maximumPixels = Math.max(this.maximumPixels, scale * height * projection * .5 / distance);
      }
      this.object.position.copy(this.point);
      this.object.rotation.set(age * .7 + turn * 6, age * .31, Math.sin(age * .9 + phase * 6) * .65);
      this.object.scale.setScalar(scale); this.object.updateMatrix(); this.mesh.setMatrixAt(i, this.object.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  diagnostics() { return { count: this.mesh?.count ?? 0, visible: this.visible, nearCanopy: this.nearCanopy, maxPixels: Number(this.maximumPixels.toFixed(2)), shape:this.shape, samples:Array.from(this.projectedSamples), zones: this.zones }; }
  dispose() {
    if (!this.mesh) return;
    this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose(); this.mesh.dispose(); this.mesh = null;
  }
}
