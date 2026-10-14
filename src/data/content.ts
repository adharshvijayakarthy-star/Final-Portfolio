import type { ProjectMedia } from "./types";
import { certificates, type Certificate } from "./certificates";

// EDIT HERE: contact values, biography, scene copy and direction.
// Certificate images and metadata are edited in ./certificates.ts.
// Contact values supplied by the owner on 2026-10-02.
export const contact = { email: "adharshvijayakarthy@gmail.com", linkedin: "https://www.linkedin.com/in/adharshvijayakarthy/", github: "https://github.com/adharshvijayakarthy-star", phone: "+91 7448864868" };

export const owner = {
  firstName: "Adharsh", lastName: "Vijayakarthy",
  position: "IB student · building toward AI / ML",
  roles: ["Researcher.", "Builder.", "Leader."],
  introduction: "I build software, experiment with intelligent systems, and keep trying to become considerably better at both.",
  context: "I’m an IB student, involved in MUN, debate and public speaking. I build with AI assistance while developing the independent technical depth to work on difficult systems.",
  researchContext: "Research, for me, starts with asking better questions. AURA is my ongoing personal inquiry.",
};
export const build = {
  title: "I like turning ideas into systems.", steps: ["Idea", "Rules", "System", "Iteration"],
  note: "The interesting part is what happens when the rules meet a case I didn’t plan for.",
  properties: ["Build", "Systems", "Communication", "Leadership"],
  descriptions: [
    "I turn ideas into working software.",
    "I enjoy the rules, constraints and logic underneath the interface.",
    "MUN, debate, teaching and public speaking have taught me to make ideas understandable.",
    "When something needs to get done, I step into the work rather than wait for a title.",
  ],
};
export const auraStory = [
  "I started by trying to build a portfolio.",
  "I realised I didn’t understand the person the portfolio was supposed to represent.",
  "So I stopped building the portfolio.",
  "And started trying to understand the person.",
];
export const auraSteps = ["Discovery", "Evidence", "Understanding", "Model", "Expression"];
export const achievements: readonly { id: string; title: string; detail: string; quickTitle: string; quickDetail: string; category: string; asset: ProjectMedia | null; source: string; certificate?: Certificate }[] = [
  { id: "strat-mun", title: "STRAT MUN", quickTitle: "STRAT MUN", quickDetail: "I helped run an actual MUN conference: committee design, topics, country allocation and delegate experience.", category: "Conference organisation · MUN", detail: "I helped organise and run STRAT MUN as an actual Model United Nations conference. My work included committee design, topics, country allocation and the delegate experience.", asset: null, source: "Master Codex §§48–49, corrected by user." },
  ...certificates.map(certificate => ({ ...certificate, asset: certificate.image, certificate })),
];
export const future = {
  title: "I’m not interested in staying where I am.", current: "Learning. Building. Experimenting.",
  currentTags: ["IB STUDENT", "BUILDING", "LEARNING", "EXPERIMENTING", "LEADING"],
  destinations: ["AI / ML", "INTELLIGENT SYSTEMS", "ADVANCED SOFTWARE", "RESEARCH"],
  statement: "I’m trying to become exceptionally capable, build difficult things, and eventually work on systems that matter.",
  closing: "A direction, not an arrival.",
};

export const quickCopy = {
  mark: "AV", homeLabel: "AV — return to the landing page",
  entryTitle: "QUICK DISCOVERY", entryHint: "NINETY SECONDS · SCROLL TO BEGIN", scrollHint: "SCROLL",
  workTitle: "Selected work", workSubtitle: "FOUR PROJECTS · FOUR DIFFERENT QUESTIONS",
  beyondTitle: "Software is only one part of what I do.",
  beyondCategories: ["MUN", "CONFERENCE", "ISSO", "SHOT PUT", "GUITAR", "MUSIC THEORY"],
  contactTitle: "Let’s talk.", contactPrompt: "Think we should talk?", contactPending: "Not added yet",
  closing: "IF NINETY SECONDS WASN’T ENOUGH", complete: "QUICK DISCOVERY COMPLETE",
  auraTail: "YOU ARE STANDING INSIDE THE LAST STEP",
  plannerNotes: ["PRIORITY WEIGHTING", "SESSION DISTRIBUTION", "SUBJECT REPETITION", "BREAKS ARE NOT OPTIONAL", "SESSION LIMITS · EDGE CASES"],
  paperNotes: ["TRACKING — PAPERS LOGGED", "ANALYSIS — SCORE, PAPER, DATE", "PREDICTION — ESTIMATED TREND"],
  paperAxes: ["FIRST PAPER", "TIME", "NEXT PAPER"],
  munCaptions: ["ONE LESSON", "A DEBATE", "A SIMULATION", "A WEEKLY CLUB"],
  schematic: "Illustrative structure", munSchematic: "Illustrative", paperSchematic: "Illustrative trend · no actual scores shown",
  musicNote: "Certified · Grade 5", evidenceNote: "Project details",
};

export const routes = { home: "/", quick: "/quick", stay: "/stay" } as const;
export const stay = {
  title: "A little more room.",
  introduction: "For the work, the questions behind it, and the parts that don’t fit into ninety seconds.",
  notes: [
    { title: "Capability before the label.", text: "I use AI to build and understand substantial amounts of the code it produces. I’m also learning to do more of that work independently. Those are different kinds of capability, and I don’t want to mistake one for the other." },
    { title: "Keep the question open.", text: "AURA began because a portfolio needed answers I didn’t yet have. Conversation became a way to test the first answer, find evidence and revise it. The model is useful because it can change." },
    { title: "A life beyond the work.", text: "Freedom, meaningful relationships and experience matter to me alongside becoming capable. I’m still working out how to hold those commitments together." },
  ],
};
export function contactHref(kind: keyof typeof contact, value: string): string | null {
  if (!value || /[\[\]]|^YOUR_/i.test(value)) return null;
  if (kind === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? `mailto:${value}` : null;
  if (kind === "phone") return /^[+\d\s()-]+$/.test(value) ? `tel:${value.replace(/[\s()-]/g, "")}` : null;
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : null; } catch { return null; }
}
