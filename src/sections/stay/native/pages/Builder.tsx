"use client";
import { Fragment, type CSSProperties } from "react";
import { StayLink } from "../StayLink";
import { DestinationFrame } from "../DestinationFrame";
import styles from "./builder.module.css";
import "./builder-keyframes.css";

// Native transcription of the reviewed Builder composition; authored motion lives in its controller.
export function Builder(){ return <div className={styles.page}><DestinationFrame name="builder">
<div className={styles.s0}>
<div className={styles.s1} id="stay-builder-content">
<section className={styles.s2} data-screen-label="Builder opening">
<div className={styles.s3}>
<p className={styles.s4}>{"02 · Timber frame"}</p>
<h1 className={styles.s5}>{"The Builder"}</h1>
<p className={styles.s6}>{"I like turning ideas into systems."}</p>
<ul className={styles.s7}>
<li className={styles.s8}>{"Build"}</li>
<li className={styles.s9}>{"Systemize"}</li>
<li className={styles.s10}>{"Experiment"}</li>
<li className={styles.s11}>{"Iterate"}</li>
</ul>
</div>
</section>
<section className={styles.s12} aria-labelledby="b-intro">
<div className={styles.s13}>
<h2 className={styles.s14} id="b-intro">{"The interesting part is never the interface."}</h2>
<p className={styles.s15}>{"What draws me in is the set of rules underneath a thing — the constraints, the weighting, the cases nobody planned for. An idea becomes a system at the moment you have to decide what happens when two of your own rules disagree."}</p>
<p className={styles.s16}>{"So I build, watch where the rules break, change something, and try again. Most of what follows was built that way."}</p>
</div>
</section>
<section className={styles.s17} aria-labelledby="b-artifacts">
<div className={styles.s18}>
<div className={styles.s19}>
<h2 className={styles.s20} id="b-artifacts">{"Five things on the bench"}</h2>
<StayLink className={styles.s21} href="/stay/work/">{"The full workshop ↗"}</StayLink>
</div>
<ol className={styles.s22}>
<li className={styles.s23}>
<span className={styles.s24}>{"01"}</span>
<span className={styles.s25}>
<span className={styles.s26}>{"Study Planner"}</span>
<span className={styles.s27}>{"A planner for the IB workload. Subjects, priorities, sessions, breaks, days and weeks — and a scheduling engine that has to produce a reasonable distribution, not just a filled calendar."}</span>
</span>
<span className={styles.s28}>{"Constraints"}</span>
</li>
<li className={styles.s29}>
<span className={styles.s30}>{"02"}</span>
<span className={styles.s31}>
<span className={styles.s32}>{"IGCSE Past Paper Logger & Analytics"}</span>
<span className={styles.s33}>{"Logging completed past papers and their scores, then turning that record into graphs, trends and an estimate of where performance might be heading."}</span>
</span>
<span className={styles.s34}>{"Data"}</span>
</li>
<li className={styles.s35}>
<span className={styles.s36}>{"03"}</span>
<span className={styles.s37}>
<span className={styles.s38}>{"MUN Club"}</span>
<span className={styles.s39}>{"A weekly Model United Nations club for younger students. The system here was made of lessons, debates and simulations rather than code — and it still had to run every week."}</span>
</span>
<span className={styles.s40}>{"People"}</span>
</li>
<li className={styles.s41}>
<span className={styles.s42}>{"04"}</span>
<span className={styles.s43}>
<span className={styles.s44}>{"SNRLED Parties"}</span>
<span className={styles.s45}>{"A party registration system built for friends: registration, payment, verification, an admin view, and pricing that changed once early-bird capacity was reached. Archived — no longer deployed, source preserved."}</span>
</span>
<span className={styles.s46}>{"Archived"}</span>
</li>
<li className={styles.s47}>
<span className={styles.s48}>{"05"}</span>
<span className={styles.s49}>
<span className={styles.s50}>{"Project AURA"}</span>
<span className={styles.s51}>{"The strangest thing I have built is a model of myself. It began as a portfolio and became an attempt to understand the person the portfolio was supposed to represent."}</span>
</span>
<span className={styles.s52}>{"Ongoing"}</span>
</li>
</ol>
</div>
</section>
<section className={styles.s53} aria-labelledby="b-honest">
<div className={styles.s54}>
<p className={styles.s55}>{"Where I actually stand"}</p>
<h2 className={styles.s56} id="b-honest">{"I have built real things. I am not yet the engineer I intend to become."}</h2>
<p className={styles.s57}>{"These projects exist and they work. I built them with AI assistance, and I read and understand a substantial amount of the code that came out of that. Understanding code and writing it independently are different capabilities, and I would rather name the difference than blur it."}</p>
<p className={styles.s58}>{"My technical depth is still developing. What is already there is the appetite for difficult systems — and a habit of not stopping at the first version."}</p>
</div>
</section>
<footer className={styles.s59}>
<div className={styles.s60}>
<p className={styles.s61}>{"Onward — this page ends here"}</p>
<div className={styles.s62}>
<StayLink className={styles.s63} href="/stay/work/">
<span className={styles.s64}>{"06 · Workshop"}</span>
<span className={styles.s65}>{"The Work"}</span>
</StayLink>
<StayLink className={styles.s66} href="/stay/leader/">
<span className={styles.s67}>{"04 · Courtyard"}</span>
<span className={styles.s68}>{"The Leader"}</span>
</StayLink>
<StayLink className={styles.s69} href="/stay/">
<span className={styles.s70}>{"00 · Arrival"}</span>
<span className={styles.s71}>{"Back to the garden"}</span>
</StayLink>
</div>
</div>
</footer>
</div>
</div>
</DestinationFrame></div>; }
