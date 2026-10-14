import { continuousCurve, sampleScalarCurve, type VectorCurve } from "./ContinuousCurve";
import type { Vec3 } from "./types";

export const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const smooth = (n: number) => { const t = clamp(n); return t*t*t*(10+t*(-15+6*t)); };
export type TextPhase = "prepare" | "reveal" | "settle" | "hold" | "depart";
export type ScoreBand = { from: number; to: number; readFrom?: number; readTo?: number };
export type TextTiming = { prepare: number; reveal: number; settle: number; read: number; gap: number };

/** Fractions of native progress, never milliseconds that a visitor must wait. */
export const routeTiming: Record<string, TextTiming> = {
  garden: { prepare: .05, reveal: .30, settle: .41, read: .86, gap: .045 },
  person: { prepare: .04, reveal: .28, settle: .40, read: .88, gap: .04 },
  builder: { prepare: .03, reveal: .24, settle: .36, read: .85, gap: .03 },
  thinker: { prepare: .03, reveal: .25, settle: .39, read: .91, gap: .045 },
  leader: { prepare: .04, reveal: .27, settle: .39, read: .86, gap: .035 },
  stories: { prepare: .05, reveal: .29, settle: .41, read: .89, gap: .045 },
  work: { prepare: .025, reveal: .23, settle: .35, read: .88, gap: .03 },
  future: { prepare: .05, reveal: .29, settle: .42, read: .88, gap: .04 },
  aura: { prepare: .04, reveal: .28, settle: .41, read: .91, gap: .045 },
  contact: { prepare: .025, reveal: .21, settle: .33, read: .94, gap: .025 },
};
const defaultTiming: TextTiming = { prepare: .08, reveal: .42, settle: .58, read: .88, gap: .065 };

/** Reversible score: no entrance queues or elapsed-time gates. */
export type TextState = { phase: TextPhase; reveal: number; support: number; settle: number; depart: number };
export function textState(local: number, readable = false, timing = defaultTiming, out?: TextState) {
  const q = clamp(local);
  const reveal = readable ? 1 : smooth((q - timing.prepare) / (timing.reveal - timing.prepare));
  const phase: TextPhase = q < timing.prepare ? "prepare" : q < timing.reveal ? "reveal" : q < timing.settle ? "settle" : q < timing.read ? "hold" : "depart";
  const state=out ?? {phase,reveal,support:0,settle:0,depart:0};
  state.phase=phase;state.reveal=reveal;state.support=readable?1:smooth((q-timing.reveal)/(timing.settle-timing.reveal));state.settle=smooth((q-timing.reveal)/(timing.settle-timing.reveal));state.depart=smooth((q-timing.read)/(1-timing.read));return state;
}

const scoreCurves = new WeakMap<readonly ScoreBand[], VectorCurve>();
/** Preserve score points and durations; C2 shoulders remove acceleration jumps
 * at approach/hold/departure joins without adding a sampled-state timeline. */
export function cameraScore(progress: number, bands: readonly ScoreBand[]) {
  const p = clamp(progress);
  if (!bands.length) return p;
  let curve=scoreCurves.get(bands);
  if (!curve) {
    const times=[bands[0]!.from],points:Vec3[]=[[bands[0]!.from,0,0]],slopes:Vec3[]=[[1.6,0,0]];
    for(const b of bands) {
      const span=b.to-b.from;
      times.push(b.from+span*(b.readFrom??.42),b.from+span*(b.readTo??.82),b.to);
      points.push([b.from+span*.60,0,0],[b.from+span*.64,0,0],[b.to,0,0]);slopes.push([.10,0,0],[.10,0,0],[1.6,0,0]);
    }
    curve=continuousCurve(times,points,slopes);scoreCurves.set(bands,curve);
  }
  return clamp(sampleScalarCurve(curve,p));
}
