import type { ExperienceId } from "./types";
import { owner } from "./content";

/**
 * Site-level constants.
 */
export const site = {
  /** The portfolio's owner. The only verified identity this project asserts. */
  name: `${owner.firstName} ${owner.lastName}`,
  /** Internal codename, kept for continuity. Not shown to visitors. */
  codename: "Project AURA",
  /** Set to the real origin before the first deploy; used for canonical URLs. */
  url: "https://project-aura-adharsh.blithe-rose-8858.chatgpt.site",
  locale: "en",
  description: "IB student, software builder and MUN organizer. Selected work, the thinking behind it, and a direction toward AI and intelligent systems.",
} as const;

/** Which of the two visual worlds a thing belongs to. */
export type ExperienceWorld = "quick" | "stay";

/** Entry points. Literal union so `typedRoutes` can verify every <Link>. */
export type ExperiencePath = "/quick" | "/stay";

export interface ExperienceDefinition {
  id: ExperienceId;
  world: ExperienceWorld;
  path: ExperiencePath;
  /** Editorial ordinal. Decorative — the real order is DOM order. */
  index: string;
  label: string;
  /** The label broken as the approved design sets it, one line per entry. */
  titleLines: readonly string[];
  /** Who the experience is for. */
  descriptor: string;
  /** The time commitment, so the choice is an informed one. */
  duration: string;
  /** Whether the experience behind the route actually exists yet. */
  built: boolean;
}

/**
 * The two experiences.
 *
 * The landing page renders entirely from this array — it never hard-codes a
 * label, a path, or an ordinal. Adding or reordering an entrance is a data
 * change, and the copy lives in exactly one place.
 */
export const experiences: readonly ExperienceDefinition[] = [
  {
    id: "quick-discovery",
    world: "quick",
    path: "/quick",
    index: "01",
    label: "Quick Discovery",
    titleLines: ["Quick", "Discovery"],
    descriptor: "For the decisive",
    duration: "90 seconds",
    built: true,
  },
  {
    id: "stay-awhile",
    world: "stay",
    path: "/stay",
    index: "02",
    label: "Stay Awhile",
    titleLines: ["Stay", "Awhile"],
    descriptor: "For the curious",
    duration: "No rush",
    built: true,
  },
];

export function getExperience(id: ExperienceId): ExperienceDefinition | undefined {
  return experiences.find((experience) => experience.id === id);
}
