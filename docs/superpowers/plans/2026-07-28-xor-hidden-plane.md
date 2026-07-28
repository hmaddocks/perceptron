# XOR Hidden-Activation Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second view to the XOR Network page — a plane plotting each XOR row's `(h1out, h2out)` point with the Output neuron's decision boundary — so the geometric reason the hidden layer makes XOR linearly separable is visible, not just the node/edge diagram.

**Architecture:** A new self-contained module `xor-hidden-plane.js` computes each row's hidden-space point via the existing `computeNetwork`, groups rows that land on the same corner (h1out/h2out are each binary, so there are only 4 possible corners), jitters co-located points apart, and renders them with the same visual language as `plane.js` (colored fill, correct/misclassified ring, decision-boundary line, side badges). `xor-network-controller.js` gets a small view-toggle state, mirroring the existing AND/OR page's Truth Table/Plane toggle pattern.

**Tech Stack:** Plain vanilla JS (ES modules, no build step, no framework — ADR-0001), native SVG DOM APIs, no test framework (verification is one-off Node scripts for pure logic + manual browser check for rendering, matching how the existing `plane.js` boundary-clipping bug was diagnosed and fixed earlier in this project).

## Global Constraints

- No build step, no bundler, no framework — plain ES modules loaded via `<script type="module">` (ADR-0001).
- No test framework exists — verification is one-off Node scripts (deleted before committing) for pure logic, and manual browser checks for rendering.
- Follow `CONTEXT.md` terminology exactly: "Hidden neuron", "Output neuron", "Network" — avoid "node", "unit", "model", "brain".
- Visual language must match `plane.js`: fill color by `expected` (`class-a`/`class-b`), ring by `correct`/`misclassified`, decision-boundary line + `+`/`-` (now "1"/"0") side badges, dashed active-region square.
- This view is display-only: no click handling on points, no active-row ring, and it must not read or write `state.activeRowIndex`.

---

### Task 1: `xor-hidden-plane.js` — domain geometry and decision-boundary clipping

**Files:**
- Create: `xor-hidden-plane.js`

**Interfaces:**
- Consumes: nothing yet (this task is self-contained geometry).
- Produces: `export const VIEWBOX_SIZE = 400`, `export function boundaryEndpoints(perceptron)` returning `[{x, y}, {x, y}] | null`, `export function toDomainScreen(x, y)` returning `{px, py}` (an internal-use name distinct from `plane.js`'s `toScreen` since both files are standalone — no import between them).

This duplicates the padded-unit-square domain and the corrected 4-edge line-clipping logic from `plane.js` (fixed earlier this session — the old approach evaluated y only at the two x-edges and broke for steep lines). h1out/h2out are binary like the AND/OR inputs, so the same domain proportions apply.

- [ ] **Step 1: Write the file**

```js
// xor-hidden-plane.js
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
```

- [ ] **Step 2: Write a one-off verification script**

Create `verify-tmp.mjs` at the repo root:

```js
import { boundaryEndpoints, toDomainScreen, VIEWBOX_SIZE } from "./xor-hidden-plane.js";

function assertClose(actual, expected, label, tol = 1e-6) {
  if (Math.abs(actual - expected) > tol) {
    throw new Error(`FAIL ${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`ok ${label}`);
}

// Canonical Output neuron: out = Perceptron(1, 1, -1.5) — a shallow diagonal line.
const out = { w1: 1, w2: 1, bias: -1.5 };
const [a, b] = boundaryEndpoints(out);
console.log("out boundary:", a, b);
// Line is x + y = 1.5, so it must cross the domain square's top and right edges.
assertClose(Math.min(a.x, b.x) + Math.max(a.y, b.y), 1.5, "top/right intersection sums to 1.5");

// Steep line case (mirrors the plane.js bug): small w2 relative to w1.
const steep = { w1: 1.2, w2: 0.04, bias: -1.22 };
const [c, d] = boundaryEndpoints(steep);
console.log("steep boundary:", c, d);
const xAtY1 = c.x + ((1 - c.y) / (d.y - c.y)) * (d.x - c.x);
assertClose(xAtY1, 0.9833333333333333, "steep line x at y=1");

// toDomainScreen sanity: domain corners map to viewbox corners.
const originScreen = toDomainScreen(-0.6, -0.6);
assertClose(originScreen.px, 0, "domain min x -> px 0");
assertClose(originScreen.py, VIEWBOX_SIZE, "domain min y -> py VIEWBOX_SIZE (y flips)");

