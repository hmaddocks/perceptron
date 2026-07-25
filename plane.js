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
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const offset = 0.15;

      const plus = toScreen(midX + nx * offset, midY + ny * offset);
      const minus = toScreen(midX - nx * offset, midY - ny * offset);

      svg.appendChild(svgEl("circle", { class: "plane-side-badge positive", cx: plus.px, cy: plus.py, r: 12 }));
      const plusLabel = svgEl("text", { class: "plane-side-label", x: plus.px, y: plus.py });
      plusLabel.textContent = "+";
      svg.appendChild(plusLabel);

      svg.appendChild(svgEl("circle", { class: "plane-side-badge negative", cx: minus.px, cy: minus.py, r: 12 }));
      const minusLabel = svgEl("text", { class: "plane-side-label", x: minus.px, y: minus.py });
      minusLabel.textContent = "−";
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
