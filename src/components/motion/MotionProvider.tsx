"use client";

import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

import { duration, ease } from "@/lib/motion/tokens";

/**
 * The single animation boundary for the application.
 *
 * Three things happen here, and each is load-bearing:
 *
 * 1. `LazyMotion features={domAnimation}` ships only the DOM animation and
 *    gesture features (~15kB) instead of Motion's full bundle (~34kB). Layout
 *    animations and drag are not loaded; if a later phase genuinely needs
 *    them, swap in `domMax` and note the cost.
 *
 * 2. `strict` makes Motion throw if anyone imports the full `motion.*`
 *    components instead of the lightweight `m.*` ones. It converts a silent
 *    bundle-size regression into a build-time error.
 *
 * 3. `reducedMotion="user"` makes Motion honour the OS setting for every
 *    animation in the tree, without each component remembering to check.
 *
 * `children` is a prop, so the server components inside it are NOT pulled into
 * the client bundle — this wrapper adds a boundary, not a client tree.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: duration.base, ease: ease.standard }}
    >
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
