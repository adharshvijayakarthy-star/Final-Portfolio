"use client";

import { useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * On the server we cannot know the preference, so we assume REDUCED.
 *
 * That default is the safe one in both directions: the server-rendered HTML
 * describes the calm variant, and anything expensive gated behind this hook
 * stays unmounted until the client has actually confirmed the user wants it.
 * useSyncExternalStore re-renders after hydration once the real value is
 * known, without a hydration mismatch.
 */
function getServerSnapshot(): boolean {
  return true;
}

/**
 * Live `prefers-reduced-motion` state. Updates if the user changes the OS
 * setting while the page is open.
 *
 * This is for BRANCHING LOGIC — deciding not to mount an expensive canvas,
 * choosing a different copy variant, skipping a scroll listener. It is not the
 * mechanism that keeps content visible: that guarantee lives in CSS
 * (src/styles/a11y.css) and in MotionConfig's `reducedMotion="user"`, both of
 * which work even if this hook is never called.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export type MotionPreference = "full" | "reduced";

/** The same signal, named for readability at call sites. */
export function useMotionPreference(): MotionPreference {
  return usePrefersReducedMotion() ? "reduced" : "full";
}
