/** Bounded samples. CPU duration and inter-frame interval are separate measures;
 * neither is presented as GPU time. Hidden intervals are discarded by runtime. */
export class FrameProfiler {
  private intervals = new Float32Array(240);
  private costs = new Float32Array(240);
  private sortedIntervals = new Float32Array(240);
  private sortedCosts = new Float32Array(240);
  private count = 0;
  private index = 0;
  record(interval: number, cost: number) {
    if (interval <= 0) return;
    this.intervals[this.index] = interval; this.costs[this.index] = cost;
    this.index = (this.index + 1) % this.intervals.length;
    this.count = Math.min(this.count + 1, this.intervals.length);
  }
  stats() {
    const a=this.sortedIntervals,b=this.sortedCosts;let over20=0,over33=0,over50=0;
    a.fill(Infinity);b.fill(Infinity);
    for(let i=0;i<this.count;i++){const interval=this.intervals[i]!;a[i]=interval;b[i]=this.costs[i]!;if(interval>20)over20++;if(interval>33.4)over33++;if(interval>50)over50++;}
    a.sort();b.sort();
    return { samples:this.count, frameP50:this.count?a[Math.floor(this.count*.5)]!:0, frameP95:this.count?a[Math.floor(this.count*.95)]!:0, frameMax:this.count?a[this.count-1]!:0, cpuP95:this.count?b[Math.floor(this.count*.95)]!:0, over20,over33,over50 };
  }
  reset() { this.count=0; this.index=0; }
}
