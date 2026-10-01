"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import marks from "./map-geometry.json";
import nodes from "./map-nodes.json";
import { destinations, type StayDestination } from "./destinations";
import styles from "./stay.module.css";
import { useStayNavigation } from "./StayNavigation";
import { curve, edges, positionPercent, travelPath } from "./map-topology";
import { MotionScope } from "./motion-scope";
import { StayLink } from "./StayLink";

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
    if (!target || target === current || !path || !dot) return;
    const scope = new MotionScope(); let finished = false;
    path.setAttribute("d", travelPath(current, target));
    const length = path.getTotalLength();
    if (length <= 0) { arrive(); return; }
    path.style.strokeDasharray = `${length} ${length}`; path.style.strokeDashoffset = String(length); path.style.opacity = ".92";
    const place = (progress: number) => { const p = path.getPointAtLength(length * progress); dot.style.left = `${positionPercent(p.x)}%`; dot.style.top = `${positionPercent(p.y)}%`; };
    place(0);
    const finish = () => { if (finished) return; finished = true; path.style.strokeDashoffset = "0"; place(1); arrive(); };
    // Browser-owned animations share a single bounded travel timeline; no map RAF.
    const duration = 1150;
    const frames = Array.from({length:61}, (_,i) => {
      const p = path.getPointAtLength(length*i/60);
      return {left:`${positionPercent(p.x)}%`,top:`${positionPercent(p.y)}%`};
    });
    const dotAnimation = dot.animate(frames,{duration,easing:"cubic-bezier(.4,0,.2,1)",fill:"forwards"});
    const pathAnimation = path.animate([{strokeDashoffset:String(length)},{strokeDashoffset:"0"}],{duration,easing:"cubic-bezier(.4,0,.2,1)",fill:"forwards"});
    void dotAnimation.finished.then(()=>scope.after(200,finish),()=>{});
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    scope.listen(media, "change", () => { if (media.matches) finish(); });
    return () => { dotAnimation.cancel(); pathAnimation.cancel(); scope.dispose(); };
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
        {target && <button type="button" className={styles.close} onClick={() => arrive(true)}>Arrive now</button>}
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
            {nodes.map(n => <StayLink key={n.id} href={destinations.find(d => d.id === n.id)!.route}
              aria-label={n.aria} aria-current={n.id === current ? "page" : undefined}
              style={{ ...fontStyle(n.btnStyle), textDecoration: "none", cursor: n.id === current ? "default" : "pointer", opacity: target && target !== n.id ? .3 : 1 }} className={styles.mapNode}>
              <span style={{ ...fontStyle(n.dotStyle), background: visited.includes(n.id) || n.id === current ? "#f7f3ea" : "rgba(247,243,234,.14)" }} /><span style={{ ...fontStyle(n.labelStyle), color: n.id === current ? "#1d2318" : "#2f3828", borderBottom: n.id === current ? "1px solid rgba(29,35,24,.6)" : "none" }}>{n.name}</span>
            </StayLink>)}
            <div ref={marker} className={styles.marker} style={{ left: currentNode.btnStyle.left, top: currentNode.btnStyle.top }} aria-hidden="true"><span /><span /></div>
            <p className={styles.planCaption}>Overhead plan · not to scale</p>
          </div>
        </div>
        <nav className={styles.mapList} aria-label="Stay Awhile destinations">
          <p className={styles.listHeading}>All destinations</p>
          <ul className={styles.destinationList}>{nodes.map(n => <li key={n.id}><StayLink href={destinations.find(d => d.id === n.id)!.route}
            aria-current={n.id === current ? "page" : undefined}
            style={{ ...fontStyle(n.rowStyle), textDecoration: "none", background: n.id === current ? "rgba(61,76,58,.09)" : "transparent", cursor: n.id === current ? "default" : "pointer" }}>
            <span className={styles.nodeNumber}>{n.num}</span><span className={styles.nodeText}><span className={styles.nodeName}>{n.name}</span><span className={styles.nodeSub}>{n.sub}</span>{n.id === current ? <span className={styles.visitStatus}>Current location</span> : visited.includes(n.id) ? <span className={styles.visitStatus}>Visited</span> : null}</span><span style={{ ...fontStyle(n.tagStyle), color: n.id === current ? "#23291f" : "#8b9179" }}>{n.tag}</span>
          </StayLink></li>)}</ul>
          <p className={styles.availability}>Choose any destination. The plan traces the route; Arrive now skips the drawing.</p>
        </nav>
      </div>
    </div>
    <div className={styles.travelVeil} data-leaving={navigation.leaving} aria-hidden="true" />
  </dialog>;
}
