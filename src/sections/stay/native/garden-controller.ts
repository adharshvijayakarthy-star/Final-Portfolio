/** Shared authored environment clock and Builder/Leader construction signatures.
 * All handles and imperative styles belong to one mount.
 */
import type { StayDestination } from "./destinations";
import { MotionScope } from "./motion-scope";
export function startGarden(root: HTMLElement, canvas: HTMLCanvasElement, options: { current: StayDestination; water: number | null } = { current: "garden", water: null }) {
  const { current } = options;
  const scope = new MotionScope();
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const context = ctx;
  const originals = Array.from(root.querySelectorAll<HTMLElement | SVGElement>("[data-depth], [data-cue], [data-horizon-wash]")).map(el => [el, el.getAttribute("style")] as const);
  const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]"));
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = preference.matches;
  let frame = 0, introFrame = 0, requested = 0, introProgress = 0;
  let pointerX = 0, stopped = false;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  function apply() {
    const y = window.scrollY;
    const p = Math.max(Math.min(1.4, y / (Math.max(1, window.innerHeight) * 0.8)), introProgress);
    const t = reduced ? 0 : performance.now();
    for (const el of layers) {
      const d = Number(el.dataset.depth) || 0;
      const dx = reduced ? 0 : pointerX * -8 * d + Math.sin(t / 11000 + d * 3) * 5 * d;
      const dy = reduced ? 0 : -y * d * 0.2 + Math.cos(t / 15000 + d * 2) * 2 * d;
      el.style.transform = `translate3d(${dx.toFixed(2)}px,${dy.toFixed(2)}px,0)`;
      const order = Number(el.dataset.order);
      if (current === "garden" && order >= 0) el.style.opacity = reduced ? "1" : clamp((p - order * 0.72) / 0.34).toFixed(3);
      if (current === "future" && order >= .2) {
        const start = .12 + (.72 - Math.min(.72, order)) * 1.15;
        el.style.opacity = reduced ? "1" : clamp(1 - (p - start) / .5).toFixed(3);
      }
    }
    const wash = root.querySelector<HTMLElement>("[data-horizon-wash]");
    if (wash) wash.style.opacity = reduced ? "0" : String(Math.min(.85, Math.max(0, (p - .25) / .7)));
  }
  function schedule() {
    if (requested || stopped) return;
    requested = requestAnimationFrame(() => { requested = 0; apply(); });
  }
  function resize() {
    const r = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(innerWidth * r));
    canvas.height = Math.max(1, Math.round(innerHeight * r));
    context.setTransform(r, 0, 0, r, 0, 0);
    schedule();
  }
  function pointer(event: PointerEvent) {
    if (reduced) return;
    pointerX = (event.clientX / Math.max(1, innerWidth) - 0.5) * 2;
    schedule();
  }
  let tick = 0;
  function atmosphere() {
    if (stopped || reduced || document.hidden) { frame = 0; return; }
    if ((tick++ % 5) === 0) apply();
    context.clearRect(0, 0, innerWidth, innerHeight);
    frame = requestAnimationFrame(atmosphere);
  }
  function resume() {
    cancelAnimationFrame(frame); frame = 0;
    if (!reduced && !document.hidden) { frame = requestAnimationFrame(atmosphere); }
  }
  function changePreference() {
    reduced = preference.matches;
    if (reduced) { cancelAnimationFrame(introFrame); introFrame = 0; introProgress = 0.66; context.clearRect(0, 0, innerWidth, innerHeight); }
    if (reduced) finishSignature();
    apply(); resume();
  }
  const start = performance.now();
  function intro(now: number) {
    if (stopped || reduced) return;
    const t = Math.min(1, (now - start) / 2600);
    introProgress = 0.66 * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    apply();
    if (t < 1) introFrame = requestAnimationFrame(intro);
  }
  resize(); apply();
  if (!reduced && current === "garden") introFrame = requestAnimationFrame(intro);
  const cued = Array.from(root.querySelectorAll<SVGElement>("[data-cue]")).sort((a, b) => Number(a.dataset.cue) - Number(b.dataset.cue));
  const opacity = new Map(cued.map(el => [el, el.style.opacity || "1"]));
  let fired = false;
  function finishSignature() { cued.forEach(el => { el.style.opacity = opacity.get(el) ?? "1"; el.style.transform = "none"; }); }
  if (!reduced && cued.length) {
    const converge = current === "leader";
    cued.forEach(el => {
      el.style.opacity = "0"; el.style.transformBox = "fill-box"; el.style.transformOrigin = converge ? "50% 0%" : "50% 100%";
      el.style.transform = converge ? "scaleX(.12)" : "translateY(14px)";
      el.style.transition = "opacity 820ms ease, transform 1000ms cubic-bezier(.2,.7,.2,1)";
    });
    const fire = () => {
      if (fired) return; fired = true;
      cued.forEach((el, i) => scope.after(i * (converge ? 320 : 130), () => { el.style.opacity = opacity.get(el) ?? "1"; el.style.transform = "none"; }));
    };
    scope.listen(window, "scroll", () => { if (scrollY > innerHeight * .3) fire(); }, { passive: true });
    scope.after(2600, fire);
    if (scrollY > innerHeight * .3) fire();
  }
  resume();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", pointer, { passive: true });
  preference.addEventListener("change", changePreference);
  document.addEventListener("visibilitychange", resume);
  return () => {
    stopped = true;
    scope.dispose();
    [frame, introFrame, requested].forEach(cancelAnimationFrame);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", pointer);
    preference.removeEventListener("change", changePreference);
    document.removeEventListener("visibilitychange", resume);
    originals.forEach(([el, value]) => value === null ? el.removeAttribute("style") : el.setAttribute("style", value));
  };
}
