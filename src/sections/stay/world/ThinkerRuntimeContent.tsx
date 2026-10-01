import { NarrativeRoute } from "./NarrativeRoute";
import { thinkerBeats } from "./core-narrative";
export function ThinkerRuntimeContent() { return <NarrativeRoute id="thinker" beats={thinkerBeats} />; }