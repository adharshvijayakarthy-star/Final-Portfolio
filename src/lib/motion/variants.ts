import type { Variants } from "motion/react";

import { duration, ease, stagger, travel, type TravelName } from "./tokens";

/**
 * Shared animation vocabulary.
 *
 * Sections compose these rather than inventing their own numbers, so the whole
 * site moves with one hand. All of them animate `opacity` and `transform`
 * only — never width, height, top, or left — so the compositor does the work
 * and the main thread stays free.
 *
 * None of these need a reduced-motion branch of their own: MotionConfig is
 * mounted with `reducedMotion="user"`, and src/styles/a11y.css neutralises any
 * residual transform on a `[data-motion-reveal]` element.
 */

/** Straight fade. The quietest reveal available. */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: duration.slow, ease: ease.entrance },
  },
};

/** Fade combined with an upward settle. The default section reveal. */
export function rise(distance: TravelName = "md"): Variants {
  return {
    hidden: { opacity: 0, y: travel[distance] },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: duration.slow, ease: ease.entrance },
    },
  };
}

/** Horizontal counterpart, for editorial slide-ins from a bleed edge. */
export function slide(distance: TravelName = "md", from: "left" | "right" = "left"): Variants {
  const offset = from === "left" ? -travel[distance] : travel[distance];
  return {
    hidden: { opacity: 0, x: offset },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: duration.slow, ease: ease.entrance },
    },
  };
}

/**
 * Parent variant for a staggered group. Children inherit `hidden`/`visible`
 * automatically, so a list only needs this on the container plus `rise()` on
 * each item.
 */
export function staggerGroup(
  step: keyof typeof stagger = "base",
  delayChildren = 0,
): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger[step],
        delayChildren,
      },
    },
  };
}
