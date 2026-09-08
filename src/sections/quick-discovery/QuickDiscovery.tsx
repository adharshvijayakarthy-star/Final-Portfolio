import Link from "next/link";
import Image from "next/image";
import { owner, chapters, build, auraStory, auraSteps, achievements, future, contact, contactHref, quickCopy, routes } from "@/data/content";
import { orderedProjects } from "@/data/projects";
import type { Project } from "@/data/types";
import { QuickReadingStyles } from "./QuickReadingStyles";

import { SceneRuntime } from "./SceneRuntime";
import styles from "./QuickDiscovery.module.css";

/**
 * QUICK DISCOVERY — the 90-second scroll.
 *
 * The DOM of the approved design source (`Quick Discovery.dc.html`), element
 * for element. Presentation lives in the CSS module; every original `data-*` attribute
 * here is an anchor the engine queries, so none of them is decorative and none
 * may be renamed on its own.
 *
 * This is a server component: nothing on the page is stateful, and the whole
 * choreography is one rAF loop mounted by <SceneRuntime />. The only additions
 * to the design are semantic — headings, landmarks and accessible names, which
 * a purely visual artboard had no way to express.
 *
 * Structure: eleven `[data-stage]` blocks, each a tall scroll track wrapping
 * one sticky 100vh viewport. Their heights are the timing — see the module.
 */

const [planner, papers, mun, aura] = orderedProjects as readonly [Project, Project, Project, Project];

/** The section index that opens most scenes, e.g. "01   WHO". */
function ScreenLabel({
  index,
  children,
  className,
}: {
  index: string;
  children: string;
  className?: string | undefined;
}) {
  return (
    <div data-label className={className}>
      <span className={styles.labelRule} aria-hidden="true" />
      {index}&nbsp;&nbsp; {children}
    </div>
  );
}

/** Keep the approved evidence frame; fill it with actual project detail. */
function EvidenceSlot({ project }: { project: Project }) {
  const asset = project.assets[0];
  return <>
    <div className={styles.evidenceSlot}>
      {asset ? <Image src={asset.src} alt={asset.alt} width={asset.width} height={asset.height} loading="lazy" /> :
        <div className={styles.evidenceDetails}><span>{quickCopy.evidenceNote}</span><p>{project.details.slice(0, 3).join(" · ")}</p></div>}
    </div>
    <div className={styles.evidenceSignal}>{project.signal}</div>
    {project.stayAwhile.route && <Link data-deeper href={project.stayAwhile.route}>{project.quick.deeperLabel}<span aria-hidden="true"> ↗</span></Link>}
  </>;
}

function ArchiveContent({ id }: { id: string }) {
  const item = achievements.find(a => a.id === id)!;
  return <>
    <div className={styles.bgSlot}>
      {item.asset ? <Image src={item.asset.src} alt={item.asset.alt} width={item.asset.width} height={item.asset.height} loading="lazy" /> :
        <div className={styles.archiveRecord}><span>{item.category}</span><h3>{item.quickTitle}</h3><p>{item.quickDetail}</p></div>}
    </div>
    <div className={styles.bgCaption}>{item.id === "guitar" || item.id === "theory" ? quickCopy.musicNote : item.category}</div>
  </>;
}

