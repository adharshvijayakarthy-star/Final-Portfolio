import { clamp } from "./narrative-score";

/** Analytic third-order damping. Position, velocity and acceleration survive
 * reversals; only the current native target is used, with no animation queue. */
export class PresentationProgress {
  value = 0;
  private velocity = 0;
  private acceleration = 0;
  constructor(private readonly frequency = 54) {}
  reset(value: number) { this.value = clamp(value); this.velocity = 0; this.acceleration = 0; }
  isSettled(target: number) { return Math.abs(target-this.value)<.000001 && Math.abs(this.velocity)<.0001 && Math.abs(this.acceleration)<.01; }
  step(target: number, seconds: number) {
    if (this.isSettled(target)) {
      this.reset(target); return this.value;
    }
    // A stalled tab gets a bounded recovery step; hidden time never accumulates.
    const dt = Math.min(.05, Math.max(0, seconds)), omega = this.frequency;
    const displacement = this.value - target;
    const c1=this.velocity+omega*displacement,c2=(this.acceleration+2*omega*this.velocity+omega*omega*displacement)/2;
    const polynomial=displacement+c1*dt+c2*dt*dt, derivative=c1+2*c2*dt, decay=Math.exp(-omega*dt);
    const next=target+polynomial*decay;
    this.velocity=(derivative-omega*polynomial)*decay;
    this.acceleration=(2*c2-2*omega*derivative+omega*omega*polynomial)*decay;
    this.value=clamp(next);
    if(this.value!==next){this.velocity=0;this.acceleration=0;}
    return this.value;
  }
}
