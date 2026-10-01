import type { ReactNode } from "react";
import { StayLink } from "../native/StayLink";
import type { StayDestination } from "../native/destinations";
import contact from "../native/pages/contact-content.json";
import { CinematicTitle, type CinematicReveal } from "./CinematicTitle";
import styles from "./journey.module.css";

type Exit = { href: string; label: string; place: string };
type Beat = {
  heading: string;
  eyebrow?: string;
  paragraphs?: string[];
  detail?: ReactNode;
  exits?: Exit[];
  reveal?: CinematicReveal | undefined;
  lines?: readonly string[] | undefined;
  groups?: readonly string[] | undefined;
};

function Journey({ id, beats }: { id: StayDestination; beats: Beat[] }) {
  return <div className={styles.journey}>
    <picture className={styles.poster}>
      <source media="(max-width: 767px)" srcSet={`/assets/stay/v1/${id}-mobile.webp`} />
      <img src={`/assets/stay/v1/${id}-desktop.webp`} alt="" />
    </picture>
    {beats.map((beat, index) => {
      const beatId = `${id}-b${String(index + 1).padStart(2, "0")}`;
      return <section key={beatId} id={beatId} data-stay-beat={beatId}
        data-from={(index / beats.length).toFixed(4)} data-to={((index + 1) / beats.length).toFixed(4)}
        className={styles.beat} aria-labelledby={`${beatId}-heading`}>
        <div className={styles.copy}>
          {beat.eyebrow && <p className={styles.eyebrow}>{beat.eyebrow}</p>}
          <CinematicTitle as={index === 0 ? "h1" : "h2"} id={`${beatId}-heading`} text={beat.heading}
            reveal={beat.reveal} lines={beat.lines} groups={beat.groups} />
          {beat.paragraphs?.map((paragraph, line) => <p key={line}>{paragraph}</p>)}
          {beat.detail}
          {beat.exits && <nav className={styles.exits} aria-label="Paths onward">
            {beat.exits.map(exit => <StayLink href={exit.href} key={exit.href}>{exit.label}<span>{exit.place}</span></StayLink>)}
          </nav>}
        </div>
      </section>;
    })}
  </div>;
}

export function StoriesRuntimeContent() {
  return <Journey id="stories" beats={[
    { eyebrow: "05 · Lantern path", heading: "Stories", paragraphs: ["Four moments, told at their actual size.", "Follow the lanterns."], reveal: "masked" },
    { eyebrow: "01 · A small reputation", heading: "The “Adharsh mentality”", paragraphs: ["Among people who know me, there is a small running phrase. When someone needs confidence, they sometimes call it an “Adharsh mentality”.", "It is a narrow reputation in a narrow circle. I want to describe it at that size."], reveal: "landmark" },
    { eyebrow: "02 · A friend’s honesty", heading: "Stop pleasing everyone", paragraphs: ["A friend I trust told me to stop being so formal, stop people pleasing, and be more open.", "I already knew. I just had not accepted it."], reveal: "tracking" },
    { eyebrow: "03 · A gap to close", heading: "The coder I am, and the coder I want to be", paragraphs: ["Real projects have been built. I have also used AI assistance extensively, and my independent technical depth is still developing.", "My ambition toward AI and machine learning is larger than my present depth. I intend to close that gap."], reveal: "groups", groups: ["The coder I am,", "and the coder I want to be"] },
    { eyebrow: "04 · Taking responsibility", heading: "Leading without a title", paragraphs: ["The MUN club ran each week because I kept building the lessons and sessions that made it run.", "When a co-leader was absent at a house activity, I stepped in to help organise it and manage the crowd."], exits: [{ href: "/stay/leader/", label: "The Leader", place: "The fuller account" }], reveal: "environmental" },
    { eyebrow: "The lantern path", heading: "A story continues beyond this page.", paragraphs: ["The scenes here are moments, not a complete biography. Walk toward the open horizon or return to the garden."], exits: [{ href: "/stay/future/", label: "The Future", place: "Open horizon" }, { href: "/stay/", label: "Garden", place: "Return to arrival" }], reveal: "dissolve" },
  ]} />;
}

const workProjects = [
  { name: "Study Planner", lead: "A planner is a set of competing constraints.", detail: "Subjects, priority weights, sessions, breaks, day and week views, and a focus mode with tasks and timers. Built with HTML, CSS, JavaScript, and local storage. The hard problem was distributing work reasonably across the week." },
  { name: "IGCSE Past Paper Logger & Analytics", lead: "I wanted the pattern behind the marks.", detail: "The system logs completed papers and scores, visualises performance, identifies trends, and uses accumulated results to estimate a direction. An estimate is not a result." },
  { name: "MUN Club", lead: "A system built for people.", detail: "I built and ran weekly sessions for younger students: lessons, debates, simulations, Rules of Procedure, speeches, motions, and interactive revision. Attention and confidence were part of the design constraints." },
  { name: "SNRLED Parties", lead: "A registration form became a system.", detail: "An admin could review payments, group sizes, and screenshots. Once early bird capacity was reached, the price changed. The service is archived and no longer deployed; the source is preserved." },
  { name: "Project AURA", lead: "The strangest thing I have built is a model of myself.", detail: "A portfolio question became a longer process of conversation, evidence, and revision. AURA holds a working model, including the parts I still do not understand. This garden is one expression of it." },
] as const;

