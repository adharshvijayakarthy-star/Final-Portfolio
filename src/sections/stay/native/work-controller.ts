import { all, one, show, type DestinationController, type MotionScope, type VisualElement } from "./motion-scope";

const visible = (el: VisualElement | null | undefined) => { if (el) el.style.opacity = "1"; };
const text = (el: VisualElement | null, value: string) => { if (el) el.textContent = value; };
const prep = (el: VisualElement, dy: number) => Object.assign(el.style, { opacity: "0", transform: `translateY(${dy}px)`, transition: "opacity 800ms cubic-bezier(0.22,0.61,0.36,1), transform 1000ms cubic-bezier(0.22,0.61,0.36,1)" });
type Station = (sec: VisualElement, scope: MotionScope, instant: boolean) => void;

const planner: Station = (sec, scope, instant) => {
  const chips = all(sec, "[data-chip]"), weights = all(sec, "[data-w]"), blocks = all(sec, "[data-blk]");
  const brk = one(sec, "[data-brk]"), lock = one(sec, "[data-lock]"), note = one(sec, "[data-note]"), mover = one(sec, "[data-move]");
  const targets = [0.9, 0.7, 0.6, 0.4, 0.3];
  const restingNote = "Illustrative structure · the gold band is a break, not a session";
  text(note, restingNote);
  weights.forEach(w => text(w, "0.4"));
  if (instant) {
    [...chips, ...blocks].forEach(visible);
    weights.forEach((w, i) => text(w, (targets[i] ?? 0.4).toFixed(1)));
    visible(brk); visible(lock); return;
  }
  chips.forEach((chip, i) => scope.after(700 + i * 130, () => visible(chip)));
  weights.forEach((weight, i) => scope.after(1500 + i * 150, () => {
    let value = 0;
    const goal = targets[i] ?? 0.4;
    const tick = scope.every(55, () => {
      value += 0.1;
      if (value >= goal - 0.001) { value = goal; scope.cancelInterval(tick); }
      text(weight, value.toFixed(1));
    });
  }));
  blocks.forEach((block, i) => { if (block !== mover) scope.after(2400 + i * 110, () => visible(block)); });
  if (mover) {
    scope.after(2500, () => { mover.style.transform = "translateX(-215%)"; visible(mover); });
    scope.after(3500, () => text(note, "Thursday already holds this subject — the block moves."));
    scope.after(3900, () => { mover.style.transform = "none"; });
  }
  scope.after(4700, () => visible(brk));
  scope.after(4900, () => text(note, "A break is inserted between session groups, not scheduled as one."));
  scope.after(5900, () => visible(lock));
  scope.after(6100, () => text(note, restingNote));
};

const logger: Station = (sec, scope, instant) => {
  const pipes = all(sec, "[data-pipe]"), sheets = all(sec, "[data-sheet]"), dots = all(sec, "[data-dot]");
  const line = sec.querySelector<SVGGeometryElement>("[data-line]"), pred = one(sec, "[data-pred]"), tip = one(sec, "[data-tip]"), est = one(sec, "[data-est]");
  if (line) { const length = line.getTotalLength(); line.style.strokeDasharray = `${length} ${length}`; line.style.strokeDashoffset = String(length); }
  if (pred) { pred.style.strokeDasharray = "5 5"; pred.style.opacity = "0"; }
  if (tip) tip.style.opacity = "0";
  if (instant) {
    [...pipes, ...sheets, ...dots].forEach(visible);
    if (line) line.style.strokeDashoffset = "0";
    visible(pred); visible(tip); visible(est); return;
  }
  pipes.forEach((el, i) => scope.after(600 + i * 200, () => visible(el)));
  sheets.forEach((el, i) => scope.after(1500 + i * 320, () => visible(el)));
  dots.forEach((el, i) => scope.after(2600 + i * 190, () => visible(el)));
  scope.after(2700, () => { if (line) { line.style.transition = "stroke-dashoffset 1900ms cubic-bezier(0.35,0.1,0.25,1)"; line.style.strokeDashoffset = "0"; } });
  scope.after(4700, () => { if (pred) { pred.style.transition = "opacity 900ms ease"; visible(pred); } });
  scope.after(5300, () => { if (tip) { tip.style.transition = "opacity 700ms ease"; visible(tip); } });
  scope.after(5500, () => { if (est) { est.style.transition = "opacity 700ms ease"; visible(est); } });
};

