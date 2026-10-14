import * as THREE from "three";
import type { RouteAdapter } from "./RouteAdapter";
import { smooth } from "../narrative-score";
const backdrop = new THREE.Color("#b7c5bd");

export const thinkerAdapter: RouteAdapter = {
  evaluate(progress, { scene, light }) {
    if (scene.fog instanceof THREE.FogExp2) { scene.fog.color.set("#9eaea8"); scene.fog.density = .011-.001*smooth((progress-.88)/.02); }
    scene.background = backdrop;
    light.intensity = 2.05;
  },
};
