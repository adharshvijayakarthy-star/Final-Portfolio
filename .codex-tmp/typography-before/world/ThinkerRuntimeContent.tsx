import { StayLink } from "../native/StayLink";
import { CinematicTitle, type CinematicReveal } from "./CinematicTitle";
import styles from "./thinker.module.css";

const beats: { id: string; from: number; to: number; heading: string; copy: string; reveal?: CinematicReveal | undefined; lines?: readonly string[] | undefined; groups?: readonly string[] | undefined }[] = [
  { id: "thinker-b01", from: 0, to: .12, heading: "The Thinker", copy: "Some of the things I think about have nothing to do with code.", reveal: "tracking" },
  { id: "thinker-b02", from: .12, to: .28, heading: "We are animals that want things badly enough to invent them.", copy: "The model I keep coming back to is this: human beings are animals whose unusual desire, ingenuity and perseverance let them create things that previously did not exist. This is a personal philosophical model, not a scientific claim.", reveal: "masked" },
  { id: "thinker-b03", from: .28, to: .44, heading: "Money matters because it buys choice.", copy: "Freedom is not one thing. Financial. Time. Career. Relationship. Geographic. Intellectual. Experiential. Money matters because it creates freedom. Freedom matters because it creates choice.", reveal: "groups", groups: ["Money matters", "because it buys choice."] },
  { id: "thinker-b04", from: .44, to: .6, heading: "Failing is not the lesson. The return is.", copy: "Failure does not automatically make someone better. What reveals something about a person is the sequence: trying, failing, understanding why, changing something, and trying again.", reveal: "environmental" },
  { id: "thinker-b05", from: .6, to: .76, heading: "I could build a life nothing could reach. I don’t want it.", copy: "I want a life worth experiencing. Being reachable is part of that choice.", reveal: "lines", lines: ["I could build a life", "nothing could reach. I don’t want it."] },
  { id: "thinker-b06", from: .76, to: .9, heading: "Ship it imperfect. Keep the debt on the books.", copy: "I can put out something imperfect in the short term and still intend to improve it later. What I try to avoid is letting a rough first version become permission to stop caring about it.", reveal: "tracking" },
  { id: "thinker-b07", from: .9, to: 1, heading: "Keep the question open", copy: "There is more than one way through the garden.", reveal: "dissolve" },
];

const freedoms = ["Financial", "Time", "Career", "Relationship", "Geographic", "Intellectual", "Experiential"];

export function ThinkerRuntimeContent() {
  return <div className={styles.thinker}>
    <picture className={styles.fallbackPoster}>
      <source media="(max-width: 767px)" srcSet="/assets/stay/v1/thinker-mobile.webp" />
      <img src="/assets/stay/v1/thinker-desktop.webp" alt="" />
    </picture>
    {beats.map((beat, index) => <section key={beat.id} data-stay-beat={beat.id} data-from={beat.from} data-to={beat.to}
      className={`${styles.beat} ${index % 2 ? styles.left : styles.right}`} aria-labelledby={`${beat.id}-heading`}>
      <div className={styles.copy}>
        {index === 0 && <p className={styles.label}>03 · Quiet water</p>}
        <CinematicTitle as={index === 0 ? "h1" : "h2"} id={`${beat.id}-heading`} text={beat.heading}
          reveal={beat.reveal} lines={beat.lines} groups={beat.groups} />
        <p>{beat.copy}</p>
        {index === 2 && <ul className={styles.freedoms} aria-label="Seven kinds of freedom">
          {freedoms.map(freedom => <li key={freedom}>{freedom}</li>)}
        </ul>}
        {index === 6 && <nav className={styles.exits} aria-label="Leave the water">
          <StayLink href="/stay/stories/">Stories</StayLink>
          <StayLink href="/stay/contact/">Contact</StayLink>
          <StayLink href="/stay/">Return to Garden</StayLink>
        </nav>}
      </div>
    </section>)}
  </div>;
}
