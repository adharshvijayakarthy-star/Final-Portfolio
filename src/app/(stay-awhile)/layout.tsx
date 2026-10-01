import type { ReactNode } from "react";
import { EB_Garamond } from "next/font/google";

import { MAIN_CONTENT_ID } from "@/components/a11y/SkipLink";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { StayExperienceProvider } from "@/sections/stay/world/StayExperienceProvider";
import { StayNavigation } from "@/sections/stay/native/StayNavigation";
import "@/sections/stay/world/editorial.css";

// Stay's editorial body face; never applied to the root or Quick Discovery.
const stayBody = EB_Garamond({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], display: "swap", variable: "--stay-body-face" });

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
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className={stayBody.variable}>
      <MotionProvider><StayExperienceProvider><StayNavigation>{children}</StayNavigation></StayExperienceProvider></MotionProvider>
    </main>
  );
}
