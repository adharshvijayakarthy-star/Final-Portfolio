import { stageOffset } from "./continuity";

/** Only chapter clicks use this clock. Wheel/touch scrolling stays native. */
export function navigationDuration(distance: number, viewport: number): number {
  return Math.min(4600, 650 + Math.sqrt(Math.abs(distance) / Math.max(1, viewport)) * 600);
}

export function bindChapterNavigation(root: HTMLElement, reduced: () => boolean): () => void {
  let frame = 0;
  let hashFrame = 0;
  let hashInnerFrame = 0;
  let cancelled = false;
  let previousBehavior = "";
  let disposed = false;
  const html = document.documentElement;
  const stop = () => {
    if (!frame) return;
    cancelled = true;
    cancelAnimationFrame(frame);
    frame = 0;
    html.style.scrollBehavior = previousBehavior;
    delete root.dataset["navigating"];
    delete root.dataset["destination"];
  };
  const key = (e: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Escape", "Tab"].includes(e.key)) stop();
  };
  const arrival = (link: HTMLAnchorElement, target: HTMLElement) => {
    const top = target.getBoundingClientRect().top + window.scrollY;
    const progress = reduced() ? 0 : Number(link.dataset["arrival"] || 0);
    return Math.min(document.documentElement.scrollHeight - innerHeight,
      Math.max(0, top + stageOffset(progress, target.offsetHeight, innerHeight) - (reduced() ? 100 : 0)));
  };
  const navigate = (e: MouseEvent) => {
    const link = (e.target as Element).closest<HTMLAnchorElement>("[data-chip]");
    if (!link || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    e.preventDefault();
    stop();
    const from = window.scrollY, to = arrival(link, target);
    const duration = reduced() ? 0 : navigationDuration(to - from, innerHeight);
    previousBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    cancelled = false;
    root.dataset["navigating"] = "true";
    root.dataset["destination"] = link.dataset["chip"] || "";
    const start = performance.now();
    const tick = (now: number) => {
      if (cancelled) return;
      const p = duration ? Math.min(1, (now - start) / duration) : 1;
      const eased = p*p*p*(p*(p*6-15)+10);
      window.scrollTo({ top: from + (to - from) * eased, behavior: "instant" });
      if (p < 1) frame = requestAnimationFrame(tick);
      else {
        frame = 0;
        html.style.scrollBehavior = previousBehavior;
        delete root.dataset["navigating"];
    delete root.dataset["destination"];
        if (location.hash !== link.hash) history.pushState(history.state, "", link.hash);
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
    };
    frame = requestAnimationFrame(tick);
  };
  const onFocus = (e: FocusEvent) => {
    const link = (e.target as Element).closest<HTMLElement>("[data-deeper]");
    const stage = link?.closest<HTMLElement>("[data-stage]");
    if (!link || !stage || reduced()) return;
    const viewport = stage.firstElementChild?.getBoundingClientRect();
    const bounds = link.getBoundingClientRect();
    if (!viewport || bounds.top >= 0 && bounds.bottom <= innerHeight && Number(getComputedStyle(link.parentElement!).opacity) > .8) return;
    stop();
    window.scrollTo({ top: stage.getBoundingClientRect().top + scrollY + .99 * (stage.offsetHeight - innerHeight), behavior: "instant" });
  };
  // Native hash scrolling includes the global scroll padding and can still be
  // in flight. Resolve known chapter hashes to their readable arrival pose.
  const settleHash = () => {
    if (disposed) return;
    cancelAnimationFrame(hashFrame); cancelAnimationFrame(hashInnerFrame);
    hashFrame = requestAnimationFrame(() => { hashInnerFrame = requestAnimationFrame(() => {
      if (disposed || !location.hash) return;
      const target = document.getElementById(location.hash.slice(1));
      const link = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-chip]')).find(a => a.hash === location.hash);
      if (!target || !link) return;
      window.scrollTo({top: arrival(link, target), behavior: 'instant'});
    }); });
  };
  void document.fonts.ready.then(settleHash);
  window.addEventListener('hashchange', settleHash);
  window.addEventListener('popstate', settleHash);
  root.addEventListener("click", navigate);
  root.addEventListener("focusin", onFocus);
  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("pointerdown", stop, { passive: true });
  window.addEventListener("keydown", key);
  window.addEventListener("popstate", stop);
  window.addEventListener("resize", stop);
  const onVisibility = () => { if (document.hidden) stop(); };
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    disposed = true;
    cancelAnimationFrame(hashFrame); cancelAnimationFrame(hashInnerFrame);
    stop();
    root.removeEventListener("click", navigate);
    root.removeEventListener("focusin", onFocus);
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("pointerdown", stop);
    window.removeEventListener("keydown", key);
    window.removeEventListener("popstate", stop);
    window.removeEventListener("resize", stop);
    window.removeEventListener('popstate', settleHash);
    window.removeEventListener('hashchange', settleHash);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
