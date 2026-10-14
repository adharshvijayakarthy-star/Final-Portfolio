import { smooth, textState, routeTiming, type TextTiming, type TextState } from "./narrative-score";
import type { ReadingZone } from "./reading-zone";
type PhraseMotion = { exposure:number;settle:number;readable:boolean };
type Beat = { section: HTMLElement; title: HTMLElement; phrases: HTMLElement[]; phraseMotion:PhraseMotion[]; support: HTMLElement[]; supportExposure:number[]; from: number; to: number; top: number; bottom: number; supportTop: number; revealWindow: number; lastLocal: number; lastRead: number; lastSupportRead: number; lastExit: number; lastPhase: string; state: TextState; timing: TextTiming; trackingBase:number; stickyTop: number; copyTop: number; copyEnd: number; copyLeft: number; copyRight: number; copyHeight: number; titleOffset: number; titleHeight: number; supportOffset: number; sticky: boolean };
const open = "none";

/** Camera-score typography with cached layout, approach reveals and immediate
 * readable destination states. No timers, WAAPI queues or private RAF. */
export class CinematicTextController {
  private beats: Beat[];
  private observer: ResizeObserver;
  private layoutDirty = true;
  private layoutReads = 0;
  private readonly diagnostics = process.env.NODE_ENV !== "production" || (typeof location !== "undefined" && new URLSearchParams(location.search).has("qa"));
  private reduced = matchMedia("(prefers-reduced-motion: reduce)");
  readonly readingZones: ReadingZone[];
  constructor(private root: HTMLElement) {
    this.beats = [...root.querySelectorAll<HTMLElement>("section[data-stay-beat]")].flatMap(section => {
      const title = section.querySelector<HTMLElement>("[data-reveal]");
      if (!title) return [];
      const support = [...section.querySelectorAll<HTMLElement>(":scope > div > :not(h1):not(h2)")].filter(node => !node.hasAttribute("data-eyebrow"));
      support.forEach(node => { node.dataset.titleSupport = ""; });
      const phrases=[...title.querySelectorAll<HTMLElement>("[data-title-phrase]")];
      return [{ section, title, phrases,phraseMotion:phrases.map(()=>({exposure:NaN,settle:NaN,readable:false})), support,supportExposure:support.map(()=>NaN),
        from: Number(section.dataset.from), to: Number(section.dataset.to), top: 0, bottom: 0, supportTop: 0, revealWindow: 1, lastLocal: NaN, lastRead: NaN, lastSupportRead: NaN, lastExit: NaN, lastPhase: "", state: textState(0),
        timing: routeTiming[root.dataset.stayRoute ?? "garden"]!,trackingBase:-.022, stickyTop: 0, copyTop: 0, copyEnd: 0, copyLeft: 0, copyRight: 0, copyHeight: 0, titleOffset: 0, titleHeight: 0, supportOffset: 0, sticky: false }];
    });
    this.readingZones = this.beats.map(() => ({left:0,right:0,top:0,bottom:0,active:false}));
    this.observer = new ResizeObserver(() => { this.layoutDirty = true; });
    this.observer.observe(root);
    this.beats.forEach(beat => { this.observer.observe(beat.title); this.observer.observe(beat.section); });
    void document.fonts.ready.then(() => { this.layoutDirty = true; });
    this.present(0, 0);
  }
  present = (progress: number, target: number) => {
    if (this.layoutDirty) {
      const height = window.innerHeight;
      this.beats.forEach(beat => { delete beat.section.dataset.stayFlow; });
      const sections = this.beats.map(beat => {
        const box = beat.section.getBoundingClientRect();
        return { top: box.top + window.scrollY, bottom: box.bottom + window.scrollY };
      });
      const boundaries = sections.slice(1).map((next, i) => (sections[i]!.bottom + next.top) / 2 - height * .5);
      for (const [index, beat] of this.beats.entries()) {
        const box = beat.title.getBoundingClientRect();
        beat.top = box.top + window.scrollY; beat.bottom = box.bottom + window.scrollY;
        beat.supportTop = (beat.support[0]?.getBoundingClientRect().top ?? box.bottom) + window.scrollY;
        const copy = beat.title.parentElement!, copyBox = copy.getBoundingClientRect();
        beat.copyLeft = copyBox.left; beat.copyRight = copyBox.right; beat.copyHeight = copyBox.height;
        const style = getComputedStyle(beat.section), copyStyle = getComputedStyle(copy);
        if(beat.title.dataset.reveal==="tracking-settle"){
          const titleStyle=getComputedStyle(beat.title);
          beat.trackingBase=(parseFloat(titleStyle.letterSpacing)||0)/Math.max(1,parseFloat(titleStyle.fontSize)||1);
        }
        const paddingBottom = parseFloat(style.paddingBottom);
        beat.stickyTop = parseFloat(copyStyle.top) || 120;
        beat.sticky = window.innerWidth >= 768 && copyBox.height <= height - beat.stickyTop - 60 && !this.reduced.matches && this.root.dataset.stayQuiet !== "true";
        beat.section.dataset.stayFlow = beat.sticky ? "held" : "native";
        beat.titleOffset = box.top - copyBox.top; beat.titleHeight = box.height;
        beat.supportOffset = (beat.support[0]?.getBoundingClientRect().top ?? box.bottom) - copyBox.top;
        beat.copyTop = copyBox.top + window.scrollY;
        beat.copyEnd = sections[index]!.bottom - paddingBottom - copyBox.height;
        if (beat.sticky) {
          beat.top = beat.copyTop + beat.titleOffset; beat.bottom = beat.top + box.height;
          beat.supportTop = beat.copyTop + beat.supportOffset;
        }
        const start = index ? boundaries[index - 1]! : Math.max(0, sections[index]!.top);
        const end = index < boundaries.length ? boundaries[index]! : Math.max(start + 1, sections[index]!.bottom - height);
        // The same measured camera beat supplies progress. Compress only its
        // opening score when native flow would carry the title into the nav
        // before its supporting copy resolves. No viewport-triggered animation.
        const safeTop = Math.min(120, height * .2);
        const deadline = (beat.top - safeTop - start) / Math.max(1, end - start);
        const supportEnd = beat.timing.settle + Math.max(0, beat.phrases.length - 1) * beat.timing.gap;
        beat.revealWindow = Math.min(1, Math.max(.25, deadline / (supportEnd + .045)));
        beat.lastLocal = NaN;
        for(const motion of beat.phraseMotion)motion.settle=NaN;
      }
      this.layoutReads += this.beats.length * 4;
      if (this.diagnostics) this.root.dataset.stayTextLayoutReads = String(this.layoutReads);
      this.layoutDirty = false;
    }
    const height = window.innerHeight, y = window.scrollY;
    const accessible = this.reduced.matches || this.root.dataset.stayQuiet === "true";
    this.root.dataset.typeDirected = "score";
    if (this.diagnostics) this.root.dataset.stayTextScore = progress.toFixed(4);
    if (this.diagnostics) this.root.dataset.stayTextTarget = target.toFixed(4);
    for (let index=0;index<this.beats.length;index++) {
      const beat=this.beats[index]!;
      const span = Math.max(.0001, beat.to - beat.from);
      const local = (progress - beat.from) / span;
      const copyTop = beat.sticky ? Math.min(Math.max(beat.copyTop - y, beat.stickyTop), beat.copyEnd - y) : beat.top - beat.titleOffset - y;
      const top = beat.sticky ? copyTop + beat.titleOffset : beat.top - y;
      const bottom = top + (beat.sticky ? beat.titleHeight : beat.bottom - beat.top);
      // Only resolve early at the upper reading edge or for accessibility.
      // Being in the viewport is the approach, not permission to bypass a mask.
      const focused = beat.section.contains(document.activeElement) && document.activeElement?.matches("a,button,input,textarea,select,summary,[contenteditable='true']");
      const edge=beat.sticky?beat.stickyTop+beat.titleOffset+20:height*.16;
      const readExposure=accessible||focused?1:bottom>0?smooth((edge+48-top)/48):0;
      const supportExposure=accessible||focused?1:smooth((height*.16+48-(beat.sticky?copyTop+beat.supportOffset:beat.supportTop-y))/48);
      const exitExposure=accessible||focused?0:1-smooth((bottom-height*.10)/(height*.08));
      const readable=readExposure>=.999999;
      const openingLocal = local / beat.revealWindow;
      const timing = beat.timing;
      const state = textState(openingLocal, accessible||Boolean(focused), timing, beat.state), r = Math.max(state.reveal,readExposure);
      const zone = this.readingZones[index]!;
      zone.active = r > .35 && copyTop < height && copyTop + beat.copyHeight > 0;
      zone.left = beat.copyLeft / window.innerWidth * 2 - 1 - .025;
      zone.right = beat.copyRight / window.innerWidth * 2 - 1 + .025;
      zone.top = 1 - copyTop / height * 2 + .04;
      zone.bottom = 1 - (copyTop + beat.copyHeight) / height * 2 - .04;
      const phase = local >= timing.read ? "depart" : openingLocal >= timing.settle ? "hold" : state.phase;
      const key=Math.max(0,Math.min(1,local));
      if(key===beat.lastLocal&&readExposure===beat.lastRead&&supportExposure===beat.lastSupportRead&&exitExposure===beat.lastExit&&phase===beat.lastPhase)continue;
      beat.lastLocal=key;beat.lastRead=readExposure;beat.lastSupportRead=supportExposure;beat.lastExit=exitExposure;beat.lastPhase=phase;beat.section.dataset.typePhase=phase;
      if (this.diagnostics) beat.section.dataset.textProgress = r.toFixed(3);
      const mode = beat.title.dataset.reveal;
      for (let order=0;order<beat.phrases.length;order++) {
        const phrase=beat.phrases[order]!;
        const delay = order * timing.gap * (mode === "line-unfold" ? 1.2 : 1);
        const scored=smooth((openingLocal-timing.prepare-delay)/(timing.reveal-timing.prepare));
        const stagger=scored+(1-scored)*readExposure;
        const closing=mode!=="tracking-settle"&&mode!=="quiet-emergence"?exitExposure*smooth((local-timing.read)/(1-timing.read)):0;
        const exposure=stagger*(1-closing);
        const motion=beat.phraseMotion[order]!;
        if(exposure!==motion.exposure){
          motion.exposure=exposure;if (this.diagnostics) phrase.dataset.maskExposure = exposure.toFixed(3);
          phrase.style.clipPath = exposure >= 1 ? open : mode === "line-unfold"
            ? `inset(-12% -3% ${100 * (1 - exposure)}% -3%)`
            : mode === "diagonal-mask" ? `polygon(-3% -14%, ${exposure * 126 - 3}% -14%, ${exposure * 126 - 23}% 118%, -3% 118%)`
            : mode === "offset-alignment" && order % 2 ? `inset(-14% -3% -18% ${100 * (1 - exposure)}%)`
            : `inset(-14% ${100 * (1 - exposure)}% -18% -3%)`;
          phrase.style.opacity = mode === "quiet-emergence" ? String(.12 + .88 * exposure) : "1";
        }
        const settle=state.settle+(1-state.settle)*readExposure;
        if(settle!==motion.settle||readable!==motion.readable){
          motion.settle=settle;motion.readable=readable;
          phrase.style.letterSpacing = mode === "tracking-settle" && !readable ? `${beat.trackingBase+(-.010-beat.trackingBase)*(1-settle)}em` : "";
          phrase.style.transform = mode === "offset-alignment" && !readable ? `translateX(${(order % 2 ? -1 : 1) * 2 * (1 - settle)}px)` : "";
        }
      }
      const supportStart = timing.reveal + Math.max(0, beat.phrases.length - 1) * timing.gap + .015;
      for (let order=0;order<beat.support.length;order++) {
        const node=beat.support[order]!;
        const scored=smooth((openingLocal-supportStart-Math.min(order,2)*.018)/(timing.settle-timing.reveal));
        const safety=Math.max(readExposure,supportExposure),exposure=scored+(1-scored)*safety;
        if(exposure===beat.supportExposure[order])continue;
        beat.supportExposure[order]=exposure;
        if (this.diagnostics) node.dataset.maskExposure = exposure.toFixed(3);
        node.style.clipPath = exposure >= 1 ? open : `inset(-4% -2% ${100 * (1 - exposure)}% -2%)`;
        node.style.opacity = String(.18 + .82 * exposure);
      }
    }
  };
  invalidate() { this.layoutDirty = true; }
  dispose() {
    this.observer.disconnect();
    delete this.root.dataset.typeDirected; delete this.root.dataset.stayTextScore; delete this.root.dataset.stayTextTarget;
    for (const beat of this.beats) {
      delete beat.section.dataset.typePhase; delete beat.section.dataset.textProgress;
      delete beat.section.dataset.stayFlow;
      beat.phrases.forEach(node => { delete node.dataset.maskExposure; node.style.clipPath = ""; node.style.opacity = ""; node.style.transform = ""; node.style.letterSpacing = ""; });
      beat.support.forEach(node => { delete node.dataset.maskExposure; delete node.dataset.titleSupport; node.style.clipPath = ""; node.style.opacity = ""; });
    }
  }
}