console.log("ALL PASS");
```

- [ ] **Step 3: Run it**

Run: `node verify-tmp.mjs`
Expected: five `ok ...` lines and `ALL PASS`, no thrown error.

- [ ] **Step 4: Delete the verification script**

```bash
rm verify-tmp.mjs
```

- [ ] **Step 5: Commit**

```bash
git add xor-hidden-plane.js
git commit -m "Add domain geometry and boundary clipping for XOR hidden plane"
```

---

### Task 2: `xor-hidden-plane.js` — grouping rows by hidden-space corner and jitter offsets

**Files:**
- Modify: `xor-hidden-plane.js`

**Interfaces:**
- Consumes: `computeNetwork(neurons, x1, x2)` from `xor-network-model.js` (returns `{ h1: {sum, output}, h2: {sum, output}, out: {sum, output} }`).
- Produces: `export function groupByCorner(rows, neurons)` returning `Array<{ hx: number, hy: number, members: Array<{x1, x2, expected, actual}> }>`; `export function jitterOffsets(n)` returning `Array<{x: number, y: number}>` of length `n`.

`rows` is always `XOR_ROWS`-shaped: `Array<[x1, x2, expected]>`.

- [ ] **Step 1: Add the functions**

```js
// Add near the top of xor-hidden-plane.js, after the existing imports/consts:
import { computeNetwork } from "./xor-network-model.js";

const JITTER_RADIUS = 0.12;

// Groups rows by identical (h1out, h2out) — there are only 4 possible
// corners since both are binary, so collisions between rows (even
// different-expected ones) are common while exploring non-solving weights.
export function groupByCorner(rows, neurons) {
  const groups = new Map();
  for (const [x1, x2, expected] of rows) {
    const { h1, h2, out } = computeNetwork(neurons, x1, x2);
    const key = `${h1.output},${h2.output}`;
    if (!groups.has(key)) groups.set(key, { hx: h1.output, hy: h2.output, members: [] });
    groups.get(key).members.push({ x1, x2, expected, actual: out.output });
  }
  return [...groups.values()];
}

// n evenly-spaced offsets (domain units) around a corner. n=1 -> centered.
export function jitterOffsets(n) {
  if (n <= 1) return [{ x: 0, y: 0 }];
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n;
    return { x: JITTER_RADIUS * Math.cos(angle), y: JITTER_RADIUS * Math.sin(angle) };
  });
}
```

- [ ] **Step 2: Write a one-off verification script**

Create `verify-tmp.mjs` at the repo root:

```js
import { groupByCorner, jitterOffsets } from "./xor-hidden-plane.js";
import { XOR_ROWS, SOLUTION } from "./xor-network-model.js";

function assertEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`FAIL ${label}: expected ${e}, got ${a}`);
  console.log(`ok ${label}`);
}

// Canonical SOLUTION: (0,0)->(0,1) alone; (0,1) and (1,0) collide at (1,1)
// (both expected=1); (1,1)->(1,0) alone.
const groups = groupByCorner(XOR_ROWS, SOLUTION);
const byKey = Object.fromEntries(groups.map((g) => [`${g.hx},${g.hy}`, g.members]));

assertEqual(byKey["0,1"], [{ x1: 0, x2: 0, expected: 0, actual: 0 }], "corner (0,1) has just (0,0)");
assertEqual(
  byKey["1,1"],
  [
    { x1: 0, x2: 1, expected: 1, actual: 1 },
    { x1: 1, x2: 0, expected: 1, actual: 1 },
  ],
  "corner (1,1) collects (0,1) and (1,0)"
);
assertEqual(byKey["1,0"], [{ x1: 1, x2: 1, expected: 0, actual: 0 }], "corner (1,0) has just (1,1)");

// Different-class collision: h1 = Perceptron(0,0,-1) always outputs 0.
const collidingNeurons = { h1: { sum: () => -1, predict: () => 0 }, h2: SOLUTION.h2, out: SOLUTION.out };
const collidingGroups = groupByCorner(XOR_ROWS, collidingNeurons);
const collidingByKey = Object.fromEntries(collidingGroups.map((g) => [`${g.hx},${g.hy}`, g.members]));
const mixedExpected = collidingByKey["0,1"].map((m) => m.expected);
assertEqual(mixedExpected, [0, 1, 1], "corner (0,1) collects 3 rows with mixed expected values");

