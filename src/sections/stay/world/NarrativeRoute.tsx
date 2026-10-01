import type { ReactNode } from "react";
import type { StayDestination } from "../native/destinations";
import { StayLink } from "../native/StayLink";
import { CinematicTitle, type CinematicReveal } from "./CinematicTitle";
import styles from "./journey.module.css";

export type NarrativeBeat = {
  id: string; band: readonly [number, number]; heading: string; label: string;
  paragraphs: readonly string[]; reveal?: CinematicReveal;
  lines?: readonly string[]; detail?: ReactNode;
  exits?: readonly { href: string; label: string; place: string }[];
};

/** SSR carries the entire narrative. The runtime only enhances its score. */
export function NarrativeRoute({ id, beats }: { id: StayDestination; beats: readonly NarrativeBeat[] }) {
  return <div className={styles.journey}>
    <picture className={styles.poster}>
      <source media="(max-width: 767px)" srcSet={`/assets/stay/v1/${id}-mobile.webp`} />
      <img src={`/assets/stay/v1/${id}-desktop.webp`} alt="" />
    </picture>
    {beats.map((beat, index) => <section key={beat.id} id={beat.id} data-stay-beat={beat.id}
      data-from={beat.band[0]} data-to={beat.band[1]} className={styles.beat} aria-labelledby={`${beat.id}-heading`}>
      <div className={styles.copy}>
        <p data-eyebrow className={styles.eyebrow}>{beat.label}</p>
        <CinematicTitle as={index === 0 ? "h1" : "h2"} id={`${beat.id}-heading`} text={beat.heading}
          reveal={beat.reveal} lines={beat.lines} />
        {beat.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        {beat.detail}
        {beat.exits && <nav aria-label="Paths onward" className={styles.exits}>
          {beat.exits.map(exit => <StayLink href={exit.href} key={exit.href}>{exit.label}<span>{exit.place}</span></StayLink>)}
        </nav>}
      </div>
    </section>)}
  </div>;
}
