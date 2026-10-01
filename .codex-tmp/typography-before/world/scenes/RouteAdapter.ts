import * as THREE from "three";

export type AdapterContext = {
  scene: THREE.Scene;
  light: THREE.DirectionalLight;
  objects: Map<string, THREE.Object3D[]>;
};
export type RouteAdapter = { evaluate: (progress: number, context: AdapterContext) => void };
function atmosphericRoute(background: string, fog: string, density: number, intensity: number, key = "#fff0d6"): RouteAdapter {
  const backdrop = new THREE.Color(background), haze = new THREE.Color(fog), sunlight = new THREE.Color(key);
  return { evaluate(_progress, { scene, light }) {
    scene.background = backdrop;
    if (scene.fog instanceof THREE.FogExp2) { scene.fog.color.copy(haze); scene.fog.density = density; }
    light.color.copy(sunlight); light.intensity = intensity;
  } };
}

export const routeAdapters: Record<string, RouteAdapter> = {
  stories: atmosphericRoute("#34473d", "#435347", .011, .68, "#f5c48d"),
  work: atmosphericRoute("#819780", "#82967e", .005, 1.5),
  future: atmosphericRoute("#82a89e", "#85a69b", .006, 1.65),
  aura: atmosphericRoute("#8d9c88", "#899985", .006, 1.6),
  contact: atmosphericRoute("#8cae97", "#8dac94", .005, 1.58),
};
