/**
 * THE QUICK DISCOVERY SCROLL ENGINE.
 *
 * A direct port of the logic in the approved design source
 * (`Quick Discovery.dc.html`), which ran there as a Claude Design `DCLogic`
 * component. The choreography, easing curves, timing windows and random seeds
 * are reproduced exactly — this file *is* the design, not an interpretation of
 * it. Move a window here and the scene stops matching the artboard.
 *
 * Structure, unchanged from the source:
 *
 *   - Every scene is a tall `[data-stage]` block wrapping one sticky 100vh
 *     viewport. `prog()` turns that block's position into a 0 → 1 clock.
 *   - `setup()` generates the primitives each scene animates (entry shards,
 *     planner blocks, the MUN graph, …) once, from a seeded PRNG, so the
 *     composition is identical on every load.
 *   - One rAF loop reads scroll and writes inline styles. Nothing here holds
 *     React state, which is why the markup can stay a server component.
 *
 * The authored geometry, sequence and scroll windows remain the baseline.
 * Refinements below interpolate only binary material/caret states, and handle
 * navigation, lifecycle and accessible reading independently of choreography.
 */

import { plannerContent } from "@/data/content";
import { bindChapterNavigation } from "./navigation";

export interface EngineOptions {
  /** Full cinematic choreography. `false` takes the reduced-motion path. */
  cinematicMotion: boolean;
  /** Ember particle count multiplier, 0–2. */
  emberDensity: number;
  /** The fixed chapter rail down the right edge. */
  showChapterRail: boolean;
}

export const ENGINE_DEFAULTS: EngineOptions = {
  cinematicMotion: true,
  emberDensity: 1,
  showChapterRail: true,
};

/* ---------- math, verbatim from the design ---------- */

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const st = (a: number, b: number, x: number) => {
  const t = cl((x - a) / (b - a || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};
const lin = (a: number, b: number, x: number) => cl((x - a) / (b - a || 1e-6), 0, 1);
const lp = (a: number, b: number, t: number) => a + (b - a) * t;
const back = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const u = t - 1;
  return 1 + c3 * u * u * u + c1 * u * u;
};
const outQuint = (t: number) => 1 - Math.pow(1 - t, 5);
const colorBetween = (a: readonly number[], b: readonly number[], t: number) =>
  `rgb(${a.map((v, i) => Math.round(lp(v, b[i]!, t))).join(",")})`;

/**
 * The design's seeded PRNG. Module-level, exactly as in the source: each
 * `build*` routine reseeds it before generating, so every composition is
 * deterministic and independent of the order things get built in.
 */
let SEED = 20260906;
const rnd = () => {
  SEED = (SEED * 1103515245 + 12345) & 0x7fffffff;
  return SEED / 0x7fffffff;
};

const NS = "http://www.w3.org/2000/svg";
function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  return e;
}

/* ---------- shapes of the generated primitives ---------- */

interface Shard { el: HTMLDivElement; tx: number; ty: number; sx: number; sy: number; rot: number; d: number; depth: number }
interface Spark { el: SVGCircleElement; a: number; d: number; ph: number }
interface SystemNode { g: SVGGElement; ring: SVGCircleElement; core: SVGCircleElement }
interface PlanBlock { el: HTMLDivElement; tx: number; ty: number; tw: number; th: number; sx: number; sy: number; sr: number; d: number }
interface PaperPoint { el: SVGCircleElement; x: number; y: number; drop: number }
interface MunNode { g: SVGGElement; c: SVGCircleElement; x: number; y: number; sx: number; sy: number; wave: number; r: number }
interface MunLink { el: SVGPathElement; wave: number }
interface WireBlock { el: HTMLDivElement; dx: number; dy: number; rot: number; d: number }
interface Ember { x: number; y: number; r: number; vy: number; ph: number; sp: number; warm: boolean }
interface Star { x: number; y: number; r: number; ph: number }

class QuickDiscoveryEngine {
  private readonly root: HTMLElement;
  private readonly opts: EngineOptions;

  private dead = false;
  private boot = 0;
  private raf = 0;
  private lastTime = 0;
  private frameStep = 1;
  private readonly cached = new Map<string, Element | null>();
  private readonly cachedLists = new Map<string, Element[]>();
  private bounds: Record<string, { top: number; height: number }> = {};
  private scroll = 0;
  private staticPainted = false;

  private readonly ptr = { x: -9999, y: -9999 };
  private heat = 0.4;
  private flash = 0;
  private starAlpha = 0;
  private starDrift = 0;
  private chapter = "";

  private sysReduced = false;
  private largeText = false;
  private coarse = false;
  private vw = 0;
  private vh = 0;

  private stages: Record<string, HTMLElement> = {};

  private entryLetters: HTMLSpanElement[] = [];
  private whoName: HTMLSpanElement[] = [];
  private planTitle: HTMLSpanElement[] = [];
  private papTitle: HTMLSpanElement[] = [];
  private munTitle: HTMLSpanElement[] = [];
  private auraTitle: HTMLSpanElement[] = [];
  private beyondTitle: HTMLSpanElement[] = [];
  private contactTitle: HTMLSpanElement[] = [];
  private buildWords: HTMLElement[] = [];

  private shards: Shard[] = [];
  private sparks: Spark[][] = [];
  private bPts: number[][] = [];
  private bLinkEls: SVGPathElement[] = [];
  private bNodeEls: SystemNode[] = [];
  private bIdeaRing: SVGCircleElement | null = null;
  private bPulses: SVGCircleElement[] = [];
  private readonly bPulseIdx = [4, 8, 11];
  private pBlocks: PlanBlock[] = [];
  private pThreads: SVGPathElement[] = [];
  private papPts: PaperPoint[] = [];
  private papOffsets: number[] = [];
  private mNodes: MunNode[] = [];
  private mLinks: MunLink[] = [];
  private aWire: WireBlock[] = [];

  private roleTargets: { x: number; y: number; s: number }[] | null = null;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private stars: HTMLCanvasElement | null = null;
  private sctx: CanvasRenderingContext2D | null = null;
  private embers: Ember[] = [];
  private emberDen = 1;
  private starPts: Star[] = [];

  private readonly cleanups: (() => void)[] = [];

