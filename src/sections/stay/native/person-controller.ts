import { all, one, show, type DestinationController } from "./motion-scope";

export const startPerson: DestinationController = (root, scope, reduced) => {
  if (reduced) return;
  const steps = all(root, "[data-step]");
  steps.forEach(step => all(step, "[data-reveal]").forEach(el => {
    el.style.opacity = "0"; el.style.transform = "translateY(20px)";
    el.style.transition = "opacity 1000ms cubic-bezier(.22,.61,.36,1), transform 1200ms cubic-bezier(.22,.61,.36,1)";
  }));
  const pending = new Map<Element, number[]>();
  const observer = scope.observe(entries => entries.forEach(entry => {
    (pending.get(entry.target) ?? []).forEach(id => scope.cancelTimer(id));
    const own = all(entry.target, "[data-reveal]");
    if (entry.isIntersecting) pending.set(entry.target, own.map((el, i) => scope.after(140 + i * 260, () => show(el))));
    else if (entry.boundingClientRect.top < 0) own.forEach(el => { el.style.opacity = ".34"; });
  }), { threshold: .3, rootMargin: "-6% 0px -14% 0px" });
  steps.forEach(step => observer.observe(step));
  const foreground = one(root, "[data-fg]");
  if (foreground) {
    foreground.style.transition = "opacity 600ms ease";
    let scheduled = false;
    const update = () => {
      if (scheduled) return; scheduled = true;
      scope.frame(() => {
        scheduled = false;
        const p = Math.min(scrollY / (innerHeight * .95), 1), e = p * p * (3 - 2 * p);
        foreground.style.transform = `translate(${-42 * e}%,${-26 * e}%) scale(${1 + e * .18})`;
        foreground.style.opacity = String(1 - e * .55);
      });
    };
    scope.listen(window, "scroll", update, { passive: true }); update();
  }
  const joins = Array.from(root.querySelectorAll<SVGPathElement>("[data-second]"));
  joins.forEach(path => {
    const length = path.getTotalLength(); path.style.strokeDasharray = String(length); path.style.strokeDashoffset = String(length);
    path.style.transition = "stroke-dashoffset 1600ms cubic-bezier(.3,.1,.25,1)";
  });
  const joinObserver = scope.observe((entries, owner) => entries.forEach(entry => {
    if (!entry.isIntersecting) return; owner.unobserve(entry.target);
    scope.after(500, () => { (entry.target as SVGPathElement).style.strokeDashoffset = "0"; });
  }), { threshold: .6 });
  joins.forEach(path => joinObserver.observe(path));
  const leaves = foreground ? all(foreground, "[data-leaf]") : [];
  leaves.forEach(leaf => { leaf.style.transition = "transform 900ms cubic-bezier(.22,.61,.36,1)"; });
  let mx = 0, my = 0, scheduled = false;
  scope.listen(window, "mousemove", event => {
    mx = (event as MouseEvent).clientX; my = (event as MouseEvent).clientY;
    if (scheduled) return; scheduled = true;
    scope.frame(() => {
      scheduled = false;
      leaves.forEach(leaf => {
        const r = leaf.getBoundingClientRect(), dx = r.left + r.width / 2 - mx, dy = r.top + r.height / 2 - my;
        const distance = Math.hypot(dx, dy) || 1, k = distance < 150 ? (1 - distance / 150) * 5.5 : 0;
        leaf.style.transform = `rotate(${leaf.dataset.rot ?? 0}deg)${k ? ` translate(${dx / distance * k}px,${dy / distance * k}px)` : ""}`;
      });
    });
  }, { passive: true });
};
