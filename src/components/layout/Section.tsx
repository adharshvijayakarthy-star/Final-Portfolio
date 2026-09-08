import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import styles from "./Section.module.css";

export type SectionSpace = "none" | "tight" | "normal" | "loose" | "chapter";
export type SectionSurface = "obsidian" | "bone";

export interface SectionProps {
  children: ReactNode;
  /** Anchor target. Required whenever the section is a navigation destination. */
  id?: string;
  /**
   * A <section> is only a landmark when it has an accessible name. Pass the id
   * of its heading (preferred) or an explicit label — never neither, or screen
   * reader users get an unnamed region they cannot orient inside.
   */
  labelledBy?: string;
  label?: string;
  space?: SectionSpace;
  /** `bone` flips the section to the inverted editorial scope. */
  surface?: SectionSurface;
  /** Draws a structural hairline on one edge. */
  rule?: "top" | "bottom";
  className?: string;
}

/**
 * A section of the page: vertical rhythm, surface scope, and the accessible
 * naming that makes it a real landmark.
 */
export function Section({
  children,
  id,
  labelledBy,
  label,
  space = "normal",
  surface = "obsidian",
  rule,
  className,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      className={cn(styles.section, className)}
      data-space={space}
      data-surface={surface === "bone" ? "bone" : undefined}
      data-rule={rule}
    >
      {children}
    </section>
  );
}
