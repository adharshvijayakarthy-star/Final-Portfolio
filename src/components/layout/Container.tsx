import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/cn";

import styles from "./Container.module.css";

export type ContainerWidth = "text" | "narrow" | "default" | "wide" | "bleed";

export interface ContainerProps {
  children: ReactNode;
  /**
   * `text` is the reading measure, `bleed` removes the gutter entirely.
   * Anything wider than `default` should be reserved for imagery.
   */
  width?: ContainerWidth;
  /**
   * The container is a layout device with no meaning of its own, so it renders
   * a <div> by default. Pass the semantically correct element when it does
   * carry meaning — `nav`, `header`, `footer`.
   */
  as?: ElementType;
  className?: string;
}

/**
 * Horizontal measure and page gutter. The only place either value is applied.
 */
export function Container({
  children,
  width = "default",
  as: Element = "div",
  className,
}: ContainerProps) {
  return (
    <Element className={cn(styles.container, className)} data-width={width}>
      {children}
    </Element>
  );
}
