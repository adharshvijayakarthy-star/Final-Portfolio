import type { StayDestination } from "../native/destinations";

export type TravelFamily = "spatial" | "matched" | "atmosphere";
/** Story relationships choose the bridge. The atlas is reserved for map travel. */
export function travelFamily(from: StayDestination, to: StayDestination): TravelFamily {
  if (to === "contact" || from === "contact" || from === "thinker" || to === "thinker" || to === "stories") return "atmosphere";
  if ((from === "work" && to === "future") || (from === "future" && to === "work") || (from === "future" && to === "aura")) return "matched";
  return "spatial";
}
