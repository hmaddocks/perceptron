import { Perceptron, GATES, EPOCH_CAP } from "./perceptron.js";
import { renderPlane } from "./plane.js";
import { mountSiteNav } from "./nav.js";

mountSiteNav("index.html");

const RUN_INTERVAL_MS = 500;
const LEARNING_RATE = 0.1;

const state = {
  gate: "AND",
  mode: "manual",
  view: "table",
  perceptron: new Perceptron(),
  epoch: 0,
  rowCursor: 0,
  misclassifiedInEpoch: 0,
  converged: false,
  running: false,
  intervalId: null,
  lastRowIndex: null,
};

const format = (n) => Number(n).toFixed(2);

const queryElementsByRole = (role) => Array.from(document.querySelectorAll(`[data-role="${role}"]`));

const viewTableBtn = document.getElementById("view-table-btn");
const viewPlaneBtn = document.getElementById("view-plane-btn");
const tableBody = document.getElementById("truth-table-body");
const planeSvg = document.getElementById("plane-svg");

function stopRun() {
  if (state.intervalId !== null) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
  state.running = false;
}

function resetTrainingProgress() {
  state.epoch = 0;
  state.rowCursor = 0;
  state.misclassifiedInEpoch = 0;
  state.converged = false;
  state.lastRowIndex = null;
}

function setView(view) {
  state.view = view;
  render();
}

function setGate(gate) {
  stopRun();
  state.gate = gate;
  state.perceptron = new Perceptron();
  resetTrainingProgress();
  render();
}

function setMode(mode) {
  state.mode = mode;
  render();
}

function stepOnce() {
  const rows = GATES[state.gate];
  if (state.converged || state.epoch >= EPOCH_CAP) return;

  const row = rows[state.rowCursor];
  const { error } = state.perceptron.applyRow(row, LEARNING_RATE);
  state.lastRowIndex = state.rowCursor;
  if (error !== 0) state.misclassifiedInEpoch++;

  state.rowCursor++;
  if (state.rowCursor >= rows.length) {
    state.rowCursor = 0;
    state.epoch++;
    if (state.misclassifiedInEpoch === 0) {
      state.converged = true;
      stopRun();
    }
    state.misclassifiedInEpoch = 0;
  }
  if (state.epoch >= EPOCH_CAP) stopRun();
  render();
}

function toggleRun() {
  if (state.running) {
    stopRun();
  } else if (!state.converged && state.epoch < EPOCH_CAP) {
    state.running = true;
    state.intervalId = setInterval(stepOnce, RUN_INTERVAL_MS);
  }
  render();
}

function reset() {
  stopRun();
  state.perceptron = new Perceptron();
  resetTrainingProgress();
  render();
}

viewTableBtn.addEventListener("click", () => setView("table"));
viewPlaneBtn.addEventListener("click", () => setView("plane"));

queryElementsByRole("gate-btn").forEach((btn) => {
  btn.addEventListener("click", () => setGate(btn.dataset.gate));
});
queryElementsByRole("mode-manual").forEach((btn) => btn.addEventListener("click", () => setMode("manual")));
queryElementsByRole("mode-training").forEach((btn) => btn.addEventListener("click", () => setMode("training")));

queryElementsByRole("w1-slider").forEach((el) =>
  el.addEventListener("input", (e) => {
    state.perceptron.w1 = Number(e.target.value);
    render();
  })
);
queryElementsByRole("w2-slider").forEach((el) =>
  el.addEventListener("input", (e) => {
    state.perceptron.w2 = Number(e.target.value);
    render();
  })
);
queryElementsByRole("bias-slider").forEach((el) =>
  el.addEventListener("input", (e) => {
    state.perceptron.bias = Number(e.target.value);
    render();
  })
);

queryElementsByRole("step-btn").forEach((btn) => btn.addEventListener("click", stepOnce));
queryElementsByRole("run-btn").forEach((btn) => btn.addEventListener("click", toggleRun));
queryElementsByRole("reset-btn").forEach((btn) => btn.addEventListener("click", reset));

