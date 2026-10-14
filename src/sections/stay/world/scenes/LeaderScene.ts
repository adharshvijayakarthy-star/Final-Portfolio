import * as THREE from "three";
import type { RouteAdapter } from "./RouteAdapter";
import { upperLimit } from "../ContinuousCurve";
const backdrop = new THREE.Color("#bec7b4");

export const leaderAdapter: RouteAdapter = {
  evaluate(progress, { scene, light }) {
    scene.background = backdrop;
    if (scene.fog instanceof THREE.FogExp2) { scene.fog.color.copy(backdrop); scene.fog.density = .012 - .002 * upperLimit(progress/.68,1); }
    light.intensity = 2.05;
  },
};
