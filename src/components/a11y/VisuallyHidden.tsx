import type { ElementType, ReactNode } from "react";

export interface VisuallyHiddenProps {
  children: ReactNode;
  as?: ElementType;
}

/**
 * Available to assistive technology, absent from the visual composition.
 *
 * Use this to supply the context that the art direction deliberately omits —
 * a heading that exists for the document outline, the expansion of a numeric
 * index, the meaning of a purely graphic mark. Never use it to hide something
 * a sighted user also needs; that is `hidden` or conditional rendering.
 *
 * The styling lives in src/styles/a11y.css so that the class works on plain
 * markup too, not only through this component.
 */
export function VisuallyHidden({ children, as: Element = "span" }: VisuallyHiddenProps) {
  return <Element className="visually-hidden">{children}</Element>;
}
