import { NarrativeRoute } from "./NarrativeRoute";
import { builderBeats } from "./core-narrative";
export function BuilderRuntimeContent() { return <NarrativeRoute id="builder" beats={builderBeats} />; }