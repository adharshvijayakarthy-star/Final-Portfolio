"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import geometry from "./garden-geometry.json";
import { startGarden } from "./garden-controller";
import styles from "./stay.module.css";
import type { StayDestination } from "./destinations";

type Mark = { d: string; st: CSSProperties; cue?: number };
type Plane = { depth: number; order: number; anchor: CSSProperties; vb: string; marks: Mark[] };
type Wash = { depth: number; order: number; style: CSSProperties };
export type SceneGeometry = { washes: Wash[]; planes: Plane[]; water?: number | null };

/** The reference's authored Garden SVG geometry, with React owning the DOM. */
export function GardenScene({ current = "garden", scene = geometry as SceneGeometry }: { current?: StayDestination; scene?: SceneGeometry }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!root.current || !canvas.current) return;
    return startGarden(root.current, canvas.current, { current, water: scene.water ?? null });
  }, [current, scene]);
  return <div ref={root} className={styles.scene} aria-hidden="true" data-stay-scene>
    {scene.washes.map((wash, i) => <div key={`wash-${i}`} data-depth={wash.depth} data-order={wash.order} style={wash.style} />)}
    {scene.planes.map((plane, i) => <div key={`plane-${i}`} data-depth={plane.depth} data-order={plane.order} className={styles.plane}>
      <div style={plane.anchor}><svg viewBox={plane.vb} preserveAspectRatio="none" className={styles.planeSvg}>
        {plane.marks.map((mark, j) => <path key={j} d={mark.d} data-cue={mark.cue} style={mark.st} />)}
      </svg></div>
    </div>)}
    {current === "future" && <div data-horizon-wash className={styles.horizonWash} />}
    <canvas ref={canvas} className={styles.atmosphere} />
    <div className={styles.vignette} />
  </div>;
}
