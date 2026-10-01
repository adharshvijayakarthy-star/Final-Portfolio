"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personAdapter = void 0;
const THREE = require("three");
const backdrop = new THREE.Color("#c1cbbd");
exports.personAdapter = {
    evaluate(_progress, { scene, light }) {
        if (scene.fog instanceof THREE.FogExp2) {
            scene.fog.color.set("#adbdae");
            scene.fog.density = .009;
        }
        scene.background = backdrop;
        light.intensity = 2.35;
    },
};
