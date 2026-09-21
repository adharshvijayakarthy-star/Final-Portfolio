export const STAGE_ORDER = ["entry", "who", "build", "think", "lead", "workcard", "plan", "papers", "mun", "snrled", "aura", "beyond", "future", "contact"] as const;
export const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
export const smooth = (n: number) => { const t = clamp(n); return t*t*(3-2*t); };
export const range = (n: number, from: number, to: number) => smooth((n-from)/(to-from));
export const damp = (current: number, target: number, dt: number, rate = 12) => current+(target-current)*(1-Math.exp(-rate*dt));
export function stageOffset(progress: number, height: number, _viewport: number) { return clamp(progress)*height; }

export interface Track { top: number; height: number }
/** All animation, including Blender time, uses this one reversible clock. */
export function journeyAt(y: number, tracks: Track[]) {
  let index = tracks.findIndex((track,i) => y < track.top+track.height || i===tracks.length-1);
  if (index<0) index=tracks.length-1;
  const track=tracks[index]!;
  return clamp(index+(y-track.top)/Math.max(1,track.height),0,tracks.length-.001);
}

export function headingPose(p: number, word: number, style: number) {
  const t=range(p,-.08+word*.009,.16+word*.009);
  const out=range(p,.79+word*.009,1.04+word*.009);
  // Different masks and approach directions share the same handoff clock.
  const anticipation=(1-t), settle=Math.sin(t*Math.PI)*anticipation;
  return {
    clip: 100*(1-t), opacity: 1-out,
    x: (style===1 ? -30*anticipation : style===2 ? 18*anticipation : 0)-out*20,
    y: (style===0 ? 100*anticipation-9*settle : -4*settle)-out*12,
    rotation: (style===2 ? -4*anticipation : 1.2*settle),
  };
}
