/** Carry the existing crystal into the matching opening monolith. */
export function bindQuickMorph(scene: HTMLElement, openQuick: () => void): () => void {
  let busy = false;
  let routeStarted = false;
  let cancelCurrent: (() => void) | undefined;
  const click = (event: MouseEvent) => {
    const source = (event.target as Element).closest<HTMLElement>('[data-disc="quick"]');
    if (busy && !source && (event.target as Element).closest('a')) cancelCurrent?.();
    if (!source || event.button || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    busy = true;

    const rect = source.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.dataset['auraMorph'] = 'true';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.inert = true;
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden';
    const backdrop = document.createElement('div');
    backdrop.style.cssText = 'position:absolute;inset:0;background:#070709;opacity:0';
    const crystal = document.createElement('div');
    crystal.innerHTML = source.innerHTML;
    const originals = [source, ...source.querySelectorAll<HTMLElement>('*')];
    const copies = [crystal, ...crystal.querySelectorAll<HTMLElement>('*')];
    originals.forEach((node, i) => {
      const copy = copies[i]!;
      const style = getComputedStyle(node);
      for (let p = 0; p < style.length; p++) {
        const property = style.item(p);
        copy.style.setProperty(property, style.getPropertyValue(property));
      }
      copy.removeAttribute('id');
      copy.style.animation = 'none';
      copy.style.transition = 'none';
    });
    const w = source.offsetWidth, h = source.offsetHeight;
    Object.assign(crystal.style, {position: 'absolute', left: '0', top: '0', margin: '0', width: `${w}px`, height: `${h}px`, transformOrigin: '0 0', visibility: 'visible'});
    overlay.append(backdrop, crystal);
    document.body.append(overlay);
    source.style.visibility = 'hidden';
    const transform = (x: number, y: number, width: number, height: number) => `translate(${x}px,${y}px) scale(${width / w},${height / h})`;
    const targetW = 246 * .9, targetH = 382 * .9;
    const flight = crystal.animate([
      {transform: transform(rect.x, rect.y, rect.width, rect.height)},
      {transform: transform(innerWidth / 2 - targetW / 2, innerHeight * .46 - targetH / 2, targetW, targetH)},
    ], {duration: 1050, easing: 'cubic-bezier(.3,.05,.2,1)', fill: 'forwards'});
    backdrop.animate([{opacity: 0}, {opacity: 0, offset: .35}, {opacity: 1}], {duration: 680, fill: 'forwards'});
    // The same surface loses its inscription while the surrounding shards pull inward.
    crystal.querySelector<HTMLElement>('[data-disc-copy]')?.animate([
      {transform: 'translateY(0) scale(1)', opacity: 1},
      {transform: 'translateY(-24px) scale(.78)', opacity: 0},
    ], {duration: 620, fill: 'forwards', easing: 'cubic-bezier(.3,0,.2,1)'});
    const worldAnimations = Array.from(scene.querySelectorAll<HTMLElement>('[data-scene-layer], [data-threshold-copy]')).filter(n => n.getBoundingClientRect().width).map(node => {
      const box = node.getBoundingClientRect(), current = getComputedStyle(node).transform;
      return node.animate([
        {transform: current === 'none' ? 'translate(0,0)' : current, opacity: getComputedStyle(node).opacity},
        {transform: `translate(${(innerWidth / 2 - box.x - box.width / 2) * .32}px,${(innerHeight * .46 - box.y - box.height / 2) * .32}px) scale(.82)`, opacity: 0},
      ], {duration: 700, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards'});
    });

    let routed = false, done = false, handingOff = false;
    const route = () => { if (!routed) { routed = true; routeStarted = true; openQuick(); } };
    const routeTimer = window.setTimeout(route, 650);
    const cleanup = () => {
      if (done) return;
      done = true;
      clearTimeout(routeTimer);
      clearTimeout(safetyTimer);
      observer.disconnect();
      overlay.remove();
      flight.cancel();
      worldAnimations.forEach(a => a.cancel());
      source.style.removeProperty('visibility');
      window.removeEventListener('popstate', cleanup);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      window.removeEventListener('keydown', key);
      motionQuery.removeEventListener('change', interrupt);
      busy = false;
      cancelCurrent = undefined;
    };
    const handoff = async () => {
      if (done || handingOff || !document.querySelector('[data-qd-root][data-ready]')) return;
      handingOff = true;
      await flight.finished.catch(() => undefined);
      if (done) return;
      const mono = document.querySelector<HTMLElement>('[data-entry-mono]');
      if (mono) {
        const destination = mono.getBoundingClientRect();
        crystal.style.transform = transform(destination.x, destination.y, destination.width, destination.height);
        flight.cancel();
      }
      // Coincident silhouettes exchange material; there is no page-wide crossfade.
      backdrop.remove();
      await crystal.animate([{opacity: 1}, {opacity: 0}], {duration: 180, fill: 'forwards'}).finished.catch(() => undefined);
      cleanup();
    };
    const observer = new MutationObserver(() => void handoff());
    observer.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-ready']});
    const interrupt = () => { route(); cleanup(); };
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener('change', interrupt);
    const key = (e: KeyboardEvent) => { if (['Escape', 'Tab', 'ArrowDown', 'PageDown', ' '].includes(e.key)) interrupt(); };
    const safetyTimer = window.setTimeout(() => { route(); cleanup(); }, 4500);
    window.addEventListener('popstate', cleanup);
    window.addEventListener('wheel', interrupt, {passive: true});
    window.addEventListener('touchstart', interrupt, {passive: true});
    window.addEventListener('keydown', key);
    cancelCurrent = cleanup;
    void handoff();
  };
  scene.addEventListener('click', click, true);
  return () => {
    scene.removeEventListener('click', click, true);
    if (!routeStarted) cancelCurrent?.();
  };
}
