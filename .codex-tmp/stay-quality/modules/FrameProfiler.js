"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameProfiler = void 0;
/** Bounded samples. CPU duration and inter-frame interval are separate measures;
 * neither is presented as GPU time. Hidden intervals are discarded by runtime. */
class FrameProfiler {
    intervals = new Float32Array(240);
    costs = new Float32Array(240);
    count = 0;
    index = 0;
    record(interval, cost) {
        if (interval <= 0)
            return;
        this.intervals[this.index] = interval;
        this.costs[this.index] = cost;
        this.index = (this.index + 1) % this.intervals.length;
        this.count = Math.min(this.count + 1, this.intervals.length);
    }
    stats() {
        const a = Array.from(this.intervals.slice(0, this.count)).sort((x, y) => x - y);
        const b = Array.from(this.costs.slice(0, this.count)).sort((x, y) => x - y);
        return { samples: this.count, frameP50: a[Math.floor(a.length * .5)] ?? 0, frameP95: a[Math.floor(a.length * .95)] ?? 0, frameMax: a.at(-1) ?? 0, cpuP95: b[Math.floor(b.length * .95)] ?? 0 };
    }
    reset() { this.count = 0; this.index = 0; }
}
exports.FrameProfiler = FrameProfiler;
