import { all, one, show, type DestinationController } from "./motion-scope";

export const startThinker: DestinationController = (root, scope, reduced) => {
  if (reduced) return;
  all(root, "[data-reveal],[data-stone]").forEach(el => {
    el.style.opacity = "0"; el.style.transform = el.hasAttribute("data-stone") ? "translateY(14px)" : "translateY(18px)";
    el.style.transition = "opacity 900ms cubic-bezier(.22,.61,.36,1), transform 1100ms cubic-bezier(.22,.61,.36,1)";
  });
  const seen = new WeakSet<Element>();
  const reveal = (el: HTMLElement | SVGElement, delay: number) => {
    if (seen.has(el)) return; seen.add(el); scope.after(delay, () => show(el));
  };
  const observer = scope.observe((entries, owner) => entries.forEach(entry => {
    if (!entry.isIntersecting) return; owner.unobserve(entry.target);
    const items = all(entry.target, "[data-reveal]");
    if (entry.target.getAttribute("data-moment") === "1") {
      const petal = one(entry.target, "[data-petal]");
      if (petal) petal.style.animation = "stay-thinker-dropIn 1500ms cubic-bezier(.4,.02,.6,1) both";
      scope.after(1320, () => all(entry.target, "[data-ring]").forEach((ring, i) => {
        ring.style.animation = `stay-thinker-ringOut ${3400 + i * 400}ms ${i * 260}ms cubic-bezier(.16,.7,.3,1) forwards`;
      }));
      items.forEach((el, i) => reveal(el, 1560 + i * 320));
    } else items.forEach((el, i) => reveal(el, 120 + i * 240));
    all(entry.target, "[data-stone]").forEach((el, i) => reveal(el, 260 + i * 150));
  }), { threshold: .28 });
  all(root, "[data-moment]").forEach(section => observer.observe(section));
};
