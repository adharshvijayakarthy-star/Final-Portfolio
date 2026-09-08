import Link from "next/link";
import type { CSSProperties } from "react";

import { experiences, type ExperienceDefinition } from "@/data/site";
import { owner, quickCopy, routes } from "@/data/content";
import { cn } from "@/lib/cn";

import {
  MOBILE_BLOSSOMS,
  MOBILE_BRANCHES,
  MOBILE_LEAVES,
  MOBILE_QUICK_FOREGROUND,
  MOBILE_QUICK_FRACTURES,
  MOBILE_QUICK_INNER_FRACTURES,
  MOBILE_QUICK_LAYERS,
  MOBILE_STAY_LAYERS,
  QUICK_FOREGROUND,
  QUICK_FRACTURES,
  QUICK_INNER_FRACTURES,
  QUICK_LAYERS,
  STAY_BLOSSOMS,
  STAY_BOKEH,
  STAY_BRANCHES,
  STAY_LAYERS,
  STAY_LEAVES,
  STAY_PITS,
  STAY_UNDERGLOW,
  type Blossom,
  type Branch,
  type Fracture,
  type Leaf,
  type SceneLayer,
} from "./scene";
import styles from "./Threshold.module.css";
import { ThresholdRuntime } from "./ThresholdRuntime";

/**
 * THE THRESHOLD — the approved "AURA Threshold" landing design.
 *
 * A single dark stage holding two environmental objects rather than two
 * panels: a faceted obsidian crystal rising out of shards on the left, and a
 * warm ivory stone resting under a sakura branch on the right. The question
 * sits between them, revealed by a soft mask travelling across each line.
 *
 * All of this markup is server-rendered. ThresholdRuntime is the only client
 * component, and it adds the canvas particle field, the custom cursor and the
 * pointer-reactive material response on top — so the scene is complete,
 * readable and navigable before (and without) hydration.
 */

const ENTER_CLASS: Record<SceneLayer["enter"], string> = {
  fade: styles.enterFade!,
  shardL: styles.enterShardL!,
  shardR: styles.enterShardR!,
};

function enterStyle(dur: string, delay: string): CSSProperties {
  return { "--enter-dur": dur, "--enter-delay": delay } as CSSProperties;
}

function Layers({ items }: { items: readonly SceneLayer[] }) {
  return (
    <>
      {items.map((layer) => (
        <div
          key={layer.id}
          data-scene-layer={layer.id}
          className={cn(styles.layer, styles.enter, ENTER_CLASS[layer.enter])}
          style={{ ...layer.style, ...enterStyle(layer.dur, layer.delay) } as CSSProperties}
        />
      ))}
    </>
  );
}

function Fractures({ items, inner }: { items: readonly Fracture[]; inner?: boolean }) {
  return (
    <>
      {items.map((line) => (
        <div
          key={line.id}
          className={inner ? styles.innerFracture : styles.fracture}
          style={line.style as CSSProperties}
        />
      ))}
    </>
  );
}

function Leaves({ items }: { items: readonly Leaf[] }) {
  return (
    <>
      {items.map((leaf) => (
        <div key={leaf.id} className={styles.leaf} style={leaf.style as CSSProperties} />
      ))}
    </>
  );
}

function Branches({ items }: { items: readonly Branch[] }) {
  return (
    <>
      {items.map((branch) => (
        <path
          key={branch.id}
          className={styles.branchPath}
          d={branch.d}
          pathLength={1}
          stroke={branch.stroke}
          strokeWidth={branch.width}
          style={enterStyle(branch.dur, branch.delay)}
        />
      ))}
    </>
  );
}