function statusText() {
  if (state.mode === "manual") return "Manual mode — adjust the sliders and watch it update";
  const rows = GATES[state.gate];
  if (state.converged) return `✓ Converged after ${state.epoch} epoch${state.epoch === 1 ? "" : "s"}`;
  if (state.epoch >= EPOCH_CAP) return `⚠ Stopped after ${EPOCH_CAP} epochs — ${state.gate} is not linearly separable`;
  return `Epoch ${state.epoch} · ${state.misclassifiedInEpoch}/${rows.length} misclassified so far this pass`;
}

function formatCalculation(x1, x2, w1, w2, bias, sum) {
  const signedBias = bias >= 0 ? `+ ${format(bias)}` : `- ${format(Math.abs(bias))}`;
  const terms = `${x1}×${format(w1)} + ${x2}×${format(w2)} ${signedBias}`;
  return `${terms} = <span class="calc-sum">${format(sum)}</span>`;
}

function renderTable() {
  const { w1, w2, bias } = state.perceptron;
  const rows = GATES[state.gate];
  tableBody.innerHTML = "";
  rows.forEach(([x1, x2, expected], index) => {
    const sum = state.perceptron.sum(x1, x2);
    const actual = state.perceptron.predict(x1, x2);
    const correct = actual === expected;

    const tr = document.createElement("tr");
    if (state.mode === "training" && index === state.lastRowIndex) {
      tr.classList.add("active-row");
    }
    tr.innerHTML = `
      <td>${x1}</td>
      <td>${x2}</td>
      <td>${expected}</td>
      <td class="numeric calculation">${formatCalculation(x1, x2, w1, w2, bias, sum)}</td>
      <td class="numeric">${actual}</td>
      <td class="check ${correct ? "correct" : "incorrect"}">${correct ? "✓" : "✗"}</td>
    `;
    tableBody.appendChild(tr);
  });
}

function renderPlaneView() {
  renderPlane(planeSvg, {
    rows: GATES[state.gate],
    perceptron: state.perceptron,
    activeIndex: state.mode === "training" ? state.lastRowIndex : null,
  });
}

function render() {
  document.body.dataset.activeView = state.view;
  document.body.dataset.mode = state.mode;

  viewTableBtn.classList.toggle("active", state.view === "table");
  viewPlaneBtn.classList.toggle("active", state.view === "plane");

  queryElementsByRole("gate-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.gate === state.gate));
  queryElementsByRole("mode-manual").forEach((btn) => btn.classList.toggle("active", state.mode === "manual"));
  queryElementsByRole("mode-training").forEach((btn) => btn.classList.toggle("active", state.mode === "training"));

  queryElementsByRole("w1-slider").forEach((el) => (el.value = state.perceptron.w1));
  queryElementsByRole("w2-slider").forEach((el) => (el.value = state.perceptron.w2));
  queryElementsByRole("bias-slider").forEach((el) => (el.value = state.perceptron.bias));
  queryElementsByRole("w1-value").forEach((el) => (el.textContent = format(state.perceptron.w1)));
  queryElementsByRole("w2-value").forEach((el) => (el.textContent = format(state.perceptron.w2)));
  queryElementsByRole("bias-value").forEach((el) => (el.textContent = format(state.perceptron.bias)));

  queryElementsByRole("epoch-count").forEach((el) => (el.textContent = state.epoch));
  queryElementsByRole("run-btn").forEach((el) => (el.textContent = state.running ? "Pause" : "Run"));
  queryElementsByRole("status").forEach((el) => (el.textContent = statusText()));
  queryElementsByRole("training-indicator").forEach((el) => {
    el.textContent = state.running ? "● Training…" : "■ Stopped";
    el.classList.toggle("running", state.running);
  });

  renderTable();
  renderPlaneView();
}

render();
