"use client";
import { Fragment, type CSSProperties } from "react";
import { StayLink } from "../StayLink";
import { DestinationFrame } from "../DestinationFrame";
import styles from "./work.module.css";
import "./work-keyframes.css";
import { startWork } from "../work-controller";

// Native transcription of the reviewed Work composition; authored motion lives in its controller.
export function Work(){ return <div className={styles.page}><DestinationFrame name="work" start={startWork}>
<div className={styles.s0}>
<div className={styles.s1} id="stay-work-content">
<section className={styles.s2} data-screen-label="Work opening">
<div className={styles.s3}>
<p className={styles.s4}>{"06 · Workshop"}</p>
<h1 className={styles.s5}>{"The things I"}<br />{"actually built."}</h1>
<p className={styles.s6}>{"Five projects. Each one is on the bench here with its problem, its system and its current state. The long case studies open from each entry."}</p>
<p className={styles.s7}>{"Five stations ahead · each one runs as you reach it"}</p>
</div>
</section>

<section className={styles.s8} id="study-planner" data-station="1" aria-labelledby="w1">
<div className={styles.s9}>
<div>
<div className={styles.s10} data-step="1">
<span className={styles.s11}>{"01"}</span>
<h2 className={styles.s12} id="w1">{"Study Planner"}</h2>
<span className={styles.s13}>{"Modular · constraints"}</span>
</div>
<div className={styles.s14} data-step="2">
<p className={styles.s15}>{"A planner isn't a calendar. It's a set of competing constraints."}</p>
<p className={styles.s16}>{"Problem"}</p>
<p className={styles.s17}>{"The IB workload becomes difficult to organise by hand. Everything is urgent and nothing is evenly spread."}</p>
<p className={styles.s18}>{"System"}</p>
<p className={styles.s19}>{"Subjects, decimal priority weights, sessions, break rules, day and week views, and a focus mode with tasks and timers. Built in HTML, CSS and JavaScript with local storage."}</p>
<p className={styles.s20}>{"The difficult part"}</p>
<p className={styles.s21}>{"The engine didn't just need to produce a schedule. It needed to produce a reasonable distribution — no subject taking over the week, no arbitrary-feeling plan, and sensible behaviour in the cases I hadn't planned for."}</p>
</div>
</div>
<div className={styles.s22} data-step="3">
<div className={styles.s23}>
<span className={styles.s24}>{"Week board"}</span>
<span className={styles.s25} data-lock="1">{"Schedule locked"}</span>
</div>
<div className={styles.s26}>
<span className={styles.s27} data-chip="1">{"MATH "}<b className={styles.s28} data-w="1">{"0.4"}</b></span>
<span className={styles.s29} data-chip="2">{"PHYS "}<b className={styles.s30} data-w="2">{"0.4"}</b></span>
<span className={styles.s31} data-chip="3">{"CHEM "}<b className={styles.s32} data-w="3">{"0.4"}</b></span>
<span className={styles.s33} data-chip="4">{"ENG "}<b className={styles.s34} data-w="4">{"0.4"}</b></span>
<span className={styles.s35} data-chip="5">{"HIST "}<b className={styles.s36} data-w="5">{"0.4"}</b></span>
</div>
<div className={styles.s37}>
<div className={styles.s38} data-blk="1"></div>
<div className={styles.s39} data-blk="2"></div>
<div className={styles.s40} data-blk="3"></div>
<div className={styles.s41} data-blk="4"></div>
<div className={styles.s42} data-blk="5" data-move="1"></div>
<div className={styles.s43} data-brk="1"></div>
<div className={styles.s44} data-blk="6"></div>
<div className={styles.s45} data-blk="7"></div>
<div className={styles.s46} data-blk="8"></div>
<div className={styles.s47} data-blk="9"></div>
<div className={styles.s48} data-blk="10"></div>
</div>
<div className={styles.s49}>
<span className={styles.s50}>{"MON"}</span>
<span className={styles.s51}>{"TUE"}</span>
<span className={styles.s52}>{"WED"}</span>
<span className={styles.s53}>{"THU"}</span>
<span className={styles.s54}>{"FRI"}</span>
</div>
<p className={styles.s55} data-note="1">{"Illustrative structure · the gold band is a break, not a session"}</p>
</div>
</div>
<p className={styles.s56}>{"Full case study · next pass"}</p>
</section>

<section className={styles.s57} id="past-paper-logger" data-station="2" aria-labelledby="w2">
<div className={styles.s58}>
<div className={styles.s59} data-step="1">
<span className={styles.s60}>{"02"}</span>
<h2 className={styles.s61} id="w2">{"IGCSE Past Paper Logger & Analytics"}</h2>
<span className={styles.s62}>{"Data · trajectory"}</span>
</div>
<div className={styles.s63} data-step="2">
<div className={styles.s64}>
<div>
<p className={styles.s65}>{"I wanted to know more than just my marks. I wanted the pattern behind them."}</p>
<div className={styles.s66}>
<span className={styles.s67} data-pipe="1">{"Track"}</span>
<span className={styles.s68} data-pipe="2">{"Analyze"}</span>
<span className={styles.s69} data-pipe="3">{"Visualize"}</span>
<span className={styles.s70} data-pipe="4">{"Predict"}</span>
</div>
<p className={styles.s71}>{"System"}</p>
<p className={styles.s72}>{"It logs completed past papers, records the scores, visualises performance and identifies trends — then uses the accumulated results to estimate where performance might be heading."}</p>
<p className={styles.s73}>{"What I was after"}</p>
<p className={styles.s74}>{"Making my own practice history useful for deciding what to do next, rather than a pile of marks I felt vaguely bad about."}</p>
</div>
<div>
<div className={styles.s75}>
<span className={styles.s76} data-sheet="1">{"PAPER"}<br />{"LOGGED"}</span>
<span className={styles.s77} data-sheet="2">{"SCORE"}<br />{"RECORDED"}</span>
<span className={styles.s78} data-sheet="3">{"TREND"}<br />{"COMPUTED"}</span>
</div>
<svg className={styles.s79} viewBox="0 0 320 150" aria-hidden="true">
<g stroke="rgba(214,204,178,0.14)" strokeWidth="1">
<line x1="18" y1="126" x2="306" y2="126"></line>
<line x1="18" y1="94" x2="306" y2="94"></line>
<line x1="18" y1="62" x2="306" y2="62"></line>
<line x1="18" y1="30" x2="306" y2="30"></line>
</g>
<polyline data-line="1" points="30,112 74,100 118,86 162,90 206,68 250,56" fill="none" stroke="#cdd3ba" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></polyline>
<polyline data-pred="1" points="250,56 298,36" fill="none" stroke="#d9b56a" strokeWidth="1.8" strokeDasharray="5 5" strokeLinecap="round"></polyline>
<g data-dots="1">
<circle data-dot="1" cx="30" cy="112" r="2.6" fill="#f2ecdd"></circle>
<circle data-dot="2" cx="74" cy="100" r="2.6" fill="#f2ecdd"></circle>
<circle data-dot="3" cx="118" cy="86" r="2.6" fill="#f2ecdd"></circle>
<circle data-dot="4" cx="162" cy="90" r="2.6" fill="#f2ecdd"></circle>
<circle data-dot="5" cx="206" cy="68" r="2.6" fill="#f2ecdd"></circle>
<circle data-dot="6" cx="250" cy="56" r="2.6" fill="#f2ecdd"></circle>
</g>
<circle data-tip="1" cx="298" cy="36" r="3.2" fill="none" stroke="#d9b56a" strokeWidth="1.4"></circle>
</svg>
<div className={styles.s80}>
<span className={styles.s81}>{"FIRST PAPER"}</span>
<span className={styles.s82}>{"TIME"}</span>
<span className={styles.s83} data-est="1">{"ESTIMATE"}</span>
</div>
<p className={styles.s84}>{"Illustrative trend · no actual scores shown. The gold segment is an estimate, not a result."}</p>
</div>
</div>
</div>
<p className={styles.s85}>{"Full case study · next pass"}</p>
</div>
</section>

<section className={styles.s86} id="mun-club" data-station="3" aria-labelledby="w3">
<div className={styles.s87}>
<div className={styles.s88} data-step="3">
<div className={styles.s89}>
<div className={styles.s90} data-stage="1">
<span className={styles.s91}></span>
<span className={styles.s92}>{"Lesson"}</span>
<span className={styles.s93}>{"rules of procedure"}</span>
</div>
<div className={styles.s94} data-stage="2">
<span className={styles.s95}></span>
<span className={styles.s96}>{"Debate"}</span>
<span className={styles.s97}>{"speeches · motions"}</span>
</div>
<div className={styles.s98} data-stage="3">
<span className={styles.s99}></span>
<span className={styles.s100}>{"Simulation"}</span>
<span className={styles.s101}>{"scenarios"}</span>
</div>
<div className={styles.s102} data-stage="4">
<span className={styles.s103}></span>
<span className={styles.s104}>{"Weekly structure"}</span>
<span className={styles.s105}>{"it repeats"}</span>
</div>
</div>
<div className={styles.s106} data-slot="1">
<p className={styles.s107}>{"[Real MUN Club material]"}</p>
<p className={styles.s108}>{"A real lesson plan or session document goes here."}</p>
</div>
</div>
<div className={styles.s109}>
<div className={styles.s110} data-step="1">
<span className={styles.s111}>{"03"}</span>
<h2 className={styles.s112} id="w3">{"MUN Club"}</h2>
<span className={styles.s113}>{"People · rooms · documents"}</span>
</div>
<div className={styles.s114} data-step="2">
<p className={styles.s115}>{"I wanted younger students to experience MUN properly."}</p>
<p className={styles.s116}>{"System"}</p>
<p className={styles.s117}>{"A curriculum in weekly instalments: lessons, debates, simulations, rules of procedure, speeches, motions and scenarios. I designed it, taught it and kept it running."}</p>
<p className={styles.s118}>{"The signal"}</p>
<p className={styles.s119}>{"Building systems for people. The constraints here were attention, confidence and a room of younger students — not memory or compute."}</p>
</div>
</div>
</div>
<p className={styles.s120}>{"Full case study · next pass"}</p>
</section>

<section className={styles.s121} id="snrled" data-station="4" aria-labelledby="w4">
<div className={styles.s122}>
<div className={styles.s123} data-step="1">
<span className={styles.s124}>{"04"}</span>
<h2 className={styles.s125} id="w4">{"SNRLED Parties"}</h2>
<span className={styles.s126}>{"Archived"}</span>
</div>
<div className={styles.s127} data-step="2">
<div className={styles.s128}>
<span className={styles.s129}></span>
<span className={styles.s130}>{"snrled · registration service"}</span>
<span className={styles.s131}>{"Archived · not deployed"}</span>
</div>
<div className={styles.s132}>
<div className={styles.s133}>
<div className={styles.s134} data-log="1"><span className={styles.s135}>{"›"}</span><span>{"REGISTER"}</span></div>
<div className={styles.s136} data-log="2"><span className={styles.s137}>{"›"}</span><span>{"PAYMENT"}</span></div>
<div className={styles.s138} data-log="3"><span className={styles.s139}>{"›"}</span><span>{"UPLOAD PROOF"}</span></div>
<div className={styles.s140} data-log="4"><span className={styles.s141}>{"›"}</span><span>{"ADMIN REVIEW"}</span></div>
<div className={styles.s142} data-log="5"><span className={styles.s143}>{"✓"}</span><span className={styles.s144}>{"VERIFIED"}</span></div>
<div className={styles.s145} data-log="6"><span className={styles.s146}>{"+"}</span><span>{"REGISTRATION COUNT "}<b className={styles.s147} data-count="1">{"0"}</b></span></div>
<div className={styles.s148} data-log="7"><span>{"!"}</span><span data-thresh="1">{"EARLY-BIRD THRESHOLD REACHED"}</span></div>
<div className={styles.s149} data-log="8"><span className={styles.s150}>{"›"}</span><span>{"PRICE "}<s className={styles.s151} data-old="1">{"EARLY"}</s>
<span className={styles.s152} data-new="1">{"STANDARD"}</span></span></div>
<p className={styles.s153}>{"Demo run · illustrative counts and tiers, not real registration data."}</p>
</div>
<div>
<p className={styles.s154}>{"A party registration system, built for friends."}</p>
<p className={styles.s155}>{"What the admin could see"}</p>
<p className={styles.s156}>{"Who paid, how much they paid, how many people they paid for, and their payment screenshots."}</p>
<p className={styles.s157}>{"The threshold"}</p>
<p className={styles.s158}>{"Once early-bird capacity was reached, the price changed. That single rule is what turned a form into a system."}</p>
<p className={styles.s159}>{"Current state"}</p>
<p className={styles.s160}>{"Archived. The service is no longer deployed; the source code is preserved. It is not live, and I would rather say so than leave it ambiguous."}</p>
<p className={styles.s161}>{"Known, and to be confirmed"}</p>
<p className={styles.s162}>{"The original project used a black and blue visual identity, with frontend and backend integration via Supabase. Exact stack details await a pass through the repository rather than a guess here."}</p>
</div>
</div>
</div>
<p className={styles.s163}>{"Full case study · next pass — including the threshold walkthrough"}</p>
</div>
</section>

<section className={styles.s164} id="project-aura" data-station="5" aria-labelledby="w5">
<div className={styles.s165}>
<div>
<div className={styles.s166} data-step="1">
<span className={styles.s167}>{"05"}</span>
<h2 className={styles.s168} id="w5">{"Project AURA"}</h2>
<span className={styles.s169}>{"Layers · evidence · model"}</span>
</div>
<div className={styles.s170} data-step="2">
<p className={styles.s171}>{"The strangest thing I've built is a model of myself."}</p>
<p className={styles.s172}>{"I started trying to build a portfolio. Each design decision led back to a question about the person it was meant to represent. So I paused the portfolio and began a longer process: conversation, evidence, revision."}</p>
<p className={styles.s173}>{"AURA holds the current model, including the parts I still don't understand. This website is one expression of it. "}<StayLink className={styles.s174} href="/stay/aura/">{"The archive explains why"}</StayLink>{"."}</p>
</div>
</div>
<div className={styles.s175} data-step="3">
<p className={styles.s176}>{"Archive cabinet"}</p>
<div className={styles.s177}>
<div className={styles.s178}>
<svg className={styles.s179} data-links="1" viewBox="0 0 30 160" preserveAspectRatio="none" aria-hidden="true">
<path d="M7 16 V 144" fill="none" stroke="rgba(217,181,106,0.35)" strokeWidth="1" vectorEffect="non-scaling-stroke"></path>
<path d="M7 16 C 18 16, 20 16, 30 16" fill="none" stroke="rgba(217,181,106,0.55)" strokeWidth="1" vectorEffect="non-scaling-stroke"></path>
<path d="M7 48 C 18 48, 20 48, 30 48" fill="none" stroke="rgba(217,181,106,0.45)" strokeWidth="1" vectorEffect="non-scaling-stroke"></path>
<path d="M7 80 C 18 80, 20 80, 30 80" fill="none" stroke="rgba(217,181,106,0.5)" strokeWidth="1" vectorEffect="non-scaling-stroke"></path>
<path d="M7 112 C 18 112, 20 112, 30 112" fill="none" stroke="rgba(217,181,106,0.4)" strokeWidth="1" vectorEffect="non-scaling-stroke"></path>
<path d="M7 144 C 18 144, 20 144, 30 144" fill="none" stroke="rgba(217,181,106,0.65)" strokeWidth="1" vectorEffect="non-scaling-stroke"></path>
</svg>
</div>
<div className={styles.s180}>
<span className={styles.s181} data-doc="1">{"Conversation"}</span>
<span className={styles.s182} data-doc="2">{"Evidence"}</span>
<span className={styles.s183} data-doc="3">{"Understanding"}</span>
<span className={styles.s184} data-doc="4">{"Model"}</span>
<span className={styles.s185} data-doc="5">{"Expression"}</span>
</div>
</div>
<p className={styles.s186} data-note="5">{"The documents were not filed in this order to begin with."}</p>
</div>
</div>
<p className={styles.s187}>{"Full case study · next pass"}</p>
</section>
<footer className={styles.s188}>
<div className={styles.s189}>
<p className={styles.s190}>{"Onward — this page ends here"}</p>
<div className={styles.s191}>
<StayLink className={styles.s192} href="/stay/future/">
<span className={styles.s193}>{"07 · Open horizon"}</span>
<span className={styles.s194}>{"The Future"}</span>
</StayLink>
<StayLink className={styles.s195} href="/stay/aura/">
<span className={styles.s196}>{"08 · Archive"}</span>
<span className={styles.s197}>{"AURA"}</span>
</StayLink>
<StayLink className={styles.s198} href="/stay/">
<span className={styles.s199}>{"00 · Arrival"}</span>
<span className={styles.s200}>{"Back to the garden"}</span>
</StayLink>
</div>
</div>
</footer>
</div>
</div>
</DestinationFrame></div>; }
