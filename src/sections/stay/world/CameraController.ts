import * as THREE from "three";
import type { SceneManifest, Vec3 } from "./types";
import { clamp, cameraScore } from "./narrative-score";

type Rail = { times: number[]; positions: Vec3[]; targets: Vec3[]; positionSlopes: Vec3[]; targetSlopes: Vec3[]; bands: { from: number; to: number }[] };
const rails = new WeakMap<SceneManifest, Rail>();
const position = new THREE.Vector3(), look = new THREE.Vector3(), origin = new THREE.Vector3();
const overheadPosition = new THREE.Vector3(0,24,4), overheadLook = new THREE.Vector3(0,0,-7);

/** Monotone nonuniform Hermite slopes: velocity is shared at each knot, while
 * each coordinate stays inside authored endpoints rather than cutting corners. */
function slopes(times: number[], points: Vec3[]) {
  return points.map((_, i) => [0, 1, 2].map(axis => {
    const a = axis as 0 | 1 | 2;
    if (!i) return (points[1]![a] - points[0]![a]) / (times[1]! - times[0]!);
    if (i === points.length - 1) return (points[i]![a] - points[i - 1]![a]) / (times[i]! - times[i - 1]!);
    const h0 = times[i]! - times[i - 1]!, h1 = times[i + 1]! - times[i]!;
    const d0 = (points[i]![a] - points[i - 1]![a]) / h0;
    const d1 = (points[i + 1]![a] - points[i]![a]) / h1;
    if (d0 * d1 <= 0) return 0;
    const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0;
    return (w0 + w1) / (w0 / d0 + w1 / d1);
  }) as Vec3);
}
function railFor(manifest: SceneManifest) {
  let rail = rails.get(manifest);
  if (rail) return rail;
  const knots = manifest.cameraKnots;
  const times = [knots[0]!.band[0], ...knots.map(knot => knot.band[1])];
  const positions = [knots[0]!.start, ...knots.map(knot => knot.end)];
  const targets = [knots[0]!.look, ...knots.map(knot => knot.look)];
  rail = { times, positions, targets, positionSlopes: slopes(times, positions), targetSlopes: slopes(times, targets), bands: knots.map(knot => ({ from: knot.band[0], to: knot.band[1] })) };
  rails.set(manifest, rail); return rail;
}
function sample(out: THREE.Vector3, points: Vec3[], tangents: Vec3[], i: number, t: number, h: number) {
  const t2 = t * t, t3 = t2 * t;
  const a = 2 * t3 - 3 * t2 + 1, b = t3 - 2 * t2 + t, c = -2 * t3 + 3 * t2, d = t3 - t2;
  const p0 = points[i]!, p1 = points[i + 1]!, m0 = tangents[i]!, m1 = tangents[i + 1]!;
  out.set(a*p0[0]+b*h*m0[0]+c*p1[0]+d*h*m1[0], a*p0[1]+b*h*m0[1]+c*p1[1]+d*h*m1[1], a*p0[2]+b*h*m0[2]+c*p1[2]+d*h*m1[2]);
}
export function sampleCamera(camera: THREE.PerspectiveCamera, manifest: SceneManifest, progress: number, narrow: boolean, atlas = 0) {
  const rail = railFor(manifest);
  const p = cameraScore(progress, rail.bands);
  const i = Math.min(rail.times.length - 2, Math.max(0, rail.times.findIndex((time, index) => index > 0 && p < time) - 1));
  // findIndex is -1 at the final endpoint.
  const index = p >= 1 ? rail.times.length - 2 : i;
  const h = rail.times[index + 1]! - rail.times[index]!;
  const t = clamp((p - rail.times[index]!) / h);
  sample(position, rail.positions, rail.positionSlopes, index, t, h);
  sample(look, rail.targets, rail.targetSlopes, index, t, h);
  if (manifest.routeId === "work") {
    look.z = Math.min(look.z, position.z - 4.5);
    look.x = position.x + THREE.MathUtils.clamp(look.x - position.x, -2.2, 2.2);
  }
  if (narrow) {
    position.x *= .65; look.x *= .65;
    position.z += manifest.routeId === "builder" ? 1.5 : 1;
    position.y = Math.max(1.2, position.y);
  }
  if (atlas > 0) {
    position.lerp(overheadPosition, atlas);
    look.lerp(overheadLook, atlas);
  }
  origin.set(...manifest.worldOrigin);
  camera.position.copy(position.add(origin)); camera.lookAt(look.add(origin)); camera.rotation.z = 0;
  const fov = narrow ? 52 : manifest.camera.fov;
  if (camera.fov !== fov || camera.near !== manifest.camera.near || camera.far !== manifest.camera.far) {
    camera.fov = fov; camera.near = manifest.camera.near; camera.far = manifest.camera.far; camera.updateProjectionMatrix();
  }
}