const committee: Station = (sec, scope, instant) => {
  const stages = all(sec, "[data-stage]");
  if (instant) { stages.forEach(visible); return; }
  stages.forEach((stage, i) => {
    scope.after(900 + i * 520, () => {
      visible(stage);
      const dot = one(stage, "span");
      if (dot) dot.style.background = "rgba(176,144,79,0.85)";
      stage.style.boxShadow = "0 10px 18px -12px rgba(35,41,31,0.95)";
    });
    scope.after(1500 + i * 520, () => {
      const dot = one(stage, "span");
      if (dot && i < stages.length - 1) dot.style.background = "rgba(61,76,58,0.4)";
    });
  });
};

const terminal: Station = (sec, scope, instant) => {
  const logs = all(sec, "[data-log]");
  const count = one(sec, "[data-count]"), threshold = one(sec, "[data-thresh]"), oldPrice = one(sec, "[data-old]"), newPrice = one(sec, "[data-new]");
  const cap = 40; // Authored illustrative count; never actual registration data.
  if (instant) { logs.forEach(visible); text(count, `${cap} / ${cap}`); visible(newPrice); return; }
  text(count, `0 / ${cap}`);
  logs.slice(0, 5).forEach((log, i) => scope.after(700 + i * 620, () => visible(log)));
  scope.after(3900, () => {
    visible(logs[5]);
    let value = 0;
    const tick = scope.every(45, () => {
      value += value < 30 ? 2 : 1;
      if (value >= cap) { value = cap; scope.cancelInterval(tick); }
      text(count, `${value} / ${cap}`);
    });
  });
  scope.after(5300, () => visible(logs[6]));
  scope.after(5500, () => { if (threshold) threshold.style.textShadow = "0 0 18px rgba(217,181,106,0.5)"; });
  scope.after(6100, () => visible(logs[7]));
  scope.after(6700, () => {
    if (oldPrice) { oldPrice.style.transition = "opacity 600ms ease"; oldPrice.style.opacity = "0.45"; }
    if (newPrice) { newPrice.style.transition = "opacity 700ms ease"; visible(newPrice); }
  });
};

const cabinet: Station = (sec, scope, instant) => {
  const docs = all(sec, "[data-doc]"), links = one(sec, "[data-links]"), note = one(sec, '[data-note="5"]');
  const skew = [-2.4, 1.8, -1.4, 2.2, -0.9], shift = [-9, 7, -5, 8, -3];
  if (instant) { docs.forEach(visible); visible(links); visible(note); return; }
  docs.forEach((doc, i) => scope.after(700 + i * 150, () => { visible(doc); doc.style.transform = `rotate(${skew[i]}deg) translateX(${shift[i]}px)`; }));
  scope.after(2100, () => { if (note) { note.style.transition = "opacity 700ms ease"; visible(note); } });
  docs.forEach((doc, i) => scope.after(2700 + i * 170, () => { doc.style.transform = "none"; }));
  scope.after(4100, () => visible(links));
  scope.after(4600, () => { const last = docs.at(-1); if (last) last.style.boxShadow = "0 0 22px -4px rgba(217,181,106,0.55)"; });
};

export const startWork: DestinationController = (root, scope, reduced) => {
  const sections = all(root, "[data-station]");
  const played = new WeakSet<Element>();
  const stations: Record<string, Station> = { "1": planner, "2": logger, "3": committee, "4": terminal, "5": cabinet };
  sections.forEach(sec => {
    all(sec, "[data-step]").forEach(el => prep(el, 18));
    all(sec, "[data-blk],[data-brk],[data-chip],[data-sheet],[data-dot],[data-pipe],[data-stage],[data-log],[data-doc]").forEach(el => Object.assign(el.style, { opacity: "0", transition: "opacity 520ms ease, transform 700ms cubic-bezier(0.22,0.61,0.36,1), background 600ms ease, box-shadow 600ms ease" }));
    const slot = one(sec, "[data-slot]"); if (slot) prep(slot, 12);
  });
  const run = (sec: VisualElement, instant: boolean) => {
    if (played.has(sec)) return;
    played.add(sec);
    all(sec, "[data-step]").forEach((el, i) => { if (instant) show(el); else scope.after(120 + i * 260, () => show(el)); });
    const slot = one(sec, "[data-slot]");
    if (slot) { if (instant) show(slot); else scope.after(900, () => show(slot)); }
    stations[sec.dataset.station ?? ""]?.(sec, scope, instant);
  };
  if (reduced) { sections.forEach(sec => run(sec, true)); return; }
  const io = scope.observe((entries, owner) => entries.forEach(entry => {
    if (entry.intersectionRatio >= 0.24 || entry.boundingClientRect.top < 0) {
      owner.unobserve(entry.target);
      run(entry.target as VisualElement, entry.intersectionRatio < 0.24);
    }
  }), { threshold: [0, 0.24, 0.5] });
  sections.forEach(sec => io.observe(sec));
};
