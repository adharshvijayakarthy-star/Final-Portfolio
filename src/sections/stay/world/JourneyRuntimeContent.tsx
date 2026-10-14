import { NarrativeRoute, type NarrativeBeat } from "./NarrativeRoute";
import { auraBeats, futureBeats, storyBeats, workBeats } from "./onward-narrative";
import { PlannerArtifact, LoggerArtifact, MunArtifact } from "./ProjectArtifacts";
import { contact, contactHref } from "@/data/content";
import { repositories } from "@/data/repositories";
import { ContactAddress } from "@/components/layout/ContactAddress";
import contactStyles from "./contact.module.css";
export function StoriesRuntimeContent() { return <NarrativeRoute id="stories" beats={storyBeats} />; }
export function FutureRuntimeContent() { return <NarrativeRoute id="future" beats={futureBeats} />; }
export function AuraRuntimeContent() { return <NarrativeRoute id="aura" beats={auraBeats} />; }
export function WorkRuntimeContent() {
  const beats = workBeats.map(beat => ({...beat,
    ...(beat.id === "planner-rules" ? {detail:<PlannerArtifact />} : beat.id === "logger-boundaries" ? {detail:<LoggerArtifact />} : beat.id === "mun-practice" ? {detail:<MunArtifact />} : {}),
    ...(repositories[beat.id] ? {source: {href: repositories[beat.id]!, label: `View source for ${beat.heading}`}} : {}),
    ...(beat.id === "work-b01" ? {detail:<nav aria-label="Work stations">{[["study-planner","Study Planner"],["past-paper-logger","Past Paper Logger"],["mun-club","MUN Club"],["snrled","SNRLED · archived"],["project-aura","Project AURA"]].map(([id,name])=><a href={`#${id}`} key={id}>{name}</a>)}</nav>} : {}),
  }));
  return <NarrativeRoute id="work" beats={beats} />;
}
const contactBeats: NarrativeBeat[] = [
  {id:"contact-b01",band:[0,.25],label:"09 / Let’s talk",heading:"Think we should talk?",lines:["Think we", "should talk?"],reveal:"quiet-emergence",paragraphs:["You’ve seen the work. You know a little of the person. The conversation can begin here."]},
  {id:"contact-b02",band:[.25,.75],label:"An open invitation",heading:"A conversation, from here.",lines:["A conversation,", "from here."],reveal:"quiet-emergence",paragraphs:["Choose the channel that suits the conversation."],detail:<ol className={contactStyles.inscriptions} aria-label="Contact channels">
    {(["email", "linkedin", "github", "phone"] as const).map((kind, index) => {
      const value = contact[kind];
      const external = kind === "linkedin" || kind === "github";
      return <li key={kind} className={`${contactStyles.inscription} ${contactStyles[kind]}`}>
        <a href={contactHref(kind,value)!} aria-label={`${kind === "phone" ? "Call" : kind === "email" ? "Email" : kind === "linkedin" ? "LinkedIn" : "GitHub"}: ${value}${external ? " (opens in a new tab)" : ""}`} {...(external ? {target:"_blank",rel:"noopener noreferrer"} : {})}>
          <span className={contactStyles.number} aria-hidden="true">0{index + 1}</span>
          <span className={contactStyles.label}>{kind}</span>
          <span className={contactStyles.address}><ContactAddress value={value} /></span>
          <span className={contactStyles.arrow} aria-hidden="true">↗</span>
        </a>
      </li>;
    })}
  </ol>},
  {id:"contact-b03",band:[.75,1],label:"A quiet ending",heading:"Thank you for staying awhile.",reveal:"quiet-emergence",paragraphs:["The garden stays open."],exits:[{href:"/stay/",label:"Return to the garden",place:"Choose another question"}]},
];
export function ContactRuntimeContent() { return <div className={contactStyles.ending}><NarrativeRoute id="contact" beats={contactBeats} /></div>; }
