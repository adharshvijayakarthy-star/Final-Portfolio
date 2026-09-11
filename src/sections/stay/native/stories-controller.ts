import { all, one, show, type DestinationController, type VisualElement } from "./motion-scope";

export const startStories: DestinationController = (root, scope, reduced) => {
  if (reduced) return;
  const stops = all(root, "[data-stop]");
  const pending = new WeakMap<Element, number>();
  stops.forEach(stop => {
    const text = one(stop, "[data-reveal]"), lamp = one(stop, "[data-lamp]");
    if (text) Object.assign(text.style, { opacity: "0", transform: "translateY(22px)", transition: "opacity 1100ms cubic-bezier(0.22,0.61,0.36,1), transform 1300ms cubic-bezier(0.22,0.61,0.36,1)" });
    if (lamp) Object.assign(lamp.style, { opacity: "0.3", transition: "opacity 1400ms ease, filter 600ms ease" });
  });
  const io = scope.observe(entries => entries.forEach(entry => {
    const text = one(entry.target, "[data-reveal]"), lamp = one(entry.target, "[data-lamp]");
    const timer = pending.get(entry.target);
    if (timer) scope.cancelTimer(timer);
    if (entry.isIntersecting) {
      if (lamp) lamp.style.opacity = "1";
      if (text) pending.set(entry.target, scope.after(340, () => show(text)));
    } else {
      const behind = entry.boundingClientRect.top < 0;
      if (lamp) lamp.style.opacity = behind ? "0.5" : "0.3";
      if (text && behind) text.style.opacity = "0.22";
    }
  }), { threshold: 0.32, rootMargin: "-4% 0px -10% 0px" });
  stops.forEach(stop => io.observe(stop));
  const beats = all(root, "[data-beat]");
  beats.forEach(beat => Object.assign(beat.style, { opacity: "0", transform: "translateY(12px)", transition: "opacity 950ms cubic-bezier(0.22,0.61,0.36,1), transform 1100ms cubic-bezier(0.22,0.61,0.36,1)" }));
  const bio = scope.observe((entries, owner) => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    owner.unobserve(entry.target);
    let index = 0, previous = entry.target.previousElementSibling;
    while (previous?.hasAttribute("data-beat")) { index++; previous = previous.previousElementSibling; }
    scope.after(260 + index * 780, () => show(entry.target as VisualElement));
  }), { threshold: 0.9 });
  beats.forEach(beat => bio.observe(beat));
  const lamps = all(root, "[data-lamp]");
  let queued = false, x = 0, y = 0;
  scope.listen(window, "mousemove", ((event: MouseEvent) => {
    x = event.clientX; y = event.clientY;
    if (queued) return;
    queued = true;
    scope.frame(() => {
      queued = false;
      lamps.forEach(lamp => {
        const rect = lamp.getBoundingClientRect();
        const distance = Math.hypot(x - rect.left - rect.width / 2, y - rect.top - 40);
        const near = distance < 240 ? 1 - distance / 240 : 0;
        lamp.style.filter = near > 0.01 ? `brightness(${(1 + near * 0.14).toFixed(3)})` : "";
      });
    });
  }) as EventListener, { passive: true });
};
