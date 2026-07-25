// PROTOTYPE — throwaway UI-layout exploration. Not production code.
// Variant B: top-to-bottom signal-flow — a literal node diagram of the
// arithmetic across the top, the plane centered below it, controls in a
// bottom toolbar. Emphasizes "how the computation flows" over dashboard chrome.

import { createController } from "./controller.js";

const TEMPLATE = `
  <div class="variant-b">
    <div class="vb-flow">
      <div class="vb-node vb-input"><span class="vb-node-label">x1</span><span data-role="calc-x1" class="vb-node-value"></span></div>
      <div class="vb-op">×</div>
      <div class="vb-node vb-weight"><span class="vb-node-label">w1</span><span data-role="calc-w1" class="vb-node-value"></span></div>
      <div class="vb-op">+</div>
      <div class="vb-node vb-input"><span class="vb-node-label">x2</span><span data-role="calc-x2" class="vb-node-value"></span></div>
      <div class="vb-op">×</div>
      <div class="vb-node vb-weight"><span class="vb-node-label">w2</span><span data-role="calc-w2" class="vb-node-value"></span></div>
      <div class="vb-op">+</div>
      <div class="vb-node vb-bias"><span class="vb-node-label">bias</span><span data-role="calc-bias" class="vb-node-value"></span></div>
      <div class="vb-arrow">→</div>
      <div class="vb-node vb-sum"><span class="vb-node-label">sum</span><span data-role="calc-sum" class="vb-node-value"></span></div>
      <div class="vb-arrow">→</div>
      <div class="vb-node vb-step"><span class="vb-node-label">step</span></div>
      <div class="vb-arrow">→</div>
      <div class="vb-node vb-output"><span class="vb-node-label">output</span><span data-role="calc-output" class="vb-node-value"></span></div>
    </div>

    <div class="vb-plane-wrap">
      <svg data-role="plane" viewBox="0 0 400 400"></svg>
    </div>

    <p data-role="status" class="vb-status"></p>

    <div class="vb-toolbar">
      <div class="vb-toolbar-group">
        <button data-role="mode-manual" class="vb-tab">Manual</button>
        <button data-role="mode-training" class="vb-tab">Training</button>
      </div>

      <div data-manual-only class="vb-toolbar-group">
        <label class="vb-inline-slider">w1 <input data-role="w1-slider" type="range" min="-2" max="2" step="0.01" /></label>
        <label class="vb-inline-slider">w2 <input data-role="w2-slider" type="range" min="-2" max="2" step="0.01" /></label>
        <label class="vb-inline-slider">bias <input data-role="bias-slider" type="range" min="-2" max="2" step="0.01" /></label>
      </div>

      <div data-training-only class="vb-toolbar-group">
        <button data-role="class-toggle" data-class-value="0" class="class-a-btn">A</button>
        <button data-role="class-toggle" data-class-value="1" class="class-b-btn">B</button>
        <button data-role="preset-separable">Separable</button>
        <button data-role="preset-nonseparable">Non-separable</button>
        <button data-role="clear-points">Clear</button>
        <label class="vb-inline-slider">rate <input data-role="lr-slider" type="range" min="0.01" max="1" step="0.01" /></label>
        <button data-role="step-btn">Step</button>
        <button data-role="run-btn">Run</button>
        <button data-role="reset-btn">Reset</button>
        <span class="vb-epoch">Epoch <span data-role="epoch-count"></span></span>
      </div>
    </div>
  </div>
`;

export function mount(root) {
  root.innerHTML = TEMPLATE;
  return createController(root);
}
