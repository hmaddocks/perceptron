export const VIEWBOX_SIZE = 400;
// Screen mapping spans a bit wider than the unit square so the boundary
// line has room to run off the edges instead of getting clipped, and the
// 4 corner points sit comfortably inset from the plane's own edges.
const DOMAIN_MIN = -0.6;
const DOMAIN_MAX = 1.6;
const SPAN = DOMAIN_MAX - DOMAIN_MIN;

function toScreen(x, y) {
  return {
    px: ((x - DOMAIN_MIN) / SPAN) * VIEWBOX_SIZE,
    py: VIEWBOX_SIZE - ((y - DOMAIN_MIN) / SPAN) * VIEWBOX_SIZE,
  };
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

export function renderPlane(svg, { rows, perceptron, activeIndex }) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const unitSquareStart = toScreen(0, 1);
  const unitSquareEnd = toScreen(1, 0);
  svg.appendChild(
    svgEl("rect", {
      class: "plane-active-region",
      x: unitSquareStart.px,
      y: unitSquareStart.py,
      width: unitSquareEnd.px - unitSquareStart.px,
      height: unitSquareEnd.py - unitSquareStart.py,
    })
  );

  const boundary = boundaryEndpoints(perceptron);
  if (boundary) {
    const [a, b] = boundary;
    const aScreen = toScreen(a.x, a.y);
    const bScreen = toScreen(b.x, b.y);
    svg.appendChild(svgEl("line", { class: "plane-boundary", x1: aScreen.px, y1: aScreen.py, x2: bScreen.px, y2: bScreen.py }));

    // The gradient (w1, w2) points toward increasing sum — i.e. toward the
    // "positive"/output-1 side of the line. Drop a +/- badge on each side.
    const { w1, w2 } = perceptron;
    const magnitude = Math.hypot(w1, w2);
    if (magnitude > 1e-6) {
      const nx = w1 / magnitude;
      const ny = w2 / magnitude;

      // Slide along the drawn segment (a to b) to the point nearest the
      // canvas center, clamped so it can't slide past either endpoint. This
      // keeps the badges on the visible line while pulling them toward the
      // middle of the plane instead of the middle of the (possibly
      // off-center) segment.
      const canvasCenter = (DOMAIN_MIN + DOMAIN_MAX) / 2;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const lengthSq = dx * dx + dy * dy;
      const t = lengthSq > 1e-9 ? ((canvasCenter - a.x) * dx + (canvasCenter - a.y) * dy) / lengthSq : 0;
      const tClamped = Math.max(0, Math.min(1, t));
      const midX = a.x + tClamped * dx;
      const midY = a.y + tClamped * dy;
      const offset = 0.15;

      const plus = toScreen(midX + nx * offset, midY + ny * offset);
      const minus = toScreen(midX - nx * offset, midY - ny * offset);

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

  rows.forEach(([x1, x2, expected], index) => {
    const actual = perceptron.predict(x1, x2);
    const correct = actual === expected;
    const { px, py } = toScreen(x1, x2);

    if (index === activeIndex) {
      svg.appendChild(svgEl("circle", { class: "plane-point-active-ring", cx: px, cy: py, r: 16 }));
    }

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
  });
}
