import { StayLink } from "../native/StayLink";
import { CinematicTitle, type CinematicReveal } from "./CinematicTitle";
import styles from "./builder.module.css";

const beats: { id: string; from: number; to: number; heading: string; copy: string; reveal?: CinematicReveal | undefined; lines?: readonly string[] | undefined; groups?: readonly string[] | undefined }[] = [
  { id: "builder-b01", from: 0, to: .1, heading: "The Builder", copy: "I like turning ideas into systems.", reveal: "lines", lines: ["The", "Builder"] },
  { id: "builder-b02", from: .1, to: .2, heading: "Ground rules", copy: "What draws me in is the set of rules underneath a thing — the constraints, the weighting, the cases nobody planned for.", reveal: "tracking" },
  { id: "builder-b03", from: .2, to: .32, heading: "When rules meet", copy: "An idea becomes a system at the moment you have to decide what happens when two of your own rules disagree.", reveal: "environmental" },
  { id: "builder-b04", from: .32, to: .44, heading: "Build and revise", copy: "So I build, watch where the rules break, change something, and try again." },
  { id: "builder-b05", from: .44, to: .56, heading: "A structure that holds", copy: "The interesting part is what happens when the rules meet a case I didn’t plan for.", reveal: "landmark" },
  { id: "builder-b06", from: .56, to: .68, heading: "Five things on the bench", copy: "Study Planner. IGCSE Past Paper Logger & Analytics. MUN Club. SNRLED Parties. Project AURA.", reveal: "groups", groups: ["Five things", "on the bench"] },
  { id: "builder-b07", from: .68, to: .82, heading: "Artifacts", copy: "These projects were built with AI assistance. My independent technical depth is still developing." },
  { id: "builder-b08", from: .82, to: 1, heading: "I have built real things. I am not yet the engineer I intend to become.", copy: "Understanding code and writing it independently are different capabilities, and I would rather name the difference than blur it.", reveal: "lines", lines: ["I have built real things.", "I am not yet the engineer I intend to become."] },
];
const projects = [
  ["Study Planner", "study-planner"],
  ["IGCSE Past Paper Logger & Analytics", "past-paper-logger"],
  ["MUN Club", "mun-club"],
  ["SNRLED Parties · archived", "snrled"],
  ["Project AURA", "project-aura"],
] as const;

export function BuilderRuntimeContent() {
  return <div className={styles.builder}>
    <picture className={styles.fallbackPoster}>
      <source media="(max-width: 767px)" srcSet="/assets/stay/v1/builder-mobile.webp" />
      <img src="/assets/stay/v1/builder-desktop.webp" alt="" />
    </picture>
    {beats.map((beat, index) => <section key={beat.id} data-stay-beat={beat.id} data-from={beat.from} data-to={beat.to}
      className={`${styles.beat} ${index % 2 ? styles.right : styles.left}`} aria-labelledby={`${beat.id}-heading`}>
      <div className={styles.copy}>
        {index === 0 && <p className={styles.label}>02 · Timber frame</p>}
        <CinematicTitle as={index === 0 ? "h1" : "h2"} id={`${beat.id}-heading`} text={beat.heading}
          reveal={beat.reveal} lines={beat.lines} groups={beat.groups} />
        <p>{beat.copy}</p>
        {index === 5 && <nav className={styles.projects} aria-label="The five projects">
          {projects.map(([label, hash]) => <StayLink key={hash} href={`/stay/work/#${hash}`}>{label}</StayLink>)}
        </nav>}
        {index === 7 && <nav className={styles.exits} aria-label="Leave the workshop">
          <StayLink href="/stay/work/">The Work</StayLink>
          <StayLink href="/stay/leader/">The Leader</StayLink>
          <StayLink href="/stay/">Return to Garden</StayLink>
        </nav>}
      </div>
    </section>)}
  </div>;
}
