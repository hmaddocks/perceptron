import { computeNetwork } from "./xor-network-model.js";

export const VIEWBOX_SIZE = 400;
const DOMAIN_MIN = -0.6;
const DOMAIN_MAX = 1.6;
const SPAN = DOMAIN_MAX - DOMAIN_MIN;
const JITTER_RADIUS = 0.12;

export function toDomainScreen(x, y) {
  return {
    px: ((x - DOMAIN_MIN) / SPAN) * VIEWBOX_SIZE,
    py: VIEWBOX_SIZE - ((y - DOMAIN_MIN) / SPAN) * VIEWBOX_SIZE,
  };
}

// Endpoints of the line w1*x + w2*y + bias = 0, clipped to the domain square.
// Finds where the (infinite) line crosses each of the square's 4 edges, then
// keeps only the crossings that actually land within the square — evaluating
// y at the two x-edges alone breaks down for steep lines (small w2 relative
// to w1), which leave the square through its top/bottom edges instead.
export function boundaryEndpoints(perceptron) {
  const { w1, w2, bias } = perceptron;
  const inRange = (v) => v >= DOMAIN_MIN - 1e-9 && v <= DOMAIN_MAX + 1e-9;
  const points = [];

  if (Math.abs(w2) > 1e-9) {
    for (const x of [DOMAIN_MIN, DOMAIN_MAX]) {
      const y = -(w1 * x + bias) / w2;
      if (inRange(y)) points.push({ x, y });
    }
  }
  if (Math.abs(w1) > 1e-9) {
    for (const y of [DOMAIN_MIN, DOMAIN_MAX]) {
      const x = -(w2 * y + bias) / w1;
      if (inRange(x)) points.push({ x, y });
    }
  }

  const unique = points.filter(
    (p, i) => !points.slice(0, i).some((q) => Math.abs(q.x - p.x) < 1e-6 && Math.abs(q.y - p.y) < 1e-6)
  );
  if (unique.length < 2) return null;
  return [unique[0], unique[unique.length - 1]];
}

// Groups rows by identical (h1out, h2out) — there are only 4 possible
// corners since both are binary, so collisions between rows (even
// different-expected ones) are common while exploring non-solving weights.
export function groupByCorner(rows, neurons) {
  const groups = new Map();
  for (const [x1, x2, expected] of rows) {
    const { h1, h2, out } = computeNetwork(neurons, x1, x2);
    const key = `${h1.output},${h2.output}`;
    if (!groups.has(key)) groups.set(key, { hx: h1.output, hy: h2.output, members: [] });
    groups.get(key).members.push({ x1, x2, expected, actual: out.output });
  }
  return [...groups.values()];
}

// n evenly-spaced offsets (domain units) around a corner. n=1 -> centered.
export function jitterOffsets(n) {
  if (n <= 1) return [{ x: 0, y: 0 }];
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n;
    return { x: JITTER_RADIUS * Math.cos(angle), y: JITTER_RADIUS * Math.sin(angle) };
  });
}
