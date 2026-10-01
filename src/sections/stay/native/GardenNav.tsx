"use client";

import Link from "next/link";
import { GardenMap } from "./GardenMap";
import styles from "./stay.module.css";
import nodes from "./map-nodes.json";
import type { StayDestination } from "./destinations";
import { useStayNavigation } from "./StayNavigation";
import { StayMotionControls } from "../world/StayMotionControls";
import { destinations } from "./destinations";

export function GardenNav({ current = "garden" }: { current?: StayDestination }) {
  const place = nodes.find(node => node.id === current) ?? nodes[0]!;
  const navigation = useStayNavigation()!;
  const { open, close, openMap } = navigation;
  return <>
    <div className={styles.veil} aria-hidden="true" />
    <header className={styles.nav}>
      <Link prefetch={false} className={styles.plate} href="/">Aura</Link>
      <button type="button" className={styles.plate} aria-expanded={open} aria-keyshortcuts="M" aria-label="Open the garden map (M)" onClick={openMap}><span className={styles.mapIcon} />Map</button>
      <StayMotionControls />
    </header>
    <noscript><style>{'button[aria-keyshortcuts="M"]{display:none}'}</style><details className={styles.fallbackAtlas}><summary>All garden paths</summary><nav aria-label="Garden paths without JavaScript">
      {destinations.map(destination => <a href={destination.route} key={destination.id}>{nodes.find(node => node.id === destination.id)?.name ?? destination.id}</a>)}
    </nav></details></noscript>
    <div className={styles.location} aria-hidden="true"><div className={styles.locationPlate}>
      <span className={styles.ordinal}>{place.num}</span><span className={styles.locationText}><span>{place.name}</span><small>{place.sub}</small></span>
    </div></div>
    {open && <GardenMap current={current} close={close} />}
  </>;
}
