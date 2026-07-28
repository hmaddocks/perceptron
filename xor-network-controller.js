import { XOR_ROWS, SOLUTION, computeNetwork, cloneNeurons } from "./xor-network-model.js";
import { renderDiagram } from "./xor-network-diagram.js";
import { renderHiddenPlane } from "./xor-hidden-plane.js";

const NEURON_KEYS = ["h1", "h2", "out"];
const WEIGHT_FIELDS = ["w1", "w2", "bias"];

export function createController(root) {
  const getElement = (role) => root.querySelector(`[data-role="${role}"]`);

  const svg = getElement("diagram");

  const state = {
    neurons: cloneNeurons(SOLUTION),
    activeRowIndex: 0,
    diagramView: "diagram",
  };

  function format(n) {
    return Number(n).toFixed(2);
  }

  // Avoids "-0.00" from e.g. 0 * -1.
  function formatProduct(n) {
    const rounded = Math.round(n * 100) / 100;
    return (rounded === 0 ? 0 : rounded).toFixed(2);
  }

  // Renders a signed term for a running formula: the first term has no
  // leading sign unless negative; later terms always show "+" or "-".
  function signedTerm(n, isFirst) {
    const rounded = Math.round(n * 100) / 100;
    const value = rounded === 0 ? 0 : rounded;
    const abs = Math.abs(value).toFixed(2);
    if (isFirst) return value < 0 ? `-${abs}` : abs;
    return value < 0 ? `- ${abs}` : `+ ${abs}`;
  }

  function sumFormula(term1, term2, bias, sum) {
    return `${signedTerm(term1, true)} ${signedTerm(term2, false)} ${signedTerm(bias, false)} = ${formatProduct(sum)}`;
  }

  function resetToSolution() {
    state.neurons = cloneNeurons(SOLUTION);
    render();
  }

  // --- Weight/bias sliders (one set of 3 per neuron: w1, w2, bias) ---
  for (const neuronKey of NEURON_KEYS) {
    for (const field of WEIGHT_FIELDS) {
      const slider = getElement(`${neuronKey}-${field}-slider`);
      slider?.addEventListener("input", (e) => {
        state.neurons[neuronKey][field] = Number(e.target.value);
        render();
      });
    }
  }

  getElement("reset-btn")?.addEventListener("click", resetToSolution);

  const diagramWrap = getElement("diagram-wrap");
  const hiddenPlaneSvg = getElement("hidden-plane");

  function setDiagramView(view) {
    state.diagramView = view;
    render();
  }

  getElement("view-diagram-btn")?.addEventListener("click", () => setDiagramView("diagram"));
  getElement("view-hidden-plane-btn")?.addEventListener("click", () => setDiagramView("hidden-plane"));

  function computeAllRows() {
    return XOR_ROWS.map(([x1, x2, expected]) => {
      const result = computeNetwork(state.neurons, x1, x2);
      return { x1, x2, expected, result, correct: result.out.output === expected };
    });
  }

  function renderTable(rows) {
    const tbody = getElement("table-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    rows.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.dataset.role = "table-row";
      tr.classList.toggle("active", index === state.activeRowIndex);
      tr.innerHTML = `
        <td>${row.x1}</td>
        <td>${row.x2}</td>
        <td>${row.expected}</td>
        <td>${row.result.h1.output}</td>
        <td>${row.result.h2.output}</td>
        <td>${row.result.out.output}</td>
        <td class="${row.correct ? "correct" : "misclassified"}">${row.correct ? "✓" : "✗"}</td>
      `;
      tr.addEventListener("click", () => {
        state.activeRowIndex = index;
        render();
      });
      tbody.appendChild(tr);
    });
  }

  function renderComputation(activeRow) {
    const neurons = state.neurons;
    const { x1, x2, result } = activeRow;

    const h1Formula = sumFormula(x1 * neurons.h1.w1, x2 * neurons.h1.w2, neurons.h1.bias, result.h1.sum);
    const h2Formula = sumFormula(x1 * neurons.h2.w1, x2 * neurons.h2.w2, neurons.h2.bias, result.h2.sum);
    const outFormula = sumFormula(
      result.h1.output * neurons.out.w1,
      result.h2.output * neurons.out.w2,
      neurons.out.bias,
      result.out.sum
    );

    const setFormula = (role, value) => {
      const el = getElement(role);
      if (el) el.textContent = value;
    };
    setFormula("h1-formula", h1Formula);
    setFormula("h2-formula", h2Formula);
    setFormula("out-formula", outFormula);
  }

  function render() {
    const rows = computeAllRows();
    const correctCount = rows.filter((r) => r.correct).length;

    renderDiagram(svg, { neurons: state.neurons, activeRow: XOR_ROWS[state.activeRowIndex] });
    renderHiddenPlane(hiddenPlaneSvg, { rows: XOR_ROWS, neurons: state.neurons });
    if (diagramWrap) diagramWrap.dataset.activeView = state.diagramView;
    getElement("view-diagram-btn")?.classList.toggle("active", state.diagramView === "diagram");
    getElement("view-hidden-plane-btn")?.classList.toggle("active", state.diagramView === "hidden-plane");
    renderTable(rows);
    renderComputation(rows[state.activeRowIndex]);

    for (const neuronKey of NEURON_KEYS) {
      for (const field of WEIGHT_FIELDS) {
        const value = state.neurons[neuronKey][field];
        const slider = getElement(`${neuronKey}-${field}-slider`);
        if (slider) slider.value = value;
        const readout = getElement(`${neuronKey}-${field}-value`);
        if (readout) readout.textContent = format(value);
      }
    }

    const status = getElement("status");
    if (status) {
      status.textContent =
        correctCount === 4
          ? "✓ Solving XOR — all 4 rows correct"
          : `${correctCount} of 4 rows correct — click a row to inspect it in the diagram`;
    }
  }

  render();
}
