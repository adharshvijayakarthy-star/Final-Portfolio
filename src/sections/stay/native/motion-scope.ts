/** One destination owns one scope. Disposing it cancels all queued work. */
export class MotionScope {
  private stopped = false;
  private timers = new Set<number>();
  private frames = new Set<number>();
  private cleanups: (() => void)[] = [];
  after(ms: number, fn: () => void) {
    if (this.stopped) return 0;
    const id = window.setTimeout(() => { this.timers.delete(id); if (!this.stopped) fn(); }, ms);
    this.timers.add(id); return id;
  }
  frame(fn: (now: number) => void) {
    if (this.stopped) return 0;
    const id = requestAnimationFrame(now => { this.frames.delete(id); if (!this.stopped) fn(now); });
    this.frames.add(id); return id;
  }
  listen(target: EventTarget, type: string, fn: EventListener, options?: AddEventListenerOptions) {
    target.addEventListener(type, fn, options);
    const remove = () => target.removeEventListener(type, fn, options);
    this.cleanups.push(remove); return remove;
  }
  dispose() {
    this.stopped = true;
    this.timers.forEach(clearTimeout); this.frames.forEach(cancelAnimationFrame);
    this.cleanups.forEach(fn => fn());
    this.timers.clear(); this.frames.clear(); this.cleanups = [];
  }
}
