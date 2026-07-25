import { Perceptron, GATES, EPOCH_CAP } from "./perceptron.js";

const RUN_INTERVAL_MS = 500;

const state = {
  gate: "AND",
  mode: "manual",
  perceptron: new Perceptron(),
  learningRate: 0.1,
  epoch: 0,
  rowCursor: 0,
  misclassifiedInEpoch: 0,
  converged: false,
  running: false,
  intervalId: null,
  lastRowIndex: null,
};

const fmt = (n) => Number(n).toFixed(2);

const gateSelector = document.getElementById("gate-selector");
const modeManualBtn = document.getElementById("mode-manual");
const modeTrainingBtn = document.getElementById("mode-training");
const manualPanel = document.getElementById("manual-panel");
const trainingPanel = document.getElementById("training-panel");
const tableBody = document.getElementById("truth-table-body");
const statusEl = document.getElementById("status");
const epochEl = document.getElementById("epoch-count");

const w1Slider = document.getElementById("w1-slider");
const w2Slider = document.getElementById("w2-slider");
const biasSlider = document.getElementById("bias-slider");
const w1Value = document.getElementById("w1-value");
const w2Value = document.getElementById("w2-value");
const biasValue = document.getElementById("bias-value");

const lrSlider = document.getElementById("lr-slider");
const lrValue = document.getElementById("lr-value");
const stepBtn = document.getElementById("step-btn");
const runBtn = document.getElementById("run-btn");
const resetBtn = document.getElementById("reset-btn");

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
  const { error } = state.perceptron.applyRow(row, state.learningRate);
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

gateSelector.querySelectorAll("[data-gate]").forEach((btn) => {
  btn.addEventListener("click", () => setGate(btn.dataset.gate));
});
modeManualBtn.addEventListener("click", () => setMode("manual"));
modeTrainingBtn.addEventListener("click", () => setMode("training"));

w1Slider.addEventListener("input", (e) => {
  state.perceptron.w1 = Number(e.target.value);
  render();
});
w2Slider.addEventListener("input", (e) => {
  state.perceptron.w2 = Number(e.target.value);
  render();
});
biasSlider.addEventListener("input", (e) => {
  state.perceptron.bias = Number(e.target.value);
  render();
});

lrSlider.addEventListener("input", (e) => {
  state.learningRate = Number(e.target.value);
  render();
});

stepBtn.addEventListener("click", stepOnce);
runBtn.addEventListener("click", toggleRun);
resetBtn.addEventListener("click", reset);

function statusText() {
  if (state.mode === "manual") return "Manual mode — adjust the sliders and watch the table update";
  const rows = GATES[state.gate];
  if (state.converged) return `✓ Converged after ${state.epoch} epoch${state.epoch === 1 ? "" : "s"}`;
  if (state.epoch >= EPOCH_CAP) return `⚠ Stopped after ${EPOCH_CAP} epochs — ${state.gate} is not linearly separable`;
  return `Epoch ${state.epoch} · ${state.misclassifiedInEpoch}/${rows.length} misclassified so far this pass`;
}

function formatCalculation(x1, x2, w1, w2, bias, sum) {
  const signedBias = bias >= 0 ? `+ ${fmt(bias)}` : `- ${fmt(Math.abs(bias))}`;
  const terms = `${x1}×${fmt(w1)} + ${x2}×${fmt(w2)} ${signedBias}`;
  return `${terms} = <span class="calc-sum">${fmt(sum)}</span>`;
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

function render() {
  document.body.dataset.mode = state.mode;

  gateSelector.querySelectorAll("[data-gate]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.gate === state.gate);
  });
  modeManualBtn.classList.toggle("active", state.mode === "manual");
  modeTrainingBtn.classList.toggle("active", state.mode === "training");

  w1Slider.value = state.perceptron.w1;
  w2Slider.value = state.perceptron.w2;
  biasSlider.value = state.perceptron.bias;
  w1Value.textContent = fmt(state.perceptron.w1);
  w2Value.textContent = fmt(state.perceptron.w2);
  biasValue.textContent = fmt(state.perceptron.bias);

  lrSlider.value = state.learningRate;
  lrValue.textContent = fmt(state.learningRate);
  epochEl.textContent = state.epoch;
  runBtn.textContent = state.running ? "Pause" : "Run";

  statusEl.textContent = statusText();

  renderTable();
}

render();
