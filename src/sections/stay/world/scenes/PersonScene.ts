import * as THREE from "three";
import type { RouteAdapter } from "./RouteAdapter";
const backdrop = new THREE.Color("#c1cbbd");

export const personAdapter: RouteAdapter = {
  evaluate(_progress, { scene, light }) {
    if (scene.fog instanceof THREE.FogExp2) { scene.fog.color.set("#adbdae"); scene.fog.density = .009; }
    scene.background = backdrop;
    light.intensity = 2.35;
  },
};
