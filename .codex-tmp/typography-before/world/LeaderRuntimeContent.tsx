import { StayLink } from "../native/StayLink";
import { CinematicTitle, type CinematicReveal } from "./CinematicTitle";
import styles from "./leader.module.css";

const beats: { id: string; from: number; to: number; heading: string; copy: string; reveal?: CinematicReveal | undefined; lines?: readonly string[] | undefined; groups?: readonly string[] | undefined }[] = [
  { id: "leader-b01", from: 0, to: .14, heading: "The Leader", copy: "I don’t think leadership starts with a title.", reveal: "landmark" },
  { id: "leader-b02", from: .14, to: .36, heading: "I built a weekly MUN club for younger students, and then I ran it.", copy: "I designed lessons, debates and simulations, taught younger students and ran the sessions each week.", reveal: "environmental" },
  { id: "leader-b03", from: .36, to: .53, heading: "The programme was the work.", copy: "Lessons, debates, simulations, teaching, weekly operation.", reveal: "groups", groups: ["The programme", "was the work."] },
  { id: "leader-b04", from: .53, to: .68, heading: "A co-leader was absent, so the job was open.", copy: "I stepped into the responsibility: helping organise the activity and managing the crowd while it ran. It was not a title and it was not planned.", reveal: "lines", lines: ["A co-leader was absent,", "so the job was open."] },
  { id: "leader-b05", from: .68, to: .84, heading: "Communication makes ideas usable.", copy: "MUN, debate, public speaking and teaching are where I have practised it.", reveal: "tracking" },
  { id: "leader-b06", from: .84, to: 1, heading: "Ownership can become too much ownership.", copy: "When others underperform, I may take on too much myself. That is a risk I am trying to understand, not a documented account of a leadership failure.", reveal: "masked" },
];

const responsibilities = ["Lesson design", "Debates", "Simulations", "Teaching", "Weekly operation"];

export function LeaderRuntimeContent() {
  return <div className={styles.leader}>
    <picture className={styles.fallbackPoster}>
      <source media="(max-width: 767px)" srcSet="/assets/stay/v1/leader-mobile.webp" />
      <img src="/assets/stay/v1/leader-desktop.webp" alt="" />
    </picture>
    {beats.map((beat, index) => <section key={beat.id} data-stay-beat={beat.id} data-from={beat.from} data-to={beat.to}
      className={`${styles.beat} ${index % 2 ? styles.right : styles.left}`} aria-labelledby={`${beat.id}-heading`}>
      <div className={styles.copy}>
        {index === 0 && <p className={styles.label}>04 · Courtyard</p>}
        <CinematicTitle as={index === 0 ? "h1" : "h2"} id={`${beat.id}-heading`} text={beat.heading}
          reveal={beat.reveal} lines={beat.lines} groups={beat.groups} />
        <p>{beat.copy}</p>
        {index === 2 && <ul className={styles.responsibilities} aria-label="MUN club responsibilities">
          {responsibilities.map(item => <li key={item}>{item}</li>)}
        </ul>}
        {index === 5 && <nav className={styles.exits} aria-label="Leave the courtyard">
          <StayLink href="/stay/stories/">Stories</StayLink>
          <StayLink href="/stay/work/">The Work</StayLink>
          <StayLink href="/stay/">Return to Garden</StayLink>
        </nav>}
      </div>
    </section>)}
  </div>;
}
