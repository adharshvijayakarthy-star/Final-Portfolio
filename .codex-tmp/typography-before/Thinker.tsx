"use client";
import { Fragment, type CSSProperties } from "react";
import { StayLink } from "../StayLink";
import { DestinationFrame } from "../DestinationFrame";
import styles from "./thinker.module.css";
import "./thinker-keyframes.css";
import data from "./thinker-content.json";
import { startThinker } from "../thinker-controller";

// Native transcription of the reviewed Thinker composition; authored motion lives in its controller.
export function Thinker(){ return <div className={styles.page}><DestinationFrame name="thinker" start={startThinker}>
<div className={styles.s0}>
<div className={styles.s1} id="stay-thinker-content">
<section className={styles.s2} data-screen-label="Thinker opening">
<p className={styles.s3}>{"03 · Quiet water"}</p>
<h1 className={styles.s4}>{"The Thinker"}</h1>
<p className={styles.s5}>{"Some of the things I think about have nothing to do with code."}</p>
</section>

<section className={styles.s6} data-screen-label="Desire" aria-labelledby="t-desire" data-moment="1">
<div className={styles.s7} aria-hidden="true" data-petal="1"></div>
<div className={styles.s8} aria-hidden="true" data-rings="1">
<span className={styles.s9} data-ring="1"></span>
<span className={styles.s10} data-ring="2"></span>
<span className={styles.s11} data-ring="3"></span>
</div>
<p className={styles.s12} data-reveal="1">{"01 · Desire"}</p>
<h2 className={styles.s13} id="t-desire" data-reveal="2">{"We are animals that want things badly enough to invent them."}</h2>
<div className={styles.s14} data-reveal="3">
<p className={styles.s15}>{"The model I keep coming back to is this: human beings are animals whose unusual desire, ingenuity and perseverance let them create things that previously did not exist. Nothing about us guarantees it. The wanting comes first, and then a long stretch of stubbornness."}</p>
<p className={styles.s16}>{"This is a personal philosophical model, not a scientific claim."}</p>
</div>
</section>

<section className={styles.s17} data-screen-label="Freedom" aria-labelledby="t-freedom" data-moment="2">
<div className={styles.s18}>
<p className={styles.s19} data-reveal="1">{"02 · Freedom"}</p>
<h2 className={styles.s20} id="t-freedom" data-reveal="2">{"Money matters because it buys choice."}</h2>
<div className={styles.s21} data-reveal="3">
<p className={styles.s22}>{"Freedom is not one thing. When I use the word I mean at least seven of them, and they come apart from each other more often than people admit."}</p>
</div>
<ul className={styles.s23} data-stones="1">
{data.freedoms.map((f, index) => <Fragment key={index}>
<li style={f.style as CSSProperties} data-stone={f.i}>{f.name}</li>
</Fragment>)}
</ul>
<div className={styles.s24} data-reveal="4">
<p className={styles.s25}>{"Money matters because it creates freedom. Freedom matters because it creates choice. That is the whole of my interest in it."}</p>
</div>
</div>
</section>

<section className={styles.s26} data-screen-label="Failure" aria-labelledby="t-failure" data-moment="3">
<p className={styles.s27} data-reveal="1">{"03 · Failure"}</p>
<h2 className={styles.s28} id="t-failure" data-reveal="2">{"Failing is not the lesson. The return is."}</h2>
<div className={styles.s29} data-reveal="3">
<p className={styles.s30}>{"Failure does not automatically make someone better. Plenty of it teaches nothing at all. What reveals something about a person is the sequence: trying, failing, understanding why, changing something, and trying again. I am more interested in whether someone goes back than in whether they fell."}</p>
</div>
</section>

<section className={styles.s31} data-screen-label="Vulnerability" aria-labelledby="t-vuln" data-moment="4">
<div className={styles.s32} data-reveal="1">
<p className={styles.s33}>{"04 · Vulnerability · the fortress test"}</p>
<h2 className={styles.s34} id="t-vuln">{"I could build a life nothing could reach. I don't want it."}</h2>
<p className={styles.s35}>{"Here is the test I put to myself. Suppose I designed a life where nothing could hurt me: no betrayal, no disappointment, no loss. It would work. It would also remove most of the experiences that make a life worth having."}</p>
<p className={styles.s36}>{"So the fortress is not the goal. Being reachable is the cost of the things I actually want."}</p>
</div>
</section>

<section className={styles.s37} data-screen-label="Excellence" aria-labelledby="t-excellence" data-moment="5">
<div className={styles.s38} data-reveal="1">
<p className={styles.s39}>{"05 · Excellence"}</p>
<h2 className={styles.s40} id="t-excellence">{"Ship it imperfect. Keep the debt on the books."}</h2>
<p className={styles.s41}>{"I can put out something imperfect in the short term and still intend to improve or redeem it later. Those two things are not in conflict for me. What I try to avoid is the quiet trade where shipping something rough becomes permission to stop caring about it."}</p>
</div>
</section>
<footer className={styles.s42}>
<div className={styles.s43}>
<p className={styles.s44}>{"Onward — this page ends here"}</p>
<div className={styles.s45}>
<StayLink className={styles.s46} href="/stay/stories/">
<span className={styles.s47}>{"05 · Intimate paths"}</span>
<span className={styles.s48}>{"Stories"}</span>
</StayLink>
<StayLink className={styles.s49} href="/stay/contact/">
<span className={styles.s50}>{"09 · Open garden"}</span>
<span className={styles.s51}>{"Contact"}</span>
</StayLink>
<StayLink className={styles.s52} href="/stay/">
<span className={styles.s53}>{"00 · Arrival"}</span>
<span className={styles.s54}>{"Back to the garden"}</span>
</StayLink>
</div>
</div>
</footer>
</div>
</div>
</DestinationFrame></div>; }
