import Image from "next/image";
import Link from "next/link";
import { achievements, owner, stay } from "@/data/content";
import { orderedProjects } from "@/data/projects";
import { site } from "@/data/site";
import { ContactLines } from "@/components/layout/ContactLines";
import styles from "./StayAwhile.module.css";

export function StayAwhile() {
  return <div className={styles.garden} data-world="stay">
    <header className={styles.header}><Link href="/">{site.name}</Link><Link href="/quick">Quick Discovery ↗</Link></header>
    <section className={styles.intro}><p className={styles.index}>02 / Stay Awhile</p><h1>{stay.title}</h1><p className={styles.lead}>{stay.introduction}</p><nav aria-label="Stay Awhile contents"><a href="#work">The work ↓</a><a href="#notes">A few notes ↓</a><a href="#beyond">Beyond code ↓</a><a href="#contact">Contact ↓</a></nav></section>
    <section id="work" className={styles.work} aria-labelledby="stay-work-title"><p className={styles.index}>01 / The work</p><h2 id="stay-work-title">What I made.<br/><em>What it asked of me.</em></h2>{orderedProjects.map(p=><article id={p.id} key={p.id} className={styles.project}><span className={styles.ordinal}>0{p.order}</span><div><p className={styles.role}>{p.role}</p><h3>{p.title}</h3><p className={styles.statement}>{p.quick.headline}</p><p className={styles.prose}>{p.longDescription}</p><ul>{p.details.map(d=><li key={d}>{d}</li>)}</ul>{p.links.map(l=><a href={l.href} key={l.href}>{l.label} ↗</a>)}{p.assets.map(a=><Image key={a.src} src={a.src} alt={a.alt} width={a.width} height={a.height} loading="lazy"/>)}</div></article>)}</section>
    <section id="notes" className={styles.notes} aria-labelledby="notes-title"><p className={styles.index}>02 / Still thinking</p><h2 id="notes-title">A few notes<br/><em>on becoming.</em></h2><p className={styles.context}>{owner.researchContext}</p>{stay.notes.map(note=><article key={note.title}><h3>{note.title}</h3><p>{note.text}</p></article>)}</section>
    <section id="beyond" className={styles.beyond} aria-labelledby="stay-beyond-title"><p className={styles.index}>03 / Beyond code</p><h2 id="stay-beyond-title">Off the screen.</h2>{achievements.map(a=><article key={a.id}><p className={styles.role}>{a.category}</p><h3>{a.title}</h3><p>{a.detail}</p>{a.asset && <Image src={a.asset.src} alt={a.asset.alt} width={a.asset.width} height={a.asset.height} loading="lazy"/>}</article>)}</section>
    <section id="contact" className={styles.contact}><p className={styles.index}>04 / Contact</p><h2>Let’s talk.</h2><ContactLines/><Link className={styles.return} href="/">Back to the entrance ↗</Link></section>
  </div>;
}
