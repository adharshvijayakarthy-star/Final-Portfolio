import type { CSSProperties } from "react";

/**
 * Minimal class-name joiner.
 *
 * This exists instead of `clsx`/`classnames` because it is nine lines and the
 * dependency budget for this project is spent deliberately. If conditional
 * class logic ever outgrows this, that is the moment to reconsider — not now.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Type-safe CSS custom properties for inline `style`.
 *
 * React's CSSProperties does not model `--*` keys, and the alternative is an
 * `as never` cast at every call site. Components that drive a CSS variable
 * (grid spans, motion travel) route through here instead.
 */
export function cssVars(vars: Record<`--${string}`, string | number | undefined>): CSSProperties {
  const entries = Object.entries(vars).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as CSSProperties;
}
