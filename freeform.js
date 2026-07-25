import { createController } from "./freeform-controller.js";

const TEMPLATE = `
  <div class="variant-a">
    <header class="va-header">
      <h1>Perceptron — Freeform Classifier</h1>
      <p data-role="status" class="va-status"></p>
    </header>
    <div class="va-body">
      <div class="va-plane-col">
        <svg data-role="plane" viewBox="0 0 400 400"></svg>
      </div>
      <aside class="va-sidebar">
        <div class="va-tabs">
          <button data-role="mode-manual" class="va-tab">Manual</button>
          <button data-role="mode-training" class="va-tab">Training</button>
        </div>

        <section data-manual-only class="va-panel">
          <h2>Weights &amp; bias</h2>
          <label class="va-slider-row">
            <span>w1</span>
            <input data-role="w1-slider" type="range" min="-2" max="2" step="0.01" />
            <span data-role="w1-value" class="va-value"></span>
          </label>
          <label class="va-slider-row">
            <span>w2</span>
            <input data-role="w2-slider" type="range" min="-2" max="2" step="0.01" />
            <span data-role="w2-value" class="va-value"></span>
          </label>
          <label class="va-slider-row">
            <span>bias</span>
            <input data-role="bias-slider" type="range" min="-2" max="2" step="0.01" />
            <span data-role="bias-value" class="va-value"></span>
          </label>
        </section>

        <section data-training-only class="va-panel">
          <h2>Training data</h2>
          <div class="va-class-toggle">
            <button data-role="class-toggle" data-class-value="0" class="class-a-btn">● Class A</button>
            <button data-role="class-toggle" data-class-value="1" class="class-b-btn">● Class B</button>
          </div>
          <div class="va-buttons">
            <button data-role="preset-separable">Separable example</button>
            <button data-role="preset-nonseparable">Non-separable example</button>
            <button data-role="clear-points">Clear points</button>
          </div>

          <h2>Learning</h2>
          <label class="va-slider-row">
            <span>Rate</span>
            <input data-role="lr-slider" type="range" min="0.01" max="1" step="0.01" />
            <span data-role="lr-value" class="va-value"></span>
          </label>
          <div class="va-buttons">
            <button data-role="step-btn">Step</button>
            <button data-role="run-btn">Run</button>
            <button data-role="reset-btn">Reset</button>
          </div>
          <p class="va-epoch">Epoch <span data-role="epoch-count"></span></p>
        </section>

        <section class="va-computation">
          <h2>Computation</h2>
          <p class="va-formula">
            <span data-role="calc-x1"></span>×<span data-role="calc-w1"></span>
            + <span data-role="calc-x2"></span>×<span data-role="calc-w2"></span>
            + <span data-role="calc-bias"></span>
            = <strong data-role="calc-sum"></strong>
          </p>
          <p>step(sum) = <strong data-role="calc-output"></strong></p>
        </section>
      </aside>
    </div>
  </div>
`;

const root = document.getElementById("app");
root.innerHTML = TEMPLATE;
createController(root);
