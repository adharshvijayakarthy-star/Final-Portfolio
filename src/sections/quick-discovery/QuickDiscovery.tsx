import Link from "next/link";
import type { ReactNode } from "react";
import { owner, build, achievements, future, contact, contactHref, quickCopy, routes } from "@/data/content";
import { CertificateArchive } from "./CertificateArchive";
import { SceneRuntime } from "./SceneRuntime";
import { quickProjects } from "./quick-content";
import styles from "./QuickDiscovery.module.css";

const chapters = [
  ["who", "WHO"], ["build", "BUILD"], ["think", "THINK"], ["lead", "LEAD"],
  ["work", "WORK"], ["beyond", "BEYOND"], ["future", "FUTURE"], ["contact", "CONTACT"],
].map(([chip,label],i)=>({id:`ch-${chip}`,chip,label,number:String(i+1).padStart(2,"0")}));

/** Semantic server-rendered content over one persistent, scroll-scrubbed world.
 * Without JS (or in reduced motion), the same document is an ordinary readable flow.
 */
function Title({ children, level = 2, type = false }: { children: string; level?: 1 | 2 | 3; type?: boolean }) {
  const Tag = `h${level}` as "h1" | "h2" | "h3";
  return <Tag className={styles.title} aria-label={children} data-title data-type={type || undefined}>
    {children.split(" ").map((word, i) => <span className={styles.mask} key={i} aria-hidden="true"><span data-word>{type ? [...word].map((ch,n)=><span data-char key={n}>{ch}</span>) : word}</span>{" "}</span>)}
  </Tag>;
}

function Stage({ name, id, label, children }: { name: string; id?: string; label: string; children: ReactNode }) {
  return <section id={id} className={styles.stage} data-stage={name} aria-label={label}>
    <div className={styles.scene} data-scene>{children}</div>
  </section>;
}

