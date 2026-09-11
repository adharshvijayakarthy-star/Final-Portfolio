import Link from "next/link";
import { StayLink } from "./StayLink";
import styles from "./reference.module.css";

// Garden entry copy and composition translated verbatim from the immutable reference.
export function GardenContent(){return (
<div id="stay-content" className={styles.r0}>
<section data-screen-label="Arrival" className={styles.r1}>
<div aria-hidden="true" className={styles.r2}></div>
<p className={styles.r3}>{"Adharsh Vijayakarthy · Experience 02"}</p>
<h1 className={styles.r4}>{"Stay Awhile"}</h1>
<p className={styles.r5}>{"Take your time."}</p>
<div className={styles.r6}>
<span className={styles.r7}>{"Scroll to enter the garden"}</span>
<span className={styles.r8}></span>
</div>
</section>
<section data-screen-label="Orientation" aria-labelledby="orient-title" className={styles.r9}>
<div className={styles.r10}>
<p className={styles.r11}>{"Where you are"}</p>
<h2 id="orient-title" className={styles.r12}>{"A place, rather than a page."}</h2>
<p className={styles.r13}>{"There is a faster version of this portfolio. It takes ninety seconds, it is precise about what I do, and it is still next door if you would rather have the summary."}</p>
<p className={styles.r14}>{"This one is slower on purpose. It is laid out as a garden with nine places in it, because what I would want you to know about me does not arrive in a single order. Some of it is work. Some of it is the reason behind the work. A few parts are unfinished, and I have left them that way rather than tidy them into something more impressive."}</p>
<p className={styles.r15}>{"Walk in whichever direction you like. The map opens from the top of any page, or by pressing "}<span className={styles.r16}>{"M"}</span>{"."}</p>
</div>
</section>
<section data-screen-label="Nine places" aria-labelledby="places-title" className={styles.r17}>
<div className={styles.r18}>
<div className={styles.r19}>
<h2 id="places-title" className={styles.r20}>{"Nine places"}</h2>
<p className={styles.r21}>{"Each one is its own page"}</p>
</div>
<nav aria-label="Stay Awhile destinations" className={styles.r22}>
<StayLink className={styles.r23} href="/stay/person/">
<span className={styles.r24}>{"01"}</span>
<span className={styles.r25}>
<span className={styles.r26}>{"The Person"}</span>
<span className={styles.r27}>{"Before the projects, the person who keeps trying to build them."}</span>
</span>
<span className={styles.r28}>{"Clearing"}</span>
</StayLink>
<StayLink className={styles.r29} href="/stay/builder/">
<span className={styles.r30}>{"02"}</span>
<span className={styles.r31}>
<span className={styles.r32}>{"The Builder"}</span>
<span className={styles.r33}>{"I like turning ideas into systems. This is what that has produced so far."}</span>
</span>
<span className={styles.r34}>{"Timber frame"}</span>
</StayLink>
<StayLink className={styles.r35} href="/stay/thinker/">
<span className={styles.r36}>{"03"}</span>
<span className={styles.r37}>
<span className={styles.r38}>{"The Thinker"}</span>
<span className={styles.r39}>{"Desire, freedom, failure, vulnerability, excellence. None of it about code."}</span>
</span>
<span className={styles.r40}>{"Quiet water"}</span>
</StayLink>
<StayLink className={styles.r41} href="/stay/leader/">
<span className={styles.r42}>{"04"}</span>
<span className={styles.r43}>
<span className={styles.r44}>{"The Leader"}</span>
<span className={styles.r45}>{"What happens when something needs to get done and nobody has been assigned to it."}</span>
</span>
<span className={styles.r46}>{"Courtyard"}</span>
</StayLink>
<StayLink className={styles.r47} href="/stay/stories/">
<span className={styles.r48}>{"05"}</span>
<span className={styles.r49}>
<span className={styles.r50}>{"Stories"}</span>
<span className={styles.r51}>{"A handful of moments, told at their actual size."}</span>
</span>
<span className={styles.r52}>{"Intimate paths"}</span>
</StayLink>
<StayLink className={styles.r53} href="/stay/work/">
<span className={styles.r54}>{"06"}</span>
<span className={styles.r55}>
<span className={styles.r56}>{"The Work"}</span>
<span className={styles.r57}>{"Five things I actually built, and what each one asked of me."}</span>
</span>
<span className={styles.r58}>{"Workshop"}</span>
</StayLink>
<StayLink className={styles.r59} href="/stay/future/">
<span className={styles.r60}>{"07"}</span>
<span className={styles.r61}>
<span className={styles.r62}>{"The Future"}</span>
<span className={styles.r63}>{"Where I am going, without pretending I have arrived."}</span>
</span>
<span className={styles.r64}>{"Open horizon"}</span>
</StayLink>
<StayLink className={styles.r65} href="/stay/aura/">
<span className={styles.r66}>{"08"}</span>
<span className={styles.r67}>
<span className={styles.r68}>{"AURA"}</span>
<span className={styles.r69}>{"Why this portfolio is built the way it is."}</span>
</span>
<span className={styles.r70}>{"Archive"}</span>
</StayLink>
<StayLink className={styles.r71} href="/stay/contact/">
<span className={styles.r72}>{"09"}</span>
<span className={styles.r73}>
<span className={styles.r74}>{"Contact"}</span>
<span className={styles.r75}>{"Four ways to reach me."}</span>
</span>
<span className={styles.r76}>{"Open garden"}</span>
</StayLink>
</nav>
<p className={styles.r77}>{"Nothing here scrolls into the next place. When a page ends, it ends — you leave when you decide to."}</p>
</div>
</section>
<footer className={styles.r78}>
<div className={styles.r79}>
<p className={styles.r80}>{"Written in first person · where something is still developing, it says so"}</p>
<Link prefetch={false} className={styles.r81} href="/quick/">{"Quick Discovery · 90 seconds ↗"}</Link>
</div>
</footer>
</div>);}
