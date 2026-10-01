import { clamp } from "./narrative-score";
type Beat = { from: number; to: number; startY: number; endY: number };

/** The world owns the only RAF. Events invalidate cached layout and request it. */
export class ScrollController {
  private beats: Beat[] = [];
  private observer: ResizeObserver;
  private dirty = true;
  private layoutDirty = true;
  private disposed = false;
  private layoutReads = 0;
  constructor(private root: HTMLElement, private onProgress: (p: number) => void, private requestFrame: () => void) {
    this.observer = new ResizeObserver(this.invalidate);
    this.observer.observe(root);
    root.querySelectorAll<HTMLElement>("[data-stay-beat]").forEach(section => this.observer.observe(section));
    window.addEventListener("scroll", this.sample, { passive: true });
    window.addEventListener("resize", this.invalidate);
    root.addEventListener("toggle", this.invalidate, true);
    void document.fonts.ready.then(() => { if (!this.disposed) this.invalidate(); });
    requestFrame();
  }
  private sample = () => { this.dirty = true; this.requestFrame(); };
  private invalidate = () => { this.layoutDirty = true; this.sample(); };
  flush() {
    if (this.disposed || !this.dirty) return;
    if (this.layoutDirty) {
      const height = window.innerHeight;
      const sections = [...this.root.querySelectorAll<HTMLElement>("[data-stay-beat]")].map(section => {
        const box = section.getBoundingClientRect();
        return { section, top: box.top + window.scrollY, bottom: box.bottom + window.scrollY };
      });
      const boundaries = sections.slice(1).map((next, i) => (sections[i]!.bottom + next.top) / 2 - height * .5);
      this.beats = sections.map(({ section, top, bottom }, i) => {
        const startY = i ? boundaries[i - 1]! : Math.max(0, top);
        const endY = i < boundaries.length ? boundaries[i]! : Math.max(startY + 1, bottom - height);
        return { from: Number(section.dataset.from), to: Number(section.dataset.to), startY, endY: Math.max(startY + 1, endY) };
      });
      this.root.dataset.stayMeasuredBeats = String(this.beats.length);
      this.layoutReads += sections.length;
      this.root.dataset.stayScrollLayoutReads = String(this.layoutReads);
      this.layoutDirty = false;
    }
    const y = window.scrollY;
    let p = 0;
    for (const beat of this.beats) {
      if (y < beat.startY) break;
      p = beat.from + (beat.to - beat.from) * clamp((y - beat.startY) / (beat.endY - beat.startY));
    }
    if (y <= 0) p = 0;
    else if (y + window.innerHeight >= document.documentElement.scrollHeight - 2) p = 1;
    this.root.dataset.stayMeasuredProgress = clamp(p).toFixed(4);
    this.dirty = false;
    this.onProgress(clamp(p));
  }
  dispose() {
    this.disposed = true; this.observer.disconnect();
    window.removeEventListener("scroll", this.sample);
    window.removeEventListener("resize", this.invalidate);
    this.root.removeEventListener("toggle", this.invalidate, true);
  }
}
