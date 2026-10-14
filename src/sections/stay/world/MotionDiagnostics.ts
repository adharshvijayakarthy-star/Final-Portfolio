import type * as THREE from "three";

type TimerExtension = { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number };

/** Optional asynchronous GPU samples; no gl.finish or blocking result reads. */
export class GpuProfiler {
  private extension: TimerExtension | null;
  private active: WebGLQuery | null = null;
  private pending: WebGLQuery[] = [];
  private values = new Float32Array(60);
  private sorted = new Float32Array(60);
  private count = 0;
  private index = 0;
  private frames = 0;
  constructor(private gl: WebGL2RenderingContext) {
    this.extension = gl.getExtension("EXT_disjoint_timer_query_webgl2");
  }
  begin() {
    const gl = this.gl, extension = this.extension;
    if (!extension) return;
    const disjoint = gl.getParameter(extension.GPU_DISJOINT_EXT);
    while (this.pending.length && gl.getQueryParameter(this.pending[0]!, gl.QUERY_RESULT_AVAILABLE)) {
      const query = this.pending.shift()!;
      if (!disjoint) {
        this.values[this.index] = gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6;
        this.index = (this.index + 1) % this.values.length;
        this.count = Math.min(this.count + 1, this.values.length);
      }
      gl.deleteQuery(query);
    }
    if (++this.frames % 12 || this.pending.length >= 4) return;
    this.active = gl.createQuery();
    if (this.active) gl.beginQuery(extension.TIME_ELAPSED_EXT, this.active);
  }
  end() {
    if (!this.active || !this.extension) return;
    this.gl.endQuery(this.extension.TIME_ELAPSED_EXT);
    this.pending.push(this.active); this.active = null;
  }
  stats() {
    const values=this.sorted;values.fill(Infinity);
    for(let i=0;i<this.count;i++)values[i]=this.values[i]!;
    values.sort();
    return { supported: Boolean(this.extension), samples: this.count, gpuP50: this.count?values[Math.floor(this.count*.5)]!:0, gpuP95: this.count?values[Math.floor(this.count*.95)]!:0 };
  }
  reset(){for(const query of this.pending)this.gl.deleteQuery(query);this.pending.length=0;this.count=0;this.index=0;this.frames=0;}
  dispose() {
    if (this.active && this.extension) { this.gl.endQuery(this.extension.TIME_ELAPSED_EXT); this.gl.deleteQuery(this.active); }
    for (const query of this.pending) this.gl.deleteQuery(query);
    this.pending.length = 0; this.active = null;
  }
}

/** Armed only by a local QA event. Bounded numeric storage avoids allocating
 * camera samples each frame; DOM serialization happens once after recording. */
export class MotionTrace {
  private samples = new Float64Array(2400 * 14);
  private count = 0;
  private start = 0;
  private end = 0;
  get recording(){return this.end!==0;}
  private arm = () => { this.count = 0; this.start = performance.now(); this.end = this.start + 9000; delete this.canvas.dataset.stayMotionTrace;this.requestFrame(); };
  constructor(private canvas: HTMLCanvasElement,private requestFrame:()=>void) { canvas.addEventListener("stay-record-motion", this.arm); }
  record(time: number, interval: number, cpu: number, raw: number, shown: number, camera: THREE.Camera, clip: number, pointerX: number, pointerY: number) {
    if (!this.end) return;
    if (time >= this.end || this.count >= 2400) {
      this.end = 0;
      this.canvas.dataset.stayMotionTrace = JSON.stringify({ columns: ["ms","intervalMs","cpuMs","raw","shown","x","y","z","qx","qy","qz","qw","clipTime","pointerX"], samples: Array.from(this.samples.subarray(0,this.count*14)), pointerY });
      return;
    }
    const i = this.count++ * 14, position = camera.position, quaternion = camera.quaternion;
    this.samples[i]=time-this.start; this.samples[i+1]=interval; this.samples[i+2]=cpu; this.samples[i+3]=raw; this.samples[i+4]=shown;
    this.samples[i+5]=position.x; this.samples[i+6]=position.y; this.samples[i+7]=position.z;
    this.samples[i+8]=quaternion.x; this.samples[i+9]=quaternion.y; this.samples[i+10]=quaternion.z; this.samples[i+11]=quaternion.w;
    this.samples[i+12]=clip; this.samples[i+13]=pointerX;
  }
  dispose() { this.canvas.removeEventListener("stay-record-motion", this.arm); }
}
