import Link from "next/link";
import { StayLink } from "../native/StayLink";
import { CinematicTitle } from "./CinematicTitle";
import styles from "./garden.module.css";

/** Six readable Garden beats; the GLB camera reads the same score bands. */
export function GardenRuntimeContent() {
  return <div className={styles.garden}>
    <picture className={styles.fallbackPoster}>
      <source media="(max-width: 767px)" srcSet="/assets/stay/v1/garden-mobile.webp" />
      <img src="/assets/stay/v1/garden-desktop.webp" alt="" />
    </picture>
    <section data-stay-beat="garden-b01" data-from="0" data-to="0.12" className={`${styles.beat} ${styles.center}`} aria-labelledby="garden-title">
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Adharsh Vijayakarthy · Experience 02</p>
        <CinematicTitle as="h1" id="garden-title" text="Stay Awhile" reveal="masked" />
        <p className={styles.lead}>Take your time.</p>
      </div>
    </section>
    <section data-stay-beat="garden-b02" data-from="0.12" data-to="0.26" className={`${styles.beat} ${styles.center}`} aria-labelledby="garden-enter">
      <div className={styles.copy}>
        <h2 id="garden-enter">Scroll to enter the garden</h2>
        <p>A slower way through the work, the questions behind it, and the person still becoming.</p>
      </div>
    </section>
    <section data-stay-beat="garden-b03" data-from="0.26" data-to="0.42" className={`${styles.beat} ${styles.left}`} aria-labelledby="garden-place">
      <div className={styles.copy}>
        <CinematicTitle as="h2" id="garden-place" text="A place, rather than a page." reveal="environmental" exit />
        <p>Walk in whichever direction you like.</p>
      </div>
    </section>
    <section data-stay-beat="garden-b04" data-from="0.42" data-to="0.64" className={`${styles.beat} ${styles.right}`} aria-labelledby="garden-nine">
      <div className={styles.copy}>
        <CinematicTitle as="h2" id="garden-nine" text="Nine places" reveal="groups" groups={["Nine", "places"]} />
        <p>Each one is its own page.</p>
      </div>
    </section>
    <section data-stay-beat="garden-b05" data-from="0.64" data-to="0.84" className={`${styles.beat} ${styles.left}`} aria-labelledby="garden-choose">
      <div className={styles.copy}>
        <h2 id="garden-choose">Choose a path</h2>
        <p>Nothing here scrolls into the next place. When a page ends, it ends — you leave when you decide to.</p>
        <nav className={styles.paths} aria-label="Garden paths">
          <StayLink href="/stay/person/">The Person <span>Open clearing</span></StayLink>
          <StayLink href="/stay/builder/">The Builder <span>Timber frame</span></StayLink>
          <StayLink href="/stay/contact/">Contact <span>Open garden</span></StayLink>
        </nav>
      </div>
    </section>
    <section data-stay-beat="garden-b06" data-from="0.84" data-to="1" className={`${styles.beat} ${styles.center}`} aria-labelledby="garden-stay">
      <div className={styles.copy}>
        <h2 id="garden-stay">Stay as long as you like</h2>
        <p>Quick Discovery is next door if you would rather have the summary.</p>
        <Link prefetch={false} className={styles.quick} href="/quick/">Quick Discovery · 90 seconds ↗</Link>
      </div>
    </section>
  </div>;
}
