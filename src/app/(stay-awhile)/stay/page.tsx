import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getExperience } from "@/data/site";
import { StayAwhile } from "@/sections/stay/StayAwhile";

const experience = getExperience("stay-awhile");

export const metadata: Metadata = {
  title: experience?.label,
  // Not indexable until the experience actually exists.
  description: "The work and questions behind Adharsh Vijayakarthy’s portfolio.",
};

/**
 * PLACEHOLDER. The Stay Awhile entry, the garden map and the routes beneath
 * them are built in a later phase.
 */
export default function StayAwhilePage() {
  if (!experience) notFound();

  return <StayAwhile />;
}
