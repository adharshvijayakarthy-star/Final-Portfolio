import * as THREE from "three";
import type { SceneManifest, Vec3 } from "./types";

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const position = new THREE.Vector3();
const endPosition = new THREE.Vector3();
const look = new THREE.Vector3();
const endLook = new THREE.Vector3();
const origin = new THREE.Vector3();

/** Samples the authored rail continuously. The runtime damps the progress that reaches this sampler. */
export function sampleCamera(camera: THREE.PerspectiveCamera, manifest: SceneManifest, progress: number, narrow: boolean) {
  const knots = manifest.cameraKnots;
  const found = knots.findIndex(knot => progress < knot.band[1]);
  const index = found < 0 ? knots.length - 1 : found;
  const knot = knots[Math.min(index, knots.length - 1)];
  if (!knot) return;
  const prior = knots[Math.max(0, index - 1)] ?? knot;
  const local = clamp((progress - knot.band[0]) / Math.max(.0001, knot.band[1] - knot.band[0]));
  // The former / .35 reached every destination pose in the first third of its
  // band, then held still until the next band. That was the visible waypoint
  // jump when scrolling slowly. Traverse the entire authored band instead.
  const eased = smooth(local);
  position.set(...knot.start).lerp(endPosition.set(...knot.end), eased);
  look.set(...prior.look).lerp(endLook.set(...knot.look), eased);
  if (manifest.routeId === "work") {
    // The authored station targets are sometimes less than a metre ahead of
    // the travelling camera. Preserve their lateral aim while keeping enough
    // forward distance to avoid whipping into a tabletop on station entry.
    look.z = Math.min(look.z, position.z - 4.5);
    look.x = position.x + THREE.MathUtils.clamp(look.x - position.x, -2.2, 2.2);
  }
  if (narrow) {
    position.x *= .35; look.x *= .35;
    position.z += manifest.routeId === "builder" ? 1.5 : 1;
    if (manifest.routeId === "builder") position.y = 1.7;
    if (manifest.routeId === "garden") position.y = Math.max(1.2, position.y);
    if (manifest.routeId === "thinker") { position.x = 1.2; position.y = 1.6; }
  }
  origin.set(...manifest.worldOrigin);
  camera.position.copy(position.add(origin));
  camera.lookAt(look.add(origin));
  camera.rotation.z = 0;
  camera.fov = narrow ? 52 : manifest.camera.fov;
  camera.near = manifest.camera.near; camera.far = manifest.camera.far;
  camera.updateProjectionMatrix();
}
