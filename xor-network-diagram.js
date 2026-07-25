import { computeNetwork } from "./xor-network-model.js";

const NODE_R = 26;

// Fixed layout: inputs on the left, hidden layer in the middle, output on the right.
const POS = {
  x1: { x: 70, y: 110 },
  x2: { x: 70, y: 290 },
  h1: { x: 260, y: 80 },
  h2: { x: 260, y: 320 },
  out: { x: 440, y: 200 },
};

function svgEl(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

// Avoids "-0.00" from e.g. 0 * -1.
function fmtProduct(n) {
  const rounded = Math.round(n * 100) / 100;
  return (rounded === 0 ? 0 : rounded).toFixed(2);
}

function edge(svg, fromKey, toKey, weight, inputValue) {
  const a = POS[fromKey];
  const b = POS[toKey];
  svg.appendChild(svgEl("line", { class: "network-edge", x1: a.x, y1: a.y, x2: b.x, y2: b.y }));

  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  const label = svgEl("text", { class: "network-edge-label", x: midX, y: midY });
  label.textContent =
    inputValue === undefined ? weight.toFixed(2) : `${inputValue}×${weight.toFixed(2)}=${fmtProduct(inputValue * weight)}`;
  svg.appendChild(label);
}

function node(svg, key, { label, value, bias }) {
  const { x, y } = POS[key];
  const isNeuron = bias !== undefined;
  svg.appendChild(
    svgEl("circle", {
      class: `network-node ${isNeuron ? "neuron" : "input"} ${value === 1 ? "active" : ""}`,
      cx: x,
      cy: y,
      r: NODE_R,
    })
  );

  const textFill = value === 1 ? "white" : "var(--ink)";

  const labelEl = svgEl("text", { class: "network-node-label", x, y: y - 4, fill: textFill });
  labelEl.textContent = label;
  svg.appendChild(labelEl);

  if (value !== undefined) {
    const valueEl = svgEl("text", { class: "network-node-value", x, y: y + 14, fill: textFill });
    valueEl.textContent = String(value);
    svg.appendChild(valueEl);
  }

  if (isNeuron) {
    const biasEl = svgEl("text", { class: "network-bias-label", x, y: y + NODE_R + 16 });
    biasEl.textContent = `bias: ${bias.toFixed(2)}`;
    svg.appendChild(biasEl);
  }
}

// activeRow is [x1, x2, expected] or null (no row selected — structure only).
export function renderDiagram(svg, { neurons, activeRow }) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const result = activeRow ? computeNetwork(neurons, activeRow[0], activeRow[1]) : null;
  const x1 = activeRow ? activeRow[0] : undefined;
  const x2 = activeRow ? activeRow[1] : undefined;
  const h1out = result ? result.h1.output : undefined;
  const h2out = result ? result.h2.output : undefined;

  edge(svg, "x1", "h1", neurons.h1.w1, x1);
  edge(svg, "x2", "h1", neurons.h1.w2, x2);
  edge(svg, "x1", "h2", neurons.h2.w1, x1);
  edge(svg, "x2", "h2", neurons.h2.w2, x2);
  edge(svg, "h1", "out", neurons.out.w1, h1out);
  edge(svg, "h2", "out", neurons.out.w2, h2out);

  node(svg, "x1", { label: "x1", value: x1 });
  node(svg, "x2", { label: "x2", value: x2 });
  node(svg, "h1", { label: "h1", value: h1out, bias: neurons.h1.bias });
  node(svg, "h2", { label: "h2", value: h2out, bias: neurons.h2.bias });
  node(svg, "out", { label: "out", value: result ? result.out.output : undefined, bias: neurons.out.bias });
}
