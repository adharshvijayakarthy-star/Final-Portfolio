import { all, one, type DestinationController } from "./motion-scope";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const seg = (progress: number, from: number, to: number) => clamp((progress - from) / (to - from));
const ease = (value: number) => value * value * (3 - 2 * value);

/** Scroll is the clock: every state can be traversed in either direction. */
export const startAura: DestinationController = (root, scope, reduced) => {
  const section = one(root, "[data-scrub]");
  if (!section) return;
  const says = all(section, "[data-say]"), rows = all(section, "[data-row]"), nodes = all(section, "[data-node]");
  const frags = all(section, "[data-frag]"), docs = all(section, "[data-doc]"), labels = all(section, "[data-label]"), glyphs = all(section, "[data-glyph]");
  const web = Array.from(section.querySelectorAll<SVGGeometryElement>('[data-e="w"]'));
  const links = Array.from(section.querySelectorAll<SVGGeometryElement>('[data-e="l"]'));
  const spine = one(section, "[data-spine]");
  const lengths = new Map<SVGGeometryElement, number>();
  [...web, ...links].forEach(path => {
    const length = path.getTotalLength(); lengths.set(path, length);
    path.style.strokeDasharray = String(length); path.style.strokeDashoffset = String(length);
  });
  if (spine) { spine.style.transformOrigin = "52% 14%"; spine.style.transform = "scaleY(0)"; }
  if (reduced) {
    section.style.height = "auto";
    const sticky = one(section, "[data-sticky]"), words = one(section, "[data-words]");
    if (sticky) Object.assign(sticky.style, { position: "static", height: "auto" });
    if (words) Object.assign(words.style, { minHeight: "0", display: "flex", flexDirection: "column", gap: "22px", alignItems: "stretch" });
    says.forEach(el => Object.assign(el.style, { position: "relative", opacity: "1", transform: "none" }));
    nodes.forEach(el => { el.style.opacity = "1"; });
    frags.forEach(el => { el.style.opacity = "0"; });
    docs.forEach(el => Object.assign(el.style, { opacity: "1", transform: "none" }));
    labels.forEach(el => { el.style.opacity = "1"; });
    glyphs.forEach(el => { el.style.opacity = "0"; });
    [...web, ...links].forEach(el => { el.style.strokeDashoffset = "0"; });
    if (spine) spine.style.transform = "scaleY(1)";
    return;
  }
  const bands = [[0, 0.16], [0.16, 0.31], [0.31, 0.46], [0.46, 0.60], [0.60, 1.01]];
  const rowAt = [0.60, 0.72, 0.80, 0.87, 0.94];
  const draw = () => {
    const rect = section.getBoundingClientRect(), travel = rect.height - innerHeight;
    const progress = travel > 0 ? clamp(-rect.top / travel) : 0;
    says.forEach((el, i) => {
      const band = bands[i]; if (!band) return;
      const [from = 0, to = 1] = band;
      const incoming = seg(progress, from, from + 0.045), outgoing = i === 4 ? 0 : seg(progress, to - 0.045, to);
      const opacity = clamp(incoming - outgoing);
      el.style.opacity = String(opacity);
      el.style.transform = `translateY(${((1 - incoming) * 16 - outgoing * 12).toFixed(2)}px)`;
      el.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
    });
    rows.forEach((el, i) => {
      const at = rowAt[i]; if (at === undefined) return;
      const t = seg(progress, at, at + 0.035);
      el.style.opacity = (0.16 + t * 0.84).toFixed(3);
      el.style.transform = `translateX(${((1 - t) * 10).toFixed(2)}px)`;
    });
    const anchor = seg(progress, 0.12, 0.30);
    nodes.forEach((node, i) => {
      const t = seg(progress, 0.12 + i * 0.018, 0.20 + i * 0.018);
      node.style.opacity = t.toFixed(3); node.style.transform = `scale(${(0.5 + t * 0.5).toFixed(3)})`;
    });
    web.forEach((path, i) => {
      const t = ease(seg(progress, 0.15 + i * 0.022, 0.32 + i * 0.022));
      path.style.strokeDashoffset = (lengths.get(path)! * (1 - t)).toFixed(2);
      path.style.opacity = (0.25 + anchor * 0.55).toFixed(3);
    });
    docs.forEach((doc, i) => {
      const appear = seg(progress, 0.30 + i * 0.013, 0.40 + i * 0.013);
      const k = 1 - ease(seg(progress, 0.45 + i * 0.012, 0.60 + i * 0.012));
      doc.style.opacity = appear.toFixed(3);
      doc.style.transform = `translate(${(Number(doc.dataset.dx) * k).toFixed(2)}%,${(Number(doc.dataset.dy) * k).toFixed(2)}%) rotate(${(Number(doc.dataset.rot) * k).toFixed(2)}deg)`;
    });
    frags.forEach((frag, i) => {
      const appear = seg(progress, 0.60 + i * 0.008, 0.67 + i * 0.008), gather = ease(seg(progress, 0.72, 0.81));
      const x = Number(frag.dataset.sx), y = Number(frag.dataset.sy), endY = 14 + i / (frags.length - 1) * 72;
      frag.style.left = `${(x + (50 - x) * gather).toFixed(2)}%`;
      frag.style.top = `${(y + (endY - y) * gather).toFixed(2)}%`;
      frag.style.opacity = (appear * (1 - seg(progress, 0.83, 0.90) * 0.85)).toFixed(3);
    });
    links.forEach((path, i) => {
      const t = ease(seg(progress, 0.80 + i * 0.006, 0.89 + i * 0.006));
      path.style.strokeDashoffset = (lengths.get(path)! * (1 - t)).toFixed(2); path.style.opacity = t.toFixed(3);
    });
    const model = ease(seg(progress, 0.87, 0.94));
    if (spine) spine.style.transform = `scaleY(${model.toFixed(3)})`;
    const expression = ease(seg(progress, 0.93, 1));
    labels.forEach(el => { el.style.opacity = expression.toFixed(3); });
    glyphs.forEach(el => { el.style.opacity = (1 - expression).toFixed(3); });
    docs.forEach(doc => {
      doc.style.borderColor = `rgba(61,76,58,${(0.3 + model * 0.28).toFixed(3)})`;
      doc.style.boxShadow = expression > 0.05 ? `0 10px 18px -14px rgba(35,41,31,0.9), 0 0 ${(expression * 16).toFixed(1)}px -2px rgba(176,144,79,${(expression * 0.4).toFixed(3)})` : "0 10px 18px -14px rgba(35,41,31,0.9)";
    });
  };
  let queued = false;
  const schedule = () => { if (queued) return; queued = true; scope.frame(() => { queued = false; draw(); }); };
  scope.listen(window, "scroll", schedule, { passive: true });
  scope.listen(window, "resize", schedule, { passive: true });
  draw();
};
