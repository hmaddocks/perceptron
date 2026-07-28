export const VIEWBOX_SIZE = 400;
// Screen mapping spans a bit wider than the placeable region so the
// boundary line has room to run off the edges instead of getting clipped.
const DOMAIN_MIN = -1.5;
const DOMAIN_MAX = 1.5;
const SPAN = DOMAIN_MAX - DOMAIN_MIN;

export function toScreen(x, y) {
  return {
    px: ((x - DOMAIN_MIN) / SPAN) * VIEWBOX_SIZE,
    py: VIEWBOX_SIZE - ((y - DOMAIN_MIN) / SPAN) * VIEWBOX_SIZE,
  };
}

export function toDomain(px, py) {
  return {
    x: DOMAIN_MIN + (px / VIEWBOX_SIZE) * SPAN,
    y: DOMAIN_MIN + ((VIEWBOX_SIZE - py) / VIEWBOX_SIZE) * SPAN,
  };
}

export function clampToActiveRegion(x, y) {
  return { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
}

export function eventToDomain(svg, evt) {
  const rect = svg.getBoundingClientRect();
  const px = ((evt.clientX - rect.left) / rect.width) * VIEWBOX_SIZE;
  const py = ((evt.clientY - rect.top) / rect.height) * VIEWBOX_SIZE;
  return toDomain(px, py);
}

function svgEl(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

// Endpoints of the line w1*x + w2*y + bias = 0, clipped to the domain square.
// Finds where the (infinite) line crosses each of the square's 4 edges, then
// keeps only the crossings that actually land within the square — evaluating
// y at the two x-edges alone breaks down for steep lines (small w2 relative
// to w1), which leave the square through its top/bottom edges instead.
function boundaryEndpoints(perceptron) {
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

export function renderPlane(svg, { points, perceptron }) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const active = toScreen(-1, -1);
  const activeOpp = toScreen(1, 1);
  svg.appendChild(
    svgEl("rect", {
      class: "plane-active-region",
      x: Math.min(active.px, activeOpp.px),
      y: Math.min(active.py, activeOpp.py),
      width: Math.abs(activeOpp.px - active.px),
      height: Math.abs(activeOpp.py - active.py),
    })
  );

  const origin = toScreen(0, 0);
  svg.appendChild(svgEl("line", { class: "plane-axis", x1: 0, y1: origin.py, x2: VIEWBOX_SIZE, y2: origin.py }));
  svg.appendChild(svgEl("line", { class: "plane-axis", x1: origin.px, y1: 0, x2: origin.px, y2: VIEWBOX_SIZE }));

  const boundary = boundaryEndpoints(perceptron);
  if (boundary) {
    const [a, b] = boundary.map(({ x, y }) => toScreen(x, y));
    svg.appendChild(svgEl("line", { class: "plane-boundary", x1: a.px, y1: a.py, x2: b.px, y2: b.py }));
  }

  for (const p of points) {
    const { px, py } = toScreen(p.x, p.y);
    svg.appendChild(
      svgEl("circle", {
        class: `plane-point ${p.label === 0 ? "class-a" : "class-b"}`,
        cx: px,
        cy: py,
        r: 8,
      })
    );
  }
}
