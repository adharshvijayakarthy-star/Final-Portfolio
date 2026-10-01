import * as THREE from "three";
import type { RouteAdapter } from "./RouteAdapter";

export const personAdapter: RouteAdapter = {
  evaluate(_progress, { scene, light }) {
    if (scene.fog instanceof THREE.FogExp2) { scene.fog.color.set("#adbdae"); scene.fog.density = .009; }
    scene.background = new THREE.Color("#c1cbbd");
    light.intensity = 2.35;
  },
};
