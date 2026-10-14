import * as THREE from "three";
import type { RouteAdapter } from "./RouteAdapter";
import { exposeObject } from "../ObjectExposure";
import { smooth } from "../narrative-score";
const backdrop = new THREE.Color("#c3c8b5");

const entrances: Record<string, number> = { B02: .2, B03: .32, B04: .44, B05: .56, B06: .68 };
const entrancePairs=Object.entries(entrances);
export const builderAdapter: RouteAdapter = {
  evaluate(progress, { scene, light, objects }) {
    if (scene.fog instanceof THREE.FogExp2) { scene.fog.color.set("#aab6a3"); scene.fog.density = .008; }
    scene.background = backdrop;
    light.intensity = 2.45;
    for (const [assetId, threshold] of entrancePairs) {
      for (const object of objects.get(assetId) ?? []) exposeObject(object,smooth((progress-threshold)/.018));
    }
  },
};
