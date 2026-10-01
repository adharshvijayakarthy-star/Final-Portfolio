import * as THREE from "three";
import type { RouteAdapter } from "./RouteAdapter";

export const gardenAdapter: RouteAdapter = {
  evaluate(progress, { scene, light, objects }) {
    if (scene.fog instanceof THREE.FogExp2) { scene.fog.color.set("#a8b9a5"); scene.fog.density = .012 - .003 * Math.min(1, progress / .42); }
    scene.background = new THREE.Color("#bdcbb9");
    light.intensity = 2.25 + .3 * Math.min(1, progress / .42);
    // Arrival fronds frame the gate, then clear before the camera walks
    // through their low-poly back faces deeper on the path.
    for (const frond of objects.get("G10") ?? []) frond.visible = progress < .29;
  },
};
