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

// Endpoints of the line w1*x + w2*y + bias = 0, clipped to a generous range.
function boundaryEndpoints(perceptron) {
  const { w1, w2, bias } = perceptron;
  const clamp = (v) => Math.max(-3, Math.min(3, v));
  if (Math.abs(w2) > 1e-6) {
    const yAt = (x) => -(w1 * x + bias) / w2;
    return [
      { x: DOMAIN_MIN, y: clamp(yAt(DOMAIN_MIN)) },
      { x: DOMAIN_MAX, y: clamp(yAt(DOMAIN_MAX)) },
    ];
  }
  if (Math.abs(w1) > 1e-6) {
    const x0 = -bias / w1;
    return [
      { x: x0, y: DOMAIN_MIN },
      { x: x0, y: DOMAIN_MAX },
    ];
  }
  return null;
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
    const [a, b] = boundary.map(({ x, y }) => toScreen(x, y));
    svg.appendChild(svgEl("line", { class: "plane-boundary", x1: a.px, y1: a.py, x2: b.px, y2: b.py }));
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
