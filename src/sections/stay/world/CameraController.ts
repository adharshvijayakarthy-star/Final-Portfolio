import * as THREE from "three";
import type { SceneManifest, Vec3 } from "./types";
import { cameraScore, type ScoreBand } from "./narrative-score";
import { continuousCurve, sampleVectorCurve, upperLimit, type VectorCurve } from "./ContinuousCurve";

type Rail = { position: VectorCurve; target: VectorCurve; bands: { from: number; to: number }[] };
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
  rail = { position: continuousCurve(times, positions, slopes(times, positions)), target: continuousCurve(times, targets, slopes(times, targets)), bands: knots.map(knot => ({ from: knot.band[0], to: knot.band[1] })) };
  rails.set(manifest, rail); return rail;
}
export function sampleCamera(camera: THREE.PerspectiveCamera, manifest: SceneManifest, progress: number, narrow: boolean, atlas = 0, narrativeBands?: readonly ScoreBand[]) {
  const rail = railFor(manifest);
  const p = cameraScore(progress, narrativeBands ?? rail.bands);
  sampleVectorCurve(position, rail.position, p);
  sampleVectorCurve(look, rail.target, p);
  if (manifest.routeId === "work") {
    look.z = upperLimit(look.z, position.z - 4.5);
    const offset=look.x-position.x;
    look.x = position.x + (offset>=0?upperLimit(offset,2.2):-upperLimit(-offset,2.2));
  }
  if (narrow) {
    position.x *= .65; look.x *= .65;
    position.z += manifest.routeId === "builder" ? 1.5 : 1;
    position.y = -upperLimit(-position.y,-1.2);
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
