/**
 * The portfolio content model.
 *
 * ONE source of truth, TWO projections. Quick Discovery and Stay Awhile are
 * radically different experiences, but they describe the same four projects.
 * Duplicating the content into two files would guarantee they drift, so a
 * project is modelled as a shared core plus two *facets* — each holding only
 * the fields that experience actually renders.
 *
 * Every authored field is nullable and starts as null. Nothing in this file
 * asserts anything about the work; copy is written in a later phase, and a
 * null here means "not yet written", never "does not exist".
 */

export type ProjectId = "study-planner" | "past-paper-logger" | "mun-club" | "project-aura";

export type ProjectLinkKind = "repository" | "live" | "case-study" | "writeup" | "external";

export interface ProjectLink {
  label: string;
  href: string;
  kind: ProjectLinkKind;
}

/**
 * An image or video. `width`/`height` are required because the intrinsic ratio
 * is what prevents layout shift — a portfolio that jumps as media loads reads
 * as amateur regardless of how good the media is.
 */
export interface ProjectMedia {
  src: string;
  /** Empty string only if the media is genuinely decorative. */
  alt: string;
  width: number;
  height: number;
  /** A tiny blurred placeholder, for the cinematic load-in. */
  blurDataURL?: string;
}

/**
 * Quick Discovery projection — short form, built to be understood in seconds
 * while the reader is already scrolling past.
 */
export interface QuickFacet {
  /** Spoken beats in the existing three-part project choreography. */
  narration: readonly string[];
  displayTitle: string;
  deeperLabel: string;
  /** The single line that has to land. */
  headline: string | null;
  /** One sentence of substance beneath it. */
  oneLiner: string | null;
  /** Three or four words, for the technical strip. Never a full tech resume. */
  keywords: readonly string[];
  cover: ProjectMedia | null;
}

/**
 * Stay Awhile projection — long form, narrative, reached through the garden.
 * NOT IMPLEMENTED YET. The shape is declared now so the Quick Discovery build
 * cannot accidentally design itself into a corner the narrative cannot reach.
 */
export interface StayAwhileFacet {
  /** Path under the Stay Awhile route group, e.g. "/garden/study-planner". */
  route: string | null;
  /** Ordered prose blocks. */
  narrative: readonly string[];
  gallery: readonly ProjectMedia[];
  /** Where this project sits on the garden map. */
  gardenAnchor: string | null;
}

export interface Project {
  id: ProjectId;
  /** URL segment. Stable — it will end up in shared links. */
  slug: string;
  /** The name as it should be typeset. */
  title: string;
  /** Presentation order in Quick Discovery. */
  order: number;

  /* --- Shared core: read by both experiences ------------------------ */
  summary: string | null;
  shortDescription: string;
  longDescription: string;
  signal: string;
  details: readonly string[];
  assets: readonly ProjectMedia[];
  source: string;
  role: string | null;
  timeframe: string | null;
  stack: readonly string[];
  links: readonly ProjectLink[];

  /* --- Projections -------------------------------------------------- */
  quick: QuickFacet;
  stayAwhile: StayAwhileFacet;
}

/** The two experiences, named once so route groups and analytics agree. */
export type ExperienceId = "quick-discovery" | "stay-awhile";
