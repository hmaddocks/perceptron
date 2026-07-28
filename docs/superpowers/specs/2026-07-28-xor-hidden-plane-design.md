# XOR hidden-activation plane

## Purpose

The XOR Network page shows the node/edge diagram (`xor-network-diagram.js`) but has no geometric view of *why* the network solves XOR: each Hidden neuron is itself a Perceptron with its own straight-line boundary over the raw `(x1, x2)` inputs, and it's the transform through those two boundaries into `(h1out, h2out)` space that makes the XOR rows linearly separable for the Output neuron. This mirrors the motivation in ADR-0004 (Plane view added back to the AND/OR page for the geometric intuition truth tables don't give) — same idea, applied to the Output neuron's hidden-space input instead of the raw inputs.

This adds a second view to the XOR Network page — a plane plotting each XOR row's `(h1out, h2out)` point, colored/ringed the same way `plane.js` does, with the Output neuron's decision boundary drawn through them.

## Scope

In scope: the hidden-activation plane for the Output neuron only (the `(h1out, h2out)` → out transform). Plotting the Hidden neurons' own boundaries over the raw `(x1, x2)` plane (the earlier "#1" idea) is explicitly out of scope for this change.

## New file: `xor-hidden-plane.js`

Exports one function:

```js
renderHiddenPlane(svg, { rows, neurons })
```

- `rows` — `XOR_ROWS`, the 4 `[x1, x2, expected]` triples.
- `neurons` — `state.neurons` (`h1`, `h2`, `out`).

Behavior:

1. For each row, run `computeNetwork(neurons, x1, x2)` to get `(h1out, h2out)` and the Output neuron's actual prediction.
2. Group rows by identical `(h1out, h2out)` — see "Grouping & jitter" below.
3. Draw the Output neuron's decision boundary and side badges (same geometry as `plane.js`, since `h1out`/`h2out` ∈ {0, 1} match the same padded unit-square domain).
4. Draw each row as a point, colored by `expected` and ringed `correct`/`misclassified` by comparing to the Output neuron's actual prediction — same visual language as `plane.js` — labeled with its *original* `(x1, x2)` input pair (not the hidden coordinates).

No click handling on points and no active-row ring — this view is display-only; it doesn't drive `state.activeRowIndex` and isn't affected by it. It only reacts to the sliders (`state.neurons`), same as everything else on the page.

This file duplicates rather than imports the small domain/geometry helpers from `plane.js` (`svgEl`, the padded-unit-square domain constants, the corrected 4-edge boundary-clipping logic, the side-badge placement math). These are two independent single-file view modules in this codebase, and the shared logic is a self-contained ~20-30 lines; importing across them would couple two otherwise-unrelated views for a small amount of code.

### Grouping & jitter

h1out and h2out are each binary, so there are only 4 possible hidden-space locations — the corners of the unit square — same as the number of rows. Unless the hidden weights fully separate XOR, multiple rows will often land on the same corner, including rows with different `expected` values. Each occupied corner is treated as a group:

```js
function groupByCorner(rows, neurons) {
  const groups = new Map(); // key "h1out,h2out" -> array of point entries
  for (const [x1, x2, expected] of rows) {
    const { h1, h2, out } = computeNetwork(neurons, x1, x2);
    const key = `${h1.output},${h2.output}`;
    const entry = { x1, x2, expected, hx: h1.output, hy: h2.output, actual: out.output };
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  return groups;
}
```

A group of size 1 renders its point dead-center on the corner (the common case once weights solve XOR). A group of size *n* > 1 places its members at `n` evenly-spaced angles around a small fixed radius (~0.12 domain units) centered on the corner — large enough to visually separate the rendered points, small enough to stay clearly "at" that corner (corners are 1.0 domain unit apart). Each member keeps its own fill color, correct/misclassified ring, and label (its original `(x1, x2)`) regardless of jitter position.

### Boundary line & badges

Duplicated from the (already fixed) `plane.js` logic:

- `VIEWBOX_SIZE = 400`, `DOMAIN_MIN = -0.6`, `DOMAIN_MAX = 1.6` (padded unit square).
- Boundary-line endpoints found by clipping the infinite line `w1·x + w2·y + bias = 0` against all 4 edges of the domain square (not just evaluating y at the two x-edges — see the earlier plane.js bug fix), computed against `neurons.out`.
- Dashed active-region square from (0,1) to (1,0).
- `+`/`-` side badges (labeled "1"/"0") straddling the boundary line at the point nearest the canvas center, clamped to the segment.

## UI integration

**`xor-network.html`** — wrap the existing diagram in a toggle group, add a second `<svg>`:

```html
<div class="diagram-wrap">
  <nav class="view-menu">
    <button data-view="diagram" data-role="view-diagram-btn">Diagram</button>
    <button data-view="hidden-plane" data-role="view-hidden-plane-btn">Hidden-activation plane</button>
  </nav>
  <svg data-role="diagram" viewBox="0 0 500 400"></svg>
  <svg data-role="hidden-plane" viewBox="0 0 400 400"></svg>
</div>
```

**`xor-network-controller.js`**:

- Add `state.diagramView = "diagram"` (`"diagram" | "hidden-plane"`).
- Click handlers on the two toggle buttons call `setDiagramView(view)`, which updates state and calls `render()`.
- `render()` always renders both SVGs unconditionally (cheap — 4 points) and sets `diagramWrap.dataset.activeView = state.diagramView`; CSS handles show/hide. This matches the existing AND/OR page pattern (`body[data-active-view]`) and keeps `render()` simple rather than conditionally skipping a render pass.
- Import and call `renderHiddenPlane(hiddenPlaneSvg, { rows: XOR_ROWS, neurons: state.neurons })` alongside the existing `renderDiagram` call.

**`xor-network.css`** — a `.view-menu` ruleset scoped to this page (duplicated from `style.css`'s, since `xor-network.html` doesn't currently link `style.css`), plus:

```css
[data-active-view="diagram"] [data-role="hidden-plane"] { display: none; }
[data-active-view="hidden-plane"] [data-role="diagram"] { display: none; }
```

## Glossary

Add a `CONTEXT.md` entry for **Hidden-activation plane**: the XOR Network page's second view, plotting each row's `(h1out, h2out)` point with the Output neuron's decision boundary — the geometric counterpart to the node/edge Diagram view, showing why the hidden layer's transform makes XOR linearly separable.

## Testing

No test framework exists in this project (plain vanilla JS, no build step — ADR-0001). Verification is manual: load `xor-network.html`, toggle to the new view, and check against the canonical `SOLUTION` weights (h1 ≈ OR, h2 ≈ NAND) that all 4 points render at distinct corners with correct colors/rings and the boundary separates them; then perturb sliders to force a collision (e.g. zero out h1's weights) and confirm colliding rows render as a small jittered cluster rather than overlapping silently.
