import { IBM_Plex_Mono, Instrument_Serif, Inter } from "next/font/google";

/**
 * The three typographic voices, self-hosted at build time by next/font.
 *
 * next/font downloads and inlines the font files into the build output, so
 * there is no request to a third-party origin at runtime — no extra DNS
 * lookup, no connection cost, and no privacy leak. It also emits a metrics-
 * matched fallback face automatically, which is what keeps CLS at zero while
 * the real face loads.
 *
 * These are FOUNDATION defaults, chosen to be defensible rather than final:
 * a high-contrast serif for the regal/editorial voice, a neutral grotesk for
 * reading, and a monospace for technical metadata. The design phase may
 * replace any of them — that is a one-file change, because every consumer
 * reads --font-display / --font-body / --font-meta, never a family name.
 *
 * The approved landing design confirmed Instrument Serif and replaced the
 * monospace with IBM Plex Mono; that swap happened here and nowhere else.
 */

/** Display — headlines, statements, numerals. The regal voice. */
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display-face",
});

/** Body — prose and links. The reading voice. */
const body = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body-face",
});

/**
 * Meta — labels, indices, timestamps. The technical voice.
 *
 * IBM Plex Mono, specified by the approved landing design: the wordmark, the
 * "HOW MUCH TIME / DO YOU HAVE?" line and both entrance objects are all set in
 * it, heavily tracked. Not a variable font, so the three weights the design
 * uses are requested explicitly.
 */
const meta = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--font-meta-face",
});

/**
 * Applied once, to <html>, by the root layout. Every other consumer reads the
 * semantic token (var(--font-display)) rather than these class names.
 */
export const fontVariables = [display.variable, body.variable, meta.variable].join(" ");
