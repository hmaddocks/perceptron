# XOR decision-region plane

**Supersedes:** `2026-07-28-xor-hidden-plane-design.md`. That spec plotted each row's `(h1out, h2out)` point in hidden-activation space; since h1out/h2out are both binary, only 4 discrete locations exist, so rows frequently collided and needed a jitter/grouping scheme to stay legible. After seeing it rendered, the collision handling didn't match what was wanted. This spec replaces that approach entirely with a decision-region shading over the original `(x1, x2)` input plane, which has no collision problem (the 4 rows are always at fixed, distinct corners there, exactly like the AND/OR page) and shows the "why" more directly: the two hidden neurons' individual boundary lines are drawn on top of the shading, and the shading itself *is* the Output neuron's nonlinear boundary in the original space.

## Purpose

Same motivation as the superseded spec (ADR-0004's rationale, applied to the hidden layer): show geometrically why the Network solves XOR, not just via the node/edge Diagram's weights. This version shows it by shading every point of the original input plane by the Network's final predicted class, with h1's and h2's own lines drawn on top — the classic way a multi-layer decision boundary is visualized, and it reuses the same input-plane geometry `plane.js` already has (no new "hidden space" concept for the presenter to track).

## Scope

In scope: replacing the second view on the XOR Network page (previously "Hidden-activation plane") with a "Decision regions" view. Same toggle slot, same file (`xor-hidden-plane.js`), same overall integration points (`xor-network.js` template, `xor-network-controller.js`, `xor-network.css`, `CONTEXT.md`) as the superseded spec — only the view's internal content changes.

## `xor-hidden-plane.js` — new contents

Keeps from the superseded version (still valid, unchanged):
- `VIEWBOX_SIZE`, `DOMAIN_MIN = -0.6`, `DOMAIN_MAX = 1.6`, `toDomainScreen(x, y)`.
- `boundaryEndpoints(perceptron)` — generic over any `{w1, w2, bias}`, so it works unchanged for `h1` and `h2` individually (both are `Perceptron` instances with those properties).

Removed: `groupByCorner`, `jitterOffsets` — no longer needed; there's no discrete-collision problem in continuous input space.

New: `renderRegionPlane(svg, { rows, neurons })` (replaces `renderHiddenPlane` as the file's public entry point):

1. **Shading**: sample a 32×32 grid over the active unit square `[0,1]×[0,1]` (same footprint as the existing dashed active-region elsewhere in the app). For each cell, take its center point and call `computeNetwork(neurons, x, y).out.output` to get the Network's predicted class — this works because `computeNetwork`'s math (weighted sum + threshold) is defined for any real `x1, x2`, not just 0/1, so sampling between the training points is free. Draw one `<rect>` per cell, filled with a muted/low-opacity tint of the matching `class-a`/`class-b` color so the point markers stay legible on top.
2. **Hidden lines**: draw `boundaryEndpoints(neurons.h1)` and `boundaryEndpoints(neurons.h2)` as two dashed lines in distinct colors (h1 violet `#7c3aed`, h2 amber `#d97706`), each with a small colored "h1"/"h2" text label near where it exits the plane. No separate line for the Output neuron — its boundary in this space *is* the shaded region's edge (the nonlinear combination of the two half-planes).
3. **Points**: for each row, draw a point at its own `(x1, x2)` — no transform needed, unlike the superseded hidden-space version — colored by `expected` (`class-a`/`class-b`), ringed `correct`/`misclassified` against `computeNetwork(neurons, x1, x2).out.output`, labeled `(x1, x2)`. Same visual language as `plane.js`.

No click handling, no active-row ring — unchanged from the superseded spec; this view is display-only and never reads/writes `state.activeRowIndex`.

## CSS additions

New classes for the shaded cells (muted tints of the existing point colors, at low opacity):

```css
.plane-region-a { fill: #9ca3af; opacity: 0.18; }
.plane-region-b { fill: #2563eb; opacity: 0.18; }
```

New classes for the hidden-neuron lines:

```css
.plane-hidden-boundary.h1 { stroke: #7c3aed; stroke-dasharray: 6 4; stroke-width: 2; }
.plane-hidden-boundary.h2 { stroke: #d97706; stroke-dasharray: 6 4; stroke-width: 2; }
```

## UI integration (unchanged structure, renamed identifiers)

- `xor-network.js` template: toggle button text becomes "Decision regions" (was "Hidden-activation plane"); `data-role="hidden-plane"` becomes `data-role="region-plane"` on the second `<svg>` and its button (`data-role="view-region-plane-btn"`).
- `xor-network-controller.js`: import `renderRegionPlane` instead of `renderHiddenPlane`; `getElement("hidden-plane")` → `getElement("region-plane")`; button role lookups updated to match.
- `xor-network.css`: existing show/hide rules' `[data-role="hidden-plane"]` selector becomes `[data-role="region-plane"]`.
- `CONTEXT.md`: glossary entry renamed from **Hidden-activation plane** to **Decision-region plane**, referencing the existing **Decision boundary** entry:

```markdown
**Decision-region plane**:
The XOR Network page's second view (alongside the node/edge Diagram), shading every point of the input plane by the Network's predicted class, with the two Hidden neurons' individual boundary lines drawn on top — showing how their two half-plane cuts combine into the nonlinear region that makes XOR linearly separable at the Output neuron.
_Avoid_: Graph, chart, canvas, heatmap
```

## Testing

Still no test framework (ADR-0001). Verification is manual: load `xor-network.html`, toggle to "Decision regions", and check against the canonical `SOLUTION` weights that:
- The shaded region forms a diagonal band covering the `(0,1)`/`(1,0)` corners (expected 1) and excludes `(0,0)`/`(1,1)` (expected 0).
- All 4 points render at their own, undistorted corner — no jitter needed.
- h1's and h2's dashed lines are visibly distinct from each other and from the shading edge.
- Perturbing any slider updates the shading, lines, and point rings live.
