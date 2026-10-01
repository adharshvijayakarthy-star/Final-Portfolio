import { StayLink } from "../native/StayLink";
import { CinematicTitle, type CinematicReveal } from "./CinematicTitle";
import styles from "./person.module.css";

const beats: { id: string; from: number; to: number; heading: string; copy: string; reveal?: CinematicReveal | undefined; lines?: readonly string[] | undefined }[] = [
  { id: "person-b01", from: 0, to: .12, heading: "The Person", copy: "Before the projects, there is the person who keeps trying to build them.", reveal: "environmental" },
  { id: "person-b02", from: .12, to: .27, heading: "I am ambitious, and I would rather say so plainly.", copy: "I want to become exceptionally capable. Not capable in a way that looks good on a page, but capable in the way that means I can be handed a difficult problem and be trusted with it.", reveal: "tracking" },
  { id: "person-b03", from: .27, to: .4, heading: "Desire", copy: "Wanting something specific enough to work for it. Most of what I have built started as a want I couldn’t put down.", reveal: "landmark" },
  { id: "person-b04", from: .4, to: .53, heading: "Freedom", copy: "The ability to choose. Time, work, place, people. It is the reason the other four matter to me." },
  { id: "person-b05", from: .53, to: .66, heading: "Capability", copy: "Being genuinely good at difficult things, rather than adjacent to them. I am not there yet, and I know roughly where the gap is.", reveal: "masked" },
  { id: "person-b06", from: .66, to: .78, heading: "Experience", copy: "A life with things in it. I would take the version with failure in it over the version with nothing in it." },
  { id: "person-b07", from: .78, to: .9, heading: "People", copy: "Relationships I would still choose if nothing was gained from them. This is the part I am least willing to trade." },
  { id: "person-b08", from: .9, to: 1, heading: "What would it take to become someone I could genuinely admire?", copy: "And underneath most of it, one question.", reveal: "lines", lines: ["What would it take to become", "someone I could genuinely admire?"] },
];

export function PersonRuntimeContent() {
  return <div className={styles.person}>
    <picture className={styles.fallbackPoster}>
      <source media="(max-width: 767px)" srcSet="/assets/stay/v1/person-mobile.webp" />
      <img src="/assets/stay/v1/person-desktop.webp" alt="" />
    </picture>
    {beats.map((beat, index) => <section key={beat.id} data-stay-beat={beat.id} data-from={beat.from} data-to={beat.to}
      className={`${styles.beat} ${index % 2 ? styles.right : styles.left}`} aria-labelledby={`${beat.id}-heading`}>
      <div className={styles.copy}>
        {index === 0 && <p className={styles.label}>01 · Open clearing</p>}
        <CinematicTitle as={index === 0 ? "h1" : "h2"} id={`${beat.id}-heading`} text={beat.heading}
          reveal={beat.reveal} lines={beat.lines} />
        <p>{beat.copy}</p>
        {index === 6 && <details className={styles.evidence}><summary>Beyond the work · evidence</summary>
          <p>Grade 5 Music Theory, Grade 5 Guitar Practical, and ISSO Nationals Shot Put Bronze Medalist are recorded achievements. Original certificate scans have not been added here.</p>
        </details>}
        {index === 7 && <nav className={styles.links} aria-label="Leave the clearing">
          <StayLink href="/stay/builder/">The Builder</StayLink>
          <StayLink href="/stay/thinker/">The Thinker</StayLink>
          <StayLink href="/stay/">Return to Garden</StayLink>
        </nav>}
      </div>
    </section>)}
  </div>;
}
