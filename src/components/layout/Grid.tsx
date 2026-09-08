import type { ElementType, ReactNode } from "react";

import { cn, cssVars } from "@/lib/cn";

import styles from "./Grid.module.css";

export interface GridProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
}

/**
 * The editorial grid. 4 / 8 / 12 columns, driven by the --grid-columns token.
 *
 * Grid is used for COMPOSITION, not for arranging cards. If a layout starts to
 * want equal-height boxes with borders, that is a sign the design has drifted
 * toward a dashboard and should be questioned rather than styled.
 */
export function Grid({ children, as: Element = "div", className }: GridProps) {
  return <Element className={cn(styles.grid, className)}>{children}</Element>;
}

export interface GridItemProps {
  children: ReactNode;
  /** Columns to span at mobile (of 4). Defaults to the full width. */
  span?: number;
  /** Columns to span from 768px (of 8). Inherits `span` when omitted. */
  md?: number;
  /** Columns to span from 1024px (of 12). Inherits `md` when omitted. */
  lg?: number;
  /**
   * 1-based start column, desktop only. Offsets below `lg` would fragment the
   * single-column reading order that the mobile strategy depends on.
   */
  startLg?: number;
  as?: ElementType;
  className?: string;
}

export function GridItem({
  children,
  span,
  md,
  lg,
  startLg,
  as: Element = "div",
  className,
}: GridItemProps) {
  return (
    <Element
      className={cn(styles.item, className)}
      data-offset={startLg === undefined ? undefined : ""}
      style={cssVars({
        "--span": span,
        "--span-md": md,
        "--span-lg": lg,
        "--start-lg": startLg,
      })}
    >
      {children}
    </Element>
  );
}
