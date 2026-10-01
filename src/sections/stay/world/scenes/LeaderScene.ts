import * as THREE from "three";
import type { RouteAdapter } from "./RouteAdapter";
const backdrop = new THREE.Color("#bec7b4");

export const leaderAdapter: RouteAdapter = {
  evaluate(progress, { scene, light }) {
    scene.background = backdrop;
    if (scene.fog instanceof THREE.FogExp2) { scene.fog.color.copy(backdrop); scene.fog.density = .012 - .002 * Math.min(1, progress / .68); }
    light.intensity = 2.05;
  },
};
