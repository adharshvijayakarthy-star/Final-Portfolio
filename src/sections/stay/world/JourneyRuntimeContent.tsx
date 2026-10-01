import { NarrativeRoute, type NarrativeBeat } from "./NarrativeRoute";
import { auraBeats, futureBeats, storyBeats, workBeats } from "./onward-narrative";
import { PlannerArtifact, LoggerArtifact, MunArtifact } from "./ProjectArtifacts";
import contact from "../native/pages/contact-content.json";
import styles from "./journey.module.css";
export function StoriesRuntimeContent() { return <NarrativeRoute id="stories" beats={storyBeats} />; }
export function FutureRuntimeContent() { return <NarrativeRoute id="future" beats={futureBeats} />; }
export function AuraRuntimeContent() { return <NarrativeRoute id="aura" beats={auraBeats} />; }
export function WorkRuntimeContent() {
  const beats = workBeats.map(beat => ({...beat,
    ...(beat.id === "planner-rules" ? {detail:<PlannerArtifact />} : beat.id === "logger-boundaries" ? {detail:<LoggerArtifact />} : beat.id === "mun-practice" ? {detail:<MunArtifact />} : {}),
    ...(beat.id === "work-b01" ? {detail:<nav aria-label="Work stations">{[["study-planner","Study Planner"],["past-paper-logger","Past Paper Logger"],["mun-club","MUN Club"],["snrled","SNRLED · archived"],["project-aura","Project AURA"]].map(([id,name])=><a href={`#${id}`} key={id}>{name}</a>)}</nav>} : {}),
  }));
  return <NarrativeRoute id="work" beats={beats} />;
}
const contactBeats: NarrativeBeat[] = [
  {id:"contact-b01",band:[0,.25],label:"09 · Open garden",heading:"If you made it this far, let’s talk.",reveal:"quiet-emergence",paragraphs:["The work, the questions and the direction belong to one person, still becoming. Thank you for taking the time to follow them."]},
  {id:"contact-b02",band:[.25,.75],label:"Four ways to reach me",heading:"The channels",reveal:"quiet-emergence",paragraphs:["The contact details are still awaiting real values."],detail:<ul className={styles.channels}>{contact.channels.map(channel=><li key={channel.label}><span>{channel.label}</span><strong>{channel.value}</strong></li>)}</ul>},
  {id:"contact-b03",band:[.75,1],label:"A quiet ending",heading:"Thank you for staying awhile.",reveal:"quiet-emergence",paragraphs:["The garden stays open."],exits:[{href:"/stay/",label:"Return to the garden",place:"Choose another question"}]},
];
export function ContactRuntimeContent() { return <NarrativeRoute id="contact" beats={contactBeats} />; }