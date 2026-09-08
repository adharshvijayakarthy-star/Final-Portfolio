import type { ReactNode } from "react";

import { MAIN_CONTENT_ID } from "@/components/a11y/SkipLink";
import { MotionProvider } from "@/components/motion/MotionProvider";

/**
 * Quick Discovery — the 60–90 second, single-page experience at `/quick`.
 *
 * The MotionProvider lives here rather than in the root layout so that the
 * animation runtime is scoped to the experiences that use it. The landing page
 * is in a sibling route group and ships none of it.
 *
 * Nothing from `(stay-awhile)` may be imported into this tree.
 */
export default function QuickDiscoveryLayout({ children }: { children: ReactNode }) {
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1}>
      <MotionProvider>{children}</MotionProvider>
    </main>
  );
}
