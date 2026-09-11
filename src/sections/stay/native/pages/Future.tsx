"use client";
import { Fragment, type CSSProperties } from "react";
import { StayLink } from "../StayLink";
import { DestinationFrame } from "../DestinationFrame";
import styles from "./future.module.css";
import "./future-keyframes.css";

// Native transcription of the reviewed Future composition; authored motion lives in its controller.
export function Future(){ return <div className={styles.page}><DestinationFrame name="future">
<div className={styles.s0}>
<div className={styles.s1} id="stay-future-content">
<section className={styles.s2} data-screen-label="Future opening">
<p className={styles.s3}>{"07 · Open horizon"}</p>
<h1 className={styles.s4}>{"The Future"}</h1>
<p className={styles.s5}>{"What am I becoming?"}</p>
</section>
<section className={styles.s6} aria-labelledby="f-intent">
<div className={styles.s7}>
<h2 className={styles.s8} id="f-intent">{"I'm not interested in staying where I am."}</h2>
<p className={styles.s9}>{"I'm moving toward AI and machine learning. Toward intelligent systems. Toward deeper technical competence, and toward research — the kind of work where the question is genuinely open."}</p>
<p className={styles.s10}>{"Mostly I want to build things that are actually difficult, and to be the reason they work."}</p>
</div>
</section>
<section className={styles.s11} aria-label="Direction">
<ul className={styles.s12}>
<li className={styles.s13}>{"AI & machine learning"}</li>
<li className={styles.s14}>{"Intelligent systems"}</li>
<li className={styles.s15}>{"Difficult software"}</li>
<li className={styles.s16}>{"Research"}</li>
</ul>
</section>
<section className={styles.s17} aria-label="Where I actually am">
<p className={styles.s18}>{"I'm not there yet."}</p>
<p className={styles.s19}>{"That's the point."}</p>
</section>
<section className={styles.s20} aria-labelledby="f-now">
<div className={styles.s21}>
<h2 className={styles.s22} id="f-now">{"Where I am today"}</h2>
<p className={styles.s23}>{"An IB student, building and experimenting, using AI assistance while developing the independent technical depth the work I want will require. A direction, not an arrival."}</p>
</div>
</section>
<footer className={styles.s24}>
<div className={styles.s25}>
<p className={styles.s26}>{"Onward — this page ends here"}</p>
<div className={styles.s27}>
<StayLink className={styles.s28} href="/stay/aura/">
<span className={styles.s29}>{"08 · Archive"}</span>
<span className={styles.s30}>{"AURA"}</span>
</StayLink>
<StayLink className={styles.s31} href="/stay/contact/">
<span className={styles.s32}>{"09 · Open garden"}</span>
<span className={styles.s33}>{"Contact"}</span>
</StayLink>
<StayLink className={styles.s34} href="/stay/">
<span className={styles.s35}>{"00 · Arrival"}</span>
<span className={styles.s36}>{"Back to the garden"}</span>
</StayLink>
</div>
</div>
</footer>
</div>
</div>
</DestinationFrame></div>; }
