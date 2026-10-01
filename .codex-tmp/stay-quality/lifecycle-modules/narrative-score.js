"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smooth = exports.clamp = void 0;
exports.textState = textState;
exports.cameraScore = cameraScore;
const clamp = (n) => Math.max(0, Math.min(1, n));
exports.clamp = clamp;
const smooth = (n) => { const t = (0, exports.clamp)(n); return t * t * (3 - 2 * t); };
exports.smooth = smooth;
/** Reversible score: no entrance queues or elapsed-time gates. */
function textState(local, readable = false) {
    const q = (0, exports.clamp)(local);
    const reveal = readable ? 1 : (0, exports.smooth)((q - .08) / .34);
    const phase = q < .08 ? "prepare" : q < .42 ? "reveal" : q < .58 ? "settle" : q < .88 ? "hold" : "depart";
    return { phase, reveal, support: readable ? 1 : (0, exports.smooth)((q - .47) / .16), settle: (0, exports.smooth)((q - .35) / .16), depart: (0, exports.smooth)((q - .88) / .12) };
}
/** Slows reading compositions; endpoint derivatives match between bands. */
function cameraScore(progress, bands) {
    const p = (0, exports.clamp)(progress);
    const beat = bands.find(b => p < b.to) ?? bands.at(-1);
    if (!beat)
        return p;
    const span = beat.to - beat.from;
    const q = (0, exports.clamp)((p - beat.from) / Math.max(.0001, span));
    return beat.from + span * (q + .14 * Math.sin(Math.PI * 2 * q));
}