// jitterOffsets
assertEqual(jitterOffsets(1), [{ x: 0, y: 0 }], "jitterOffsets(1) is centered");
const two = jitterOffsets(2);
if (two.length !== 2) throw new Error("FAIL jitterOffsets(2) length");
if (Math.abs(two[0].x - 0.12) > 1e-9 || Math.abs(two[0].y) > 1e-9) throw new Error("FAIL jitterOffsets(2)[0]");
if (Math.abs(two[1].x + 0.12) > 1e-9 || Math.abs(two[1].y) > 1e-9) throw new Error("FAIL jitterOffsets(2)[1]");
console.log("ok jitterOffsets(2) places members on opposite sides");

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
git commit -m "Add corner-grouping and jitter offsets for XOR hidden plane"
```

---

### Task 3: `xor-hidden-plane.js` — `renderHiddenPlane` (SVG rendering)

**Files:**
- Modify: `xor-hidden-plane.js`

**Interfaces:**
- Consumes: `boundaryEndpoints`, `toDomainScreen`, `groupByCorner`, `jitterOffsets` (Tasks 1–2, same file); `computeNetwork` (already imported).
- Produces: `export function renderHiddenPlane(svg, { rows, neurons })` — the file's public entry point, called by `xor-network-controller.js` in Task 5.

This assembles the pieces into the same visual language as `plane.js`: dashed active-region square, boundary line, side badges, then each row's point (colored by `expected`, ringed `correct`/`misclassified`, labeled with its original `(x1, x2)`) at its jittered position. No click handling, no active-row ring — this view never reads or writes `state.activeRowIndex`.

- [ ] **Step 1: Add `svgEl` and `renderHiddenPlane`**

```js
// Add to xor-hidden-plane.js:

function svgEl(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

export function renderHiddenPlane(svg, { rows, neurons }) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

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

  const boundary = boundaryEndpoints(neurons.out);
  if (boundary) {
    const [a, b] = boundary;
    const aScreen = toDomainScreen(a.x, a.y);
    const bScreen = toDomainScreen(b.x, b.y);
    svg.appendChild(
      svgEl("line", { class: "plane-boundary", x1: aScreen.px, y1: aScreen.py, x2: bScreen.px, y2: bScreen.py })
    );

    const { w1, w2 } = neurons.out;
    const magnitude = Math.hypot(w1, w2);
    if (magnitude > 1e-6) {
      const nx = w1 / magnitude;
      const ny = w2 / magnitude;
      const canvasCenter = 0.5;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const lengthSq = dx * dx + dy * dy;
      const t = lengthSq > 1e-9 ? ((canvasCenter - a.x) * dx + (canvasCenter - a.y) * dy) / lengthSq : 0;
      const tClamped = Math.max(0, Math.min(1, t));
      const midX = a.x + tClamped * dx;
      const midY = a.y + tClamped * dy;
      const offset = 0.15;

      const plus = toDomainScreen(midX + nx * offset, midY + ny * offset);
      const minus = toDomainScreen(midX - nx * offset, midY - ny * offset);

      svg.appendChild(svgEl("circle", { class: "plane-side-badge positive", cx: plus.px, cy: plus.py, r: 12 }));
      const plusLabel = svgEl("text", { class: "plane-side-label", x: plus.px, y: plus.py });
      plusLabel.textContent = "1";
      svg.appendChild(plusLabel);

      svg.appendChild(svgEl("circle", { class: "plane-side-badge negative", cx: minus.px, cy: minus.py, r: 12 }));
      const minusLabel = svgEl("text", { class: "plane-side-label", x: minus.px, y: minus.py });
      minusLabel.textContent = "0";
      svg.appendChild(minusLabel);
    }
  }

  const groups = groupByCorner(rows, neurons);
  for (const group of groups) {
    const offsets = jitterOffsets(group.members.length);
    group.members.forEach((member, i) => {
      const offset = offsets[i];
      const { px, py } = toDomainScreen(group.hx + offset.x, group.hy + offset.y);
      const correct = member.actual === member.expected;

      svg.appendChild(
        svgEl("circle", {
          class: `plane-point ${member.expected === 0 ? "class-a" : "class-b"} ${correct ? "correct" : "misclassified"}`,
          cx: px,
          cy: py,
          r: 11,
        })
      );

      const label = svgEl("text", { class: "plane-point-label", x: px, y: py - 18 });
      label.textContent = `(${member.x1}, ${member.x2})`;
      svg.appendChild(label);
    });
  }
}
```

- [ ] **Step 2: Manual sanity check (no DOM in Node — deferred to Task 8)**

`document.createElementNS` requires a browser DOM, so this step cannot be verified with a Node script. Confirm only that the file has no syntax errors:

Run: `node --check xor-hidden-plane.js`
Expected: no output (exit code 0). Full visual verification happens in Task 8 once the view is wired into the page.

- [ ] **Step 3: Commit**

```bash
git add xor-hidden-plane.js
git commit -m "Add renderHiddenPlane SVG rendering for XOR hidden plane"
```

---

### Task 4: Wire the view-toggle markup into `xor-network.js`'s template

**Files:**
- Modify: `xor-network.js`

**Interfaces:**
- Consumes: nothing (markup only).
- Produces: `data-role="view-diagram-btn"`, `data-role="view-hidden-plane-btn"` (buttons), `data-role="hidden-plane"` (second `<svg>`), `data-role="diagram-wrap"` (the wrapper element Task 5's controller will set `dataset.activeView` on).

- [ ] **Step 1: Edit the template**

In `xor-network.js`, find the `TEMPLATE` string's `diagram-wrap` block:

```html
<div class="diagram-wrap">
  <svg data-role="diagram" viewBox="0 0 500 400"></svg>