export function QuickDiscovery() {
  return <div className={styles.root} data-qd-root>
    <div className={styles.world} data-world aria-hidden="true"><canvas data-world-canvas /><div className={styles.atmosphere} data-atmosphere /><div className={styles.embers} data-embers>{Array.from({length:36},(_,i)=><i className={styles.ember} data-ember key={i} />)}</div></div>
    <div className={styles.progress} data-progress aria-hidden="true" />
    <Link className={styles.markLeft} data-home href={routes.home} aria-label={quickCopy.quickHomeLabel}><i>{quickCopy.quickMark[0]}</i><span>{quickCopy.quickMark.slice(1)}</span></Link>
    <span className={styles.markRight}>QUICK DISCOVERY</span>
    <button className={styles.motionToggle} type="button" data-motion-toggle aria-pressed="false">Reduce motion</button>
    <nav className={styles.rail} aria-label="Chapters" data-rail>
      {chapters.map(ch => <a key={ch.id} href={`#${ch.id}`} data-chip={ch.chip} data-arrival={ch.chip==="future"?"0.6":"0.42"} aria-label={ch.label}><span aria-hidden="true">{ch.number}</span><span>{ch.label}</span><i aria-hidden="true" /></a>)}
    </nav>
    <p className={styles.assetError} data-asset-error hidden>The 3D scene could not load. All portfolio content remains available below.</p>
    <div className={styles.flow}>
      <Stage name="entry" label="Quick Discovery entry">
        <div className={styles.entry}>
          <p className={styles.label} data-support>AURA</p>
          <Title level={1}>{quickCopy.entryTitle}</Title>
          <p className={styles.entryHint} data-support>{quickCopy.entryHint}</p>
          <a href="#ch-who" data-chip="who" data-arrival="0.27" className={styles.enter}>Enter <span aria-hidden="true">↓</span></a>
        </div>
      </Stage>
      <Stage name="who" id="ch-who" label="Who">
        <div className={styles.copy}>
          <p className={styles.label} data-label>01 / WHO</p>
          <Title>{`${owner.firstName} ${owner.lastName}`}</Title>
          <div className={styles.prose}><p data-support>{owner.introduction}</p><p data-support>{owner.context}</p></div>
        </div>
        <div className={styles.roles}>{owner.roles.map((role,i) => <span key={role} data-role={i}>{role}</span>)}</div>
      </Stage>
      <Stage name="build" id="ch-build" label="What I build">
        <div className={styles.copy}><p className={styles.label} data-label>02 / WHAT I BUILD</p><Title>{build.title}</Title><p className={styles.buildNote} data-support>{build.note}</p></div>
        <div className={styles.buildSystem}>
          <svg viewBox="0 0 420 420" aria-hidden="true"><path data-build-line d="M210 35 L380 210 L210 385 L40 210 Z M40 210H380 M210 35V385" pathLength="1" /></svg>
          {build.properties.map((word,i) => <div key={word} data-cap={i}><span className={styles.label}>{build.steps[i]}</span><h3>{word}</h3><p>{build.descriptions[i]}</p></div>)}
        </div>
      </Stage>
      <Stage name="think" id="ch-think" label="How I think">
        <div className={styles.copy}><p className={styles.label} data-label>03 / THINK</p><Title>Start with a better question.</Title><div className={styles.prose}><p data-support>{owner.researchContext}</p><p data-support>{build.note}</p></div></div>
        <div className={styles.thoughts}>{["Question", "Evidence", "Understanding"].map(t=><span data-plane key={t}>{t}</span>)}</div>
      </Stage>
      <Stage name="lead" id="ch-lead" label="How I lead">
        <div className={styles.copy}><p className={styles.label} data-label>04 / LEAD</p><Title>Step into the work.</Title><div className={styles.prose}><p data-support>{build.descriptions[3]}</p><p data-support>{build.descriptions[2]}</p></div></div>
        <div className={styles.thoughts}>{["Listen", "Connect", "Act"].map(t=><span data-plane key={t}>{t}</span>)}</div>
      </Stage>
      <Stage name="workcard" id="ch-work" label="Selected work">
        <div className={styles.copy}><p className={styles.label} data-label>05 / WORK</p><Title>{quickCopy.workTitle}</Title><p data-support className={styles.label}>FIVE PROJECTS · FIVE DIFFERENT QUESTIONS</p></div>
        <ol className={styles.projectIndex}>{quickProjects.map((p,i) => <li key={p.id} data-index-item><a href={`#${p.id}`} data-chip="work" data-arrival="0.3"><span>0{i+1}</span>{p.displayTitle}<i aria-hidden="true">↗</i></a></li>)}</ol>
      </Stage>
      {quickProjects.map((p,i) => <Stage key={p.id} name={p.stage} id={p.id} label={p.title}>
        <div className={styles.copy}>
          <p className={styles.label} data-label>05.{i+1} / {p.title.toUpperCase()}</p>
          <Title level={3} type={p.stage === "papers"}>{p.displayTitle}</Title>
          <div className={styles.prose}>{p.narration.map((line,n) => <p key={n} data-support>{line}</p>)}</div>
          <div className={styles.evidence} data-evidence><p>{p.details.join(" · ")}</p><span>{p.signal}</span>{p.href && <Link data-deeper href={p.href}>{p.deeperLabel} <i aria-hidden="true">↗</i></Link>}</div>
        </div>
        <div className={styles.demonstration} aria-hidden="true">
          {p.stage === "plan" && <div className={styles.days}>{["MON","TUE","WED","THU","FRI"].map(d=><span key={d}>{d}</span>)}</div>}
          {p.stage === "snrled" && <div className={styles.counter}><span data-count>0</span><small>/ 40</small><p data-tier>EARLY-BIRD</p></div>}
          <div className={styles.beats}>{p.beats.map((b,n)=><span key={b} data-beat={n}>{b}</span>)}</div>
          <p className={styles.schematic}>{p.note}</p>
        </div>
      </Stage>)}
      <Stage name="beyond" id="ch-beyond" label="Beyond code">
        <div className={styles.copy}><p className={styles.label} data-label>06 / BEYOND CODE</p><Title>{quickCopy.beyondTitle}</Title><p className={styles.categories} data-support>{quickCopy.beyondCategories.join(" · ")}</p></div>
        <div className={styles.archives}>{["strat-mun","isso","guitar","theory"].map(id=>{
          const a=achievements.find(item=>item.id===id)!;
          return <article key={id} data-archive>
            {a.asset ? <CertificateArchive title={a.quickTitle} src={a.asset.src} alt={a.asset.alt} /> : <><span className={styles.label}>{a.category}</span><h3>{a.quickTitle}</h3><p>{a.quickDetail}</p></>}
          </article>;
        })}</div>
      </Stage>
      <Stage name="future" id="ch-future" label="Where I’m going">
        <div className={styles.copy}><p className={styles.label} data-label>07 / WHERE I’M GOING</p><Title>{future.title}</Title><p className={styles.categories} data-support>{future.currentTags.join(" · ")}</p><div className={styles.prose}><p data-support>{future.statement}</p><p data-support>{future.closing}</p></div></div>
        <div className={styles.futurePlanes}>{future.destinations.map((d,i)=><span data-plane={i} key={d}>{d}</span>)}</div>
      </Stage>
      <Stage name="contact" id="ch-contact" label="Contact">
        <div className={styles.copy}><p className={styles.label} data-label>08 / CONTACT</p><Title>{quickCopy.contactTitle}</Title><p className={styles.contactPrompt} data-support>{quickCopy.contactPrompt}</p>
          <div className={styles.contactList}>{(Object.entries(contact) as [keyof typeof contact,string][]).map(([kind,value])=>{
            const href=contactHref(kind,value);const content=<><span>{kind.toUpperCase()}</span><strong>{value}</strong><i>{href?"↗":quickCopy.contactPending}</i></>;
            return href?<a key={kind} href={href}>{content}</a>:<div key={kind}>{content}</div>;
          })}</div>
        </div>
        <div className={styles.closing}><p className={styles.label}>{quickCopy.closing}</p><Link href={routes.stay} data-stay>Stay awhile <span aria-hidden="true">→</span></Link><p className={styles.label}>{quickCopy.complete}</p></div>
      </Stage>
    </div>
    <SceneRuntime />
  </div>;
}
