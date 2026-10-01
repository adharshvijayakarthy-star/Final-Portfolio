import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import type { Variant } from "./types";

/** A small planar reflection on the delivered pond, with no source-asset edit. */
export class WaterSurface {
  private mirror: Reflector | null = null;
  constructor(routeId: string, variant: Variant, objects: Map<string, THREE.Object3D[]>) {
    if (routeId !== "thinker" || variant === "mobile") return;
    const placed = objects.get("G07")?.[0];
    if (!placed) return;
    const mirror = new Reflector(new THREE.PlaneGeometry(11.96, 9.96), {
      clipBias: .002,
      textureWidth: 512,
      textureHeight: 512,
      color: new THREE.Color("#8ca8a3"),
      multisample: 0,
    });
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.y = .018;
    mirror.name = "Stay thinker pond reflection";
    placed.add(mirror);
    this.mirror = mirror;
  }
  dispose() {
    if (!this.mirror) return;
    this.mirror.parent?.remove(this.mirror);
    this.mirror.getRenderTarget().dispose();
    this.mirror.geometry.dispose();
    for (const material of Array.isArray(this.mirror.material) ? this.mirror.material : [this.mirror.material]) material.dispose();
    this.mirror = null;
  }
}