export function WorkRuntimeContent() {
  return <Journey id="work" beats={[
    { eyebrow: "06 · Workshop", heading: "The things I actually built.", paragraphs: ["Five projects. Each has a problem, a system, and a present state.", "Walk the stations at your own pace."], detail: <nav className={styles.stationIndex} aria-label="Work stations">{workProjects.map((project, index) => <a href={`#work-b${String(index + 2).padStart(2, "0")}`} key={project.name}><span>{String(index + 1).padStart(2, "0")}</span>{project.name}</a>)}</nav>, reveal: "masked" },
    ...workProjects.map((project, index) => ({ eyebrow: `Station ${String(index + 1).padStart(2, "0")} · ${index === 4 ? "Archive" : "Workshop"}`, heading: project.name, paragraphs: [project.lead, project.detail], reveal: (["landmark", "tracking", "groups", "environmental", "landmark"] as const)[index], ...(index === 2 ? { groups: ["MUN", "Club"] } : {}), ...(index === 4 ? { exits: [{ href: "/stay/aura/", label: "Project AURA", place: "Open the archive" }] } : {}) })),
    { eyebrow: "Leave the workshop", heading: "The work is still becoming.", paragraphs: ["These projects show what has been made and what remains open."], exits: [{ href: "/stay/future/", label: "The Future", place: "Open horizon" }, { href: "/stay/", label: "Garden", place: "Return to arrival" }], reveal: "dissolve" },
  ]} />;
}

export function FutureRuntimeContent() {
  return <Journey id="future" beats={[
    { eyebrow: "07 · Open horizon", heading: "The Future", paragraphs: ["What am I becoming?"], reveal: "lines", lines: ["The", "Future"] },
    { eyebrow: "Direction", heading: "I am not interested in staying where I am.", paragraphs: ["I am moving toward AI and machine learning, intelligent systems, deeper technical competence, and research where the question is genuinely open."], reveal: "environmental" },
    { eyebrow: "Current", heading: "Where I am today", paragraphs: ["An IB student, building and experimenting, using AI assistance while developing the independent technical depth the work I want will require."], reveal: "tracking" },
    { eyebrow: "Building", heading: "The distance matters.", paragraphs: ["I want to build difficult things and understand why they work. The gap between that aim and my current skills is real."], reveal: "groups", groups: ["The distance", "matters."] },
    { eyebrow: "Future direction", heading: "A direction, not an arrival.", paragraphs: ["AI, machine learning, intelligent systems, and research are goals. They are not completed achievements."], exits: [{ href: "/stay/aura/", label: "Project AURA", place: "The archive" }, { href: "/stay/contact/", label: "Contact", place: "Open garden" }], reveal: "landmark" },
  ]} />;
}

const auraLayers = [
  ["Conversation", "Long questioning before conclusions. Most of what I believed about myself did not survive being asked twice."],
  ["Evidence", "Claims attached to something real: a project, a session, or a moment, rather than left as adjectives."],
  ["Understanding", "Patterns across the evidence, including the unflattering ones and what remains uncertain."],
  ["Model", "A working account of how I think and what I want. It is useful because it can be revised."],
  ["Expression", "This garden and the ninety second version next door. Two tempos, one model underneath."],
] as const;

export function AuraRuntimeContent() {
  return <Journey id="aura" beats={[
    { eyebrow: "08 · Archive", heading: "Project AURA", paragraphs: ["Why this portfolio is built the way it is."], reveal: "environmental" },
    { eyebrow: "Genesis", heading: "It started as a portfolio.", paragraphs: ["I realised I did not understand the person it was supposed to represent. So I stopped building the portfolio and started trying to understand the person."], reveal: "masked" },
    ...auraLayers.map(([heading, description], index) => ({ eyebrow: `${String(index + 1).padStart(2, "0")} · ${heading}`, heading, paragraphs: [description], reveal: (["tracking", "landmark", "environmental", "tracking", "environmental"] as const)[index] })),
    { eyebrow: "One expression", heading: "Why I do it.", paragraphs: ["A portfolio can represent what someone has done. I wanted mine to explain why I do it.", "This is an expression of an ongoing project, not a final verdict."], exits: [{ href: "/stay/contact/", label: "Contact", place: "Open garden" }, { href: "/stay/work/", label: "The Work", place: "Return to the evidence" }], reveal: "dissolve" },
  ]} />;
}

export function ContactRuntimeContent() {
  return <Journey id="contact" beats={[
    { eyebrow: "09 · Open garden", heading: "If you made it this far, let’s talk.", paragraphs: ["Thank you for staying awhile."], reveal: "tracking" },
    { eyebrow: "Ways to reach me", heading: "The channels", detail: <ul className={styles.channels}>{contact.channels.map(channel => <li key={channel.label}><span>{channel.label}</span><strong>{channel.value}</strong></li>)}</ul>, reveal: "landmark" },
    { eyebrow: "A quiet ending", heading: "The garden stays open.", paragraphs: ["Contact details have not been added yet. The channels above remain visible without pretending to be working links."], exits: [{ href: "/stay/", label: "Return to the garden", place: "Arrival" }], reveal: "dissolve" },
  ]} />;
}
