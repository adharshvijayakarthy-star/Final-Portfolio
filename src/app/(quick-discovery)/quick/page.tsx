import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getExperience } from "@/data/site";
import { QuickDiscovery } from "@/sections/quick-discovery/QuickDiscovery";

const experience = getExperience("quick-discovery");

export const metadata: Metadata = {
  title: experience?.label,
  description:
    "Ninety seconds. Six chapters, four projects, and a direction — a short introduction to Adharsh Vijayakarthy and the work behind the person.",
};

/**
 * The Quick Discovery scroll, built from the approved design source
 * (`Quick Discovery.dc.html`). Everything it renders lives in
 * `src/sections/quick-discovery/`.
 */
export default function QuickDiscoveryPage() {
  if (!experience) notFound();

  return <QuickDiscovery />;
}