export function QuickDiscovery() {
  return (
    <div className={styles.root} data-qd-root>
      <QuickReadingStyles />
      <canvas data-embers aria-hidden="true" />
      <div data-vignette aria-hidden="true" />
      <div data-flash aria-hidden="true" />

      <div data-progress aria-hidden="true" />

      <Link className={styles.markLeft} data-home href={routes.home} aria-label={quickCopy.homeLabel}><i>{quickCopy.mark[0]}</i>{quickCopy.mark.slice(1)}</Link>
      <div className={styles.markRight} aria-hidden="true">
        <span className={styles.markRule} />
        01 {quickCopy.entryTitle}
      </div>

      {/* The ordinal is decorative, so the link's accessible name is the
          chapter itself ("Who", "Build", …) rather than "01 WHO". */}
      <nav data-rail aria-label="Chapters">
        {chapters.map((chapter) => (
          <a key={chapter.id} href={`#${chapter.id}`} data-chip={chapter.chip} data-arrival={chapter.arrival} aria-label={chapter.label}>
            <span className={styles.chipNumber} aria-hidden="true">
              {chapter.number}
            </span>
            <span className={styles.chipName}>{chapter.label}</span>
            <span data-tick aria-hidden="true" />
          </a>
        ))}
      </nav>

      <div className={styles.flow}>
        {/* ---------------------------------------------------------- */}
        {/* 00 ENTRY — shards converge on the monolith, then rush past  */}
        {/* ---------------------------------------------------------- */}
        <section data-stage="entry" data-screen-label="00 ENTRY" aria-label="Entry">
          <div className={styles.viewport}>
            <div data-entry-cam aria-hidden="true">
              <div data-entry-halo-back />
              <div data-entry-shards />
              <div data-entry-mono>
                <div className={styles.monoSheen} />
                <div data-entry-crack="0" />
                <div data-entry-crack="1" />
                <div data-entry-crack="2" />
              </div>
              <div data-entry-halo />
            </div>
            <h1 data-entry-title data-letters aria-label="Quick Discovery">
              {quickCopy.entryTitle}
            </h1>
            <div data-entry-sub>{quickCopy.entryHint}</div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 01 WHO — the name assembles, three roles resolve into a row */}
        {/* ---------------------------------------------------------- */}
        <section id="ch-who" data-stage="who" data-screen-label="01 WHO" aria-label="Who">
          <div className={styles.viewport}>
            <div data-who-grid aria-hidden="true" />
            <div data-who-atmos aria-hidden="true" />
            <ScreenLabel index="01">{chapters[0].title}</ScreenLabel>
            <h2 data-who-name aria-label={`${owner.firstName} ${owner.lastName}`}>
              <span data-who-word1 data-letters>
                {owner.firstName.toUpperCase()}
              </span>
              <span data-who-word2 data-letters>
                {owner.lastName.toUpperCase()}
              </span>
            </h2>
            <div data-who-field>
              <div data-who-role="0">{owner.roles[0]?.toUpperCase()}</div>
              <div data-who-role="1">{owner.roles[1]?.toUpperCase()}</div>
              <div data-who-role="2">{owner.roles[2]?.toUpperCase()}</div>
              <svg data-who-sparks aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" />
            </div>
            <div data-who-line><p>{owner.introduction}</p><p className={styles.whoContext}>{owner.context}</p>
            </div>
            <div data-who-hint aria-hidden="true">
              {quickCopy.scrollHint}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 02 BUILD — an idea grows into a network of rules            */}
        {/* ---------------------------------------------------------- */}
        <section id="ch-build" data-stage="build" data-screen-label="02 BUILD" aria-label="What I build">
          <div className={styles.viewport}>
            <div data-build-blueprint aria-hidden="true" />
            <ScreenLabel index="02">{chapters[1].title}</ScreenLabel>
            <h2 data-build-head>{build.title.split(" ").map((word, i, all) => <span key={i}><span data-build-w className={i === all.length - 1 ? styles.buildItalic : undefined}>{word}</span>{i < all.length - 1 ? " " : ""}</span>)}</h2>
            <div data-frame="build" style={{ width: 1000, height: 560 }}>
              <svg viewBox="0 0 1000 560" aria-hidden="true">
                <g data-build-ring />
                <g data-build-links />
                <g data-build-nodes />
                <g data-build-pulses />
              </svg>
              <div data-build-cap="0"><div className={styles.capWord}>{build.properties[0]}</div><div className={styles.capNote}>{build.descriptions[0]}</div></div>
              <div data-build-cap="1"><div className={styles.capWord}>{build.properties[1]}</div><div className={styles.capNote}>{build.descriptions[1]}</div></div>
              <div data-build-cap="2"><div className={styles.capWord}>{build.properties[2]}</div><div className={styles.capNote}>{build.descriptions[2]}</div></div>
              <div data-build-cap="3"><div className={styles.capWord}>{build.properties[3]}</div><div className={styles.capNote}>{build.descriptions[3]}</div></div>
              <div data-build-stage="0">{build.steps[0]?.toUpperCase()}</div>
              <div data-build-stage="1">{build.steps[1]?.toUpperCase()}</div>
              <div data-build-stage="2">{build.steps[2]?.toUpperCase()}</div>
              <div data-build-stage="3">{build.steps[3]?.toUpperCase()}</div>
            </div>
            <div data-build-caption><p>{build.note}</p>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 03 WORK — the title card, then four project scenes          */}
        {/* ---------------------------------------------------------- */}
        <section id="ch-work" data-stage="workcard" data-screen-label="03 WORK" aria-label="Selected work">
          <div className={`${styles.viewport} ${styles.viewportCentred}`}>
            <div data-workcard>
              <div className={styles.workcardIndex}>03</div>
              <h2 data-workcard-big>{quickCopy.workTitle}</h2>
              <div className={styles.workcardSub}>{quickCopy.workSubtitle}</div>
            </div>
          </div>
        </section>

        {/* 03A — scattered tasks fall into a week */}
        <section id={planner.id} data-stage="plan" data-screen-label="03A STUDY PLANNER" aria-label="Study Planner">
          <div className={styles.viewport}>
            <div data-plan-spot aria-hidden="true" />
            <ScreenLabel index="01" className={styles.projectLabel}>{planner.title.toUpperCase()}</ScreenLabel>
            <h3 data-plan-title data-letters aria-label={planner.quick.displayTitle} className={styles.projectTitle}>{planner.quick.displayTitle}</h3>
            <p data-plan-line="0" className={styles.line}>{planner.quick.narration[0]}</p>
            <p data-plan-line="1" className={styles.line}>{planner.quick.narration[1]}</p>
            <p data-plan-line="2" className={styles.line}>{planner.quick.narration[2]}</p>
            <div data-frame="plan" style={{ width: 1000, height: 520 }} aria-hidden="true">
              <div data-plan-grid />
              <svg data-plan-threads viewBox="0 0 1000 520" />
              <div data-plan-blocks />
              <div data-plan-note="0" className={styles.note}>{quickCopy.plannerNotes[0]}</div>
              <div data-plan-note="1" className={styles.note}>{quickCopy.plannerNotes[1]}</div>
              <div data-plan-note="2" className={styles.note}>{quickCopy.plannerNotes[2]}</div>
              <div data-plan-note="3" className={styles.note}>{quickCopy.plannerNotes[3]}</div>
              <div data-plan-note="4" className={styles.note}>{quickCopy.plannerNotes[4]}</div>
            </div>
            <p className={styles.schematic}>{quickCopy.schematic}</p>
            <div data-plan-evidence className={styles.evidence}><EvidenceSlot project={planner} />
            </div>
          </div>
        </section>

        {/* 03B — logged papers become a trend, then a prediction */}
        <section id={papers.id} data-stage="papers" data-screen-label="03B PAST PAPER ANALYTICS" aria-label="Past Paper Analytics">
          <div className={styles.viewport}>
            <div data-pap-board aria-hidden="true" />
            <ScreenLabel index="02" className={styles.projectLabel}>{papers.title.toUpperCase()}</ScreenLabel>
            <div className={styles.papTitleBox}>
              <h3 data-pap-title data-letters aria-label={papers.quick.displayTitle} className={styles.projectTitle}>{papers.quick.displayTitle}</h3>
              <span data-pap-caret aria-hidden="true" />
            </div>
            <p data-pap-line="0" className={styles.line}>{papers.quick.narration[0]}</p>
            <p data-pap-line="1" className={styles.line}>{papers.quick.narration[1]}</p>
            <p data-pap-line="2" className={styles.line}>{papers.quick.narration[2]}</p>
            <div data-frame="papers" style={{ width: 1000, height: 500 }} aria-hidden="true">
              <svg viewBox="0 0 1000 500">
                <g data-pap-axis>
                  <line x1="60" y1="440" x2="960" y2="440" />
                  <line x1="60" y1="30" x2="60" y2="440" />
                  <line x1="60" y1="340" x2="960" y2="340" stroke="#171416" />
                  <line x1="60" y1="240" x2="960" y2="240" stroke="#171416" />
                  <line x1="60" y1="140" x2="960" y2="140" stroke="#171416" />
                </g>
                <path data-pap-band d="" fill="rgba(192,24,42,.1)" opacity="0" />
                <path
                  data-pap-log
                  d=""
                  fill="none"
                  stroke="#6f6459"
                  strokeWidth="1"
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
                <path
                  data-pap-trend
                  d=""
                  fill="none"
                  stroke="#c0182a"
                  strokeWidth="1.6"
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
                <path data-pap-pred d="" fill="none" stroke="#e0555f" strokeWidth="1.5" strokeDasharray="5 6" opacity="0" />
                <g data-pap-points />
              </svg>
              <div data-pap-note="0" className={styles.note}>{quickCopy.paperNotes[0]}</div>
              <div data-pap-note="1" className={styles.note}>{quickCopy.paperNotes[1]}</div>
              <div data-pap-note="2" className={styles.note}>{quickCopy.paperNotes[2]}</div>
              <div data-pap-axislab>{quickCopy.paperAxes.map(label => <span key={label}>{label}</span>)}</div>
            </div>
            <p className={styles.schematic}>{quickCopy.paperSchematic}</p>
            <div data-pap-evidence className={styles.evidence}><EvidenceSlot project={papers} />
            </div>
          </div>
        </section>

        {/* 03C — one delegate becomes a conference */}
        <section id={mun.id} data-stage="mun" data-screen-label="03C STRAT MUN" aria-label="STRAT MUN">
          <div className={styles.viewport}>
            <div data-mun-spot aria-hidden="true" />
            <ScreenLabel index="03" className={styles.projectLabel}>{mun.title.toUpperCase()}</ScreenLabel>
            <h3 data-mun-title data-letters aria-label={mun.quick.displayTitle} className={styles.projectTitle}>{mun.quick.displayTitle}</h3>
            <p data-mun-line="0" className={styles.line}>{mun.quick.narration[0]}</p>
            <p data-mun-line="1" className={styles.line}>{mun.quick.narration[1]}</p>
            <p data-mun-line="2" className={styles.line}>{mun.quick.narration[2]}</p>
            <div data-frame="mun" style={{ width: 1000, height: 520 }} aria-hidden="true">
              <svg viewBox="0 0 1000 520">
                <g data-mun-links />
                <g data-mun-nodes />
                <g data-mun-podium opacity="0">
                  <rect x="484" y="244" width="32" height="32" fill="#c0182a" transform="rotate(45 500 260)" />
                  <rect x="492" y="252" width="16" height="16" fill="#f6efe4" transform="rotate(45 500 260)" />
                </g>
              </svg>
              <div data-mun-cap="0">{quickCopy.munCaptions[0]}</div>
              <div data-mun-cap="1">{quickCopy.munCaptions[1]}</div>
              <div data-mun-cap="2">{quickCopy.munCaptions[2]}</div>
              <div data-mun-cap="3">{quickCopy.munCaptions[3]}</div>
            </div>
            <p className={styles.schematic}>{quickCopy.schematic}</p>
            <div data-mun-evidence className={styles.evidence}><EvidenceSlot project={mun} />
            </div>
          </div>
        </section>

        {/* 03D — the portfolio assembles, shatters, and rebuilds as a process */}
        <section id={aura.id} data-stage="aura" data-screen-label="03D PROJECT AURA" aria-label="Project Aura">
          <div className={styles.viewport}>
            <ScreenLabel index="04" className={styles.projectLabel}>{aura.title.toUpperCase()}</ScreenLabel>
            <h3 data-aura-title data-letters aria-label="Project Aura" className={styles.projectTitle}>{aura.quick.displayTitle}</h3>
            <p data-aura-line="0">{aura.shortDescription}</p>
            <p data-aura-line="1">{auraStory[0]}</p>
            <p data-aura-line="2">{auraStory[1]}</p>
            <p data-aura-line="3">{auraStory[2]}</p>
            <p data-aura-line="4">{auraStory[3]}</p>
            <div data-frame="aura" style={{ width: 900, height: 520 }}>
              <div data-aura-wire aria-hidden="true" />
              <svg data-aura-spine viewBox="0 0 900 520" aria-hidden="true">
                <line x1="450" y1="40" x2="450" y2="480" stroke="#2a2023" strokeWidth="1" />
                <path
                  data-aura-spineline
                  d="M450 40 L450 480"
                  stroke="#c0182a"
                  strokeWidth="1.4"
                  fill="none"
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
              </svg>
              {auraSteps.map((step, i) => (
                <div key={step} data-aura-step={i}>
                  <span className={styles.stepMark} />
                  <span className={styles.stepLabel}>{step.toUpperCase()}</span>
                </div>
              ))}
            </div>
            <div data-aura-tail>
              <div className={styles.auraSignal}>{aura.signal}</div>
              <div className={styles.auraTailLine}>{quickCopy.auraTail}</div><Link data-deeper href={aura.stayAwhile.route!}>{aura.quick.deeperLabel} ↗</Link>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 04 BEYOND CODE — parallax layers over oversized type        */}
        {/* ---------------------------------------------------------- */}
        <section id="ch-beyond" data-stage="beyond" data-screen-label="04 BEYOND CODE" aria-label="Beyond code">
          <div className={styles.viewport}>
            <div data-beyond-warm aria-hidden="true" />
            <div data-beyond-big data-letters aria-hidden="true">
              BEYOND CODE
            </div>
            <ScreenLabel index="04" className={styles.beyondLabel}>
              BEYOND CODE
            </ScreenLabel>
            <div data-beyond-lead className={styles.munClubLead}>
              <h2>{quickCopy.munClubTitle}</h2>
              <p>{quickCopy.munClubDetail}</p>
            </div>

            <div data-bg-layer="3"><ArchiveContent id="theory" /></div>
            <div data-bg-layer="2"><ArchiveContent id="communication" /></div>
            <div data-bg-layer="1">
              <div className={styles.bgSlot}><div className={styles.archiveRecord}>
                <span>{mun.role}</span><h3>{mun.title}</h3><p>{quickCopy.munConferenceDetail}</p>
              </div></div>
              <div className={styles.bgCaption}>{mun.signal}</div>
            </div>
            <div data-bg-layer="1b"><ArchiveContent id="guitar" /></div>

            <div data-beyond-strip>{quickCopy.beyondCategories.map(label => <span key={label}>{label}</span>)}</div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 05 WHERE I'M GOING — the near view recedes past a horizon   */}
        {/* ---------------------------------------------------------- */}
        <section id="ch-future" data-stage="future" data-screen-label="05 WHERE I'M GOING" aria-label="Where I’m going">
          <div className={styles.viewport}>
            <canvas data-stars aria-hidden="true" />
            <div data-fut-horizon aria-hidden="true" />
            <div data-fut-glow aria-hidden="true" />
            <ScreenLabel index="05">{chapters[4].title}</ScreenLabel>
            <div data-fut-near>
              <h2 className={styles.futNearTitle}>{future.title}</h2>
              <div className={styles.futNearTags}>{future.currentTags.map(tag => <span key={tag}>{tag}</span>)}</div>
            </div>
            {future.destinations.map((plane, i) => (
              <div key={plane} data-fut-plane={i}>
                {plane}
              </div>
            ))}
            <div data-fut-final><p>{future.statement}</p>
              <div className={styles.futFinalNote}>{future.closing.toUpperCase()}</div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 06 CONTACT — the only scene that is not a sticky viewport   */}
        {/* ---------------------------------------------------------- */}
        <section id="ch-contact" data-stage="contact" data-screen-label="06 CONTACT" aria-label="Contact">
          <div data-contact-mark>
            <span className={styles.labelRule} aria-hidden="true" />
            {chapters[5].number} &nbsp; {chapters[5].title}
          </div>
          <h2 data-contact-title data-letters aria-label={quickCopy.contactTitle}>
            {quickCopy.contactTitle}
          </h2>
          <p className={styles.contactPrompt}>{quickCopy.contactPrompt}</p>
          <div className={styles.contactList}>
            {(Object.entries(contact) as [keyof typeof contact, string][]).map(([kind, value]) => {
              const href = contactHref(kind, value);
              const children = <><span className={styles.contactKind}>{kind.toUpperCase()}</span><span className={styles.contactValue}>{value}</span>{href ? <span data-carrow aria-hidden="true">→</span> : <span className={styles.contactPending}>{quickCopy.contactPending}</span>}</>;
              return href ? <a key={kind} data-contact href={href} rel={href.startsWith("https:") ? "me noopener noreferrer" : undefined}>{children}</a> : <div key={kind} data-contact>{children}</div>;
            })}
          </div>
          <div className={styles.closing}>
            <div className={styles.closingNote}>{quickCopy.closing}</div>
            {/* The design pointed this at the other artboard; in the site that
                destination is the Stay Awhile route. */}
            <Link data-stay href={routes.stay}>
              <span className={styles.stayLabel}>Stay awhile</span>
              <span data-stayarrow aria-hidden="true">
                &#8594;
              </span>
            </Link>
          </div>
          <div className={styles.complete}>
            <span className={styles.completeMark} aria-hidden="true" />
            {quickCopy.complete}
          </div>
        </section>
      </div>

      <SceneRuntime />
    </div>
  );
}
