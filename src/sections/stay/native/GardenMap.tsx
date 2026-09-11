"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import marks from "./map-geometry.json";
import nodes from "./map-nodes.json";
import { destinations, type StayDestination } from "./destinations";
import styles from "./stay.module.css";
import { useStayNavigation } from "./StayNavigation";
import { curve, edges, positionPercent, travelPath } from "./map-topology";
import { MotionScope } from "./motion-scope";

function fontStyle(value: object): CSSProperties {
  const result = { ...value } as CSSProperties;
  if (result.fontFamily) result.fontFamily = result.fontFamily.replace("'IBM Plex Mono'", "var(--font-meta-face)");
  return result;
}

export function GardenMap({ current, close }: { current: StayDestination; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const travel = useRef<SVGPathElement>(null), marker = useRef<HTMLDivElement>(null);
  const navigation = useStayNavigation()!;
  const { target, arrive, visited, trails } = navigation;
  useEffect(() => {
    const path = travel.current, dot = marker.current;
    if (!target || !path || !dot) return;
    const scope = new MotionScope(); let finished = false;
    path.setAttribute("d", travelPath(current, target));
    const length = path.getTotalLength(); path.style.strokeDasharray = `${length} ${length}`; path.style.strokeDashoffset = String(length); path.style.opacity = ".92";
    const place = (progress: number) => { const p = path.getPointAtLength(length * progress); dot.style.left = `${positionPercent(p.x)}%`; dot.style.top = `${positionPercent(p.y)}%`; };
    place(0);
    const finish = () => { if (finished) return; finished = true; path.style.strokeDashoffset = "0"; place(1); arrive(); };
    const start = performance.now();
    const step = (now: number) => {
      if (finished) return;
      const t = Math.min(1, (now - start) / 1150), eased = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      path.style.strokeDashoffset = String(length * (1 - eased)); place(eased);
      if (t < 1) scope.frame(step); else scope.after(200, finish);
    };
    scope.frame(step);
    scope.listen(window, "pointerdown", finish, { capture: true });
    scope.listen(window, "keydown", event => { const e = event as KeyboardEvent; if (!["Escape", "m", "M"].includes(e.key)) finish(); }, { capture: true });
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    scope.listen(media, "change", () => { if (media.matches) finish(); });
    return () => scope.dispose();
  }, [target, current, arrive]);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    el.showModal();
    return () => { el.close(); };
  }, []);
  const currentNode = nodes.find(node => node.id === current) ?? nodes[0]!;
  return <dialog ref={dialog} className={styles.dialog} aria-label="Garden map" onCancel={event => { event.preventDefault(); close(); }}>
    <div className={styles.mapShell}>
      <div className={styles.mapHeading}>
        <div><p>Stay Awhile · overhead</p><h2>The garden from above</h2></div>
        <button type="button" autoFocus onClick={close} className={styles.close}>Close · esc</button>
      </div>
      <div className={styles.mapColumns}>
        <div className={styles.planColumn}>
          <div className={styles.plan} style={{ transformOrigin: `${currentNode.btnStyle.left} ${currentNode.btnStyle.top}` }}>
            <svg viewBox="-7 -7 114 114" preserveAspectRatio="none" className={styles.planSvg} aria-hidden="true">
              {marks.map((m, i) => <path key={i} d={m.d} style={m.st as CSSProperties} />)}
              {edges.map(([a, b], i) => trails.includes(`${a}>${b}`) || trails.includes(`${b}>${a}`) ? <path key={`${a}-${b}`} d={curve(a, b, ((i % 3) - 1) * 5 + 2)} fill="none" stroke="#3d4c3a" strokeWidth=".4" opacity=".5" strokeDasharray="1.4 2" /> : null)}
              <path ref={travel} d="M 0 0" fill="none" stroke="#2c3626" strokeWidth="1.1" strokeLinecap="round" opacity="0" />
            </svg>
            <div className={styles.planWash} />
            {nodes.map(n => <button key={n.id} type="button" onClick={() => navigation.go(destinations.find(d => d.id === n.id)!.route)}
              aria-label={n.aria} aria-current={n.id === current ? "page" : undefined}
              style={{ ...fontStyle(n.btnStyle), cursor: n.id === current ? "default" : "pointer", opacity: target && target !== n.id ? .3 : 1 }} className={styles.mapNode}>
              <span style={{ ...fontStyle(n.dotStyle), background: visited.includes(n.id) || n.id === current ? "#f7f3ea" : "rgba(247,243,234,.14)" }} /><span style={{ ...fontStyle(n.labelStyle), color: n.id === current ? "#1d2318" : "#2f3828", borderBottom: n.id === current ? "1px solid rgba(29,35,24,.6)" : "none" }}>{n.name}</span>
            </button>)}
            <div ref={marker} className={styles.marker} style={{ left: currentNode.btnStyle.left, top: currentNode.btnStyle.top }} aria-hidden="true"><span /><span /></div>
            <p className={styles.planCaption}>Overhead plan · not to scale</p>
          </div>
        </div>
        <nav className={styles.mapList} aria-label="Stay Awhile destinations">
          <p className={styles.listHeading}>All destinations</p>
          <ul className={styles.destinationList}>{nodes.map(n => <li key={n.id}><button type="button" onClick={() => navigation.go(destinations.find(d => d.id === n.id)!.route)}
            aria-current={n.id === current ? "page" : undefined}
            style={{ ...fontStyle(n.rowStyle), background: n.id === current ? "rgba(61,76,58,.09)" : "transparent", cursor: n.id === current ? "default" : "pointer" }}>
            <span className={styles.nodeNumber}>{n.num}</span><span className={styles.nodeText}><span className={styles.nodeName}>{n.name}</span><span className={styles.nodeSub}>{n.sub}</span></span><span style={{ ...fontStyle(n.tagStyle), color: n.id === current ? "#23291f" : "#8b9179" }}>{n.tag}</span>
          </button></li>)}</ul>
          <p className={styles.availability}>Choose a destination and the walk there is traced on the plan. Click, tap or press any key to arrive straight away.</p>
        </nav>
      </div>
    </div>
    <div className={styles.travelVeil} data-leaving={navigation.leaving} aria-hidden="true" />
  </dialog>;
}
