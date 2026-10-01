import { NarrativeRoute } from "./NarrativeRoute";
import { personBeats } from "./core-narrative";
import { achievements } from "@/data/content";
export function PersonRuntimeContent() {
  const beats = personBeats.map(beat => beat.id === "person-b06" ? { ...beat, detail: <details>
    <summary>Music and athletics · supporting records</summary>
    {achievements.filter(item => item.id !== "strat-mun").map(item => <div key={item.id}>
      <h3>{item.title}</h3><p>{item.detail}</p>
    </div>)}
    <p>These achievements were supplied for the portfolio. Original certificate scans are pending.</p>
  </details> } : beat);
  return <NarrativeRoute id="person" beats={beats} />;
}
