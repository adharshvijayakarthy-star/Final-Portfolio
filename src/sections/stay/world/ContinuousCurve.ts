import type { Vector3 } from "three";
import type { Vec3 } from "./types";

type Segment = { from: number; to: number; base: number; width: number; coefficients: Float64Array };
export type VectorCurve = readonly Segment[];
/** C2 shoulder into an existing upper cap; its final value stays exact. */
export function upperLimit(value:number,limit:number,width=.02) {
  if(value<=limit-width)return value;if(value>=limit)return limit;
  const t=(value-limit+width)/width;
  return limit-width+width*(t+t*t*t*(4+t*(-7+3*t)));
}
const evaluate = (c: Float64Array, a: number, t: number) => c[a]! + t*(c[a+1]! + t*(c[a+2]! + t*(c[a+3]! + t*(c[a+4]! + t*c[a+5]!))));
const velocity = (c: Float64Array, a: number, t: number, h: number) => (c[a+1]! + t*(2*c[a+2]! + t*(3*c[a+3]! + t*(4*c[a+4]! + t*5*c[a+5]!)))) / h;
const acceleration = (c: Float64Array, a: number, t: number, h: number) => (2*c[a+2]! + t*(6*c[a+3]! + t*(12*c[a+4]! + t*20*c[a+5]!))) / (h*h);

/** Retain the existing cubic trajectory except inside tiny knot shoulders.
 * Quintic shoulders meet both the original curve and the exact authored knot
 * in position, velocity and acceleration. Built once, sampled as a float. */
export function continuousCurve(times: readonly number[], points: readonly Vec3[], slopes: readonly Vec3[]): VectorCurve {
  const original: Segment[] = [];
  for (let i=0;i<times.length-1;i++) {
    const base=times[i]!, width=times[i+1]!-base, c=new Float64Array(18);
    for(let axis=0;axis<3;axis++) {
      const a=axis*6,p0=points[i]![axis]!,p1=points[i+1]![axis]!,v0=slopes[i]![axis]!*width,v1=slopes[i+1]![axis]!*width;
      c[a]=p0;c[a+1]=v0;c[a+2]=-3*p0+3*p1-2*v0-v1;c[a+3]=2*p0-2*p1+v0+v1;
    }
    original.push({from:base,to:base+width,base,width,coefficients:c});
  }
  const shared=times.map((_,i)=>[0,1,2].map(axis=>{
    if(!i)return acceleration(original[0]!.coefficients,axis*6,0,original[0]!.width);
    if(i===times.length-1)return acceleration(original.at(-1)!.coefficients,axis*6,1,original.at(-1)!.width);
    if(!slopes[i]![axis])return 0;
    const left=original[i-1]!,right=original[i]!;
    return (acceleration(left.coefficients,axis*6,1,left.width)*right.width+acceleration(right.coefficients,axis*6,0,right.width)*left.width)/(left.width+right.width);
  }));
  const result: Segment[]=[];
  function shoulder(source:Segment,from:number,to:number,knot:number,atStart:boolean) {
    const h=to-from,c=new Float64Array(18),q0=(from-source.base)/source.width,q1=(to-source.base)/source.width;
    for(let axis=0;axis<3;axis++) {
      const a=axis*6,p0=atStart?points[knot]![axis]!:evaluate(source.coefficients,a,q0),p1=atStart?evaluate(source.coefficients,a,q1):points[knot]![axis]!;
      const v0=atStart?slopes[knot]![axis]!:velocity(source.coefficients,a,q0,source.width),v1=atStart?velocity(source.coefficients,a,q1,source.width):slopes[knot]![axis]!;
      const a0=atStart?shared[knot]![axis]!:acceleration(source.coefficients,a,q0,source.width),a1=atStart?acceleration(source.coefficients,a,q1,source.width):shared[knot]![axis]!;
      c[a]=p0;c[a+1]=h*v0;c[a+2]=h*h*a0/2;
      const d=p1-c[a]!-c[a+1]!-c[a+2]!,v=h*v1-c[a+1]!-2*c[a+2]!,s=h*h*a1-2*c[a+2]!;
      c[a+3]=10*d-4*v+s/2;c[a+4]=-15*d+7*v-s;c[a+5]=6*d-3*v+s/2;
    }
    result.push({from,to,base:from,width:h,coefficients:c});
  }
  original.forEach((segment,i)=>{
    const left=i?Math.min(original[i-1]!.width,segment.width)/32:0,right=i<original.length-1?Math.min(segment.width,original[i+1]!.width)/32:0;
    if(left)shoulder(segment,segment.from,segment.from+left,i,true);
    result.push({...segment,from:segment.from+left,to:segment.to-right});
    if(right)shoulder(segment,segment.to-right,segment.to,i+1,false);
  });
  return result;
}
function segmentAt(curve: VectorCurve, p: number) {
  for(let i=0;i<curve.length;i++)if(p<=curve[i]!.to)return curve[i]!;
  return curve[curve.length-1]!;
}
export function sampleVectorCurve(out: Vector3, curve: VectorCurve, p: number) {
  const s=segmentAt(curve,p),t=(p-s.base)/s.width,c=s.coefficients;
  out.set(evaluate(c,0,t),evaluate(c,6,t),evaluate(c,12,t));
}
export function sampleScalarCurve(curve: VectorCurve, p: number) {
  const s=segmentAt(curve,p);return evaluate(s.coefficients,0,(p-s.base)/s.width);
}
