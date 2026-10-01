import * as THREE from "three";
import type { RouteAdapter } from "./RouteAdapter";

export const leaderAdapter: RouteAdapter = {
  evaluate(progress, { scene, light }) {
    if (scene.fog instanceof THREE.FogExp2) scene.fog.density = .019 - .002 * Math.min(1, progress / .68);
    light.intensity = 2.05;
  },
};
