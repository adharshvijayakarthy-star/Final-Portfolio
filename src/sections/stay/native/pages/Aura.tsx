"use client";
import { Fragment, type CSSProperties } from "react";
import { StayLink } from "../StayLink";
import { DestinationFrame } from "../DestinationFrame";
import styles from "./aura.module.css";
import "./aura-keyframes.css";
import { startAura } from "../aura-controller";

// Native transcription of the reviewed Aura composition; authored motion lives in its controller.
export function Aura(){ return <div className={styles.page}><DestinationFrame name="aura" start={startAura}>
<div className={styles.s0}>
<div className={styles.s1} id="stay-aura-content">
<section className={styles.s2} data-screen-label="AURA opening">
<div className={styles.s3}>
<p className={styles.s4}>{"08 · Archive"}</p>
<h1 className={styles.s5}>{"Project AURA"}</h1>
<p className={styles.s6}>{"Why this portfolio is built the way it is."}</p>
<p className={styles.s7}>{"Keep going — the garden organises itself below"}</p>
</div>
</section>

<section className={styles.s8} data-scrub="1" data-screen-label="AURA transformation" aria-label="How the model was built">
<div className={styles.s9} data-sticky="1">
<div className={styles.s10}>

<div className={styles.s11} data-words="1">
<p className={styles.s12} data-say="1">{"I started by trying to build a portfolio."}</p>
<p className={styles.s13} data-say="2">{"I realised I didn't understand the person the portfolio was supposed to represent."}</p>
<p className={styles.s14} data-say="3">{"So I stopped building the portfolio."}</p>
<p className={styles.s15} data-say="4">{"And started trying to understand the person."}</p>
<ol className={styles.s16} data-say="5">
<li className={styles.s17} data-row="1"><span className={styles.s18}>{"Discovery"}</span><span className={styles.s19}>{"Unstructured reality"}</span></li>
<li className={styles.s20} data-row="2"><span className={styles.s21}>{"Evidence"}</span><span className={styles.s22}>{"Observation"}</span></li>
<li className={styles.s23} data-row="3"><span className={styles.s24}>{"Understanding"}</span><span className={styles.s25}>{"Organization"}</span></li>
<li className={styles.s26} data-row="4"><span className={styles.s27}>{"Model"}</span><span className={styles.s28}>{"A working account"}</span></li>
<li className={styles.s29} data-row="5"><span className={styles.s30}>{"Expression"}</span><span className={styles.s31}>{"This garden"}</span></li>
</ol>
</div>

<div className={styles.s32} data-field="1">
<svg className={styles.s33} data-edges="1" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
<g data-web="1" stroke="rgba(61,76,58,0.34)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke">
<path data-e="w" d="M12 22 C 22 34, 14 44, 18 62"></path>
<path data-e="w" d="M18 62 C 24 70, 26 76, 31 83"></path>
<path data-e="w" d="M12 22 C 26 24, 34 28, 40 34"></path>
<path data-e="w" d="M40 34 C 36 52, 34 62, 31 83"></path>
<path data-e="w" d="M8 45 C 14 44, 16 50, 18 62"></path>
</g>
<g data-links="1" stroke="rgba(176,144,79,0.6)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke">
<path data-e="l" d="M12 22 C 34 20, 40 14, 52 15"></path>
<path data-e="l" d="M12 22 C 34 28, 40 24, 52 24"></path>
<path data-e="l" d="M40 34 C 46 32, 48 32, 52 33"></path>
<path data-e="l" d="M8 45 C 30 42, 40 42, 52 42"></path>
<path data-e="l" d="M18 62 C 34 54, 44 52, 52 51"></path>
<path data-e="l" d="M18 62 C 34 60, 44 60, 52 60"></path>
<path data-e="l" d="M31 83 C 40 76, 46 70, 52 69"></path>
<path data-e="l" d="M31 83 C 40 82, 46 79, 52 78"></path>
<path data-e="l" d="M40 34 C 46 56, 48 78, 52 87"></path>
</g>
<line data-spine="1" x1="52" y1="14" x2="52" y2="88" stroke="rgba(61,76,58,0.45)" strokeWidth="1" vectorEffect="non-scaling-stroke"></line>
</svg>
<span className={styles.s34} data-node="1"></span>
<span className={styles.s35} data-node="2"></span>
<span className={styles.s36} data-node="3"></span>
<span className={styles.s37} data-node="4"></span>
<span className={styles.s38} data-node="5"></span>
<span className={styles.s39} data-frag="1" data-sx="6" data-sy="14"></span>
<span className={styles.s40} data-frag="2" data-sx="20" data-sy="10"></span>
<span className={styles.s41} data-frag="3" data-sx="4" data-sy="34"></span>
<span className={styles.s42} data-frag="4" data-sx="26" data-sy="44"></span>
<span className={styles.s43} data-frag="5" data-sx="10" data-sy="55"></span>
<span className={styles.s44} data-frag="6" data-sx="30" data-sy="66"></span>
<span className={styles.s45} data-frag="7" data-sx="14" data-sy="76"></span>
<span className={styles.s46} data-frag="8" data-sx="38" data-sy="90"></span>
<span className={styles.s47} data-frag="9" data-sx="34" data-sy="20"></span>
<span className={styles.s48} data-frag="10" data-sx="22" data-sy="90"></span>
<div className={styles.s49} data-doc="1" data-dx="26" data-dy="18" data-rot="-7"><span className={styles.s50} data-glyph="1"></span><span className={styles.s51} data-label="1">{"The Person"}</span></div>
<div className={styles.s52} data-doc="2" data-dx="-18" data-dy="26" data-rot="5"><span className={styles.s53} data-glyph="2"></span><span className={styles.s54} data-label="2">{"The Builder"}</span></div>
<div className={styles.s55} data-doc="3" data-dx="30" data-dy="-14" data-rot="8"><span className={styles.s56} data-glyph="3"></span><span className={styles.s57} data-label="3">{"The Thinker"}</span></div>
<div className={styles.s58} data-doc="4" data-dx="-26" data-dy="-8" data-rot="-4"><span className={styles.s59} data-glyph="4"></span><span className={styles.s60} data-label="4">{"The Leader"}</span></div>
<div className={styles.s61} data-doc="5" data-dx="20" data-dy="30" data-rot="6"><span className={styles.s62} data-glyph="5"></span><span className={styles.s63} data-label="5">{"Stories"}</span></div>
<div className={styles.s64} data-doc="6" data-dx="-30" data-dy="10" data-rot="-9"><span className={styles.s65} data-glyph="6"></span><span className={styles.s66} data-label="6">{"The Work"}</span></div>
<div className={styles.s67} data-doc="7" data-dx="24" data-dy="-22" data-rot="4"><span className={styles.s68} data-glyph="7"></span><span className={styles.s69} data-label="7">{"The Future"}</span></div>
<div className={styles.s70} data-doc="8" data-dx="-22" data-dy="-26" data-rot="7"><span className={styles.s71} data-glyph="8"></span><span className={styles.s72} data-label="8">{"AURA"}</span></div>
<div className={styles.s73} data-doc="9" data-dx="16" data-dy="16" data-rot="-6"><span className={styles.s74} data-glyph="9"></span><span className={styles.s75} data-label="9">{"Contact"}</span></div>
</div>
</div>
</div>
</section>
<section className={styles.s76} aria-labelledby="a-process">
<div className={styles.s77}>
<h2 className={styles.s78} id="a-process">{"The process, in five layers"}</h2>
<ol className={styles.s79}>
<li className={styles.s80}>
<span className={styles.s81}>{"01"}</span>
<span className={styles.s82}>{"Conversation"}</span>
<span className={styles.s83}>{"Long questioning before any conclusions. Most of what I believed about myself did not survive being asked twice."}</span>
</li>
<li className={styles.s84}>
<span className={styles.s85}>{"02"}</span>
<span className={styles.s86}>{"Evidence"}</span>
<span className={styles.s87}>{"Claims attached to something real — a project, a session, a moment — rather than left as adjectives."}</span>
</li>
<li className={styles.s88}>
<span className={styles.s89}>{"03"}</span>
<span className={styles.s90}>{"Understanding"}</span>
<span className={styles.s91}>{"Patterns across the evidence, including the unflattering ones and the parts that stay uncertain."}</span>
</li>
<li className={styles.s92}>
<span className={styles.s93}>{"04"}</span>
<span className={styles.s94}>{"Model"}</span>
<span className={styles.s95}>{"A working account of how I think and what I want. It is useful precisely because it can be revised."}</span>
</li>
<li className={styles.s96}>
<span className={styles.s97}>{"05"}</span>
<span className={styles.s98}>{"Expression"}</span>
<span className={styles.s99}>{"This garden, and the ninety-second version next door. Two tempos, one model underneath."}</span>
</li>
</ol>
</div>
</section>
<section className={styles.s100} aria-label="Why">
<div className={styles.s101}>
<p className={styles.s102}>{"A portfolio is usually a representation of what someone has done."}</p>
<p className={styles.s103}>{"I wanted mine to explain why I do it."}</p>
<p className={styles.s104}>{"This portfolio is one expression of an ongoing project"}</p>
</div>
</section>
<footer className={styles.s105}>
<div className={styles.s106}>
<p className={styles.s107}>{"Onward — this page ends here"}</p>
<div className={styles.s108}>
<StayLink className={styles.s109} href="/stay/contact/">
<span className={styles.s110}>{"09 · Open garden"}</span>
<span className={styles.s111}>{"Contact"}</span>
</StayLink>
<StayLink className={styles.s112} href="/stay/work/">
<span className={styles.s113}>{"06 · Workshop"}</span>
<span className={styles.s114}>{"The Work"}</span>
</StayLink>
<StayLink className={styles.s115} href="/stay/">
<span className={styles.s116}>{"00 · Arrival"}</span>
<span className={styles.s117}>{"Back to the garden"}</span>
</StayLink>
</div>
</div>
</footer>
</div>
</div>
</DestinationFrame></div>; }
