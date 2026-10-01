import * as THREE from "three";
import type { RouteAdapter } from "./RouteAdapter";

export const thinkerAdapter: RouteAdapter = {
  evaluate(progress, { scene, light }) {
    if (scene.fog instanceof THREE.FogExp2) { scene.fog.color.set("#9eaea8"); scene.fog.density = progress > .9 ? .01 : .011; }
    scene.background = new THREE.Color("#b7c5bd");
    light.intensity = 2.05;
  },
};
