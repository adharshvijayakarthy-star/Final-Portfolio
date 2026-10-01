"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useStayExperience } from "./StayExperienceProvider";
import styles from "./stay-world.module.css";

/** In the navigation's DOM order: Home, Map, motion controls, then the story. */
export function StayMotionControls() {
  const experience = useStayExperience();
  const [reduced, setReduced] = useState(false);
  const readingAnchor = useRef<{ section: HTMLElement; fraction: number } | null>(null);
  useLayoutEffect(() => {
    const anchor = readingAnchor.current;
    readingAnchor.current = null;
    if (!anchor?.section.isConnected) return;
    const next = anchor.section.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + next.top + next.height * anchor.fraction - window.innerHeight * .54, behavior: "instant" });
  }, [experience?.quiet]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  if (!experience?.registration || reduced) return null;
  const setQuietKeepingPlace = () => {
    const line = window.innerHeight * .54;
    const sections = [...experience.registration!.root.querySelectorAll<HTMLElement>("section[data-stay-beat]")];
    const active = sections.find(section => {
      const box = section.getBoundingClientRect();
      return box.top <= line && box.bottom >= line;
    }) ?? sections[0];
    const box = active?.getBoundingClientRect();
    const fraction = box ? Math.max(0, Math.min(1, (line - box.top) / Math.max(1, box.height))) : 0;
    readingAnchor.current = active ? {section:active,fraction} : null;
    experience.setQuiet(!experience.quiet);
  };
  return <>
    {!experience.quiet && <button type="button" className={styles.pause} aria-pressed={experience.ambientPaused}
      onClick={() => experience.setAmbientPaused(!experience.ambientPaused)}>
      {experience.ambientPaused ? "Resume ambient motion" : "Pause ambient motion"}
    </button>}
    <button type="button" className={styles.quiet} onClick={setQuietKeepingPlace}>
      {experience.quiet ? "Use the 3D garden" : "Read without motion"}
    </button>
  </>;
}
