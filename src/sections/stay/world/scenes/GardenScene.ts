import * as THREE from "three";
import type { RouteAdapter } from "./RouteAdapter";
import { exposeObject } from "../ObjectExposure";
import { smooth } from "../narrative-score";
import { upperLimit } from "../ContinuousCurve";
const backdrop = new THREE.Color("#bdcbb9");

export const gardenAdapter: RouteAdapter = {
  evaluate(progress, { scene, light, objects }) {
    const ambience=upperLimit(progress/.42,1);
    if (scene.fog instanceof THREE.FogExp2) { scene.fog.color.set("#a8b9a5"); scene.fog.density = .012 - .003 * ambience; }
    scene.background = backdrop;
    light.intensity = 2.25 + .3 * ambience;
    // Arrival fronds frame the gate, then clear before the camera walks
    // through their low-poly back faces deeper on the path.
    for (const frond of objects.get("G10") ?? []) exposeObject(frond,1-smooth((progress-.28)/.01));
  },
};
