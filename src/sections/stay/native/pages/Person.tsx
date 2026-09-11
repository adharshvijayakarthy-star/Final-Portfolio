"use client";
import { Fragment, type CSSProperties } from "react";
import { StayLink } from "../StayLink";
import { DestinationFrame } from "../DestinationFrame";
import styles from "./person.module.css";
import "./person-keyframes.css";
import data from "./person-content.json";
import { startPerson } from "../person-controller";

// Native transcription of the reviewed Person composition; authored motion lives in its controller.
export function Person(){ return <div className={styles.page}><DestinationFrame name="person" start={startPerson}>
<div className={styles.s0}>

<div className={styles.s1} data-fg="1" aria-hidden="true">
<svg className={styles.s2} viewBox="0 0 520 360" preserveAspectRatio="xMinYMin slice">
<g fill="#4c5442" opacity="0.9">
<path d="M-30 8 C 60 30, 140 52, 214 96 C 256 121, 288 150, 306 178 C 292 156, 262 128, 220 104 C 146 62, 62 42, -30 24 Z"></path>
<path d="M96 38 C 118 62, 128 92, 130 122 C 124 96, 112 68, 88 46 Z"></path>
<path d="M182 78 C 214 86, 240 74, 262 56 C 244 84, 212 98, 178 92 Z"></path>
</g>
<g fill="#5c6650" opacity="0.85">
<ellipse cx="118" cy="128" rx="19" ry="8" transform="rotate(34 118 128)"></ellipse>
<ellipse cx="140" cy="146" rx="16" ry="7" transform="rotate(52 140 146)"></ellipse>
<ellipse cx="252" cy="52" rx="18" ry="7.5" transform="rotate(-22 252 52)"></ellipse>
<ellipse cx="276" cy="66" rx="15" ry="6.5" transform="rotate(-8 276 66)"></ellipse>
<ellipse cx="60" cy="44" rx="20" ry="8" transform="rotate(18 60 44)"></ellipse>
</g>
<g fill="#d7b8b7" opacity="0.88">
<ellipse className={styles.s3} data-leaf="1" data-rot="24" cx="196" cy="98" rx="8" ry="5"></ellipse>
<ellipse className={styles.s4} data-leaf="2" data-rot="-14" cx="228" cy="120" rx="7" ry="4.5"></ellipse>
<ellipse className={styles.s5} data-leaf="3" data-rot="40" cx="132" cy="86" rx="7.5" ry="4.8"></ellipse>
<ellipse className={styles.s6} data-leaf="4" data-rot="-32" cx="292" cy="86" rx="6.5" ry="4.2"></ellipse>
</g>
</svg>
</div>
<div className={styles.s7} id="stay-person-content">

<section className={styles.s8} data-screen-label="Person opening">
<div className={styles.s9} data-editorial-grid="true">
<div aria-hidden="true"></div>
<div>
<p className={styles.s10}>{"01 · Open clearing"}</p>
<h1 className={styles.s11}>{"The Person"}</h1>
<p className={styles.s12}>{"Before the projects, there is the person who keeps trying to build them."}</p>
</div>
</div>
</section>

<section className={styles.s13} data-screen-label="Ambition" aria-labelledby="p-intro" data-step="1">
<div className={styles.s14} data-editorial-grid="true">
<div aria-hidden="true"></div>
<div className={styles.s15} data-reveal="1">
<h2 className={styles.s16} id="p-intro">{"I am ambitious, and I would rather say so plainly."}</h2>
<p className={styles.s17}>{"I want to become exceptionally capable. Not capable in a way that looks good on a page, but capable in the way that means I can be handed a difficult problem and be trusted with it."}</p>
<p className={styles.s18}>{"I want freedom — not simply money, but the ability to choose how I spend my time, where I go, what I work on, and who I build my life with. Money is part of that, but only as a means."}</p>
<p className={styles.s19}>{"I care about meaningful relationships, and I don't want a life protected from failure. I want a life worth experiencing, which is a different specification entirely."}</p>
</div>
</div>
</section>

<section className={styles.s20} data-screen-label="Five things" aria-labelledby="p-five">
<h2 className={styles.s21} id="p-five">{"Five things I keep returning to"}</h2>
{data.concepts.map((c, index) => <Fragment key={index}>
<div style={c.wrap as CSSProperties} data-step={c.step}>
<div style={c.inner as CSSProperties} data-reveal="1">
{c.join && <>
<svg className={styles.s22} data-join="1" viewBox="0 0 300 70" preserveAspectRatio="none" aria-hidden="true">
<path d="M2 66 C 70 60, 120 40, 298 8" fill="none" stroke="rgba(107,99,78,0.6)" strokeWidth="9" strokeLinecap="round" vectorEffect="non-scaling-stroke"></path>
<path data-second="1" d="M2 4 C 90 22, 150 34, 298 8" fill="none" stroke="rgba(107,99,78,0.42)" strokeWidth="7" strokeLinecap="round" vectorEffect="non-scaling-stroke"></path>
</svg>
</>}
<p className={styles.s23}>{c.name}</p>
<p className={styles.s24}>{c.body}</p>
</div>
</div>
</Fragment>)}
</section>
<section className={styles.s25} data-screen-label="The question" aria-label="The question underneath" data-step="7">
<p className={styles.s26} data-reveal="1">{"And underneath most of it, one question"}</p>
<blockquote className={styles.s27} data-reveal="2">{"“What would it take to become someone I could genuinely admire?”"}</blockquote>
</section>
<footer className={styles.s28}>
<div className={styles.s29}>
<p className={styles.s30}>{"Onward — this page ends here"}</p>
<div className={styles.s31}>
<StayLink className={styles.s32} href="/stay/builder/">
<span className={styles.s33}>{"02 · Timber frame"}</span>
<span className={styles.s34}>{"The Builder"}</span>
</StayLink>
<StayLink className={styles.s35} href="/stay/thinker/">
<span className={styles.s36}>{"03 · Quiet water"}</span>
<span className={styles.s37}>{"The Thinker"}</span>
</StayLink>
<StayLink className={styles.s38} href="/stay/">
<span className={styles.s39}>{"00 · Arrival"}</span>
<span className={styles.s40}>{"Back to the garden"}</span>
</StayLink>
</div>
<p className={styles.s41}>{"Or open the garden map for any of the nine places."}</p>
</div>
</footer>
</div>
</div>
</DestinationFrame></div>; }
