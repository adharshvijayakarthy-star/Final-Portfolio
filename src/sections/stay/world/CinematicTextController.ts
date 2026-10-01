import { smooth, textState } from "./narrative-score";
type Beat = { section: HTMLElement; title: HTMLElement; phrases: HTMLElement[]; support: HTMLElement[]; from: number; to: number; top: number; bottom: number; supportTop: number; revealWindow: number; last: string };
const open = "none";

/** Camera-score typography with cached layout, approach reveals and immediate
 * readable destination states. No timers, WAAPI queues or private RAF. */
export class CinematicTextController {
  private beats: Beat[];
  private observer: ResizeObserver;
  private layoutDirty = true;
  private layoutReads = 0;
  private reduced = matchMedia("(prefers-reduced-motion: reduce)");
  constructor(private root: HTMLElement) {
    this.beats = [...root.querySelectorAll<HTMLElement>("section[data-stay-beat]")].flatMap(section => {
      const title = section.querySelector<HTMLElement>("[data-reveal]");
      if (!title) return [];
      const support = [...section.querySelectorAll<HTMLElement>(":scope > div > :not(h1):not(h2)")].filter(node => !node.hasAttribute("data-eyebrow"));
      support.forEach(node => { node.dataset.titleSupport = ""; });
      return [{ section, title, phrases: [...title.querySelectorAll<HTMLElement>("[data-title-phrase]")], support,
        from: Number(section.dataset.from), to: Number(section.dataset.to), top: 0, bottom: 0, supportTop: 0, revealWindow: 1, last: "" }];
    });
    this.observer = new ResizeObserver(() => { this.layoutDirty = true; });
    this.observer.observe(root);
    this.beats.forEach(beat => this.observer.observe(beat.title));
    void document.fonts.ready.then(() => { this.layoutDirty = true; });
    this.present(0, 0);
  }
  present = (progress: number, target: number) => {
    if (this.layoutDirty) {
      const height = window.innerHeight;
      const sections = this.beats.map(beat => {
        const box = beat.section.getBoundingClientRect();
        return { top: box.top + window.scrollY, bottom: box.bottom + window.scrollY };
      });
      const boundaries = sections.slice(1).map((next, i) => (sections[i]!.bottom + next.top) / 2 - height * .5);
      for (const [index, beat] of this.beats.entries()) {
        const box = beat.title.getBoundingClientRect();
        beat.top = box.top + window.scrollY; beat.bottom = box.bottom + window.scrollY;
        beat.supportTop = (beat.support[0]?.getBoundingClientRect().top ?? box.bottom) + window.scrollY;
        const start = index ? boundaries[index - 1]! : Math.max(0, sections[index]!.top);
        const end = index < boundaries.length ? boundaries[index]! : Math.max(start + 1, sections[index]!.bottom - height);
        // The same measured camera beat supplies progress. Compress only its
        // opening score when native flow would carry the title into the nav
        // before its supporting copy resolves. No viewport-triggered animation.
        const safeTop = Math.min(120, height * .2);
        const deadline = (beat.top - safeTop - start) / Math.max(1, end - start);
        const supportEnd = .555 + Math.max(0, beat.phrases.length - 1) * .065;
        beat.revealWindow = Math.min(1, Math.max(.25, deadline / (supportEnd + .045)));
        beat.last = "";
      }
      this.layoutReads += this.beats.length;
      this.root.dataset.stayTextLayoutReads = String(this.layoutReads);
      this.layoutDirty = false;
    }
    const height = window.innerHeight, y = window.scrollY;
    const accessible = this.reduced.matches || this.root.dataset.stayQuiet === "true";
    this.root.dataset.typeDirected = "score";
    this.root.dataset.stayTextScore = progress.toFixed(4);
    this.root.dataset.stayTextTarget = target.toFixed(4);
    for (const beat of this.beats) {
      const span = Math.max(.0001, beat.to - beat.from);
      const local = (progress - beat.from) / span;
      const top = beat.top - y, bottom = beat.bottom - y;
      // Only resolve early at the upper reading edge or for accessibility.
      // Being in the viewport is the approach, not permission to bypass a mask.
      const focused = beat.section.contains(document.activeElement) && document.activeElement?.matches("a,button,input,textarea,select,summary,[contenteditable='true']");
      const readable = accessible || focused || (bottom > 0 && top < height * .10);
      const supportReadable = accessible || focused || beat.supportTop - y < height * .12;
      const openingLocal = local / beat.revealWindow;
      const state = textState(openingLocal, readable), r = state.reveal;
      const phase = local >= .88 ? "depart" : openingLocal >= .58 ? "hold" : state.phase;
      const key = `${local.toFixed(4)}:${readable}:${state.phase}`;
      if (key === beat.last) continue;
      beat.last = key; beat.section.dataset.typePhase = phase;
      beat.section.dataset.textProgress = r.toFixed(3);
      const mode = beat.title.dataset.reveal;
      for (const [order, phrase] of beat.phrases.entries()) {
        const delay = order * (mode === "line-unfold" ? .08 : .065);
        const stagger = readable ? 1 : smooth((openingLocal - .08 - delay) / .27);
        const closing = local > .9 && bottom < height * .18 && mode !== "tracking-settle" && mode !== "quiet-emergence";
        const exposure = closing ? stagger * (1 - smooth((local - .9) / .1)) : stagger;
        phrase.dataset.maskExposure = exposure.toFixed(3);
        phrase.style.clipPath = exposure >= .999 ? open : mode === "line-unfold"
          ? `inset(-12% -3% ${100 * (1 - exposure)}% -3%)`
          : mode === "diagonal-mask" ? `polygon(-3% -14%, ${exposure * 126 - 3}% -14%, ${exposure * 126 - 23}% 118%, -3% 118%)`
          : mode === "offset-alignment" && order % 2 ? `inset(-14% -3% -18% ${100 * (1 - exposure)}%)`
          : `inset(-14% ${100 * (1 - exposure)}% -18% -3%)`;
        phrase.style.opacity = mode === "quiet-emergence" ? String(.12 + .88 * exposure) : "1";
        phrase.style.letterSpacing = mode === "tracking-settle" && !readable ? `${-.022 + .012 * (1 - state.settle)}em` : "";
        phrase.style.transform = mode === "offset-alignment" && !readable ? `translateX(${(order % 2 ? -1 : 1) * 2 * (1 - state.settle)}px)` : "";
      }
      const supportStart = .40 + Math.max(0, beat.phrases.length - 1) * .065 + .035;
      for (const [order, node] of beat.support.entries()) {
        const exposure = supportReadable ? 1 : smooth((openingLocal - supportStart - Math.min(order, 2) * .02) / .12);
        node.dataset.maskExposure = exposure.toFixed(3);
        node.style.clipPath = exposure >= .999 ? open : `inset(-4% -2% ${100 * (1 - exposure)}% -2%)`;
        node.style.opacity = String(.18 + .82 * exposure);
      }
    }
  };
  dispose() {
    this.observer.disconnect();
    delete this.root.dataset.typeDirected; delete this.root.dataset.stayTextScore; delete this.root.dataset.stayTextTarget;
    for (const beat of this.beats) {
      delete beat.section.dataset.typePhase; delete beat.section.dataset.textProgress;
      beat.phrases.forEach(node => { delete node.dataset.maskExposure; node.style.clipPath = ""; node.style.opacity = ""; node.style.transform = ""; node.style.letterSpacing = ""; });
      beat.support.forEach(node => { delete node.dataset.maskExposure; delete node.dataset.titleSupport; node.style.clipPath = ""; node.style.opacity = ""; });
    }
  }
}
