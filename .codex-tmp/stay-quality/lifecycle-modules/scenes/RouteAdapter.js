"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeAdapters = void 0;
const THREE = require("three");
function atmosphericRoute(background, fog, density, intensity, key = "#fff0d6") {
    const backdrop = new THREE.Color(background), haze = new THREE.Color(fog), sunlight = new THREE.Color(key);
    return { evaluate(_progress, { scene, light }) {
            scene.background = backdrop;
            if (scene.fog instanceof THREE.FogExp2) {
                scene.fog.color.copy(haze);
                scene.fog.density = density;
            }
            light.color.copy(sunlight);
            light.intensity = intensity;
        } };
}
exports.routeAdapters = {
    stories: atmosphericRoute("#34473d", "#435347", .011, .68, "#f5c48d"),
    work: atmosphericRoute("#819780", "#82967e", .005, 1.5),
    future: atmosphericRoute("#82a89e", "#85a69b", .006, 1.65),
    aura: atmosphericRoute("#8d9c88", "#899985", .006, 1.6),
    contact: atmosphericRoute("#8cae97", "#8dac94", .005, 1.58),
};
const auraAtmosphere = exports.routeAdapters.aura;
const connections = new WeakMap();
exports.routeAdapters.aura = { evaluate(progress, context) {
        auraAtmosphere.evaluate(progress, context);
        const q = THREE.MathUtils.clamp((progress - .64) / .07, 0, 1);
        for (const root of context.objects.get("A03") ?? []) {
            let meshes = connections.get(root);
            if (!meshes) {
                meshes = [];
                root.traverse(node => { if (node instanceof THREE.Mesh)
                    meshes.push(node); });
                connections.set(root, meshes);
            }
            for (let i = 0; i < meshes.length; i++)
                meshes[i].visible = q > 0 && q >= (i + 1) / meshes.length;
        }
    } };