  constructor(root: HTMLElement, opts: EngineOptions) {
    this.root = root;
    this.opts = opts;
    this.boot = requestAnimationFrame(() => this.setup());
  }

  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.boot);
    cancelAnimationFrame(this.raf);
    for (const off of this.cleanups) off();
    this.cleanups.length = 0;
    this.cached.clear();
    this.cachedLists.clear();
  }

  private q<T extends Element = HTMLElement>(s: string): T | null {
    if (!this.cached.has(s)) this.cached.set(s, this.root.querySelector(s));
    return this.cached.get(s) as T | null;
  }

  private qa<T extends Element = HTMLElement>(s: string): T[] {
    if (!this.cachedLists.has(s)) this.cachedLists.set(s, Array.from(this.root.querySelectorAll(s)));
    return this.cachedLists.get(s) as T[];
  }

  private get lowMotion() {
    return this.sysReduced || this.largeText || this.opts.cinematicMotion === false;
  }

  private setup() {
    if (this.dead) return;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce), (max-height: 650px), (max-width: 360px), (max-width: 760px) and (max-height: 740px)");
    this.sysReduced = motionQuery.matches;
    this.coarse = window.matchMedia("(pointer: coarse)").matches;

    this.stages = {};
    for (const el of this.qa("[data-stage]")) {
      const name = el.dataset["stage"];
      if (name) this.stages[name] = el;
    }

    this.entryLetters = this.split(this.q("[data-entry-title]"));
    this.whoName = this.split(this.q("[data-who-word1]")).concat(this.split(this.q("[data-who-word2]")));
    this.planTitle = this.split(this.q("[data-plan-title]"));
    this.papTitle = this.split(this.q("[data-pap-title]"));
    this.munTitle = this.split(this.q("[data-mun-title]"));
    this.auraTitle = this.split(this.q("[data-aura-title]"));
    this.beyondTitle = this.split(this.q("[data-beyond-big]"));
    this.contactTitle = this.split(this.q("[data-contact-title]"));
    this.buildWords = this.qa("[data-build-w]");

    // A restored route or development effect may reuse its DOM. Rebuild only
    // engine-owned primitives so the seeded arrays and their nodes stay paired.
    for (const selector of ["[data-entry-shards]", "[data-who-sparks]", "[data-build-nodes]", "[data-build-links]", "[data-build-ring]", "[data-build-pulses]", "[data-plan-grid]", "[data-plan-blocks]", "[data-plan-threads]", "[data-pap-points]", "[data-mun-nodes]", "[data-mun-links]", "[data-aura-wire]"]) this.q(selector)?.replaceChildren();
    this.buildEntry();
    this.buildSparks();
    this.buildSystem();
    this.buildPlanner();
    this.buildPapers();
    this.buildMun();
    this.buildAuraWire();
    this.bindContact();
    this.cleanups.push(bindChapterNavigation(this.root, () => this.lowMotion));

    this.canvas = this.q<HTMLCanvasElement>("[data-embers]");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.stars = this.q<HTMLCanvasElement>("[data-stars]");
    this.sctx = this.stars ? this.stars.getContext("2d") : null;

    const wake = () => {
      if (this.dead || document.hidden || this.raf) return;
      this.raf = requestAnimationFrame(t => { this.raf = 0; this.tick(t); });
    };
    const onResize = () => { this.sizeCanvas(); this.fit(); this.staticPainted = false; wake(); };
    const onPtr = (e: PointerEvent) => { this.ptr.x = e.clientX; this.ptr.y = e.clientY; };
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPtr, { passive: true });
    this.cleanups.push(() => window.removeEventListener("resize", onResize));
    this.cleanups.push(() => window.removeEventListener("pointermove", onPtr));
    const onMotion = () => {
      this.sysReduced = motionQuery.matches;
      this.staticPainted = false;
      this.fit();
      wake();
    };
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(this.raf); this.raf = 0; this.lastTime = 0; }
      else wake();
    };
    const onLeave = () => { this.ptr.x = this.ptr.y = -9999; };
    motionQuery.addEventListener("change", onMotion);
    window.addEventListener("scroll", wake, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    document.documentElement.addEventListener("pointerleave", onLeave);
    this.cleanups.push(() => {
      motionQuery.removeEventListener("change", onMotion);
      window.removeEventListener("scroll", wake);
      document.removeEventListener("visibilitychange", onVisibility);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    });

    this.sizeCanvas();
    this.seedEmbers();
    this.seedStars();
    this.fit();
    document.fonts.ready.then(() => { if (!this.dead) { this.fit(); wake(); } }).catch(() => {});
    const late = window.setTimeout(() => this.fit(), 900);
    this.cleanups.push(() => window.clearTimeout(late));

    this.root.dataset["ready"] = "true";
    this.fit();
    this.tick(performance.now());
    window.dispatchEvent(new Event("aura:quick-ready"));
  }

  /* ---------- helpers ---------- */

  /**
   * Per-character split, so a title can be animated letter by letter. Guarded
   * by `data-split` because React mounts effects twice in development; the
   * second pass reuses the spans the first one made rather than splitting
   * already-split text into empty nodes.
   */
  private split(el: HTMLElement | null): HTMLSpanElement[] {
    if (!el) return [];
    if (el.dataset["split"] === "1") return Array.from(el.querySelectorAll<HTMLSpanElement>("[data-ch]"));
    const txt = el.textContent ?? "";
    el.textContent = "";
    el.dataset["split"] = "1";
    const out: HTMLSpanElement[] = [];
    for (const ch of txt) {
      const s = document.createElement("span");
      s.setAttribute("data-ch", "");
      s.style.cssText = "display:inline-block;white-space:pre;will-change:transform,opacity";
      s.textContent = ch;
      el.appendChild(s);
      out.push(s);
    }
    return out;
  }

  private sizeCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    if (this.canvas && this.ctx) {
      this.canvas.width = Math.round(this.vw * dpr);
      this.canvas.height = Math.round(this.vh * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (this.stars && this.sctx) {
      this.stars.width = Math.round(this.vw * dpr);
      this.stars.height = Math.round(this.vh * dpr);
      this.sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  /**
   * Fits each fixed-coordinate `[data-frame]` diagram to the viewport, and
   * resolves the three WHO roles into their final row (or stack, under 900px).
   * The frames keep their design width/height as inline styles precisely
   * because this reads them back.
   */
  private fit() {
    if (this.dead) return;
    this.largeText = parseFloat(getComputedStyle(document.documentElement).fontSize) > 22;
    this.q("[data-reading-style]")?.setAttribute("media", this.lowMotion ? "all" : "(prefers-reduced-motion: reduce), (scripting: none), (max-height: 650px), (max-width: 360px), (max-width: 760px) and (max-height: 740px)");
    for (const f of this.qa("[data-frame]")) {
      const w = parseFloat(f.style.width);
      const h = parseFloat(f.style.height);
      const pad = this.vw < 760 ? 24 : 96;
      const k = Math.min((this.vw - pad) / w, (this.vh * 0.58) / h);
      f.dataset["k"] = String(Math.max(0.22, k));
      f.style.setProperty("--reading-fit", String(Math.min(.9, (this.vw - (this.vw >= 1100 ? 340 : 56)) / w)));
      f.style.setProperty("--annotation-scale", String(1 / Math.max(.6, k)));
    }

    const roles = [0, 1, 2].map((i) => this.q('[data-who-role="' + i + '"]'));
    if (roles[0]) {
      const widths = roles.map((r) => (r ? r.offsetWidth : 0));
      const stack = this.vw < 900;
      const gap = this.vw * 0.03;
      const total = widths.reduce((a, b) => a + b, 0) + gap * 2;
      const scale = stack
        ? Math.min(this.vw < 760 ? 0.78 : 0.62, (this.vw * 0.86) / Math.max(1, Math.max.apply(null, widths)))
        : Math.min(0.62, (this.vw * 0.86) / Math.max(1, total));
      this.roleTargets = [];
      let x = -(total * scale) / 2;
      for (let i = 0; i < 3; i++) {
        if (stack) {
          this.roleTargets.push({ x: 0, y: (i - 1) * this.vh * (this.vw < 760 ? 0.065 : 0.11), s: scale });
        } else {
          const cx = x + (widths[i]! * scale) / 2;
          this.roleTargets.push({ x: cx, y: 0, s: scale });
          x += widths[i]! * scale + gap * scale;
        }
      }
    }

    const papRoot = this.q("[data-pap-title]");
    if (papRoot && this.papTitle.length) {
      this.papOffsets = this.papTitle.map((s) => s.offsetLeft + s.offsetWidth);
    }
    this.bounds = Object.fromEntries(Object.entries(this.stages).map(([name, el]) =>
      [name, { top: el.getBoundingClientRect().top + scrollY, height: el.offsetHeight }]));
  }

  /** A stage's own 0 → 1 clock, or -1 when it is nowhere near the viewport. */
  private prog(name: string) {
    const r = this.bounds[name];
    if (!r) return -1;
    const top = r.top - this.scroll;
    if (top + r.height < -80 || top > this.vh + 80) return -1;
    if (name === "contact") return cl((this.vh - top) / (this.vh * 0.85), 0, 1);
    return cl(-top / (r.height - this.vh || 1), 0, 1);
  }

  /** Reduced motion compresses each scene into its first half, then holds. */
  private ease(p: number) {
    return this.lowMotion ? Math.min(1, p * 2.2) : p;
  }

  private blur(v: number) {
    return this.lowMotion || v < 0.12 ? "none" : "blur(" + v.toFixed(2) + "px)";
  }

  private frame(name: string, camScale?: number, camX?: number, camY?: number) {
    const f = this.q('[data-frame="' + name + '"]');
    if (!f) return;
    const k = parseFloat(f.dataset["k"] || "1") * (camScale == null ? 1 : camScale);
    f.style.setProperty("--frame-scale", String(k));
    f.style.transform =
      "translate(calc(-50% + " + (camX || 0).toFixed(1) + "px),calc(-50% + " + (camY || 0).toFixed(1) +
      "px)) scale(" + k.toFixed(4) + ")";
  }

  /** The standard "rise into place" reveal, used by captions and evidence. */
  private seq(el: HTMLElement | null, a: number) {
    if (!el) return;
    el.style.opacity = a.toFixed(3);
    el.style.transform = "translateY(" + lp(18, 0, a).toFixed(1) + "px)";
  }

  /* ---------- generated primitives ---------- */

  private buildEntry() {
    const wrap = this.q("[data-entry-shards]");
    if (!wrap || wrap.childNodes.length) return;
    SEED = 7781;
    const shapes = [
      "polygon(0% 18%,54% 0%,100% 42%,82% 100%,0% 100%)",
      "polygon(42% 0%,100% 20%,74% 100%,0% 72%)",
      "polygon(0% 42%,62% 0%,100% 58%,30% 100%)",
      "polygon(0% 24%,52% 0%,100% 30%,100% 100%,0% 100%)",
    ];
    this.shards = [];
    for (let i = 0; i < 16; i++) {
      const w = 60 + rnd() * 230;
      const h = 60 + rnd() * 260;
      const el = document.createElement("div");
      const ang = (i / 16) * Math.PI * 2 + rnd() * 0.5;
      const tx = Math.cos(ang) * (120 + rnd() * 260);
      const ty = Math.sin(ang) * (90 + rnd() * 220);
      el.style.cssText =
        "position:absolute;left:50%;top:46%;width:" + w.toFixed(0) + "px;height:" + h.toFixed(0) +
        "px;margin:" + (-h / 2).toFixed(0) + "px 0 0 " + (-w / 2).toFixed(0) + "px;clip-path:" + shapes[i % 4] +
        ";background:linear-gradient(" + (120 + rnd() * 90).toFixed(0) +
        "deg,#16151d,#08080c 72%);will-change:transform,opacity;opacity:0";
      wrap.appendChild(el);
      this.shards.push({
        el, tx, ty,
        sx: Math.cos(ang) * (900 + rnd() * 900),
        sy: Math.sin(ang) * (700 + rnd() * 700),
        rot: (rnd() - 0.5) * 150,
        d: rnd(),
        depth: 0.5 + rnd(),
      });
    }
  }

  private buildSparks() {
    const s = this.q<SVGSVGElement>("[data-who-sparks]");
    if (!s || s.childNodes.length) return;
    SEED = 6112;
    this.sparks = [];
    for (let w = 0; w < 3; w++) {
      const group: Spark[] = [];
      for (let i = 0; i < 9; i++) {
        const c = svg("circle", { r: 0.35, fill: i % 3 === 0 ? "#e0555f" : "#e8dccb", opacity: 0 });
        s.appendChild(c);
        group.push({ el: c, a: rnd() * 6.283, d: 3 + rnd() * 9, ph: rnd() });
      }
      this.sparks.push(group);
    }
  }

  private buildSystem() {
    const nodesG = this.q<SVGGElement>("[data-build-nodes]");
    const linksG = this.q<SVGGElement>("[data-build-links]");
    const ringG = this.q<SVGGElement>("[data-build-ring]");
    const pulseG = this.q<SVGGElement>("[data-build-pulses]");
    if (!nodesG || !linksG || !ringG || !pulseG || nodesG.childNodes.length) return;
    SEED = 40311;
    const pts = [[110, 280], [300, 280], [430, 170], [430, 388], [580, 108], [592, 262], [578, 420], [730, 176], [742, 340], [872, 258]];
    const links = [[0, 1], [1, 2], [1, 3], [2, 4], [2, 5], [3, 5], [3, 6], [4, 7], [5, 7], [5, 8], [6, 8], [7, 9], [8, 9]];
    this.bPts = pts;
    this.bLinkEls = links.map(([a, b]) => {
      const l = svg("path", {
        d: "M" + pts[a!]![0] + " " + pts[a!]![1] + " L" + pts[b!]![0] + " " + pts[b!]![1],
        pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1, "stroke-width": 0.9, opacity: 0.55,
      });
      linksG.appendChild(l);
      return l;
    });
    this.bNodeEls = pts.map((p, i) => {
      const g = svg("g", { transform: "translate(" + p[0] + " " + p[1] + ")", opacity: 0 });
      const ring = svg("circle", { r: i === 0 ? 5 : 9, fill: "none", stroke: "#4a3a3e", "stroke-width": 1 });
      const core = svg("circle", { r: i === 0 ? 2.6 : 3.2, fill: i === 0 ? "#e0555f" : "#8f8578" });
      g.appendChild(ring);
      g.appendChild(core);
      nodesG.appendChild(g);
      return { g, ring, core };
    });
    this.bIdeaRing = svg("circle", { cx: 110, cy: 280, r: 6, "stroke-width": 1, opacity: 0 });
    ringG.appendChild(this.bIdeaRing);
    this.bPulses = [0, 1, 2].map(() => {
      const c = svg("circle", { r: 3.2, fill: "#ffd9c8", opacity: 0 });
      pulseG.appendChild(c);
      return c;
    });
  }

  private buildPlanner() {
    const grid = this.q("[data-plan-grid]");
    const holder = this.q("[data-plan-blocks]");
    const threads = this.q<SVGSVGElement>("[data-plan-threads]");
    if (!grid || !holder || holder.childNodes.length) return;
    SEED = 90210;
    const cols = 5, colW = 176, gap = 20, x0 = 30, y0 = 54, rowH = 62, rowGap = 12;
    for (let c = 0; c < cols; c++) {
      const g = document.createElement("div");
      g.style.cssText =
        "position:absolute;left:" + (x0 + c * (colW + gap)) + "px;top:22px;width:" + colW +
        "px;height:462px;border-left:1px solid #191518;";
      const lab = document.createElement("div");
      lab.style.cssText = "position:absolute;left:8px;top:-20px;font-size:11px;letter-spacing:.2em;color:#4f4a45";
      lab.textContent = plannerContent.days[c]!;
      g.appendChild(lab);
      grid.appendChild(g);
    }
    const tasks = plannerContent.tasks;
    const breaks = [[2, 3], [3, 4], [4, 4]];
    this.pBlocks = [];
    const mk = (label: string, sub: string, col: number, row: number, span: number, kind: string) => {
      const el = document.createElement("div");
      const tx = x0 + col * (colW + gap) + 10;
      const ty = y0 + row * (rowH + rowGap);
      const tw = colW - 20;
      const th = rowH * span + rowGap * (span - 1);
      const isBreak = kind === "break";
      el.style.cssText =
        "position:absolute;left:0;top:0;width:" + tw + "px;height:" + th + "px;box-sizing:border-box;padding:9px 10px;" +
        (isBreak
          ? "background:rgba(20,17,19,.7);border:1px dashed #2a2226;"
          : "background:linear-gradient(155deg,#16151c,#0c0b10);border:1px solid #221d20;border-left:1px solid #c0182a;") +
        "will-change:transform,opacity;";
      const t1 = document.createElement("div");
      t1.style.cssText = "font-size:14px;letter-spacing:.04em;line-height:1.3;color:" + (isBreak ? "#aaa198" : "#dcd4c8");
      t1.textContent = label;
      el.appendChild(t1);
      if (sub) {
        const t2 = document.createElement("div");
        t2.style.cssText = "margin-top:5px;font-size:12px;letter-spacing:.04em;color:#a99f95";
        t2.textContent = sub;
        el.appendChild(t2);
      }
      holder.appendChild(el);
      const sx = rnd() * 940 - 40, sy = rnd() * 470 - 20, sr = (rnd() - 0.5) * 54;
      this.pBlocks.push({ el, tx, ty, tw, th, sx, sy, sr, d: rnd() });
    };
    tasks.forEach((t) => mk(t[0], t[1], t[2], t[3], t[4], "task"));
    breaks.forEach((b) => mk(plannerContent.breakLabel, "", b[0]!, b[1]!, 1, "break"));

    this.pThreads = [];
    if (threads) {
      for (const r of [0, 2, 4]) {
        const y = y0 + r * (rowH + rowGap) - 8;
        const p = svg("path", {
          d: "M" + (x0 + 10) + " " + y + " L" + (x0 + 4 * (colW + gap) + colW - 10) + " " + y,
          stroke: "#3a2a2e", "stroke-width": 0.8, fill: "none",
          pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1,
        });
        threads.appendChild(p);
        this.pThreads.push(p);
      }
    }
  }

  private buildPapers() {
    const g = this.q<SVGGElement>("[data-pap-points]");
    if (!g || g.childNodes.length) return;
    SEED = 5150;
    const n = 22, x0 = 90, x1 = 700;
    this.papPts = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const base = 400 - t * 210;
      const y = cl(base + (rnd() - 0.5) * 76, 60, 430);
      const x = x0 + t * (x1 - x0);
      const c = svg("circle", { cx: x, cy: y, r: 3.1, fill: "#cdbfae", opacity: 0 });
      g.appendChild(c);
      this.papPts.push({ el: c, x, y, drop: 90 + rnd() * 180 });
    }
    const dLog = this.papPts.map((p, i) => (i ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" ");
    const dTrend = this.papPts
      .map((p, i) => {
        const t = i / (this.papPts.length - 1);
        return (i ? "L" : "M") + p.x.toFixed(1) + " " + (400 - t * 210).toFixed(1);
      })
      .join(" ");
    this.q<SVGPathElement>("[data-pap-log]")?.setAttribute("d", dLog);
    this.q<SVGPathElement>("[data-pap-trend]")?.setAttribute("d", dTrend);
    this.q<SVGPathElement>("[data-pap-pred]")?.setAttribute("d", "M700 190 L960 118");
    this.q<SVGPathElement>("[data-pap-band]")?.setAttribute("d", "M700 190 L960 76 L960 168 L700 190 Z");
  }

  private buildMun() {
    const nodesG = this.q<SVGGElement>("[data-mun-nodes]");
    const linksG = this.q<SVGGElement>("[data-mun-links]");
    if (!nodesG || !linksG || nodesG.childNodes.length) return;
    SEED = 771;
    const centers = [[500, 260], [232, 150], [770, 152], [250, 386], [760, 380]];
    this.mNodes = [];
    const push = (x: number, y: number, wave: number, r: number) => {
      const g = svg("g", { transform: "translate(" + x + " " + y + ")", opacity: 0 });
      const c = svg("circle", { r, fill: wave === 0 ? "#e0555f" : "#8a7f72" });
      g.appendChild(c);
      nodesG.appendChild(g);
      const edge = rnd();
      const sx = edge < 0.5 ? (x < 500 ? -280 - rnd() * 220 : 1280 + rnd() * 220) : x + (rnd() - 0.5) * 500;
      const sy = edge < 0.5 ? y + (rnd() - 0.5) * 320 : y < 260 ? -260 - rnd() * 180 : 780 + rnd() * 180;
      this.mNodes.push({ g, c, x, y, sx, sy, wave, r });
    };
    push(500, 260, 0, 4.6);
    const comm: number[] = [];
    for (let i = 0; i < 4; i++) {
      const p = centers[i + 1]!;
      push(p[0]!, p[1]!, 1, 3.6);
      comm.push(this.mNodes.length - 1);
    }
    for (let i = 0; i < 4; i++) {
      const p = centers[i + 1]!;
      for (let j = 0; j < 9; j++) {
        const a = (j / 9) * Math.PI * 2 + i * 0.4;
        const rr = 62 + rnd() * 34;
        push(p[0]! + Math.cos(a) * rr * 1.35, p[1]! + Math.sin(a) * rr * 0.72, 2, 2.2);
      }
    }
    this.mLinks = [];
    const link = (a: number, b: number, wave: number) => {
      const A = this.mNodes[a]!, B = this.mNodes[b]!;
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2 - 26;
      const p = svg("path", {
        d: "M" + A.x + " " + A.y + " Q" + mx + " " + my + " " + B.x + " " + B.y,
        pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1, opacity: 0.5,
      });
      linksG.appendChild(p);
      this.mLinks.push({ el: p, wave });
    };
    comm.forEach((c) => link(0, c, 1));
    for (let i = 0; i < 4; i++) {
      const cIdx = comm[i]!;
      for (let j = 0; j < 9; j++) link(cIdx, 5 + i * 9 + j, 2);
    }
    link(comm[0]!, comm[1]!, 3);
    link(comm[1]!, comm[3]!, 3);
    link(comm[3]!, comm[2]!, 3);
    link(comm[2]!, comm[0]!, 3);
  }

  private buildAuraWire() {
    const wrap = this.q("[data-aura-wire]");
    if (!wrap || wrap.childNodes.length) return;
    SEED = 3312;
    const rects = [
      [60, 40, 340, 190], [420, 40, 420, 96], [420, 156, 200, 74], [640, 156, 200, 74],
      [60, 254, 200, 226], [280, 254, 240, 110], [280, 384, 240, 96], [540, 254, 300, 226],
    ];
    this.aWire = rects.map((r) => {
      const el = document.createElement("div");
      el.style.cssText =
        "position:absolute;left:" + r[0] + "px;top:" + r[1] + "px;width:" + r[2] + "px;height:" + r[3] +
        "px;border:1px solid #241f22;background:linear-gradient(160deg,rgba(22,21,28,.9),rgba(9,9,13,.9));will-change:transform,opacity;opacity:0";
      wrap.appendChild(el);
      return { el, dx: (rnd() - 0.5) * 1000, dy: (rnd() - 0.5) * 700, rot: (rnd() - 0.5) * 70, d: rnd() };
    });
  }

  private bindContact() {
    for (const a of this.qa<HTMLAnchorElement>("a[data-contact]")) {
      const ar = a.querySelector<HTMLElement>("[data-carrow]");
      const enter = () => {
        a.style.paddingLeft = "16px";
        a.style.background = "linear-gradient(90deg,rgba(192,24,42,.12),rgba(192,24,42,0) 62%)";
        if (ar) { ar.style.transform = "translateX(6px)"; ar.style.color = "#e0555f"; }
      };
      const leave = () => {
        a.style.paddingLeft = "";
        a.style.background = "";
        if (ar) { ar.style.transform = ""; ar.style.color = ""; }
      };
      // Focus mirrors hover so the same affordance exists for keyboard users.
      a.addEventListener("pointerenter", enter);
      a.addEventListener("pointerleave", leave);
      a.addEventListener("focus", enter);
      a.addEventListener("blur", leave);
      this.cleanups.push(() => {
        a.removeEventListener("pointerenter", enter);
        a.removeEventListener("pointerleave", leave);
        a.removeEventListener("focus", enter);
        a.removeEventListener("blur", leave);
      });
    }

    const stay = this.q("[data-stay]");
    const sa = this.q("[data-stayarrow]");
    if (stay && sa) {
      const enter = () => { sa.style.transform = "translateX(10px)"; };
      const leave = () => { sa.style.transform = ""; };
      stay.addEventListener("pointerenter", enter);
      stay.addEventListener("pointerleave", leave);
      stay.addEventListener("focus", enter);
      stay.addEventListener("blur", leave);
      this.cleanups.push(() => {
        stay.removeEventListener("pointerenter", enter);
        stay.removeEventListener("pointerleave", leave);
        stay.removeEventListener("focus", enter);
        stay.removeEventListener("blur", leave);
      });
    }

  }

  /* ---------- particles ---------- */

  private seedEmbers() {
    SEED = 12009;
    const d = this.opts.emberDensity;
    this.emberDen = d;
    const n = Math.round(30 * d);
    this.embers = [];
    for (let i = 0; i < n; i++) {
      this.embers.push({
        x: rnd() * this.vw, y: rnd() * this.vh, r: 0.5 + rnd() * 1.5,
        vy: 0.1 + rnd() * 0.34, ph: rnd() * 6.3, sp: 0.6 + rnd() * 1.5, warm: rnd() < 0.35,
      });
    }
  }

  private seedStars() {
    SEED = 8801;
    this.starPts = [];
    for (let i = 0; i < 130; i++) {
      this.starPts.push({ x: rnd(), y: rnd() * 0.62, r: 0.3 + rnd() * 1.1, ph: rnd() * 6.3 });
    }
  }

  private drawEmbers(t: number) {
    const c = this.ctx;
    if (!c) return;
    c.clearRect(0, 0, this.vw, this.vh);
    const h = this.heat;
    if (h < 0.02) return;
    for (let i = 0; i < this.embers.length; i++) {
      const p = this.embers[i]!;
      if (!this.lowMotion) {
        p.y -= p.vy * (0.4 + h) * this.frameStep;
        p.x += Math.sin(t * 0.0005 * p.sp + p.ph) * 0.16 * this.frameStep;
        if (p.y < -10) { p.y = this.vh + 10; p.x = rnd() * this.vw; }
      }
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.001 * p.sp + p.ph));
      const a = tw * h * 0.5;
      c.beginPath();
      c.fillStyle = p.warm ? "rgba(238,132,86," + (a * 0.85).toFixed(3) + ")" : "rgba(196,32,48," + a.toFixed(3) + ")";
      c.arc(p.x, p.y, p.r, 0, 6.283);
      c.fill();
    }
  }

  private drawStars(t: number, alpha: number, drift: number) {
    const c = this.sctx;
    if (!c) return;
    c.clearRect(0, 0, this.vw, this.vh);
    if (alpha < 0.02) return;
    for (let i = 0; i < this.starPts.length; i++) {
      const s = this.starPts[i]!;
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(t * 0.0008 + s.ph));
      c.beginPath();
      c.fillStyle = "rgba(226,219,208," + (tw * alpha * 0.6).toFixed(3) + ")";
      c.arc(s.x * this.vw, s.y * this.vh + drift, s.r, 0, 6.283);
      c.fill();
    }
  }

  /* ---------- scenes ---------- */

  private updEntry(p: number, now: number) {
    const e = this.ease(p);
    const cam = this.q("[data-entry-cam]");
    const mono = this.q("[data-entry-mono]");
    const halo = this.q("[data-entry-halo]");
    const sub = this.q("[data-entry-sub]");
    const converge = st(0.02, 0.44, e);
    for (const s of this.shards) {
      const k = outQuint(cl((converge - s.d * 0.32) / 0.68, 0, 1));
      const drift = this.lowMotion ? 0 : Math.sin(now * 0.0004 * s.depth + s.d * 6) * 6 * k;
      const x = lp(s.sx, s.tx, k) + drift;
      const y = lp(s.sy, s.ty, k) - drift * 0.6;
      const r = lp(s.rot, 0, k);
      s.el.style.transform =
        "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" + r.toFixed(2) +
        "deg) scale(" + lp(0.72, 1, k).toFixed(3) + ")";
      s.el.style.opacity = (k * lp(0.25, 0.9, s.depth / 1.5)).toFixed(3);
    }
    if (mono) {
      const born = st(0, 0.3, e);
      mono.style.opacity = "1";
      mono.style.transform = "scale(" + lp(0.9, 1, born).toFixed(3) + ")";
      mono.style.boxShadow =
        "0 0 0 1px rgba(192,24,42," + lp(0.5, 0.9, born).toFixed(2) + "),0 0 " +
        lp(30, 90, born).toFixed(0) + "px rgba(192,24,42," + lp(0.08, 0.2, born).toFixed(2) + ")";
      for (let i = 0; i < 3; i++) {
        const cr = mono.querySelector<HTMLElement>('[data-entry-crack="' + i + '"]');
        if (!cr) continue;
        const puls = this.lowMotion ? 1 : 0.5 + 0.5 * Math.abs(Math.sin(now * 0.0016 + i * 1.7));
        cr.style.opacity = (lp(0.35, 1, st(i * 0.06, 0.26 + i * 0.06, e)) * puls).toFixed(3);
      }
    }
    if (halo) halo.style.opacity = (0.55 + st(0.1, 0.7, e) * 0.45).toFixed(3);
    const lc = this.entryLetters.length;
    this.entryLetters.forEach((s, i) => {
      const t = i / Math.max(1, lc - 1);
      const a = st(0.3 + t * 0.24, 0.42 + t * 0.24, e);
      const dir = i % 2 ? 1 : -1;
      s.style.opacity = a.toFixed(3);
      s.style.transform = "translate(" + lp(dir * 46, 0, a).toFixed(1) + "px," + lp(dir * -10, 0, a).toFixed(1) + "px)";
      s.style.textShadow = a > 0.02 && a < 0.99 ? "0 0 18px rgba(224,85,95," + (1 - a).toFixed(2) + ")" : "none";
      s.style.filter = this.blur((1 - a) * 5);
    });
    if (sub) {
      const early = 1 - st(0.04, 0.16, e);
      const late = st(0.58, 0.68, e) * (1 - st(0.74, 0.84, e));
      sub.style.opacity = Math.max(early * 0.8, late).toFixed(3);
    }
    const rush = st(0.78, 1, e);
    if (cam) {
      cam.style.transform = "scale(" + lp(1, 4.6, rush * rush).toFixed(3) + ")";
      cam.style.opacity = (1 - st(0.9, 1, e)).toFixed(3);
      cam.style.filter = this.blur(rush * 7);
    }
    const title = this.q("[data-entry-title]");
    if (title) {
      title.style.opacity = (1 - st(0.8, 0.94, e)).toFixed(3);
      title.style.transform = "translateX(-50%) scale(" + lp(1, 1.6, rush).toFixed(3) + ")";
      title.style.filter = this.blur(rush * 6);
    }
    this.flash = Math.max(this.flash, Math.max(0, Math.sin(cl((e - 0.82) / 0.18, 0, 1) * Math.PI)) * 0.9);
    this.heat = lp(0.22, 0.6, e);
  }

  private updWho(p: number, now: number) {
    void now;
    const e = this.ease(p);
    const grid = this.q("[data-who-grid]");
    if (grid) {
      const a = st(0.04, 0.3, e);
      grid.style.opacity = (a * 0.55).toFixed(3);
      grid.style.transform =
        "translate(" + (-e * 40).toFixed(1) + "px," + (e * 26).toFixed(1) + "px) scale(" + lp(1, 1.12, e).toFixed(3) + ")";
    }
    const nc = this.whoName.length;
    this.whoName.forEach((s, i) => {
      const t = i / Math.max(1, nc - 1);
      const a = st(t * 0.2, t * 0.2 + 0.16, st(0, 0.34, e));
      s.style.opacity = a.toFixed(3);
      s.style.transform = "scale(" + lp(0.2, 1, back(a)).toFixed(3) + ")";
      s.style.filter = this.blur((1 - a) * 4);
    });

    const roleWin = [[0.3, 0.44], [0.44, 0.58], [0.58, 0.72]];
    const resolve = st(0.74, 0.9, e);
    const W = this.vw, H = this.vh;
    const startPos = [{ x: -W * 0.2, y: -H * 0.08 }, { x: W * 0.12, y: 0.02 * H }, { x: -W * 0.04, y: H * 0.14 }];
    for (let i = 0; i < 3; i++) {
      const el = this.q('[data-who-role="' + i + '"]');
      if (!el) continue;
      const win = roleWin[i]!;
      const inn = lin(win[0]!, win[1]!, e);
      const smooth = st(win[0]!, win[1]!, e);
      const start = startPos[i]!;
      let sc: number, bl: number;
      const x = start.x;
      let y = start.y;
      const op = smooth;
      if (i === 0) { sc = lp(0.05, 1, back(inn)); bl = 0; }
      else if (i === 1) { sc = lp(1.9, 1, outQuint(inn)); bl = (1 - inn) * 16; }
      else { sc = lp(0.9, 1, smooth); y += lp(H * 0.42, 0, back(inn)); bl = 0; }
      const dim = 1 - st(win[1]!, win[1]! + 0.14, e) * 0.55;
      const t = this.roleTargets ? this.roleTargets[i]! : { x: 0, y: (i - 1) * H * 0.12, s: 0.44 };
      const fx = lp(x, t.x, resolve), fy = lp(y, t.y, resolve);
      const fs = lp(sc * dim, t.s, resolve);
      el.style.opacity = Math.max(op * lp(1, 1, resolve), resolve).toFixed(3);
      el.style.transform =
        "translate(calc(-50% + " + fx.toFixed(1) + "px),calc(-50% + " + fy.toFixed(1) + "px)) scale(" + fs.toFixed(3) + ")";
      el.style.filter = this.blur(lp(bl + (1 - dim) * 2, 0, resolve));
      const grp = this.sparks[i];
      if (grp) {
        const burst = Math.max(0, Math.sin(cl((e - win[0]!) / 0.16, 0, 1) * Math.PI));
        for (const sp of grp) {
          const rad = sp.d * (0.4 + burst * 2.2);
          const cx = 50 + (fx / W) * 100 + Math.cos(sp.a) * rad;
          const cy = 52 + (fy / H) * 100 + Math.sin(sp.a) * rad * 0.6;
          sp.el.setAttribute("cx", cx.toFixed(2));
          sp.el.setAttribute("cy", cy.toFixed(2));
          sp.el.setAttribute("opacity", (burst * (0.3 + sp.ph * 0.7) * (this.lowMotion ? 0 : 1)).toFixed(3));
        }
      }
    }
    const line = this.q("[data-who-line]");
    if (line) {
      const a = st(0.86, 0.98, e);
      line.style.opacity = a.toFixed(3);
      line.style.transform = "translateX(-50%) translateY(" + lp(24, 0, a).toFixed(1) + "px)";
    }
    const name = this.q("[data-who-name]");
    if (name) {
      const shrink = st(0.74, 0.96, e);
      name.style.transform = "translateX(-50%) scale(" + lp(1, 0.82, shrink).toFixed(3) + ")";
      name.style.opacity = lp(1, 0.72, shrink).toFixed(3);
    }
    const at = this.q("[data-who-atmos]");
    if (at) at.style.transform = "scale(" + lp(0.5, 1.4, e).toFixed(3) + ")";
    const hint = this.q("[data-who-hint]");
    if (hint) hint.style.opacity = ((1 - st(0.05, 0.2, e)) * 0.9).toFixed(3);
    this.flash = Math.max(this.flash, Math.max(0, Math.sin(cl((e - 0.72) / 0.1, 0, 1) * Math.PI)) * 0.32);
    this.heat = lp(0.3, 0.5, e);
  }

  private updBuild(p: number, now: number) {
    const e = this.ease(p);
    const bp = this.q("[data-build-blueprint]");
    if (bp) {
      bp.style.opacity = (st(0, 0.2, e) * 0.7 * (1 - st(0.9, 1, e) * 0.5)).toFixed(3);
      bp.style.transform = "translate(" + (-e * 44).toFixed(1) + "px," + (-e * 26).toFixed(1) + "px)";
    }
    this.buildWords.forEach((w, i) => {
      const a = st(0.02 + i * 0.035, 0.1 + i * 0.035, e);
      w.style.display = "inline-block";
      w.style.opacity = a.toFixed(3);
      w.style.transform = "translateY(" + lp(20, 0, a).toFixed(1) + "px)";
    });
    this.frame("build", lp(1.5, 0.86, st(0.05, 0.95, e)), lp(230, -30, e), lp(-10, 10, e));
    const grow = st(0.1, 0.88, e);
    if (this.bIdeaRing) {
      const pulse = this.lowMotion ? 0 : (now * 0.00035) % 1;
      const on = st(0.02, 0.12, e) * (1 - st(0.3, 0.5, e));
      this.bIdeaRing.setAttribute("r", (6 + pulse * 34).toFixed(1));
      this.bIdeaRing.setAttribute("opacity", (on * (1 - pulse) * 0.8).toFixed(3));
      this.bIdeaRing.setAttribute("stroke", "#c0182a");
    }
    this.bNodeEls.forEach((n, i) => {
      const t = i / (this.bNodeEls.length - 1);
      const a = lin(t * 0.84, t * 0.84 + 0.16, grow);
      const el = back(a);
      n.g.setAttribute("opacity", st(0, 0.3, a).toFixed(3));
      n.ring.setAttribute("r", ((i === 0 ? 5 : 9) * lp(0.2, 1, el)).toFixed(2));
      n.ring.setAttribute("stroke", colorBetween([58,46,49], [93,71,75], st(.88,1,a)));
      n.core.setAttribute("r", ((i === 0 ? 2.6 : 3.2) * lp(0.4, 1, el)).toFixed(2));
      n.core.setAttribute("fill", i === 0 ? "#e0555f" : colorBetween([143,133,120], [205,194,178], st(.82,1,a)));
    });
    this.bLinkEls.forEach((l, i) => {
      const t = i / (this.bLinkEls.length - 1);
      const a = st(t * 0.8 + 0.02, t * 0.8 + 0.2, grow);
      l.setAttribute("stroke-dashoffset", (1 - a).toFixed(3));
      l.setAttribute("opacity", (0.22 + a * 0.45).toFixed(3));
    });
    ["0", "1", "2", "3"].forEach((k, i) => {
      const cap = this.q('[data-build-cap="' + k + '"]');
      const stg = this.q('[data-build-stage="' + k + '"]');
      const a = st(0.3 + i * 0.15, 0.42 + i * 0.15, e) * (1 - st(0.97, 1, e) * 0.35);
      if (cap) {
        cap.style.opacity = a.toFixed(3);
        cap.style.transform = "translateY(" + lp(16, 0, a).toFixed(1) + "px) scale(" + lp(0.92, 1, a).toFixed(3) + ")";
      }
      if (stg) stg.style.opacity = (a * 0.9).toFixed(3);
    });
    const pulseOn = st(0.62, 0.72, e) * (1 - st(0.96, 1, e));
    this.bPulses.forEach((c, i) => {
      const path = this.bLinkEls[this.bPulseIdx[i]!];
      if (!path || !path.getTotalLength) { c.setAttribute("opacity", "0"); return; }
      const len = path.getTotalLength();
      if (!len || pulseOn < 0.02) { c.setAttribute("opacity", "0"); return; }
      const seg = (now / (1500 + i * 420)) % 1;
      const pt = path.getPointAtLength(seg * len);
      c.setAttribute("cx", String(pt.x));
      c.setAttribute("cy", String(pt.y));
      c.setAttribute("opacity", (pulseOn * (0.4 + 0.6 * Math.sin(seg * Math.PI))).toFixed(3));
    });
    const head = this.q("[data-build-head]");
    if (head) head.style.opacity = (1 - st(0.5, 0.68, e) * 0.78).toFixed(3);
    const cap = this.q("[data-build-caption]");
    if (cap) this.seq(cap, st(0.82, 0.95, e));
    this.heat = lp(0.5, 0.62, e);
  }

  private updWorkcard(p: number) {
    const e = this.ease(p);
    const c = this.q("[data-workcard]");
    if (!c) return;
    const inn = lin(0, 0.4, e), out = st(0.66, 1, e);
    c.style.opacity = (st(0, 0.4, e) * (1 - out)).toFixed(3);
    c.style.transform = "scale(" + (lp(0.2, 1, back(inn)) * lp(1, 1.3, out)).toFixed(3) + ")";
    c.style.filter = this.blur(out * 8);
    this.heat = 0.6;
  }

  private updPlan(p: number) {
    const e = this.ease(p);
    this.frame("plan", lp(1.18, 0.92, e), lp(-40, 30, e), lp(30, -14, e));
    this.planTitle.forEach((s, i) => {
      const a = st(0.01 + i * 0.012, 0.08 + i * 0.012, e);
      s.style.opacity = a.toFixed(3);
      s.style.transform =
        "translateY(" + lp(-120, 0, back(a)).toFixed(1) + "px) rotate(" + lp(i % 2 ? 16 : -16, 0, a).toFixed(2) + "deg)";
    });
    const order = st(0.2, 0.74, e);
    for (const b of this.pBlocks) {
      const s = cl((order - b.d * 0.34) / 0.66, 0, 1);
      const k = outQuint(s);
      const x = lp(b.sx, b.tx, k), y = lp(b.sy, b.ty, k), r = lp(b.sr, 0, k);
      const settle = st(.94, 1, s);
      b.el.style.transform =
        "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" + r.toFixed(2) +
        "deg) scale(" + lp(0.86, 1, k).toFixed(3) + ")";
      b.el.style.opacity = lp(0.3, 1, Math.max(st(0.04, 0.14, e), k)).toFixed(3);
      b.el.style.boxShadow = `0 0 0 1px rgba(192,24,42,${(.35*settle).toFixed(3)}),0 0 22px rgba(192,24,42,${(.12*settle).toFixed(3)})`;
    }
    const grid = this.q("[data-plan-grid]");
    if (grid) grid.style.opacity = (st(0.3, 0.56, e) * 0.9).toFixed(3);
    this.pThreads.forEach((t, i) => {
      const a = st(0.66 + i * 0.05, 0.78 + i * 0.05, e);
      t.setAttribute("stroke-dashoffset", (1 - a).toFixed(3));
      t.setAttribute("opacity", (a * 0.8).toFixed(3));
    });
    for (const i of [0, 1, 2, 3, 4]) {
      const n = this.q('[data-plan-note="' + i + '"]');
      if (!n) continue;
      const a = st(0.42 + i * 0.08, 0.52 + i * 0.08, e) * (1 - st(0.96, 1, e) * 0.4);
      n.style.opacity = a.toFixed(3);
      n.style.transform = "translateY(" + lp(10, 0, a).toFixed(1) + "px)";
    }
    const spot = this.q("[data-plan-spot]");
    if (spot) spot.style.opacity = (Math.max(0, Math.sin(cl((e - 0.76) / 0.2, 0, 1) * Math.PI)) * 0.9).toFixed(3);
    const lines = [
      st(0.05, 0.14, e) * (1 - st(0.3, 0.4, e)),
      st(0.42, 0.5, e) * (1 - st(0.66, 0.74, e)),
      st(0.78, 0.86, e),
    ];
    lines.forEach((a, i) => this.seq(this.q('[data-plan-line="' + i + '"]'), a));
    const ev = this.q("[data-plan-evidence]");
    if (ev) this.seq(ev, st(0.82, 0.94, e));
    this.heat = 0.62;
  }

  private updPapers(p: number) {
    const e = this.ease(p);
    this.frame("papers", lp(1.14, 0.94, e), lp(-30, 24, e), lp(16, -8, e));
    const board = this.q("[data-pap-board]");
    if (board) {
      board.style.opacity = (st(0, 0.18, e) * 0.8).toFixed(3);
      board.style.transform = "translate(" + (e * 30).toFixed(1) + "px," + (-e * 18).toFixed(1) + "px)";
    }
    const typed = st(0.01, 0.16, e) * this.papTitle.length;
    this.papTitle.forEach((s, i) => { s.style.opacity = st(i-.2, i+.8, typed).toFixed(3); });
    const caret = this.q("[data-pap-caret]");
    if (caret && this.papOffsets.length) {
      const pos = cl(typed, 0, this.papOffsets.length);
      const index = Math.floor(pos);
      const x = lp(index > 0 ? this.papOffsets[index-1]! : 0, this.papOffsets[Math.min(index,this.papOffsets.length-1)]!, st(0,1,pos-index));
      caret.style.transform = `translateX(${(x+5).toFixed(1)}px)`;
      caret.style.visibility = e > .005 && e < .24 ? "visible" : "hidden";
      caret.style.setProperty("--caret-opacity", String(st(.005,.02,e)*(1-st(.2,.24,e))));
    }
    const appear = lin(0.14, 0.62, e);
    this.papPts.forEach((pt, i) => {
      const t = i / (this.papPts.length - 1);
      const a = lin(t * 0.88, t * 0.88 + 0.12, appear);
      const k = back(a);
      pt.el.setAttribute("opacity", (st(0, 0.25, a) * 0.95).toFixed(3));
      pt.el.setAttribute("r", lp(0.6, 3.4, k).toFixed(2));
      pt.el.setAttribute("cy", (pt.y - lp(pt.drop, 0, outQuint(a))).toFixed(1));
      pt.el.setAttribute("fill", colorBetween([156,145,132], [222,210,193], st(.86,1,a)));
    });
    const log = this.q<SVGPathElement>("[data-pap-log]");
    if (log) {
      log.setAttribute("stroke-dashoffset", (1 - lin(0.16, 0.64, e)).toFixed(3));
      log.setAttribute("opacity", (0.5 * st(0.16, 0.3, e)).toFixed(3));
    }
    const trend = this.q<SVGPathElement>("[data-pap-trend]");
    if (trend) {
      const a = st(0.56, 0.8, e);
      trend.setAttribute("stroke-dashoffset", (1 - a).toFixed(3));
      const glow = Math.max(0, Math.sin(cl((e - 0.78) / 0.16, 0, 1) * Math.PI));
      trend.style.filter =
        "drop-shadow(0 0 " + (4 + glow * 16).toFixed(1) + "px rgba(192,24,42," + (0.4 + glow * 0.5).toFixed(2) + "))";
    }
    const pred = this.q<SVGPathElement>("[data-pap-pred]");
    const band = this.q<SVGPathElement>("[data-pap-band]");
    const pr = st(0.8, 0.95, e);
    if (pred) pred.setAttribute("opacity", pr.toFixed(3));
    if (band) band.setAttribute("opacity", (pr * 0.9).toFixed(3));
    for (const i of [0, 1, 2]) {
      const n = this.q('[data-pap-note="' + i + '"]');
      if (!n) continue;
      const a = st(0.18 + i * 0.26, 0.3 + i * 0.26, e);
      n.style.opacity = a.toFixed(3);
      n.style.transform = "translateY(" + lp(10, 0, a).toFixed(1) + "px)";
    }
    const ax = this.q("[data-pap-axislab]");
    if (ax) ax.style.opacity = (st(0.18, 0.34, e) * 0.9).toFixed(3);
    const lines = [
      st(0.05, 0.14, e) * (1 - st(0.32, 0.42, e)),
      st(0.44, 0.52, e) * (1 - st(0.68, 0.76, e)),
      st(0.8, 0.88, e),
    ];
    lines.forEach((a, i) => this.seq(this.q('[data-pap-line="' + i + '"]'), a));
    const ev = this.q("[data-pap-evidence]");
    if (ev) this.seq(ev, st(0.86, 0.96, e));
    this.heat = 0.6;
  }

  private updMun(p: number, now: number) {
    const e = this.ease(p);
    this.frame("mun", lp(1.42, 0.9, e), 0, lp(40, -14, e));
    this.munTitle.forEach((s, i) => {
      const a = st(0.01 + i * 0.018, 0.09 + i * 0.018, e);
      s.style.opacity = a.toFixed(3);
      s.style.transform = "perspective(600px) rotateY(" + lp(92, 0, a).toFixed(1) + "deg)";
    });
    const waveOn = [lin(0.04, 0.14, e), lin(0.22, 0.4, e), lin(0.4, 0.7, e), lin(0.7, 0.9, e)];
    const f = this.q("[data-frame=\"mun\"]");
    const fr = f ? f.getBoundingClientRect() : null;
    this.mNodes.forEach((n, i) => {
      const w = n.wave;
      const seq = w === 2 ? cl((waveOn[2]! - ((i - 5) % 9) / 13) * 1.5, 0, 1) : waveOn[w]!;
      const k = outQuint(seq);
      let sc = lp(0.4, 1, back(seq));
      const x = lp(n.sx, n.x, k), y = lp(n.sy, n.y, k);
      if (!this.coarse && !this.lowMotion && fr && seq > 0.6) {
        const sx = fr.left + (x / 1000) * fr.width, sy = fr.top + (y / 520) * fr.height;
        const d = Math.hypot(this.ptr.x - sx, this.ptr.y - sy);
        if (d < 150) {
          const kk = 1 - d / 150;
          sc *= 1 + kk * 0.8;
          n.c.setAttribute("fill", colorBetween(w === 0 ? [224,85,95] : [138,127,114], [240,120,110], st(0,1,kk)));
        } else {
          n.c.setAttribute("fill", w === 0 ? "#e0555f" : "#8a7f72");
        }
      }
      n.g.setAttribute("opacity", st(0, 0.2, seq).toFixed(3));
      n.g.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") scale(" + sc.toFixed(3) + ")");
    });
    this.mLinks.forEach((l, i) => {
      const w = l.wave;
      const seq = w === 2 ? cl((waveOn[2]! - (i % 9) / 15) * 1.4, 0, 1) : waveOn[w]!;
      l.el.setAttribute("stroke-dashoffset", (1 - st(0, 1, seq)).toFixed(3));
      l.el.setAttribute("opacity", (0.16 + seq * 0.44).toFixed(3));
    });
    const pod = this.q<SVGGElement>("[data-mun-podium]");
    if (pod) {
      const a = st(0.76, 0.9, e);
      const puls = this.lowMotion ? 1 : 0.85 + 0.15 * Math.sin(now * 0.003);
      pod.setAttribute("opacity", (a * puls).toFixed(3));
      pod.setAttribute("transform", "translate(500 260) scale(" + lp(0.2, 1, back(a)).toFixed(3) + ") translate(-500 -260)");
    }
    const spot = this.q("[data-mun-spot]");
    if (spot) spot.style.opacity = (st(0.74, 0.92, e) * 0.9).toFixed(3);
    for (const i of [0, 1, 2, 3]) {
      const c = this.q('[data-mun-cap="' + i + '"]');
      if (!c) continue;
      const a = st(0.06 + i * 0.19, 0.16 + i * 0.19, e);
      c.style.opacity = a.toFixed(3);
      c.style.transform = "translateY(" + lp(10, 0, a).toFixed(1) + "px)";
    }
    const lines = [
      st(0.05, 0.14, e) * (1 - st(0.32, 0.42, e)),
      st(0.44, 0.52, e) * (1 - st(0.68, 0.76, e)),
      st(0.8, 0.88, e),
    ];
    lines.forEach((a, i) => this.seq(this.q('[data-mun-line="' + i + '"]'), a));
    const ev = this.q("[data-mun-evidence]");
    if (ev) this.seq(ev, st(0.88, 0.97, e));
    this.heat = 0.55;
  }

  private updAura(p: number) {
    const e = this.ease(p);
    const assemble = lin(0.08, 0.26, e);
    const shatter = lin(0.32, 0.48, e);
    const rebuild = st(0.64, 0.94, e);
    this.frame("aura", lp(1.06, 0.84, e), 0, lp(6, -18, e));
    this.auraTitle.forEach((s, i) => {
      const a = st(0.005 + i * 0.014, 0.06 + i * 0.014, e);
      const glow = Math.max(0, Math.sin(cl((a - 0.2) / 0.8, 0, 1) * Math.PI));
      s.style.opacity = a.toFixed(3);
      s.style.textShadow =
        glow > 0.05 && !this.lowMotion
          ? "0 0 " + (glow * 26).toFixed(1) + "px rgba(224,85,95," + glow.toFixed(2) + ")"
          : "none";
    });
    for (const w of this.aWire) {
      const inn = outQuint(cl((assemble - w.d * 0.3) / 0.7, 0, 1));
      const out = cl((shatter - w.d * 0.3) / 0.7, 0, 1);
      const oe = out * out;
      const x = lp(w.dx, 0, inn) + w.dx * oe * 1.8;
      const y = lp(w.dy, 0, inn) + w.dy * oe * 1.8;
      const r = lp(w.rot, 0, inn) + w.rot * oe * 2.4;
      w.el.style.transform =
        "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" + r.toFixed(2) +
        "deg) scale(" + lp(1, 0.7, oe).toFixed(3) + ")";
      w.el.style.opacity = (inn * (1 - out)).toFixed(3);
      w.el.style.filter = this.blur(oe * 5);
    }
    const spine = this.q("[data-aura-spine]");
    const sl = this.q<SVGPathElement>("[data-aura-spineline]");
    if (spine) spine.style.opacity = st(0.6, 0.72, e).toFixed(3);
    if (sl) {
      sl.setAttribute("stroke-dashoffset", (1 - rebuild).toFixed(3));
      sl.style.filter = this.lowMotion
        ? "none"
        : "drop-shadow(0 0 8px rgba(192,24,42," + (0.3 + rebuild * 0.5).toFixed(2) + "))";
    }
    for (let i = 0; i < 5; i++) {
      const s = this.q('[data-aura-step="' + i + '"]');
      if (!s) continue;
      const a = lin(0.66 + i * 0.055, 0.74 + i * 0.055, e);
      s.style.opacity = st(0, 0.3, a).toFixed(3);
      s.style.transform = "translateX(-50%) scale(" + lp(0.6, 1, back(a)).toFixed(3) + ")";
    }
    const seq = [
      st(0.02, 0.1, e) * (1 - st(0.16, 0.24, e)),
      st(0.18, 0.24, e) * (1 - st(0.3, 0.36, e)),
      st(0.34, 0.4, e) * (1 - st(0.46, 0.52, e)),
      st(0.5, 0.54, e) * (1 - st(0.58, 0.62, e)),
      st(0.58, 0.64, e) * (1 - st(0.7, 0.76, e)),
    ];
    seq.forEach((a, i) => {
      const el = this.q('[data-aura-line="' + i + '"]');
      if (el) {
        el.style.opacity = a.toFixed(3);
        el.style.transform =
          "translate(-50%,calc(-50% + " + lp(16, 0, a).toFixed(1) + "px)) scale(" + lp(0.96, 1, a).toFixed(3) + ")";
      }
    });
    const tail = this.q("[data-aura-tail]");
    if (tail) tail.style.opacity = st(0.9, 1, e).toFixed(3);
    this.flash = Math.max(this.flash, Math.max(0, Math.sin(cl((e - 0.3) / 0.12, 0, 1) * Math.PI)) * 0.24);
    this.heat = lp(0.55, 0.28, st(0.44, 0.6, e)) + rebuild * 0.32;
  }

  private updBeyond(p: number) {
    const e = this.ease(p);
    const warm = this.q("[data-beyond-warm]");
    if (warm) warm.style.opacity = (st(0.05, 0.4, e) * 0.9).toFixed(3);
    const big = this.q("[data-beyond-big]");
    if (big) {
      big.style.transform =
        "translate(calc(-50% + " + lp(150, -150, e).toFixed(1) + "px),-50%) scale(" + lp(1.12, 0.92, e).toFixed(3) + ")";
      this.beyondTitle.forEach((s, i) => {
        const a = st(0.01 + i * 0.016, 0.1 + i * 0.016, e);
        s.style.opacity = a.toFixed(3);
        s.style.transform = "translateY(" + lp(-90, 0, back(a)).toFixed(1) + "px)";
      });
    }
    const lead = this.q("[data-beyond-lead]");
    if (lead) this.seq(lead, st(0.04, 0.16, e) * (1 - st(0.74, 0.94, e) * 0.7));
    const layers: [string, number, number, number][] = [
      ["3", 0.12, -0.55, 0.9], ["2", 0.26, -0.95, 0.96], ["1", 0.4, -1.55, 1.04], ["1b", 0.54, -1.2, 1.0],
    ];
    for (const [k, on, rate, sc] of layers) {
      const el = this.q('[data-bg-layer="' + k + '"]');
      if (!el) continue;
      const a = st(on, on + 0.16, e);
      const travel = this.vw <= 760 ? .18 : 1;
      const y = (e - 0.5) * this.vh * 0.42 * rate * travel;
      const x = (e - 0.5) * this.vw * 0.05 * (rate < -1 ? 1 : -1) * travel;
      el.style.opacity = a.toFixed(3);
      el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + lp(sc * 0.9, sc, a).toFixed(3) + ")";
      el.style.filter = this.blur((1 - a) * 6);
    }
    const strip = this.q("[data-beyond-strip]");
    if (strip) this.seq(strip, st(0.76, 0.92, e));
    this.heat = lp(0.45, 0.28, e);
  }

  private updFuture(p: number) {
    const e = this.ease(p);
    const near = this.q("[data-fut-near]");
    if (near) {
      const out = st(0.24, 0.7, e);
      near.style.transform =
        "translate(-50%,-50%) scale(" + lp(1.2, 0.5, out).toFixed(3) + ") translateY(" + lp(0, -90, out).toFixed(1) + "px)";
      near.style.opacity = (1 - out * 0.78).toFixed(3);
      near.style.filter = this.blur(Math.max(0, out - 0.45) * 6);
    }
    const hz = this.q("[data-fut-horizon]");
    if (hz) hz.style.width = (st(0.16, 0.84, e) * Math.min(1240, this.vw * 0.92)).toFixed(0) + "px";
    const glow = this.q("[data-fut-glow]");
    if (glow) {
      const g = st(0.3, 0.92, e);
      glow.style.opacity = (g * 0.95).toFixed(3);
      glow.style.transform = "scale(" + lp(0.6, 1.15, g).toFixed(3) + ")";
    }
    this.starAlpha = st(0.2, 0.7, e);
    this.starDrift = -e * 40;
    const planes = [
      { on: 0.36, x: -0.3, s: 1.0, y: -0.02 },
      { on: 0.46, x: 0.26, s: 0.86, y: -0.055 },
      { on: 0.56, x: -0.14, s: 0.7, y: -0.085 },
      { on: 0.66, x: 0.1, s: 0.56, y: -0.115 },
    ];
    planes.forEach((pl, i) => {
      const el = this.q('[data-fut-plane="' + i + '"]');
      if (!el) return;
      const a = st(pl.on, pl.on + 0.16, e);
      const recede = st(pl.on + 0.12, 1, e);
      const x = pl.x * this.vw * lp(1.5, 1, a);
      const y = pl.y * this.vh - recede * this.vh * 0.05;
      const sc = lp(0.35, pl.s, a) * lp(1, 0.78, recede);
      el.style.opacity = (a * lp(1, 0.82, recede)).toFixed(3);
      el.style.transform = "translate(calc(-50% + " + x.toFixed(1) + "px)," + y.toFixed(1) + "px) scale(" + sc.toFixed(3) + ")";
      el.style.filter = this.blur(lp(6, 0, a) + recede * 0.8);
    });
    const fin = this.q("[data-fut-final]");
    if (fin) {
      const a = st(0.8, 0.96, e);
      fin.style.opacity = a.toFixed(3);
      fin.style.transform = "translate(-50%," + lp(24, 0, a).toFixed(1) + "px)";
    }
    this.heat = lp(0.3, 0.12, e);
  }

  private updContact(p: number) {
    const e = this.ease(p);
    const mark = this.q("[data-contact-mark]");
    if (mark) mark.style.opacity = st(0, 0.12, e).toFixed(3);
    this.contactTitle.forEach((s, i) => {
      const a = st(0.06 + i * 0.03, 0.2 + i * 0.03, e);
      s.style.opacity = a.toFixed(3);
      s.style.transform = "translateY(" + lp(28, 0, a).toFixed(1) + "px)";
    });
    this.qa("[data-contact]").forEach((a, i) => {
      const k = lin(0.4 + i * 0.07, 0.56 + i * 0.07, e);
      a.style.opacity = st(0, 0.4, k).toFixed(3);
      a.style.transform = "translateY(" + lp(22, 0, back(k)).toFixed(1) + "px)";
    });
    this.heat = 0.16;
  }

  /* ---------- loop ---------- */

  private tick(now: number) {
    if (this.dead || document.hidden) return;
    this.frameStep = this.lastTime ? Math.min(2, (now-this.lastTime)/(1000/60)) : 1;
    this.lastTime = now;
    this.raf = 0;
    if (!this.lowMotion) this.raf = requestAnimationFrame((t) => this.tick(t));
    if (!this.vw) return;
    if (this.opts.emberDensity !== this.emberDen) this.seedEmbers();

    const doc = document.documentElement;
    this.scroll = window.scrollY;
    const total = doc.scrollHeight - this.vh;
    const gp = cl(window.scrollY / (total || 1), 0, 1);
    const bar = this.q("[data-progress]");
    if (bar) bar.style.width = (gp * 100).toFixed(2) + "%";

    this.flash = 0;
    this.starAlpha = 0;
    const names = ["entry", "who", "build", "workcard", "plan", "papers", "mun", "aura", "beyond", "future", "contact"];
    let active: string | null = null;
    for (const n of names) {
      const p = this.lowMotion ? 1 : this.prog(n);
      if (p < 0) continue;
      const bound = this.bounds[n]!;
      if (bound.top <= this.scroll + this.vh * .45 && bound.top + bound.height > this.scroll + this.vh * .45) active = n;
      if (this.lowMotion && this.staticPainted) continue;
      const clock = this.lowMotion ? 1 : p;
      if (n === "entry") this.updEntry(clock, now);
      else if (n === "who") this.updWho(p, now);
      else if (n === "build") this.updBuild(p, now);
      else if (n === "workcard") this.updWorkcard(p);
      else if (n === "plan") this.updPlan(p);
      else if (n === "papers") this.updPapers(p);
      else if (n === "mun") this.updMun(p, now);
      else if (n === "aura") this.updAura(p);
      else if (n === "beyond") this.updBeyond(p);
      else if (n === "future") this.updFuture(p);
      else if (n === "contact") this.updContact(p);
    }
    if (!active) this.heat = 0.12;

    const fl = this.q("[data-flash]");
    if (fl) fl.style.opacity = (this.lowMotion ? 0 : this.flash).toFixed(3);
    const stars = this.q("[data-stars]");
    if (stars) stars.style.opacity = this.starAlpha.toFixed(3);
    if (!this.lowMotion) this.drawStars(now, this.starAlpha, this.starDrift);

    const rail = this.q("[data-rail]");
    if (rail) rail.style.display = this.opts.showChapterRail === false ? "none" : "";

    const chapters: Record<string, string> = {
      entry: "who", who: "who", build: "build", workcard: "work", plan: "work",
      papers: "work", mun: "work", aura: "work", beyond: "beyond", future: "future", contact: "contact",
    };
    const chapter = (active ? chapters[active] : undefined) ?? "who";
    if (chapter !== this.chapter) {
      this.chapter = chapter;
      // `aria-current` is the whole state. The design wrote the colours and
      // tick widths inline here; the rail now draws itself from this attribute
      // in CSS, so the active chapter is announced and styled by one signal
      // rather than two that can disagree.
      for (const a of this.qa("[data-chip]")) {
        if (a.dataset["chip"] === chapter) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      }
    }
    if (!this.lowMotion) this.drawEmbers(now);
    this.staticPainted = true;
  }
}

/**
 * Mounts the engine against a `[data-qd-root]` subtree. Returns the teardown.
 */
export function startQuickDiscovery(root: HTMLElement, opts: Partial<EngineOptions> = {}): () => void {
  const engine = new QuickDiscoveryEngine(root, { ...ENGINE_DEFAULTS, ...opts });
  return () => engine.destroy();
}
