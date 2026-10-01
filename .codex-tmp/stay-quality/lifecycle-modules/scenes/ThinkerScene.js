"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.thinkerAdapter = void 0;
const THREE = require("three");
const backdrop = new THREE.Color("#b7c5bd");
exports.thinkerAdapter = {
    evaluate(progress, { scene, light }) {
        if (scene.fog instanceof THREE.FogExp2) {
            scene.fog.color.set("#9eaea8");
            scene.fog.density = progress > .9 ? .01 : .011;
        }
        scene.background = backdrop;
        light.intensity = 2.05;
    },
};
