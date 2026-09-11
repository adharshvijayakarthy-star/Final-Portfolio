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
];
export const positionPercent = (value: number) => (value + 7) / 114 * 100;
export function curve(from: StayDestination, to: StayDestination, bow: number) {
  const a = places.find(p => p.id === from)!, b = places.find(p => p.id === to)!;
  const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy) || 1;
  const n = (v: number) => Math.round(v * 100) / 100;
  return `M ${n(a.x)} ${n(a.y)} Q ${n((a.x + b.x) / 2 - dy / length * bow)} ${n((a.y + b.y) / 2 + dx / length * bow)} ${n(b.x)} ${n(b.y)}`;
}
export function travelPath(from: StayDestination, to: StayDestination) {
  for (const [i, pair] of edges.entries()) {
    const bow = ((i % 3) - 1) * 5 + 2;
    if (pair[0] === from && pair[1] === to) return curve(from, to, bow);
    if (pair[1] === from && pair[0] === to) return curve(from, to, -bow);
  }
  return curve(from, to, 7);
}
