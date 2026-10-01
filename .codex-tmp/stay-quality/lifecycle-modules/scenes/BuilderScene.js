"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.builderAdapter = void 0;
const THREE = require("three");
const backdrop = new THREE.Color("#c3c8b5");
const entrances = { B02: .2, B03: .32, B04: .44, B05: .56, B06: .68 };
exports.builderAdapter = {
    evaluate(progress, { scene, light, objects }) {
        if (scene.fog instanceof THREE.FogExp2) {
            scene.fog.color.set("#aab6a3");
            scene.fog.density = .008;
        }
        scene.background = backdrop;
        light.intensity = 2.45;
        for (const [assetId, threshold] of Object.entries(entrances)) {
            for (const object of objects.get(assetId) ?? [])
                object.visible = progress >= threshold;
        }
    },
};
