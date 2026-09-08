import type { ReactNode } from "react";

import { MAIN_CONTENT_ID } from "@/components/a11y/SkipLink";

/**
 * The entry threshold — the page that offers the two experiences.
 *
 * Deliberately its own route group, and deliberately WITHOUT a MotionProvider.
 * The landing page animates entirely in CSS, so it ships no animation runtime
 * at all; Motion is mounted inside `(quick-discovery)` and `(stay-awhile)`
 * instead, where it is actually used.
 *
 * Nothing belonging to either experience may be imported from here. Keeping
 * that line clean is what stops the landing page from paying for Stay Awhile's
 * eventual environmental work.
 */
export default function EntryLayout({ children }: { children: ReactNode }) {
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1}>
      {children}
    </main>
  );
}
