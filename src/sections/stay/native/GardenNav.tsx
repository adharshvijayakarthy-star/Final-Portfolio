"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { GardenMap } from "./GardenMap";
import styles from "./stay.module.css";
import nodes from "./map-nodes.json";
import type { StayDestination } from "./destinations";
import { useStayNavigation } from "./StayNavigation";

export function GardenNav({ current = "garden" }: { current?: StayDestination }) {
  const place = nodes.find(node => node.id === current) ?? nodes[0]!;
  const navigation = useStayNavigation()!;
  const { open, close, openMap } = navigation;
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    function key(event: KeyboardEvent) {
      const target = event.target;
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat ||
        (target instanceof HTMLElement && (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName)))) return;
      if (event.key.toLowerCase() === "m") { event.preventDefault(); if (open) close(); else openMap(); }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, close, openMap]);
  return <>
    <div className={styles.veil} aria-hidden="true" />
    <header className={styles.nav}>
      <Link prefetch={false} className={styles.plate} href="/">Aura</Link>
      <button ref={button} type="button" className={styles.plate} aria-expanded={open} aria-label="Open the garden map" onClick={openMap}><span className={styles.mapIcon} />Map</button>
    </header>
    <div className={styles.location} aria-hidden="true"><div className={styles.locationPlate}>
      <span className={styles.ordinal}>{place.num}</span><span className={styles.locationText}><span>{place.name}</span><small>{place.sub}</small></span>
    </div></div>
    {open && <GardenMap current={current} close={close} />}
  </>;
}
