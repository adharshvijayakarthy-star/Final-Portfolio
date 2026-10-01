export const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
export type TextPhase = "prepare" | "reveal" | "settle" | "hold" | "depart";

/** Reversible score: no entrance queues or elapsed-time gates. */
export function textState(local: number, readable = false) {
  const q = clamp(local);
  const reveal = readable ? 1 : smooth((q - .08) / .34);
  const phase: TextPhase = q < .08 ? "prepare" : q < .42 ? "reveal" : q < .58 ? "settle" : q < .88 ? "hold" : "depart";
  return { phase, reveal, support: readable ? 1 : smooth((q - .47) / .16), settle: smooth((q - .35) / .16), depart: smooth((q - .88) / .12) };
}

/** Slows reading compositions; endpoint derivatives match between bands. */
export function cameraScore(progress: number, bands: readonly { from: number; to: number }[]) {
  const p = clamp(progress);
  const beat = bands.find(b => p < b.to) ?? bands.at(-1);
  if (!beat) return p;
  const span = beat.to - beat.from;
  const q = clamp((p - beat.from) / Math.max(.0001, span));
  return beat.from + span * (q + .14 * Math.sin(Math.PI * 2 * q));
}
