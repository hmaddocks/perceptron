// PROTOTYPE — throwaway UI-layout exploration. Not production code.

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

export function renderPlane(svg, { points, testPoint, perceptron, mode }) {
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

  const boundary = perceptron.boundaryEndpoints();
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

  if (mode === "manual" && testPoint) {
    const { px, py } = toScreen(testPoint.x, testPoint.y);
    const r = 10;
    svg.appendChild(
      svgEl("polygon", {
        class: "plane-test-point",
        points: `${px},${py - r} ${px + r},${py} ${px},${py + r} ${px - r},${py}`,
      })
    );
  }
}
