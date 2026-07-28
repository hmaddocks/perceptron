# XOR Decision-Region Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the XOR Network page's "Hidden-activation plane" view (which plotted 4 points in discrete `(h1out, h2out)` space and needed jitter to handle collisions) with a "Decision regions" view that shades the *original* `(x1, x2)` input plane by the Network's predicted class, with h1's and h2's individual boundary lines drawn on top.

**Architecture:** `xor-hidden-plane.js` keeps its existing `toDomainScreen`/`boundaryEndpoints` geometry (both are generic enough to reuse for `h1`/`h2` directly), drops `groupByCorner`/`jitterOffsets` (no longer needed — there's no collision in continuous input space), and gains a grid-sampling function plus a rewritten render entry point (`renderRegionPlane`, replacing `renderHiddenPlane`). Every other integration point (template, controller, CSS, glossary) gets its "hidden-plane"/"Hidden-activation plane" naming updated to "region-plane"/"Decision regions".

**Tech Stack:** Same as before — plain vanilla JS, ES modules, no build step (ADR-0001), no test framework. Pure grid/geometry logic is verified with one-off Node scripts (deleted before committing); the actual SVG rendering is verified manually in a browser.

## Global Constraints

- No build step, no bundler, no framework (ADR-0001).
- No test framework — verification is one-off Node scripts (deleted before committing) for pure logic, manual browser checks for rendering.
- Follow `CONTEXT.md` terminology: "Hidden neuron", "Output neuron", "Network", and the new **Decision-region plane** term (Task 6).
- Visual language for the 4 points stays identical to `plane.js`: fill by `expected` (`class-a`/`class-b`), ring by `correct`/`misclassified`.
- This view is display-only: no click handling, no active-row ring, never reads/writes `state.activeRowIndex`.

---

### Task 1: `xor-hidden-plane.js` — remove hidden-space code, add grid sampling

**Files:**
- Modify: `xor-hidden-plane.js`

**Interfaces:**
- Consumes: `computeNetwork(neurons, x1, x2)` from `xor-network-model.js` (already imported).
- Produces: `export function sampleGrid(neurons, n)` returning `Array<{x: number, y: number, cls: 0|1}>` of length `n*n`, sampling cell centers of an n×n grid over `[0,1]×[0,1]`; `export function pointNearestCenter(a, b)` returning `{x, y}`, the point on segment `a`→`b` nearest the domain's center, clamped to the segment.
- Removes: `groupByCorner`, `jitterOffsets`, `JITTER_RADIUS`, `renderHiddenPlane` (all replaced in this and the next task).

- [ ] **Step 1: Replace the grouping/jitter/render code**

In `xor-hidden-plane.js`, delete everything from the `JITTER_RADIUS` constant through the end of `renderHiddenPlane` (i.e., delete `JITTER_RADIUS`, `groupByCorner`, `jitterOffsets`, `svgEl`, `renderHiddenPlane` — `svgEl` is re-added in Task 2), leaving only `VIEWBOX_SIZE`, `DOMAIN_MIN`, `DOMAIN_MAX`, `SPAN`, `toDomainScreen`, and `boundaryEndpoints`. Then add:

```js
// Samples an n x n grid of cell centers over the active [0,1]x[0,1] square
// and classifies each by the Network's predicted output there. Works for
// any real x1/x2 (not just 0/1) because computeNetwork's math — weighted
// sum + threshold — is defined everywhere, not just at the training points.
export function sampleGrid(neurons, n) {
  const cells = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const x = (col + 0.5) / n;
      const y = (row + 0.5) / n;
      const { out } = computeNetwork(neurons, x, y);
      cells.push({ x, y, cls: out.output });
    }
  }
  return cells;
}

// The point on segment a->b nearest the domain's center, clamped to the
// segment — used to place a label on a boundary line regardless of how
// steep it is (a plain midpoint can drift off-canvas for steep lines).
export function pointNearestCenter(a, b) {
  const center = (DOMAIN_MIN + DOMAIN_MAX) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq > 1e-9 ? ((center - a.x) * dx + (center - a.y) * dy) / lengthSq : 0;
  const tClamped = Math.max(0, Math.min(1, t));
  return { x: a.x + tClamped * dx, y: a.y + tClamped * dy };
}
```

The file should now read, in full:

```js
import { computeNetwork } from "./xor-network-model.js";

export const VIEWBOX_SIZE = 400;
const DOMAIN_MIN = -0.6;
const DOMAIN_MAX = 1.6;
const SPAN = DOMAIN_MAX - DOMAIN_MIN;

export function toDomainScreen(x, y) {
  return {
    px: ((x - DOMAIN_MIN) / SPAN) * VIEWBOX_SIZE,
    py: VIEWBOX_SIZE - ((y - DOMAIN_MIN) / SPAN) * VIEWBOX_SIZE,
  };
}

// Endpoints of the line w1*x + w2*y + bias = 0, clipped to the domain square.
// Finds where the (infinite) line crosses each of the square's 4 edges, then
// keeps only the crossings that actually land within the square — evaluating
// y at the two x-edges alone breaks down for steep lines (small w2 relative
// to w1), which leave the square through its top/bottom edges instead.
export function boundaryEndpoints(perceptron) {
  const { w1, w2, bias } = perceptron;
  const inRange = (v) => v >= DOMAIN_MIN - 1e-9 && v <= DOMAIN_MAX + 1e-9;
  const points = [];

  if (Math.abs(w2) > 1e-9) {
    for (const x of [DOMAIN_MIN, DOMAIN_MAX]) {
      const y = -(w1 * x + bias) / w2;
      if (inRange(y)) points.push({ x, y });
    }
  }
  if (Math.abs(w1) > 1e-9) {
    for (const y of [DOMAIN_MIN, DOMAIN_MAX]) {
      const x = -(w2 * y + bias) / w1;
      if (inRange(x)) points.push({ x, y });
    }
  }

  const unique = points.filter(
    (p, i) => !points.slice(0, i).some((q) => Math.abs(q.x - p.x) < 1e-6 && Math.abs(q.y - p.y) < 1e-6)
  );
  if (unique.length < 2) return null;
  return [unique[0], unique[unique.length - 1]];
}

// Samples an n x n grid of cell centers over the active [0,1]x[0,1] square
// and classifies each by the Network's predicted output there. Works for
// any real x1/x2 (not just 0/1) because computeNetwork's math — weighted
// sum + threshold — is defined everywhere, not just at the training points.
export function sampleGrid(neurons, n) {
  const cells = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const x = (col + 0.5) / n;
      const y = (row + 0.5) / n;
      const { out } = computeNetwork(neurons, x, y);
      cells.push({ x, y, cls: out.output });
    }
  }
  return cells;
}

// The point on segment a->b nearest the domain's center, clamped to the
// segment — used to place a label on a boundary line regardless of how
// steep it is (a plain midpoint can drift off-canvas for steep lines).
export function pointNearestCenter(a, b) {
  const center = (DOMAIN_MIN + DOMAIN_MAX) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq > 1e-9 ? ((center - a.x) * dx + (center - a.y) * dy) / lengthSq : 0;
  const tClamped = Math.max(0, Math.min(1, t));
  return { x: a.x + tClamped * dx, y: a.y + tClamped * dy };
}
```

- [ ] **Step 2: Write a one-off verification script**

Create `verify-tmp.mjs` at the repo root:

```js
import { sampleGrid, pointNearestCenter, boundaryEndpoints } from "./xor-hidden-plane.js";
import { SOLUTION } from "./xor-network-model.js";

function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`FAIL ${label}: expected ${expected}, got ${actual}`);
  console.log(`ok ${label}`);
}
function assertClose(actual, expected, label, tol = 1e-6) {
  if (Math.abs(actual - expected) > tol) throw new Error(`FAIL ${label}: expected ${expected}, got ${actual}`);
  console.log(`ok ${label}`);
}

// sampleGrid: canonical SOLUTION carves a diagonal band — corners near
// (0,0) and (1,1) should classify 0, corners near (0,1) and (1,0) should
// classify 1 (matches XOR's expected outputs at those same corners).
const N = 10;
const cells = sampleGrid(SOLUTION, N);
assertEqual(cells.length, N * N, "sampleGrid returns n*n cells");

const cornerCell = (xPred, yPred) => cells.find((c) => xPred(c.x) && yPred(c.y));
assertEqual(cornerCell((x) => x < 0.15, (y) => y < 0.15).cls, 0, "near (0,0) classifies 0");
assertEqual(cornerCell((x) => x < 0.15, (y) => y > 0.85).cls, 1, "near (0,1) classifies 1");
assertEqual(cornerCell((x) => x > 0.85, (y) => y < 0.15).cls, 1, "near (1,0) classifies 1");
assertEqual(cornerCell((x) => x > 0.85, (y) => y > 0.85).cls, 0, "near (1,1) classifies 0");

// pointNearestCenter: for a steep near-vertical line (mirrors the earlier
// plane.js bug case), the label point must land inside the segment, not
// drift to a plain unclamped midpoint that could be off-canvas.
const steepBoundary = boundaryEndpoints({ w1: 1.2, w2: 0.04, bias: -1.22 });
const [a, b] = steepBoundary;
const nearest = pointNearestCenter(a, b);
const withinX = nearest.x >= Math.min(a.x, b.x) - 1e-9 && nearest.x <= Math.max(a.x, b.x) + 1e-9;
const withinY = nearest.y >= Math.min(a.y, b.y) - 1e-9 && nearest.y <= Math.max(a.y, b.y) + 1e-9;
if (!withinX || !withinY) throw new Error(`FAIL pointNearestCenter out of segment bounds: ${JSON.stringify(nearest)}`);
console.log("ok pointNearestCenter stays within the segment");

// Straight-down case: a vertical line x=0.5 (w1=1, w2=0, bias=-0.5) should
// place the label near y=0.5 (the domain's vertical center).
const vertical = boundaryEndpoints({ w1: 1, w2: 0, bias: -0.5 });
const verticalNearest = pointNearestCenter(vertical[0], vertical[1]);
assertClose(verticalNearest.y, 0.5, "pointNearestCenter centers on a vertical line");

console.log("ALL PASS");
```

- [ ] **Step 3: Run it**

Run: `node verify-tmp.mjs`
Expected: all `ok ...` lines and `ALL PASS`, no thrown error.

- [ ] **Step 4: Delete the verification script**

```bash
rm verify-tmp.mjs
```

- [ ] **Step 5: Commit**

```bash
git add xor-hidden-plane.js
git commit -m "Replace hidden-space grouping/jitter with region grid sampling"
```

---

### Task 2: `xor-hidden-plane.js` — `renderRegionPlane` (SVG rendering)

**Files:**
- Modify: `xor-hidden-plane.js`

**Interfaces:**
- Consumes: `sampleGrid`, `pointNearestCenter`, `boundaryEndpoints`, `toDomainScreen`, `VIEWBOX_SIZE` (Task 1, same file); `computeNetwork` (already imported).
- Produces: `export function renderRegionPlane(svg, { rows, neurons })` — the file's new public entry point, replacing `renderHiddenPlane`, called by `xor-network-controller.js` in Task 4.

- [ ] **Step 1: Add `svgEl`, `drawHiddenLine`, and `renderRegionPlane`**

Append to `xor-hidden-plane.js`:

```js
const GRID_N = 32;

function svgEl(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function drawHiddenLine(svg, perceptron, key) {
  const boundary = boundaryEndpoints(perceptron);
  if (!boundary) return;
  const [a, b] = boundary;
  const aScreen = toDomainScreen(a.x, a.y);
  const bScreen = toDomainScreen(b.x, b.y);
  svg.appendChild(
    svgEl("line", { class: `plane-hidden-boundary ${key}`, x1: aScreen.px, y1: aScreen.py, x2: bScreen.px, y2: bScreen.py })
  );

  const labelPoint = pointNearestCenter(a, b);
  const labelScreen = toDomainScreen(labelPoint.x, labelPoint.y);
  const text = svgEl("text", {
    class: `plane-hidden-boundary-label ${key}`,
    x: labelScreen.px,
    y: labelScreen.py - 8,
  });
  text.textContent = key;
  svg.appendChild(text);
}

export function renderRegionPlane(svg, { rows, neurons }) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const cellSize = 1 / GRID_N;
  const cellPx = (cellSize / SPAN) * VIEWBOX_SIZE;
  for (const cell of sampleGrid(neurons, GRID_N)) {
    const corner = toDomainScreen(cell.x - cellSize / 2, cell.y + cellSize / 2);
    svg.appendChild(
      svgEl("rect", {
        class: cell.cls === 0 ? "plane-region-a" : "plane-region-b",
        x: corner.px,
        y: corner.py,
        width: cellPx,
        height: cellPx,
      })
    );
  }

  const regionStart = toDomainScreen(0, 1);
  const regionEnd = toDomainScreen(1, 0);
  svg.appendChild(
    svgEl("rect", {
      class: "plane-active-region",
      x: regionStart.px,
      y: regionStart.py,
      width: regionEnd.px - regionStart.px,
      height: regionEnd.py - regionStart.py,
    })
  );

  drawHiddenLine(svg, neurons.h1, "h1");
  drawHiddenLine(svg, neurons.h2, "h2");

  for (const [x1, x2, expected] of rows) {
    const { out } = computeNetwork(neurons, x1, x2);
    const correct = out.output === expected;
    const { px, py } = toDomainScreen(x1, x2);

    svg.appendChild(
      svgEl("circle", {
        class: `plane-point ${expected === 0 ? "class-a" : "class-b"} ${correct ? "correct" : "misclassified"}`,
        cx: px,
        cy: py,
        r: 11,
      })
    );

    const label = svgEl("text", { class: "plane-point-label", x: px, y: py - 18 });
    label.textContent = `(${x1}, ${x2})`;
    svg.appendChild(label);
  }
}
```

- [ ] **Step 2: Confirm the file has no syntax errors**

`document.createElementNS` requires a browser DOM, so `renderRegionPlane`/`drawHiddenLine`/`svgEl` can't be exercised in Node. Confirm only that the file parses:

Run: `node --check xor-hidden-plane.js`
Expected: no output (exit code 0). Full visual verification happens in Task 7.

- [ ] **Step 3: Commit**

```bash
git add xor-hidden-plane.js
git commit -m "Add renderRegionPlane: shaded decision regions plus h1/h2 lines"
```

---

### Task 3: Rename toggle markup in `xor-network.js`'s template

**Files:**
- Modify: `xor-network.js`

**Interfaces:**
- Consumes: nothing (markup only).
- Produces: `data-role="view-region-plane-btn"` (button, renamed from `view-hidden-plane-btn`), `data-role="region-plane"` (svg, renamed from `hidden-plane`).

- [ ] **Step 1: Edit the template**

In `xor-network.js`, find:

```html
<button type="button" data-view="hidden-plane" data-role="view-hidden-plane-btn">Hidden-activation plane</button>
```

Replace with:

```html
<button type="button" data-view="region-plane" data-role="view-region-plane-btn">Decision regions</button>
```

Find:

```html
<svg data-role="hidden-plane" viewBox="0 0 400 400"></svg>
```

Replace with:

```html
<svg data-role="region-plane" viewBox="0 0 400 400"></svg>
```

- [ ] **Step 2: Verify the file parses**

Run: `node --check xor-network.js`
Expected: no output (exit code 0).

- [ ] **Step 3: Commit**

```bash
git add xor-network.js
git commit -m "Rename hidden-plane toggle to Decision regions in XOR network template"
```

---

### Task 4: Rename controller wiring in `xor-network-controller.js`

**Files:**
- Modify: `xor-network-controller.js`

**Interfaces:**
- Consumes: `renderRegionPlane(svg, { rows, neurons })` (Task 2); `data-role="region-plane"`, `data-role="view-region-plane-btn"` (Task 3).
- Produces: `state.diagramView` now takes values `"diagram" | "region-plane"` instead of `"diagram" | "hidden-plane"`.

- [ ] **Step 1: Rename the import**

```js
import { renderRegionPlane } from "./xor-hidden-plane.js";
```

(replaces `import { renderHiddenPlane } from "./xor-hidden-plane.js";`)

- [ ] **Step 2: Rename the element lookups and handler**

```js
const hiddenPlaneSvg = getElement("region-plane");
```

(replaces `getElement("hidden-plane")` — variable name `hiddenPlaneSvg` can stay as-is, it's a local variable, not part of the renamed public vocabulary)

```js
getElement("view-hidden-plane-btn")?.addEventListener("click", () => setDiagramView("hidden-plane"));
```

becomes:

```js
getElement("view-region-plane-btn")?.addEventListener("click", () => setDiagramView("region-plane"));
```

- [ ] **Step 3: Rename the render call and active-state check**

```js
renderHiddenPlane(hiddenPlaneSvg, { rows: XOR_ROWS, neurons: state.neurons });
```

becomes:

```js
renderRegionPlane(hiddenPlaneSvg, { rows: XOR_ROWS, neurons: state.neurons });
```

```js
getElement("view-hidden-plane-btn")?.classList.toggle("active", state.diagramView === "hidden-plane");
```

becomes:

```js
getElement("view-region-plane-btn")?.classList.toggle("active", state.diagramView === "region-plane");
```

- [ ] **Step 4: Verify the file parses**

Run: `node --check xor-network-controller.js`
Expected: no output (exit code 0).

- [ ] **Step 5: Commit**

```bash
git add xor-network-controller.js
git commit -m "Rename hidden-plane wiring to region-plane in XOR network controller"
```

---

### Task 5: CSS — rename show/hide selector, add region/hidden-line styles

**Files:**
- Modify: `xor-network.css` (rename the show/hide rule's selector)
- Modify: `style.css` (add the new `.plane-region-*`/`.plane-hidden-boundary*` rules, alongside the other `.plane-*` rules already there)

**Interfaces:**
- Consumes: `data-role="region-plane"` (Task 3); `class="plane-region-a"`/`"plane-region-b"`/`"plane-hidden-boundary h1"`/`"plane-hidden-boundary h2"`/`"plane-hidden-boundary-label h1"`/`"plane-hidden-boundary-label h2"` (Task 2).
- Produces: nothing consumed by later tasks — this is a leaf.

- [ ] **Step 1: Rename the show/hide selector in `xor-network.css`**

```css
[data-role="diagram-wrap"][data-active-view="diagram"] [data-role="hidden-plane"] {
  display: none;
}
[data-role="diagram-wrap"][data-active-view="hidden-plane"] [data-role="diagram"] {
  display: none;
}
```

becomes:

```css
[data-role="diagram-wrap"][data-active-view="diagram"] [data-role="region-plane"] {
  display: none;
}
[data-role="diagram-wrap"][data-active-view="region-plane"] [data-role="diagram"] {
  display: none;
}
```

- [ ] **Step 2: Add the new plane styles to `style.css`**

`xor-network.html` already links `style.css`, and every other `.plane-*` class (`.plane-active-region`, `.plane-boundary`, `.plane-point*`, `.plane-side-badge*`) already lives there rather than in a page-specific stylesheet — these new rules follow that same convention. Add them right after the existing `.plane-point-active-ring` rule (around line 292 currently):

```css
.plane-region-a {
  fill: #9ca3af;
  opacity: 0.18;
}
.plane-region-b {
  fill: #2563eb;
  opacity: 0.18;
}

.plane-hidden-boundary {
  stroke-width: 2;
  stroke-dasharray: 6 4;
  fill: none;
}
.plane-hidden-boundary.h1 {
  stroke: #7c3aed;
}
.plane-hidden-boundary.h2 {
  stroke: #d97706;
}

.plane-hidden-boundary-label {
  font-size: 12px;
  font-weight: 700;
  text-anchor: middle;
}
.plane-hidden-boundary-label.h1 {
  fill: #7c3aed;
}
.plane-hidden-boundary-label.h2 {
  fill: #d97706;
}
```

- [ ] **Step 3: Commit**

```bash
git add xor-network.css style.css
git commit -m "Add decision-region and hidden-boundary-line styles; rename toggle selector"
```

---

### Task 6: `CONTEXT.md` — rename glossary entry

**Files:**
- Modify: `CONTEXT.md`

**Interfaces:**
- Consumes: nothing (documentation only).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace the glossary entry**

Find:

```markdown
**Hidden-activation plane**:
The XOR Network page's second view (alongside the node/edge Diagram), plotting each row's `(h1out, h2out)` point with the Output neuron's decision boundary drawn through them — the geometric reason the hidden layer's transform makes XOR linearly separable, shown rather than only explained via the Diagram's weights.
_Avoid_: Graph, chart, canvas
```

Replace with:

```markdown
**Decision-region plane**:
The XOR Network page's second view (alongside the node/edge Diagram), shading every point of the input plane by the Network's predicted class, with the two Hidden neurons' individual boundary lines drawn on top — showing how their two half-plane cuts combine into the nonlinear region that makes XOR linearly separable at the Output neuron.
_Avoid_: Graph, chart, canvas, heatmap
```

- [ ] **Step 2: Commit**

```bash
git add CONTEXT.md
git commit -m "Rename Hidden-activation plane to Decision-region plane in glossary"
```

---

### Task 7: Manual browser verification

**Files:** none (verification only)

**Interfaces:** none — this task exercises the fully wired page.

- [ ] **Step 1: Serve the site**

Run: `npx serve .` (or `python3 -m http.server 8000`)

- [ ] **Step 2: Open the XOR Network page and toggle to the new view**

Navigate to `xor-network.html`, click "Decision regions".

Expected: a shaded plane appears (the canonical `SOLUTION` is loaded by default) with:
- A gray-tinted region covering the corners near `(0,0)` and `(1,1)`.
- A blue-tinted region covering the corners near `(0,1)` and `(1,0)` — a diagonal band.
- Two dashed lines (violet "h1", amber "h2") cutting across the square.
- All 4 XOR points at their own true corners (no jitter, no overlap) — `(0,1)` and `(1,0)` blue with correct rings, `(0,0)` and `(1,1)` gray with correct rings.

- [ ] **Step 3: Perturb a slider and confirm live updates**

Drag the Output neuron's `bias` slider.

Expected: the shaded region's shape changes accordingly (the band shifts/shrinks), some point rings may flip to "misclassified", and the two hidden lines (h1/h2) stay fixed since only the Output neuron's weights changed — confirming the shading responds to the Output neuron's math and the hidden lines are independent of it.

- [ ] **Step 4: Toggle back to Diagram**

Click "Diagram".

Expected: the original node/edge diagram reappears unchanged; the truth table is unaffected.

- [ ] **Step 5: Confirm no console errors**

Check the browser console throughout Steps 2–3.

Expected: no errors logged.
