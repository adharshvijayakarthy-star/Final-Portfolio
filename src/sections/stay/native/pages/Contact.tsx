"use client";
import { Fragment, type CSSProperties } from "react";
import { StayLink } from "../StayLink";
import { DestinationFrame } from "../DestinationFrame";
import styles from "./contact.module.css";
import "./contact-keyframes.css";
import data from "./contact-content.json";

// Native transcription of the reviewed Contact composition; authored motion lives in its controller.
export function Contact(){ return <div className={styles.page}><DestinationFrame name="contact">
<div className={styles.s0}>
<div className={styles.s1} id="stay-contact-content">

<section className={styles.s2} data-screen-label="Contact">
<p className={styles.s3}>{"09 · Open garden"}</p>
<h1 className={styles.s4}>{"If you made it this far, let's talk."}</h1>
<ul className={styles.s5}>
{data.channels.map((c, index) => <Fragment key={index}>
<li className={styles.s6}>
<span className={styles.s7}>{c.label}</span>
<span className={styles.s8}>{c.value}</span>
<span className={styles.s9}>{c.hint}</span>
</li>
</Fragment>)}
</ul>
<p className={styles.s10}>{"No form, no funnel. These four channels stay as visible placeholders until the real details are added, so nothing here pretends to be a working link."}</p>
<StayLink className={styles.s11} href="/stay/">{"Return to the garden"}</StayLink>
<p className={styles.s12}>{"Adharsh Vijayakarthy · thank you for staying awhile"}</p>
</section>
</div>
</div>
</DestinationFrame></div>; }
