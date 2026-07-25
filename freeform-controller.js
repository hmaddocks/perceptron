import { Perceptron, EPOCH_CAP } from "./perceptron.js";
import { CLASS_A, CLASS_B, PRESET_SEPARABLE, PRESET_NON_SEPARABLE } from "./freeform-data.js";
import { renderPlane, eventToDomain, clampToActiveRegion } from "./freeform-plane.js";

const RUN_INTERVAL_MS = 60;
const LEARNING_RATE = 0.1;

// Freeform starts from small random weights (rather than the gate demo's
// zero-init) so there's visible work for Training mode to do immediately.
function randomStartingPerceptron() {
  const randWeight = () => (Math.random() * 2 - 1) * 0.5;
  return new Perceptron(randWeight(), randWeight(), randWeight());
}

export function createController(root) {
  const q = (role) => root.querySelector(`[data-role="${role}"]`);
  const qa = (role) => Array.from(root.querySelectorAll(`[data-role="${role}"]`));

  const svg = q("plane");

  const state = {
    perceptron: randomStartingPerceptron(),
    points: [],
    currentClass: CLASS_A,
    epoch: 0,
    pointCursor: 0,
    misclassifiedInEpoch: 0,
    converged: false,
    running: false,
    lastComputation: null, // { point, pred, error } from the most recent training step
    intervalId: null,
  };

  function fmt(n) {
    return Number(n).toFixed(2);
  }

  function stopRun() {
    if (state.intervalId !== null) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    state.running = false;
  }

  // Applies the learning rule to a single point, without rendering. Returns
  // false if there was nothing to do (already converged/capped/empty).
  function applyOnePoint() {
    if (state.converged || state.points.length === 0 || state.epoch >= EPOCH_CAP) return false;
    const point = state.points[state.pointCursor];
    const { pred, error } = state.perceptron.applyPoint(point, LEARNING_RATE);
    state.lastComputation = { point, pred, error };
    if (error !== 0) state.misclassifiedInEpoch++;

    state.pointCursor++;
    if (state.pointCursor >= state.points.length) {
      state.pointCursor = 0;
      state.epoch++;
      if (state.misclassifiedInEpoch === 0) {
        state.converged = true;
        stopRun();
      }
      state.misclassifiedInEpoch = 0;
    }
    if (state.epoch >= EPOCH_CAP) stopRun();
    return true;
  }

  // Run animates one point at a time, so its progress is visible.
  function stepPoint() {
    if (applyOnePoint()) render();
  }

  // Step (the button) advances a full epoch — every point once — in one click.
  function stepEpoch() {
    const startEpoch = state.epoch;
    while (state.epoch === startEpoch && applyOnePoint()) {
      // keep going until the epoch counter ticks over (or we hit convergence/cap)
    }
    render();
  }

  function toggleRun() {
    if (state.running) {
      stopRun();
    } else if (!state.converged && state.epoch < EPOCH_CAP && state.points.length > 0) {
      state.running = true;
      state.intervalId = setInterval(stepPoint, RUN_INTERVAL_MS);
    }
    render();
  }

  function reset() {
    stopRun();
    state.perceptron = randomStartingPerceptron();
    state.points = [];
    state.epoch = 0;
    state.pointCursor = 0;
    state.misclassifiedInEpoch = 0;
    state.converged = false;
    state.lastComputation = null;
    render();
  }

  function loadPreset(points) {
    stopRun();
    state.points = points.map((p) => ({ ...p }));
    state.epoch = 0;
    state.pointCursor = 0;
    state.misclassifiedInEpoch = 0;
    state.converged = false;
    state.lastComputation = null;
    render();
  }

  function clearPoints() {
    loadPreset([]);
  }

  function addPoint(x, y) {
    state.points.push({ x, y, label: state.currentClass });
    state.epoch = 0;
    state.pointCursor = 0;
    state.misclassifiedInEpoch = 0;
    state.converged = false;
    render();
  }

  // --- Weight/bias sliders ---
  q("w1-slider")?.addEventListener("input", (e) => {
    state.perceptron.w1 = Number(e.target.value);
    render();
  });
  q("w2-slider")?.addEventListener("input", (e) => {
    state.perceptron.w2 = Number(e.target.value);
    render();
  });
  q("bias-slider")?.addEventListener("input", (e) => {
    state.perceptron.bias = Number(e.target.value);
    render();
  });

  // --- Click the plane to add a training point of the current class ---
  svg?.addEventListener("pointerdown", (e) => {
    const { x, y } = eventToDomain(svg, e);
    const clamped = clampToActiveRegion(x, y);
    addPoint(clamped.x, clamped.y);
  });

  // --- Class toggle ---
  qa("class-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.currentClass = Number(btn.dataset.classValue);
      render();
    });
  });

  // --- Training controls ---
  q("step-btn")?.addEventListener("click", stepEpoch);
  q("run-btn")?.addEventListener("click", toggleRun);
  q("reset-btn")?.addEventListener("click", reset);
  q("preset-separable")?.addEventListener("click", () => loadPreset(PRESET_SEPARABLE));
  q("preset-nonseparable")?.addEventListener("click", () => loadPreset(PRESET_NON_SEPARABLE));
  q("clear-points")?.addEventListener("click", clearPoints);

  function statusText() {
    if (state.points.length === 0) return "Click the plane to add training points, or load a preset";
    if (state.converged) return `✓ Converged after ${state.epoch} epoch${state.epoch === 1 ? "" : "s"}`;
    if (state.epoch >= EPOCH_CAP) return `⚠ Stopped after ${EPOCH_CAP} epochs — not linearly separable`;
    return `Epoch ${state.epoch} · ${state.misclassifiedInEpoch} misclassified so far this pass`;
  }

  function render() {
    renderPlane(svg, state);

    // Slider + readout values
    const w1 = q("w1-slider");
    if (w1) w1.value = state.perceptron.w1;
    const w2 = q("w2-slider");
    if (w2) w2.value = state.perceptron.w2;
    const bias = q("bias-slider");
    if (bias) bias.value = state.perceptron.bias;
    if (q("w1-value")) q("w1-value").textContent = fmt(state.perceptron.w1);
    if (q("w2-value")) q("w2-value").textContent = fmt(state.perceptron.w2);
    if (q("bias-value")) q("bias-value").textContent = fmt(state.perceptron.bias);
    if (q("epoch-count")) q("epoch-count").textContent = state.epoch;

    // Class toggle active state
    qa("class-toggle").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.classValue) === state.currentClass);
    });

    // Run button label
    const runBtn = q("run-btn");
    if (runBtn) runBtn.textContent = state.running ? "Pause" : "Run";

    if (q("status")) q("status").textContent = statusText();

    const indicator = q("training-indicator");
    if (indicator) {
      indicator.textContent = state.running ? "● Training…" : "■ Stopped";
      indicator.classList.toggle("running", state.running);
    }

    // Computation view shows the most recently processed training point.
    const calc = state.lastComputation ? { x: state.lastComputation.point.x, y: state.lastComputation.point.y } : null;
    const sum = calc ? state.perceptron.sum(calc.x, calc.y) : null;
    const output = calc ? state.perceptron.predict(calc.x, calc.y) : null;
    const setCalc = (role, value) => {
      const el = q(role);
      if (el) el.textContent = value;
    };
    setCalc("calc-x1", calc ? fmt(calc.x) : "—");
    setCalc("calc-x2", calc ? fmt(calc.y) : "—");
    setCalc("calc-w1", fmt(state.perceptron.w1));
    setCalc("calc-w2", fmt(state.perceptron.w2));
    setCalc("calc-bias", fmt(state.perceptron.bias));
    setCalc("calc-sum", sum === null ? "—" : fmt(sum));
    setCalc("calc-output", output === null ? "—" : String(output));
  }

  render();

  return {
    destroy() {
      stopRun();
    },
  };
}
