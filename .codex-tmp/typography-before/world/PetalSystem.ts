import * as THREE from "three";
import type { AssetHandle } from "./AssetStore";
import type { SceneManifest, Variant } from "./types";

const fraction = (value: number) => value - Math.floor(value);
const densities: Record<string, [number, number]> = {
  garden: [14, 3], person: [4, 1], builder: [2, 1], thinker: [1, 0],
  leader: [2, 1], stories: [5, 1], work: [1, 0], future: [1, 0], aura: [1, 0],
};
export const needsPetals = (routeId: string) => (densities[routeId]?.[0] ?? 0) > 0;

/** The authored G12 mesh supplies the petal; one draw call supplies the air. */
export class PetalSystem {
  private readonly mesh: THREE.InstancedMesh;
  private readonly transform = new THREE.Object3D();
  private readonly projectedPoint = new THREE.Vector3();
  private readonly count: number;
  private readonly nearZ: number;
  private readonly farZ: number;
  private readonly materials: THREE.Material[];
  private pointer = new THREE.Vector2(3, 3);
  private pointerVelocity = new THREE.Vector2();
  private pointerAt = -100;
  private lastPointer = new THREE.Vector2(3, 3);

  constructor(handle: AssetHandle, variant: Variant, private readonly parent: THREE.Group, manifest: SceneManifest) {
    let source: THREE.Mesh | null = null;
    handle.root.traverse(node => { if (!source && node instanceof THREE.Mesh) source = node; });
    if (!source) throw new Error("G12 has no petal geometry");
    const petal = source as THREE.Mesh;
    this.count = densities[manifest.routeId]?.[variant === "mobile" ? 1 : 0] ?? 0;
    const rail = manifest.cameraKnots.flatMap(knot => [knot.start[2], knot.end[2]]);
    this.nearZ = Math.max(...rail) + 1.1;
    this.farZ = Math.min(...rail) - 2.8;
    this.materials = (Array.isArray(petal.material) ? petal.material : [petal.material]).map(material => {
      const copy = material.clone();
      copy.transparent = true;
      copy.opacity = .84;
      return copy;
    });
    this.mesh = new THREE.InstancedMesh(petal.geometry, this.materials, this.count);
    this.mesh.name = `SA_G12_RUNTIME_PETALS_${manifest.routeId}`;
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const colors = ["#fff5ee", "#f4dedb", "#f7e4e5", "#eecdd1"];
    for (let index = 0; index < this.count; index++) this.mesh.setColorAt(index, new THREE.Color(colors[index % colors.length]!));
    this.parent.add(this.mesh);
    this.evaluate(0, 0);
  }

  pointerMove(clientX: number, clientY: number, width: number, height: number) {
    const x = clientX / width * 2 - 1, y = 1 - clientY / height * 2;
    const dx = x - this.lastPointer.x, dy = y - this.lastPointer.y;
    const speed = Math.hypot(dx, dy);
    this.pointer.set(x, y);
    this.pointerVelocity.set(dx, dy);
    if (this.lastPointer.x === 3) this.pointerVelocity.set(0, 0);
    else if (speed > .001) this.pointerVelocity.multiplyScalar(Math.min(.45, speed * 3.5) / speed);
    this.lastPointer.copy(this.pointer);
    this.pointerAt = performance.now() / 1000;
  }

  evaluate(progress: number, time: number, camera?: THREE.Camera) {
    this.mesh.visible = progress >= (this.parent.name === "Stay garden" ? .12 : .08) && this.count > 0;
    if (!this.mesh.visible) return;
    const impulse = Math.exp(-Math.max(0, performance.now() / 1000 - this.pointerAt) * 2.2);
    for (let index = 0; index < this.count; index++) {
      const a = index === 0 ? .5 : fraction(index * .61803398875);
      const b = fraction(index * .41421356237);
      const phase = index * 2.4;
      const drift = fraction(time / (17 + index % 13) + b);
      const depth = fraction(index * .754877666);
      const depthBand = index === 0 ? .9 : .08 + depth * .62;
      const z = THREE.MathUtils.lerp(this.farZ, this.nearZ, depthBand);
      const gust = Math.pow(Math.max(0, Math.sin(time * .16 + phase * .71)), 8) * .18;
      this.transform.position.set(
        -5.4 + 10.8 * a + Math.sin(time * .24 + phase) * .26 + Math.sin(time * .09 + phase * .43) * gust,
        .55 + (1 - drift) * 3.2 + Math.cos(time * .16 + phase) * .08 + gust * .18,
        z + Math.cos(time * .13 + phase) * .17,
      );
      if (camera && impulse > .005) {
        this.projectedPoint.copy(this.transform.position).add(this.parent.position).project(camera);
        const dx = this.projectedPoint.x - this.pointer.x, dy = this.projectedPoint.y - this.pointer.y;
        const proximity = Math.max(0, 1 - Math.hypot(dx, dy) / .33);
        const strength = proximity * proximity * impulse * .14;
        this.transform.position.x += this.pointerVelocity.x * strength;
        this.transform.position.y += this.pointerVelocity.y * strength;
      }
      this.transform.rotation.set(.15 + Math.sin(time * .29 + phase) * .13, time * (.08 + b * .05) + phase, .2 + Math.sin(time * .21 + index) * .17);
      const scale = index === 0 ? .78 : .44 + .22 * fraction(index * .732);
      this.transform.scale.setScalar(scale);
      this.transform.updateMatrix();
      this.mesh.setMatrixAt(index, this.transform.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() { this.parent.remove(this.mesh); this.mesh.dispose(); this.materials.forEach(material => material.dispose()); }
}
