import * as THREE from "three";
import type { RouteAdapter } from "./RouteAdapter";
const backdrop = new THREE.Color("#b7c5bd");

export const thinkerAdapter: RouteAdapter = {
  evaluate(progress, { scene, light }) {
    if (scene.fog instanceof THREE.FogExp2) { scene.fog.color.set("#9eaea8"); scene.fog.density = progress > .9 ? .01 : .011; }
    scene.background = backdrop;
    light.intensity = 2.05;
  },
};