/** Five ellipses around a pale centre — a blossom seen head-on. */
function Blossoms({ items }: { items: readonly Blossom[] }) {
  return (
    <>
      {items.map((blossom) => (
        <g
          key={blossom.id}
          transform={`translate(${blossom.x},${blossom.y}) scale(${blossom.scale})`}
          {...(blossom.soft ? { filter: "url(#auraSoft)" } : {})}
        >
          {!blossom.soft && <circle r={3} fill="#f6dcc9" />}
          {blossom.fills.map((fill, index) => (
            <ellipse
              key={fill + String(index)}
              rx={blossom.soft ? 7 : 6.5}
              ry={blossom.soft ? 9 : 8.5}
              fill={fill}
              transform={`rotate(${
                blossom.rotate + index * (360 / blossom.fills.length)
              }) translate(0,${blossom.soft ? -8 : -9})`}
            />
          ))}
        </g>
      ))}
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* The two entrance objects                                               */
/* ---------------------------------------------------------------------- */

function discLabel(experience: ExperienceDefinition): string {
  return `${experience.index} — ${experience.label}. ${experience.descriptor}. ${experience.duration}.`;
}

function DiscContent({ experience }: { experience: ExperienceDefinition }) {
  return (
    <span className={styles.discContent} data-disc-copy>
      <span className={styles.discIndex} aria-hidden="true">
        {experience.index}
      </span>
      <span className={styles.discTitle}>
        {experience.titleLines.map((line, index) => (
          <span key={line}>
            {index > 0 && <br />}
            {line}
          </span>
        ))}
      </span>
      <span className={styles.discDescriptor}>{experience.descriptor}</span>
      <span className={styles.discDuration}>{experience.duration}</span>
      <span className={styles.discArrow} aria-hidden="true">
        &#8594;
      </span>
    </span>
  );
}

function QuickCrystal({
  experience,
  fractures,
}: {
  experience: ExperienceDefinition;
  fractures: readonly Fracture[];
}) {
  return (
    <>
      <div className={cn(styles.quickShadow, styles.crystalShape)} />
      <div className={cn(styles.quickRim, styles.crystalShape)} />
      <div className={cn(styles.quickBevel, styles.crystalShape)} />
      <Link
        href={experience.path}
        className={cn(styles.quickDisc, styles.crystalShape)}
        data-disc="quick"
        aria-label={discLabel(experience)}
      >
        <span className={styles.quickSheen} />
        <span className={styles.quickShade} />
        <Fractures items={fractures} inner />
        <span className={styles.discLight} />
        <span className={cn(styles.gleam, styles.quickGleam)} data-gleam />
        <DiscContent experience={experience} />
      </Link>
    </>
  );
}

function StayStone({ experience }: { experience: ExperienceDefinition }) {
  return (
    <Link
      href={experience.path}
      className={styles.stayDisc}
      data-disc="stay"
      aria-label={discLabel(experience)}
    >
      <span className={styles.stayModelling} />
      <span className={styles.stayGrain} />
      <span className={styles.stayForm} />
      {STAY_PITS.map((pit) => (
        <span key={pit.id} className={styles.stayPit} style={pit.style as CSSProperties} />
      ))}
      <span className={styles.discLight} />
      <span className={cn(styles.gleam, styles.stayGleam)} data-gleam />
      <span className={styles.stayBounce} />
      <DiscContent experience={experience} />
    </Link>
  );
}

/* ---------------------------------------------------------------------- */

export function Threshold() {
  const quick = experiences.find((item) => item.world === "quick");
  const stay = experiences.find((item) => item.world === "stay");
  if (!quick || !stay) return null;

  return (
    <div className={styles.scene} data-aura-scene>
      <div className={styles.vignette} />

      <div className={styles.stageLayer}>
        {/* --- the question, rendered once and repositioned per breakpoint --- */}
        <div className={styles.centre} data-threshold-copy>
          <h1 className={styles.title}>
            <span className={styles.titleLine}>
              <span className={styles.titleWipe} style={enterStyle("0.88s", "0.3s")}>
                Want to discover
              </span>
            </span>
            <span className={styles.titleLine}>
              <span
                className={cn(styles.titleWipe, styles.titleItalic)}
                style={enterStyle("0.82s", "0.86s")}
              >
                {owner.firstName}?
              </span>
            </span>
          </h1>
          <p className={styles.question}>
            How much time
            <br />
            do you have?
          </p>
        </div>

        {/* --- DESKTOP: two anchored worlds ------------------------------- */}
        <div className={styles.desktopWorlds}>
          <div className={styles.worldQuick} data-region="ember">
            <Layers items={QUICK_LAYERS} />

            <div
              className={cn(styles.fractureField, styles.enter, styles.enterFade)}
              style={enterStyle("1.4s", "1.25s")}
            >
              <Fractures items={QUICK_FRACTURES} />
            </div>

            <div
              className={cn(styles.quickWrap, styles.enter, styles.enterDisc)}
              style={enterStyle("1.2s", "1.55s")}
            >
              <QuickCrystal experience={quick} fractures={QUICK_INNER_FRACTURES} />
            </div>

            <Layers items={QUICK_FOREGROUND} />
          </div>

          <div className={styles.worldStay} data-region="petal">
            <Layers items={STAY_LAYERS} />

            <svg
              className={styles.foliageSvg}
              viewBox="0 0 560 900"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <filter id="auraSoft" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="3.2" />
                </filter>
                <filter id="auraSofter" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="6" />
                </filter>
              </defs>
              <g className={styles.branchGroup}>
                <Branches items={STAY_BRANCHES} />
              </g>
              <g
                className={cn(styles.blossomGroup, styles.enter, styles.enterFade)}
                style={enterStyle("1.4s", "1.1s")}
              >
                <Blossoms items={STAY_BLOSSOMS} />
                <g filter="url(#auraSofter)" opacity="0.55">
                  {STAY_BOKEH.map((dot) => (
                    <circle key={dot.id} cx={dot.cx} cy={dot.cy} r={dot.r} fill={dot.fill} />
                  ))}
                </g>
              </g>
            </svg>

            <div
              className={cn(styles.stayWrap, styles.enter, styles.enterDisc)}
              style={enterStyle("1.4s", "1.65s")}
            >
              <div className={styles.stayShadow} />
              <div className={styles.stayTilt}>
                <StayStone experience={stay} />
              </div>
            </div>

            <Layers items={[STAY_UNDERGLOW]} />

            <div
              className={cn(styles.leafField, styles.enter, styles.enterFade)}
              style={enterStyle("1.6s", "1.4s")}
            >
              <Leaves items={STAY_LEAVES} />
            </div>
          </div>
        </div>

        {/* --- MOBILE: the worlds stacked as two stacked regions ---------- */}
        <div className={styles.mobileRegions}>
          <div className={cn(styles.mobileRegion, styles.mobileEmber)} data-region="ember">
            <Layers items={MOBILE_QUICK_LAYERS} />

            <div
              className={cn(styles.fractureField, styles.enter, styles.enterFade)}
              style={enterStyle("1.4s", "1.25s")}
            >
              <Fractures items={MOBILE_QUICK_FRACTURES} />
            </div>

            <div
              className={cn(styles.mobileQuickWrap, styles.enter, styles.enterDisc)}
              style={enterStyle("1.2s", "1.55s")}
            >
              <QuickCrystal experience={quick} fractures={MOBILE_QUICK_INNER_FRACTURES} />
            </div>

            <Layers items={[MOBILE_QUICK_FOREGROUND]} />
          </div>

          <div className={styles.mobileRegion} data-region="petal">
            <Layers items={MOBILE_STAY_LAYERS} />

            <svg
              className={styles.mobileFoliageSvg}
              viewBox="0 0 390 360"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <g className={styles.mobileBranchGroup}>
                <Branches items={MOBILE_BRANCHES} />
              </g>
              <g
                className={cn(styles.mobileBlossomGroup, styles.enter, styles.enterFade)}
                style={enterStyle("1.4s", "1.1s")}
              >
                <Blossoms items={MOBILE_BLOSSOMS} />
              </g>
            </svg>

            <div
              className={cn(styles.mobileStayWrap, styles.enter, styles.enterDisc)}
              style={enterStyle("1.4s", "1.65s")}
            >
              <div className={styles.stayShadow} />
              <StayStone experience={stay} />
            </div>

            <div
              className={cn(styles.mobileLeafField, styles.enter, styles.enterFade)}
              style={enterStyle("1.6s", "1.4s")}
            >
              <Leaves items={MOBILE_LEAVES} />
            </div>
          </div>
        </div>
      </div>

      <Link href={routes.home} aria-label={quickCopy.homeLabel} className={cn(styles.wordmark, styles.enter, styles.enterFade)} style={enterStyle("1.4s", "0.3s")}>
        <i>{quickCopy.mark[0]}</i>{quickCopy.mark.slice(1)}
      </Link>

      <ThresholdRuntime />
    </div>
  );
}
