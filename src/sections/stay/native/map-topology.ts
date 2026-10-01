import nodes from "./map-nodes.json";
import type { StayDestination } from "./destinations";
export const places = nodes.map(node => ({ ...node, id: node.id as StayDestination,
  x: parseFloat(node.btnStyle.left) / 100 * 114 - 7,
  y: parseFloat(node.btnStyle.top) / 100 * 114 - 7,
}));
export const edges: [StayDestination, StayDestination][] = [
  ["garden", "person"], ["garden", "builder"], ["person", "thinker"], ["person", "leader"],
  ["builder", "leader"], ["builder", "work"], ["leader", "stories"], ["thinker", "stories"],
  ["work", "future"], ["work", "aura"], ["stories", "future"], ["future", "aura"],
  ["stories", "contact"], ["thinker", "contact"],
  ["aura", "contact"],
];
export const positionPercent = (value: number) => (value + 7) / 114 * 100;
export function curve(from: StayDestination, to: StayDestination, bow: number) {
  const a = places.find(p => p.id === from)!, b = places.find(p => p.id === to)!;
  const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy) || 1;
  const n = (v: number) => Math.round(v * 100) / 100;
  return `M ${n(a.x)} ${n(a.y)} Q ${n((a.x + b.x) / 2 - dy / length * bow)} ${n((a.y + b.y) / 2 + dx / length * bow)} ${n(b.x)} ${n(b.y)}`;
}
export function travelPath(from: StayDestination, to: StayDestination) {
  const distances = new Map<StayDestination, number>([[from, 0]]);
  const previous = new Map<StayDestination, StayDestination>();
  const queue: StayDestination[] = [from];
  while (queue.length) {
    queue.sort((a, b) => (distances.get(a)! - distances.get(b)!) || (places.findIndex(p => p.id === a) - places.findIndex(p => p.id === b)));
    const current = queue.shift()!;
    if (current === to) break;
    for (const [a, b] of edges) {
      const next = a === current ? b : b === current ? a : null;
      if (!next) continue;
      const here = places.find(p => p.id === current)!, there = places.find(p => p.id === next)!;
      const cost = distances.get(current)! + Math.hypot(here.x - there.x, here.y - there.y);
      if (cost < (distances.get(next) ?? Infinity)) { distances.set(next, cost); previous.set(next, current); if (!queue.includes(next)) queue.push(next); }
    }
  }
  const sequence: StayDestination[] = [to];
  while (sequence[0] !== from && previous.has(sequence[0]!)) sequence.unshift(previous.get(sequence[0]!)!);
  if (sequence[0] !== from) return curve(from, to, 0);
  return sequence.slice(1).map((node, index) => {
    const source = sequence[index]!;
    const edgeIndex = edges.findIndex(([a, b]) => (a === source && b === node) || (b === source && a === node));
    const bow = ((edgeIndex % 3) - 1) * 5 + 2;
    return curve(source, node, bow).replace(index ? /^M [^Q]+ / : /^$/, "");
  }).join(" ");
}
