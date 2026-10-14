import type { ReactNode } from "react";

import { MAIN_CONTENT_ID } from "@/components/a11y/SkipLink";

/** Quick owns its imperative motion and reduced-motion handling. Stay assets
 * remain behind their separate route group. */
export default function QuickDiscoveryLayout({ children }: { children: ReactNode }) {
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1}>
      {children}
    </main>
  );
}
