type Beat = { from: number; to: number; startY: number; endY: number };
const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Native scroll remains untouched; measurements are refreshed after layout changes. */
export class ScrollController {
  private beats: Beat[] = [];
  private observer: ResizeObserver;
  private measureFrame = 0;
  private sampleFrame = 0;
  private disposed = false;
  constructor(private root: HTMLElement, private onProgress: (progress: number) => void) {
    this.observer = new ResizeObserver(() => this.queueMeasure());
    this.observer.observe(root);
    root.querySelectorAll<HTMLElement>("[data-stay-beat]").forEach(section => this.observer.observe(section));
    window.addEventListener("scroll", this.queueSample, { passive: true });
    window.addEventListener("resize", this.queueMeasure);
    void document.fonts.ready.then(() => { if (!this.disposed) this.queueMeasure(); });
    this.queueMeasure();
  }
  private queueMeasure = () => {
    if (this.measureFrame) return;
    this.measureFrame = requestAnimationFrame(() => { this.measureFrame = 0; this.measure(); });
  };
  private queueSample = () => {
    if (this.sampleFrame) return;
    this.sampleFrame = requestAnimationFrame(() => { this.sampleFrame = 0; this.sample(); });
  };
  private measure() {
    const height = window.innerHeight;
    const sections = [...this.root.querySelectorAll<HTMLElement>("[data-stay-beat]")].map(section => {
      const box = section.getBoundingClientRect();
      return { section, top: box.top + window.scrollY, bottom: box.bottom + window.scrollY };
    });
    // One shared boundary between neighbouring beats keeps camera progress
    // continuous even when their reading zones overlap in the viewport.
    const boundaries = sections.slice(1).map((next, index) => ((sections[index]!.bottom + next.top) / 2) - height * .5);
    this.beats = sections.map(({ section, top, bottom }, index) => {
      const startY = index ? boundaries[index - 1]! : Math.max(0, top);
      const endY = index < boundaries.length ? boundaries[index]! : Math.max(startY + 1, bottom - height);
      return { from: Number(section.dataset.from ?? 0), to: Number(section.dataset.to ?? 1),
        startY, endY: Math.max(startY + 1, endY) };
    });
    this.root.dataset.stayMeasuredBeats = String(this.beats.length);
    this.sample();
  }
  private sample() {
    this.root.dataset.stayScrollY = String(window.scrollY);
    if (!this.beats.length) { this.onProgress(0); return; }
    const y = window.scrollY;
    if (y <= 0) { this.onProgress(0); return; }
    if (window.innerHeight + y >= document.documentElement.scrollHeight - 2) { this.onProgress(1); return; }
    let progress = 0;
    for (const beat of this.beats) {
      if (y < beat.startY) break;
      progress = beat.from + (beat.to - beat.from) * clamp((y - beat.startY) / (beat.endY - beat.startY));
    }
    this.root.dataset.stayMeasuredProgress = clamp(progress).toFixed(3);
    this.onProgress(clamp(progress));
  }
  dispose() {
    if (this.disposed) return; this.disposed = true;
    cancelAnimationFrame(this.measureFrame); cancelAnimationFrame(this.sampleFrame);
    this.observer.disconnect();
    window.removeEventListener("scroll", this.queueSample);
    window.removeEventListener("resize", this.queueMeasure);
  }
}
