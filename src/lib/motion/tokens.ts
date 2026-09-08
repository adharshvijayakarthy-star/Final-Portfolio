/**
 * Motion tokens — the TypeScript mirror of src/styles/tokens/motion.css.
 *
 * CSS transitions and Motion-driven JS animations must feel like one system,
 * which means they must share one set of numbers. Durations are in SECONDS
 * here (Motion's unit) and milliseconds there (CSS's unit); everything else is
 * identical. If you change a value in one file, change it in the other.
 */

/** A cubic-bezier control-point tuple, as Motion expects it. */
export type Bezier = [number, number, number, number];

/** Seconds. CSS equivalents are the same values in milliseconds. */
export const duration = {
  instant: 0.09,
  fast: 0.18,
  base: 0.32,
  slow: 0.62,
  cinematic: 1.1,
  ambient: 2.6,
} as const satisfies Record<string, number>;

export const ease = {
  standard: [0.4, 0, 0.2, 1] as Bezier,
  /** Expo-out. Arrives fast, settles slowly — the house entrance. */
  entrance: [0.16, 1, 0.3, 1] as Bezier,
  /** Expo-in. The inverse; things leave by accelerating away. */
  exit: [0.7, 0, 0.84, 0] as Bezier,
  /** Decisive and symmetric. For sharp, mechanical transitions. */
  sharp: [0.85, 0, 0.15, 1] as Bezier,
  /** Long and unhurried. For section-scale choreography. */
  glide: [0.22, 1, 0.36, 1] as Bezier,
} as const satisfies Record<string, Bezier>;

/** Pixels. Always the distance BEFORE the reduced-motion multiplier. */
export const travel = {
  none: 0,
  xs: 4,
  sm: 10,
  md: 24,
  lg: 56,
  xl: 96,
} as const satisfies Record<string, number>;

export type TravelName = keyof typeof travel;

/** Seconds between siblings in a staggered group. */
export const stagger = {
  tight: 0.04,
  base: 0.08,
  loose: 0.14,
} as const satisfies Record<string, number>;

/**
 * Fraction of an element that must be inside the viewport before it counts as
 * revealed. Matches --motion-reveal-threshold.
 */
export const REVEAL_AMOUNT = 0.15;

/** Fraction of scroll distance a layer travels, by apparent depth. */
export const parallax = {
  near: 0.12,
  mid: 0.24,
  far: 0.4,
} as const satisfies Record<string, number>;
