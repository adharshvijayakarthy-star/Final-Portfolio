import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { SkipLink } from "@/components/a11y/SkipLink";
import { site } from "@/data/site";
import { fontVariables } from "@/lib/fonts";

import "@/styles/global.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.name,
    template: `%s — ${site.name}`,
  },
  applicationName: site.name,
  description: site.description,
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  // Matches --color-surface-page, so mobile browser chrome does not flash
  // white before first paint.
  themeColor: "#0a0b0d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // No maximumScale, no userScalable:false — pinch zoom stays available.
};

/**
 * THE NO-JAVASCRIPT GUARANTEE.
 *
 * Motion renders its `initial` state as an inline style during SSR, so a
 * reveal whose in-view event never fires would sit at opacity 0 forever. If
 * scripts do not run — blocked, failed, or disabled — this makes every
 * reveal-wrapped element visible, and the page degrades to a plain readable
 * document rather than an empty one.
 *
 * Inline so it applies before first paint; inside <noscript> so it costs
 * nothing when JS is available.
 */
const NOSCRIPT_MOTION_FALLBACK = `<style>[data-motion-reveal]{opacity:1!important;transform:none!important;translate:none!important;scale:none!important;filter:none!important;clip-path:none!important}</style>`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={site.locale} className={fontVariables}>
      <head>
        <noscript dangerouslySetInnerHTML={{ __html: NOSCRIPT_MOTION_FALLBACK }} />
      </head>
      <body>
        <SkipLink />
        {/* The animation runtime is mounted per experience, not here — see
            the layouts in (quick-discovery) and (stay-awhile). The entry
            threshold animates in CSS and loads none of it. */}
        {children}
      </body>
    </html>
  );
}
