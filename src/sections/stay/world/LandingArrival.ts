import * as THREE from "three";
import { getEntryHandoff } from "@/lib/entry-handoff";
import type { SceneManifest } from "./types";

/** Temporary render pose, restored immediately after each frame. This never
 * writes to the authored camera rail, scroll progress, or narrative score. */
export class LandingArrival {
  private position = new THREE.Vector3();
  private rotation = new THREE.Quaternion();
  private active = false;
  apply(camera: THREE.PerspectiveCamera, manifest: SceneManifest | undefined) {
    const entry = getEntryHandoff();
    this.active = Boolean(entry?.destination === "stay" && !entry.reduced && manifest?.routeId === "garden");
    if (!this.active || !entry || !manifest) return;
    this.position.copy(camera.position); this.rotation.copy(camera.quaternion);
    const knot = manifest.cameraKnots[0]!;
    const depth = Math.hypot(...knot.start.map((n, i) => n - knot.look[i]!) as [number, number, number]);
    const anticipation = 1 - entry.arrival;
    const unitsPerPixel = 2 * depth * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / window.innerHeight;
    camera.translateZ(depth * .008 * anticipation);
    camera.translateY(-6 * unitsPerPixel * anticipation);
    camera.rotateY(THREE.MathUtils.degToRad(.35) * anticipation);
    camera.updateMatrixWorld();
  }
  restore(camera: THREE.PerspectiveCamera) {
    if (!this.active) return;
    camera.position.copy(this.position); camera.quaternion.copy(this.rotation);
    camera.updateMatrixWorld(); this.active = false;
  }
}
