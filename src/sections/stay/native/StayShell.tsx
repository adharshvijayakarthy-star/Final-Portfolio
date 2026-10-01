"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import type { StayDestination } from "./destinations";
import { GardenNav } from "./GardenNav";
import styles from "./stay.module.css";
import { useStayExperience } from "../world/StayExperienceProvider";
import "./reference.module.css";
import "./stay-keyframes.css";

// Preserve the pre-existing Quick → Stay evidence URLs and their current content.
const legacyAnchors = new Set(["study-planner", "past-paper-logger", "mun-club", "project-aura", "work", "notes", "beyond", "contact"]);
function hash() { return window.location.hash.slice(1); }
function subscribe(fn: () => void) {
  window.addEventListener("hashchange", fn); window.addEventListener("popstate", fn);
  return () => { window.removeEventListener("hashchange", fn); window.removeEventListener("popstate", fn); };
}
export function StayShell({ children, legacy, current = "garden" }: { children: ReactNode; legacy?: ReactNode; current?: StayDestination }) {
  const legacyRoot = useRef<HTMLDivElement>(null);
  const quiet = useStayExperience()?.quiet ?? false;
  const anchor = useSyncExternalStore(subscribe, hash, () => "");
  const showLegacy = current === "garden" && !!legacy && legacyAnchors.has(anchor);
  useEffect(() => {
    if (!showLegacy) return;
    const frame = requestAnimationFrame(() => {
      // The legacy container owns this query; never select another experience.
      legacyRoot.current?.querySelector<HTMLElement>(`[id="${anchor}"]`)?.scrollIntoView({ behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [anchor, showLegacy]);
  if (showLegacy) return <div ref={legacyRoot} id="stay-legacy">{legacy}</div>;
  return <div className={styles.stay} data-stay-native data-destination={current} data-stay-quiet={quiet ? "true" : undefined}>
    <GardenNav current={current} />{children}
  </div>;
}
