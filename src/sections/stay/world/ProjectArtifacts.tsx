"use client";
import { useId, useState } from "react";
import styles from "./artifacts.module.css";

/** A small demonstration of competing constraints, not a reconstruction of the
 * original planner or a claim about a student's actual timetable. */
export function PlannerArtifact() {
  const id = useId();
  const [weight, setWeight] = useState(1.5);
  const names = ["Maths", "Physics", "Chemistry", "English", "French", "Business"];
  const weights = [weight,1.5,1.5,1,1,1];
  const totals = names.map(() => 0), blocks: string[] = [];
  for (let i=0; i<12; i++) {
    let chosen = -1, best = Infinity;
    for (let j=0; j<names.length; j++) {
      if (blocks.at(-1) === names[j]) continue;
      const score = totals[j]! / weights[j]!;
      if (score < best) { best=score; chosen=j; }
    }
    totals[chosen] = totals[chosen]! + 1; blocks.push(names[chosen]!);
  }
  return <figure className={styles.artifact}>
    <label htmlFor={id}>Maths priority <output>{weight.toFixed(1)}</output></label>
    <input id={id} data-planner-control aria-label="Illustrative Maths priority" type="range" min=".5" max="3" step=".5" value={weight} onChange={event=>setWeight(Number(event.target.value))} />
    <noscript><style>{'[data-planner-control]{display:none}'}</style><p>Fixed illustration at a Maths priority of 1.5.</p></noscript>
    <ol className={styles.blocks}>{blocks.map((name,i)=><li key={i}><span>{name}</span>{i%3===2&&<small>Break</small>}</li>)}</ol>
    <figcaption>Illustrative constraint sketch · increase a weight, keep breaks and avoid consecutive repetition. This is not the original planner or an actual study plan.</figcaption>
  </figure>;
}

export function LoggerArtifact() {
  return <figure className={styles.artifact}>
    <svg viewBox="0 0 480 140" role="img" aria-label="Illustrative trend with a solid practice history and a separate dashed estimate. No actual scores are shown.">
      <path d="M20 110H460M20 20V110" fill="none" stroke="#d5c5a5" opacity=".6" />
      <path d="M35 92L95 80L155 85L215 61L275 49L335 42" fill="none" stroke="#f7f2e7" strokeWidth="2" />
      <path d="M335 42L450 25" fill="none" stroke="#d5c5a5" strokeDasharray="5 5" strokeWidth="2" />
      {[35,95,155,215,275,335].map((x,i)=><circle key={x} cx={x} cy={[92,80,85,61,49,42][i]} r="3" fill="#f7f2e7" />)}
      <text x="20" y="134" fill="#d5c5a5" fontSize="11">Practice history</text><text x="380" y="134" fill="#d5c5a5" fontSize="11">Estimate</text>
    </svg>
    <figcaption>Illustrative trend · no actual scores shown. The dashed projection is an estimate, with no established prediction accuracy.</figcaption>
  </figure>;
}

export function MunArtifact() {
  return <details><summary>A procedural problem to try</summary>
    <p>A delegate wants the committee to discuss one part of its agenda in a structured debate. A motion for a moderated caucus needs a topic, duration and speaking time. Knowing those words is different from being able to use them in a room.</p>
    <p>This illustrative situation shows the teaching approach: explain a rule, put it inside an activity, then revise through practice. It is not a transcript of an actual club session.</p>
  </details>;
}