</div>
```

Replace it with:

```html
<div class="diagram-wrap" data-role="diagram-wrap">
  <nav class="view-menu">
    <button type="button" data-view="diagram" data-role="view-diagram-btn">Diagram</button>
    <button type="button" data-view="hidden-plane" data-role="view-hidden-plane-btn">Hidden-activation plane</button>
  </nav>
  <svg data-role="diagram" viewBox="0 0 500 400"></svg>
  <svg data-role="hidden-plane" viewBox="0 0 400 400"></svg>
</div>
```

(This block lives in `xor-network.js`, not `xor-network.html` — the page builds its markup from a JS template string, per the existing pattern in that file.)

- [ ] **Step 2: Verify the file parses**

Run: `node --check xor-network.js`
Expected: no output (exit code 0).

- [ ] **Step 3: Commit**

```bash
git add xor-network.js
git commit -m "Add view-toggle markup and hidden-plane svg to XOR network template"
```

---

### Task 5: Wire view-toggle state and rendering into `xor-network-controller.js`

**Files:**
- Modify: `xor-network-controller.js:1-20` (imports and state init), `xor-network-controller.js:113-141` (the `render` function)

**Interfaces:**
- Consumes: `renderHiddenPlane(svg, { rows, neurons })` (Task 3); `data-role="diagram-wrap"`, `data-role="view-diagram-btn"`, `data-role="view-hidden-plane-btn"`, `data-role="hidden-plane"` (Task 4).
- Produces: `state.diagramView` (`"diagram" | "hidden-plane"`), read by `xor-network.css` (Task 6) via `dataset.activeView` on the `diagram-wrap` element.

- [ ] **Step 1: Add the import and state field**

At the top of `xor-network-controller.js`:

```js
import { XOR_ROWS, SOLUTION, computeNetwork, cloneNeurons } from "./xor-network-model.js";
import { renderDiagram } from "./xor-network-diagram.js";
import { renderHiddenPlane } from "./xor-hidden-plane.js";
```

In the `state` object (currently `{ neurons: cloneNeurons(SOLUTION), activeRowIndex: 0 }`), add a third field:

```js
const state = {
  neurons: cloneNeurons(SOLUTION),
  activeRowIndex: 0,
  diagramView: "diagram",
};
```

- [ ] **Step 2: Add the toggle wiring**

Just after the existing `getElement("reset-btn")?.addEventListener(...)` line, add:

```js
const diagramWrap = getElement("diagram-wrap");
const hiddenPlaneSvg = getElement("hidden-plane");

function setDiagramView(view) {
  state.diagramView = view;
  render();
}

