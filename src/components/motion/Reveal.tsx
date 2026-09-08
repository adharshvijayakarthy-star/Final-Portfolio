"use client";

import { m, useInView } from "motion/react";
import { useRef, type ReactNode, type Ref } from "react";

import { duration, ease, REVEAL_AMOUNT, travel, type TravelName } from "@/lib/motion/tokens";

/**
 * The base scroll-triggered reveal.
 *
 * Almost every entrance on the Quick Discovery page should go through this
 * rather than hand-rolling an IntersectionObserver, because this component is
 * where the accessibility guarantees are attached:
 *
 *   - `data-motion-reveal` is the hook src/styles/a11y.css uses to force the
 *     element visible under prefers-reduced-motion, beating Motion's inline
 *     styles with `!important`.
 *   - The same attribute is targeted by the <noscript> block in the root
 *     layout, so content is never trapped at opacity 0 when JS does not run.
 *   - Only `opacity` and `transform` animate, so reveals never trigger layout.
 *
 * `useInView` is used in preference to `whileInView` so that the trigger
 * threshold is an explicit, tokenised value rather than a magic default.
 */

const ELEMENTS = {
  div: m.div,
  section: m.section,
  article: m.article,
  header: m.header,
  footer: m.footer,
  figure: m.figure,
  li: m.li,
  p: m.p,
  span: m.span,
} as const;

export type RevealElement = keyof typeof ELEMENTS;

export interface RevealProps {
  children: ReactNode;
  /** Which element to render. Pick the one that is semantically correct. */
  as?: RevealElement;
  /** How far the element travels before settling. `none` fades only. */
  distance?: TravelName;
  /** Seconds to wait after the element enters view. */
  delay?: number;
  /** Fraction of the element that must be visible to trigger. */
  amount?: number;
  /** Re-run the reveal every time the element re-enters view. */
  repeat?: boolean;
  className?: string;
  id?: string;
}

export function Reveal({
  children,
  as = "div",
  distance = "md",
  delay = 0,
  amount = REVEAL_AMOUNT,
  repeat = false,
  className,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: !repeat, amount });

  // Every entry in ELEMENTS shares the prop surface used below; the cast keeps
  // TypeScript from widening this into an unusable union of component types.
  const Element = ELEMENTS[as] as typeof m.div;

  return (
    <Element
      ref={ref as Ref<HTMLDivElement>}
      id={id}
      className={className}
      data-motion-reveal=""
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: travel[distance] },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: duration.slow, ease: ease.entrance, delay }}
      // Hint the compositor, but only while the reveal is pending — a
      // permanent `will-change` costs memory on every layer for the whole
      // session, which is exactly the kind of thing that makes long scrolling
      // pages stutter on lower-powered devices.
      style={{ willChange: inView ? "auto" : "opacity, transform" }}
    >
      {children}
    </Element>
  );
}
