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
