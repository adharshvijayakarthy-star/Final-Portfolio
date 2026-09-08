import type { Metadata } from "next";

import { Threshold } from "@/sections/entry/Threshold";

export const metadata: Metadata = {
  // The page's own words, not marketing copy written for a meta tag.
  description: "Want to discover Adharsh? How much time do you have?",
};

export default function EntryPage() {
  return <Threshold />;
}
