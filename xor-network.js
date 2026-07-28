import { createController } from "./xor-network-controller.js";
import { mountSiteNav } from "./nav.js";

mountSiteNav("xor-network.html");

function neuronPanel(title, key) {
  return `
    <section class="panel">
      <h2>${title}</h2>
      <label class="slider-row">
        <span>w1</span>
        <input data-role="${key}-w1-slider" type="range" min="-2" max="2" step="0.01" />
        <span data-role="${key}-w1-value" class="value"></span>
      </label>
      <label class="slider-row">
        <span>w2</span>
        <input data-role="${key}-w2-slider" type="range" min="-2" max="2" step="0.01" />
        <span data-role="${key}-w2-value" class="value"></span>
      </label>
      <label class="slider-row">
        <span>bias</span>
        <input data-role="${key}-bias-slider" type="range" min="-2" max="2" step="0.01" />
        <span data-role="${key}-bias-value" class="value"></span>
      </label>
    </section>
  `;
}

const TEMPLATE = `
  <div class="network-app">
    <div class="network-main">
      <div class="diagram-wrap" data-role="diagram-wrap">
        <nav class="view-menu">
          <button type="button" data-view="diagram" data-role="view-diagram-btn">Diagram</button>
          <button type="button" data-view="hidden-plane" data-role="view-hidden-plane-btn">Hidden-activation plane</button>
        </nav>
        <svg data-role="diagram" viewBox="0 0 500 400"></svg>
        <svg data-role="hidden-plane" viewBox="0 0 400 400"></svg>
      </div>

      <table class="truth-table">
        <thead>
          <tr>
            <th>x1</th>
            <th>x2</th>
            <th>expected</th>
            <th>h1</th>
            <th>h2</th>
            <th>out</th>
            <th></th>
          </tr>
        </thead>
        <tbody data-role="table-body"></tbody>
      </table>

      <p data-role="status" class="status"></p>
    </div>

    <aside class="network-sidebar">
      ${neuronPanel("Hidden neuron 1", "h1")}
      ${neuronPanel("Hidden neuron 2", "h2")}
      ${neuronPanel("Output neuron", "out")}
      <div class="buttons">
        <button data-role="reset-btn">Reset to solution</button>
      </div>

      <section class="panel computation-panel">
        <h2>Computation (active row)</h2>
        <p class="calculation"><strong>h1</strong> = <span data-role="h1-formula"></span></p>
        <p class="calculation"><strong>h2</strong> = <span data-role="h2-formula"></span></p>
        <p class="calculation"><strong>out</strong> = <span data-role="out-formula"></span></p>
      </section>
    </aside>
  </div>
`;

const root = document.getElementById("app");
root.innerHTML = TEMPLATE;
createController(root);
