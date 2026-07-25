// PROTOTYPE — throwaway UI-layout exploration. Not production code.
// Variant C: the plane IS the page — full-bleed canvas with small floating
// overlay panels for mode, computation, controls, and status. Canvas-first,
// panel-second (the opposite priority from A and B).

import { createController } from "./controller.js";

const TEMPLATE = `
  <div class="variant-c">
    <div class="vc-plane-wrap">
      <svg data-role="plane" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice"></svg>
    </div>

    <div class="vc-mode-switch">
      <button data-role="mode-manual" class="vc-tab">Manual</button>
      <button data-role="mode-training" class="vc-tab">Training</button>
    </div>

    <div class="vc-status-pill" data-role="status"></div>

    <div class="vc-panel vc-panel-computation">
      <h3>Computation</h3>
      <p class="vc-formula">
        <span data-role="calc-x1"></span>·<span data-role="calc-w1"></span>
        + <span data-role="calc-x2"></span>·<span data-role="calc-w2"></span>
        + <span data-role="calc-bias"></span>
        = <strong data-role="calc-sum"></strong>
      </p>
      <p>step → <strong data-role="calc-output"></strong></p>
    </div>

    <div class="vc-panel vc-panel-controls" data-manual-only>
      <h3>Weights &amp; bias</h3>
      <label class="vc-slider-row">w1 <input data-role="w1-slider" type="range" min="-2" max="2" step="0.01" /> <span data-role="w1-value"></span></label>
      <label class="vc-slider-row">w2 <input data-role="w2-slider" type="range" min="-2" max="2" step="0.01" /> <span data-role="w2-value"></span></label>
      <label class="vc-slider-row">bias <input data-role="bias-slider" type="range" min="-2" max="2" step="0.01" /> <span data-role="bias-value"></span></label>
    </div>

    <div class="vc-panel vc-panel-controls" data-training-only>
      <h3>Training</h3>
      <div class="vc-class-toggle">
        <button data-role="class-toggle" data-class-value="0" class="class-a-btn">● A</button>
        <button data-role="class-toggle" data-class-value="1" class="class-b-btn">● B</button>
      </div>
      <div class="vc-buttons">
        <button data-role="preset-separable">Separable</button>
        <button data-role="preset-nonseparable">Non-separable</button>
        <button data-role="clear-points">Clear</button>
      </div>
      <label class="vc-slider-row">rate <input data-role="lr-slider" type="range" min="0.01" max="1" step="0.01" /> <span data-role="lr-value"></span></label>
      <div class="vc-buttons">
        <button data-role="step-btn">Step</button>
        <button data-role="run-btn">Run</button>
        <button data-role="reset-btn">Reset</button>
      </div>
      <p class="vc-epoch">Epoch <span data-role="epoch-count"></span></p>
    </div>
  </div>
`;

export function mount(root) {
  root.innerHTML = TEMPLATE;
  return createController(root);
}
