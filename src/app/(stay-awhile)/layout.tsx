import type { ReactNode } from "react";

import { MAIN_CONTENT_ID } from "@/components/a11y/SkipLink";
import { MotionProvider } from "@/components/motion/MotionProvider";

/**
 * Stay Awhile — the multi-route, garden-navigated experience, entered at
 * `/stay`.
 *
 * This route group exists so that the experience's eventual environmental
 * work — imagery, ambient motion, and whatever the garden map turns out to
 * need — is code-split behind it. Every asset for Stay Awhile must be imported
 * inside this tree, never from `public/` and never from a shared module, or
 * visitors who chose the 90-second route will pay for it.
 */
export default function StayAwhileLayout({ children }: { children: ReactNode }) {
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1}>
      <MotionProvider>{children}</MotionProvider>
    </main>
  );
}
