/** One destination owns one scope. Disposing it cancels all queued work. */
export class MotionScope {
  private stopped = false;
  private timers = new Set<number>();
  private intervals = new Set<number>();
  private frames = new Set<number>();
  private cleanups: (() => void)[] = [];
  after(ms: number, fn: () => void) {
    if (this.stopped) return 0;
    const id = window.setTimeout(() => { this.timers.delete(id); if (!this.stopped) fn(); }, ms);
    this.timers.add(id); return id;
  }
  cancelTimer(id: number) { clearTimeout(id); this.timers.delete(id); }
  every(ms: number, fn: () => void) {
    if (this.stopped) return 0;
    const id = window.setInterval(() => { if (!this.stopped) fn(); }, ms);
    this.intervals.add(id); return id;
  }
  cancelInterval(id: number) { clearInterval(id); this.intervals.delete(id); }
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
  observe(callback: IntersectionObserverCallback, options: IntersectionObserverInit) {
    const observer = new IntersectionObserver((entries, owner) => { if (!this.stopped) callback(entries, owner); }, options);
    this.cleanups.push(() => observer.disconnect()); return observer;
  }
  dispose() {
    this.stopped = true;
    this.timers.forEach(clearTimeout); this.intervals.forEach(clearInterval); this.frames.forEach(cancelAnimationFrame);
    this.cleanups.forEach(fn => fn());
    this.timers.clear(); this.intervals.clear(); this.frames.clear(); this.cleanups = [];
  }
}
export type VisualElement = HTMLElement | SVGElement;
export const all = (root: ParentNode, selector: string) => Array.from(root.querySelectorAll<VisualElement>(selector));
export const one = (root: ParentNode, selector: string) => root.querySelector<VisualElement>(selector);
export const show = (el: VisualElement) => { el.style.opacity = "1"; el.style.transform = "none"; };
export type DestinationController = (root: HTMLElement, scope: MotionScope, reduced: boolean) => void;
