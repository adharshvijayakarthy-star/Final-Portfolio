import type { ProjectMedia } from "./types";

// EDIT HERE: contact values, biography, scene copy, certificates and direction.
// Bracketed contacts stay visible as requested, but never become broken links.
export const contact = { email: "YOUR_EMAIL", linkedin: "YOUR_LINKEDIN", github: "YOUR_GITHUB", phone: "YOUR_PHONE" };

export const owner = {
  firstName: "Adharsh", lastName: "Vijayakarthy",
  position: "IB student · building toward AI / ML",
  roles: ["Researcher.", "Builder.", "Leader."],
  introduction: "I build software, experiment with intelligent systems, and keep trying to become considerably better at both.",
  context: "I’m an IB student, involved in MUN, debate and public speaking. I build with AI assistance while developing the independent technical depth to work on difficult systems.",
  researchContext: "Research, for me, starts with asking better questions. AURA is my ongoing personal inquiry.",
};
export const chapters = [
  { id: "ch-who", chip: "who", number: "01", label: "WHO", title: "WHO", arrival: 0.14 },
  { id: "ch-build", chip: "build", number: "02", label: "BUILD", title: "WHAT I BUILD", arrival: 0.18 },
  { id: "ch-work", chip: "work", number: "03", label: "WORK", title: "SELECTED WORK", arrival: 0.4 },
  { id: "ch-beyond", chip: "beyond", number: "04", label: "BEYOND", title: "BEYOND CODE", arrival: 0.18 },
  { id: "ch-future", chip: "future", number: "05", label: "FUTURE", title: "WHERE I’M GOING", arrival: 0.08 },
  { id: "ch-contact", chip: "contact", number: "06", label: "CONTACT", title: "CONTACT", arrival: 0 },
] as const;
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
export const achievements: readonly { id: string; title: string; detail: string; quickTitle: string; quickDetail: string; category: string; asset: ProjectMedia | null; source: string }[] = [
  { id: "mun-teaching", title: "A room learns by doing.", quickTitle: "MUN & teaching", quickDetail: "Lessons, debates and simulations for younger students. Leadership through the work.", category: "MUN · teaching · leadership", detail: "I design lessons, debates and simulations for younger students. The club meets for an hour each week; the aim is to let people practise the activity, not just hear about it.", asset: null, source: "Codex §48" },
  { id: "communication", title: "An idea has to reach someone.", quickTitle: "Debate & public speaking", quickDetail: "Putting my thinking in front of other people. Learning to make it clear.", category: "Debate · public speaking", detail: "Debate, MUN and public speaking keep putting my thinking in front of other people—and asking me to make it clear.", asset: null, source: "Codex §§23, 37, 48" },
  { id: "guitar", title: "Grade 5 Guitar Practical", quickTitle: "Grade 5 Guitar Practical", quickDetail: "Completed, with certificate.", category: "Music · completed", detail: "Completed, with certificate.", asset: null, source: "Reconstruction brief, Beyond Code. Certificate scan not supplied." },
  { id: "theory", title: "Grade 5 Music Theory", quickTitle: "Grade 5 Music Theory", quickDetail: "Completed, with certificate.", category: "Music · completed", detail: "Completed, with certificate.", asset: null, source: "Reconstruction brief, Beyond Code. Certificate scan not supplied." },
];
export const future = {
  title: "I’m not interested in staying where I am.", current: "Learning. Building. Experimenting.",
  currentTags: ["IB STUDENT", "BUILDING", "LEARNING", "EXPERIMENTING", "LEADING"],
  destinations: ["AI / ML", "INTELLIGENT SYSTEMS", "ADVANCED SOFTWARE", "RESEARCH"],
  statement: "I’m trying to become exceptionally capable, build difficult things, and eventually work on systems that matter.",
  closing: "A direction, not an arrival.",
};

export const quickCopy = {
  mark: "AURA", homeLabel: "AURA — return to the landing page",
  entryTitle: "QUICK DISCOVERY", entryHint: "NINETY SECONDS · SCROLL TO BEGIN", scrollHint: "SCROLL",
  workTitle: "Selected work", workSubtitle: "FOUR PROJECTS · FOUR DIFFERENT QUESTIONS",
  beyondTitle: "Software is only one part of what I do.",
  munClubTitle: "MUN CLUB",
  munClubDetail: "I helped establish a weekly MUN club with teachers, organising lessons, debates and simulations for younger students.",
  munConferenceDetail: "I helped organise a MUN conference: committees, topics, country allocation and delegate experience.",
  beyondCategories: ["MUN", "DEBATE", "PUBLIC SPEAKING", "TEACHING", "LEADERSHIP", "GUITAR", "MUSIC THEORY"],
  contactTitle: "Let’s talk.", contactPrompt: "Think we should talk?", contactPending: "Not added yet",
  closing: "IF NINETY SECONDS WASN’T ENOUGH", complete: "QUICK DISCOVERY COMPLETE",
  auraTail: "YOU ARE STANDING INSIDE THE LAST STEP",
  plannerNotes: ["PRIORITY WEIGHTING", "SESSION DISTRIBUTION", "SUBJECT REPETITION", "BREAKS ARE NOT OPTIONAL", "SESSION LIMITS · EDGE CASES"],
  paperNotes: ["TRACKING — PAPERS LOGGED", "ANALYSIS — SCORE, PAPER, DATE", "PREDICTION — ESTIMATED TREND"],
  paperAxes: ["FIRST PAPER", "TIME", "NEXT PAPER"],
  munCaptions: ["ONE DELEGATE", "A COMMITTEE", "COMMITTEES", "A CONFERENCE"],
  schematic: "Illustrative structure", paperSchematic: "Illustrative trend · no actual scores shown",
  musicNote: "Certified · Grade 5", evidenceNote: "Project details",
};

export const routes = { home: "/", quick: "/quick", stay: "/stay" } as const;

// Diagram labels are editable too. These are illustrative tasks, not a diary.
export const plannerContent = {
  days: ["MON", "TUE", "WED", "THU", "FRI"], breakLabel: "BREAK",
  tasks: [
    ["MATHS AA HL", "PRACTICE", 0, 0, 2], ["PHYSICS HL", "REVISION", 1, 0, 2],
    ["CHEMISTRY HL", "PRACTICE", 2, 0, 1], ["ENGLISH A LL", "WRITING", 3, 0, 2],
    ["BUSINESS SL", "REVISION", 4, 0, 1], ["MATHS AA HL", "REVIEW", 2, 2, 1],
    ["FRENCH SL", "PRACTICE", 0, 2, 1], ["PHYSICS HL", "PROBLEMS", 3, 2, 1],
    ["CHEMISTRY HL", "REVIEW", 1, 2, 1], ["BUSINESS SL", "PRACTICE", 4, 2, 2],
    ["MATHS AA HL", "MIXED PAPER", 1, 4, 2], ["ENGLISH A LL", "READING", 0, 4, 1],
  ] as const,
};
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
