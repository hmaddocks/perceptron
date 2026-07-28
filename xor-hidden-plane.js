import { computeNetwork } from "./xor-network-model.js";

export const VIEWBOX_SIZE = 400;
const DOMAIN_MIN = -0.6;
const DOMAIN_MAX = 1.6;
const SPAN = DOMAIN_MAX - DOMAIN_MIN;

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

// Samples an n x n grid of cell centers over the active [0,1]x[0,1] square
// and classifies each by the Network's predicted output there. Works for
// any real x1/x2 (not just 0/1) because computeNetwork's math — weighted
// sum + threshold — is defined everywhere, not just at the training points.
export function sampleGrid(neurons, n) {
  const cells = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const x = (col + 0.5) / n;
      const y = (row + 0.5) / n;
      const { out } = computeNetwork(neurons, x, y);
      cells.push({ x, y, cls: out.output });
    }
  }
  return cells;
}

// The point on segment a->b nearest the domain's center, clamped to the
// segment — used to place a label on a boundary line regardless of how
// steep it is (a plain midpoint can drift off-canvas for steep lines).
export function pointNearestCenter(a, b) {
  const center = (DOMAIN_MIN + DOMAIN_MAX) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq > 1e-9 ? ((center - a.x) * dx + (center - a.y) * dy) / lengthSq : 0;
  const tClamped = Math.max(0, Math.min(1, t));
  return { x: a.x + tClamped * dx, y: a.y + tClamped * dy };
}

const GRID_N = 32;

function svgEl(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function drawHiddenLine(svg, perceptron, key) {
  const boundary = boundaryEndpoints(perceptron);
  if (!boundary) return;
  const [a, b] = boundary;
  const aScreen = toDomainScreen(a.x, a.y);
  const bScreen = toDomainScreen(b.x, b.y);
  svg.appendChild(
    svgEl("line", { class: `plane-hidden-boundary ${key}`, x1: aScreen.px, y1: aScreen.py, x2: bScreen.px, y2: bScreen.py })
  );

  const labelPoint = pointNearestCenter(a, b);
  const labelScreen = toDomainScreen(labelPoint.x, labelPoint.y);
  const text = svgEl("text", {
    class: `plane-hidden-boundary-label ${key}`,
    x: labelScreen.px,
    y: labelScreen.py - 8,
  });
  text.textContent = key;
  svg.appendChild(text);
}

export function renderRegionPlane(svg, { rows, neurons }) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const cellSize = 1 / GRID_N;
  const cellPx = (cellSize / SPAN) * VIEWBOX_SIZE;
  for (const cell of sampleGrid(neurons, GRID_N)) {
    const corner = toDomainScreen(cell.x - cellSize / 2, cell.y + cellSize / 2);
    svg.appendChild(
      svgEl("rect", {
        class: cell.cls === 0 ? "plane-region-a" : "plane-region-b",
        x: corner.px,
        y: corner.py,
        width: cellPx,
        height: cellPx,
      })
    );
  }

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

  drawHiddenLine(svg, neurons.h1, "h1");
  drawHiddenLine(svg, neurons.h2, "h2");

  for (const [x1, x2, expected] of rows) {
    const { out } = computeNetwork(neurons, x1, x2);
    const correct = out.output === expected;
    const { px, py } = toDomainScreen(x1, x2);

    svg.appendChild(
      svgEl("circle", {
        class: `plane-point ${expected === 0 ? "class-a" : "class-b"} ${correct ? "correct" : "misclassified"}`,
        cx: px,
        cy: py,
        r: 11,
      })
    );

    const label = svgEl("text", { class: "plane-point-label", x: px, y: py - 18 });
    label.textContent = `(${x1}, ${x2})`;
    svg.appendChild(label);
  }
}
