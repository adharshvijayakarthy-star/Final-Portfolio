import { orderedProjects } from "@/data/projects";
import { auraStory, auraSteps, quickCopy } from "@/data/content";

// Only the newly requested fifth Quick project lives here. Shared/Stay content
// is deliberately not mutated. Its copy is taken from Stay Work's SNRLED record.
const snrled = {
  id: "snrled", title: "SNRLED Parties", displayTitle: "SNRLED Parties",
  narration: [
    "A party registration system, built for friends.",
    "Who paid, how much they paid, how many people they paid for, and their payment screenshots.",
    "Once early-bird capacity was reached, the price changed. That single rule is what turned a form into a system.",
    "Archived. The service is no longer deployed; the source code is preserved. It is not live, and I would rather say so than leave it ambiguous.",
  ],
  details: ["Registration", "Payment verification", "Price threshold"],
  signal: "ARCHIVED · NOT DEPLOYED", href: "/stay/work/#snrled", deeperLabel: "SNRLED Parties in Stay Awhile",
  stage: "snrled", beats: ["REGISTRATION", "PAYMENT VERIFIED", "CAPACITY", "STANDARD TIER"],
  note: "Demo run · illustrative counts and tiers, not real registration data.",
};

const stageNames = ["plan", "papers", "mun", "aura"];
const beats = [quickCopy.plannerNotes, quickCopy.paperNotes, quickCopy.munCaptions, auraSteps];
interface QuickProject { id: string; title: string; displayTitle: string; narration: readonly string[]; details: readonly string[]; signal: string; href: string | null; deeperLabel: string; stage: string; beats: readonly string[]; note: string }
export const quickProjects: QuickProject[] = orderedProjects.map((project, i) => ({
  id: project.id, title: project.title, displayTitle: project.quick.displayTitle,
  narration: project.id === "project-aura" ? [project.shortDescription, ...auraStory] : project.quick.narration,
  details: project.details, signal: project.signal,
  href: project.stayAwhile.route, deeperLabel: project.quick.deeperLabel,
  stage: stageNames[i]!, beats: beats[i]!,
  note: i === 1 ? quickCopy.paperSchematic : i === 2 ? quickCopy.munSchematic : quickCopy.schematic,
}));
quickProjects.splice(3, 0, snrled);
