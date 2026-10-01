import { NarrativeRoute } from "./NarrativeRoute";
import { leaderBeats } from "./onward-narrative";
export function LeaderRuntimeContent() { return <NarrativeRoute id="leader" beats={leaderBeats} />; }