/** Ephemeral Landing handoff only. Authored route/scroll scores are untouched. */
export type EntryHandoff = {
  destination: "quick" | "stay";
  reduced: boolean;
  time: number;
  ready: boolean;
  arrival: number;
};
let handoff: EntryHandoff | null = null;
export function getEntryHandoff() { return handoff; }
export function beginEntryHandoff(destination: EntryHandoff["destination"], reduced: boolean) {
  handoff = { destination, reduced, time: 0, ready: false, arrival: 0 };
  return handoff;
}
export function finishEntryHandoff() {
  handoff = null;
  window.dispatchEvent(new Event("aura:entry-complete"));
}
