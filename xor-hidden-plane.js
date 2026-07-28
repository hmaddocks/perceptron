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

function svgEl(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

export function renderHiddenPlane(svg, { rows, neurons }) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const regionStart = toDomainScreen(0, 1);
  const regionEnd = toDomainScreen(1, 0);
  svg.appendChild(
    svgEl("rect", {
      class: "plane-active-region",
      x: regionStart.px,
      y: regionStart.py,
      width: regionEnd.px - regionStart.px,
      height: regionEnd.py - regionStart.py,
    })
  );

  const boundary = boundaryEndpoints(neurons.out);
  if (boundary) {
    const [a, b] = boundary;
    const aScreen = toDomainScreen(a.x, a.y);
    const bScreen = toDomainScreen(b.x, b.y);
    svg.appendChild(
      svgEl("line", { class: "plane-boundary", x1: aScreen.px, y1: aScreen.py, x2: bScreen.px, y2: bScreen.py })
    );

    const { w1, w2 } = neurons.out;
    const magnitude = Math.hypot(w1, w2);
    if (magnitude > 1e-6) {
      const nx = w1 / magnitude;
      const ny = w2 / magnitude;
      const canvasCenter = 0.5;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const lengthSq = dx * dx + dy * dy;
      const t = lengthSq > 1e-9 ? ((canvasCenter - a.x) * dx + (canvasCenter - a.y) * dy) / lengthSq : 0;
      const tClamped = Math.max(0, Math.min(1, t));
      const midX = a.x + tClamped * dx;
      const midY = a.y + tClamped * dy;
      const offset = 0.15;

      const plus = toDomainScreen(midX + nx * offset, midY + ny * offset);
      const minus = toDomainScreen(midX - nx * offset, midY - ny * offset);

      svg.appendChild(svgEl("circle", { class: "plane-side-badge positive", cx: plus.px, cy: plus.py, r: 12 }));
      const plusLabel = svgEl("text", { class: "plane-side-label", x: plus.px, y: plus.py });
      plusLabel.textContent = "1";
      svg.appendChild(plusLabel);

      svg.appendChild(svgEl("circle", { class: "plane-side-badge negative", cx: minus.px, cy: minus.py, r: 12 }));
      const minusLabel = svgEl("text", { class: "plane-side-label", x: minus.px, y: minus.py });
      minusLabel.textContent = "0";
      svg.appendChild(minusLabel);
    }
  }

  const groups = groupByCorner(rows, neurons);
  for (const group of groups) {
    const offsets = jitterOffsets(group.members.length);
    group.members.forEach((member, i) => {
      const offset = offsets[i];
      const { px, py } = toDomainScreen(group.hx + offset.x, group.hy + offset.y);
      const correct = member.actual === member.expected;

      svg.appendChild(
        svgEl("circle", {
          class: `plane-point ${member.expected === 0 ? "class-a" : "class-b"} ${correct ? "correct" : "misclassified"}`,
          cx: px,
          cy: py,
          r: 11,
        })
      );

      const label = svgEl("text", { class: "plane-point-label", x: px, y: py - 18 });
      label.textContent = `(${member.x1}, ${member.x2})`;
      svg.appendChild(label);
    });
  }
}
