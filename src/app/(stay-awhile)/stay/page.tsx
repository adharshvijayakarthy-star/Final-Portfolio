import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getExperience } from "@/data/site";
import { StayAwhile } from "@/sections/stay/StayAwhile";
import { StayShell } from "@/sections/stay/native/StayShell";
import { GardenContent } from "@/sections/stay/native/GardenContent";

const experience = getExperience("stay-awhile");

export const metadata: Metadata = {
  title: experience?.label,
  description: "A place, rather than a page. Take your time in Adharsh Vijayakarthy’s garden.",
};

/**
 * Phase 1: native Garden entry only. Existing project hash links retain their
 * editorial destination; no future Stay destination is registered yet.
 */
export default function StayAwhilePage() {
  if (!experience) notFound();

  return <StayShell legacy={<StayAwhile />}><GardenContent /></StayShell>;
}
