/**
 * Breakpoints — the TypeScript mirror of the values in
 * src/styles/tokens/layout.css. CSS custom properties cannot be used inside
 * media queries, so the literals exist in both places and must be kept in sync.
 *
 * The strategy these encode is additive, not subtractive: the base styles ARE
 * the mobile experience (single column, content first), and each breakpoint
 * adds composition rather than restoring something that was taken away.
 */
export const breakpoints = {
  /** 480px — large phone. Type and gutters loosen slightly. */
  sm: 480,
  /** 768px — tablet. The grid widens from 4 to 8 columns. */
  md: 768,
  /** 1024px — laptop. The grid widens to 12; cinematic motion begins here. */
  lg: 1024,
  /** 1440px — the fluid type and spacing scales top out. */
  xl: 1440,
} as const;

export type BreakpointName = keyof typeof breakpoints;

/** `(min-width: 48rem)` — matching the rem-based queries used in CSS. */
export function minWidth(name: BreakpointName): string {
  return `(min-width: ${breakpoints[name] / 16}rem)`;
}

/**
 * The floor at which the full cinematic composition is offered. Below this,
 * expensive scroll choreography is skipped in favour of a direct read.
 */
export const CINEMATIC_MIN_WIDTH: BreakpointName = "lg";

/**
 * Fine-pointer, hover-capable devices only. Used to gate affordances that have
 * no touch equivalent (cursor-followers, hover-revealed detail) so they are
 * never the sole route to information.
 */
export const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