getElement("view-diagram-btn")?.addEventListener("click", () => setDiagramView("diagram"));
getElement("view-hidden-plane-btn")?.addEventListener("click", () => setDiagramView("hidden-plane"));
```

- [ ] **Step 3: Render the hidden plane and toggle visibility**

In the `render()` function, immediately after the existing `renderDiagram(svg, { ... })` line, add:

```js
renderHiddenPlane(hiddenPlaneSvg, { rows: XOR_ROWS, neurons: state.neurons });
if (diagramWrap) diagramWrap.dataset.activeView = state.diagramView;
```

Also add active-state styling for the two toggle buttons, near the existing table/status update code in `render()`:

```js
getElement("view-diagram-btn")?.classList.toggle("active", state.diagramView === "diagram");
getElement("view-hidden-plane-btn")?.classList.toggle("active", state.diagramView === "hidden-plane");
```

- [ ] **Step 4: Verify the file parses**

Run: `node --check xor-network-controller.js`
Expected: no output (exit code 0).

- [ ] **Step 5: Commit**

```bash
git add xor-network-controller.js
git commit -m "Wire hidden-activation plane view toggle into XOR network controller"
```

---

### Task 6: `xor-network.css` — hidden-plane show/hide styling

**Files:**
- Modify: `xor-network.css`

**Interfaces:**
- Consumes: `data-role="diagram-wrap"` with `dataset.activeView` (Tasks 4–5); `data-role="diagram"` and `data-role="hidden-plane"` element selectors.
- Produces: nothing consumed by later tasks — this is a leaf.

- [ ] **Step 1: Add the CSS**

`xor-network.html` already links `style.css` (confirmed: `<link rel="stylesheet" href="style.css" />` is the first stylesheet in its `<head>`), and `style.css` already defines a top-level, unscoped `.view-menu` / `.view-menu button` / `.view-menu button.active` ruleset (used by the AND/OR page's Truth Table/Plane toggle) plus the `--panel-bg`/`--border`/`--muted` custom properties it depends on. Since the class name and markup shape here (Task 4) match that ruleset exactly, no CSS needs duplicating — only the new show/hide rule for this page's two SVGs. Append to `xor-network.css`:

```css
[data-role="diagram-wrap"][data-active-view="diagram"] [data-role="hidden-plane"] {
  display: none;
}
[data-role="diagram-wrap"][data-active-view="hidden-plane"] [data-role="diagram"] {
  display: none;
}
```

- [ ] **Step 2: Commit**

```bash
git add xor-network.css
git commit -m "Hide the inactive XOR network diagram/hidden-plane svg by view"
```

---

### Task 7: `CONTEXT.md` glossary entry

**Files:**
- Modify: `CONTEXT.md`

**Interfaces:**
- Consumes: nothing (documentation only).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the entry**

Add a new glossary entry near the existing **Plane** entry, matching that entry's format (a bolded term line, a definition paragraph, an `_Avoid_` line):

```markdown
**Hidden-activation plane**:
The XOR Network page's second view (alongside the node/edge Diagram), plotting each row's `(h1out, h2out)` point with the Output neuron's decision boundary drawn through them — the geometric reason the hidden layer's transform makes XOR linearly separable, shown rather than only explained via the Diagram's weights.
_Avoid_: Graph, chart, canvas (same as **Plane**'s avoid-list)
```

- [ ] **Step 2: Commit**

```bash
git add CONTEXT.md
git commit -m "Document Hidden-activation plane term in CONTEXT.md glossary"
```

---

### Task 8: Manual browser verification

**Files:** none (verification only)

**Interfaces:** none — this task exercises the fully wired page.

- [ ] **Step 1: Serve the site**

This is a static, no-build site (ADR-0001); serve it with any static file server, e.g.:

Run: `npx serve .` (or `python3 -m http.server 8000`)

- [ ] **Step 2: Open the XOR Network page and toggle to the new view**

Navigate to `xor-network.html`, click "Hidden-activation plane".

Expected: an SVG plane appears with a dashed active-region square, a decision-boundary line, "1"/"0" side badges, and 3 visible point-groups (the canonical `SOLUTION` is loaded by default):
- `(0, 0)` alone at one corner.
- `(0, 1)` and `(1, 0)` as a small jittered pair at another corner, both filled the same "expected 1" color, both with a "correct" ring.
- `(1, 1)` alone at a third corner.
- The boundary line separates the `(0,1)/(1,0)` pair from the other two points.

- [ ] **Step 3: Force a different-class collision**

Drag hidden neuron 1's `w1` and `w2` sliders to `0` (leave its bias as-is). This makes `h1out` constant across all 4 rows, forcing all rows onto only 2 corners (keyed by `h2out` alone) — some corner should now hold rows with different `expected` values.

Expected: that corner renders as a small jittered cluster with mixed fill colors (some "correct", some "misclassified" rings) rather than one dot silently hiding the others.

- [ ] **Step 4: Toggle back to Diagram**

Click "Diagram".

Expected: the original node/edge diagram reappears unchanged, and the truth table below is unaffected by anything done in Steps 2–3 (this view never touches `state.activeRowIndex`).

- [ ] **Step 5: Confirm no console errors**

Check the browser console throughout Steps 2–4.

Expected: no errors logged.
