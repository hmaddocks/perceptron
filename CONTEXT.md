# Perceptron Demo

An interactive, educational web simulation of a single perceptron (Rosenblatt model), used to demonstrate to an audience how a perceptron implements a 2-input logic gate.

## Language

**Perceptron**:
A single artificial neuron with 2 numeric inputs, one weight per input, a bias, a weighted-sum step, and a step activation function producing a binary output (0 or 1). This project models exactly one perceptron — not a multi-layer network.
_Avoid_: Neuron, node, unit (when referring to the whole model), network

**Gate**:
The 2-input binary logic function currently being demonstrated — AND, OR, NAND, NOR, or XOR. Selecting a gate fixes the "expected" column of the truth table. AND/OR/NAND/NOR are linearly separable and Training mode converges on them; XOR is not, and is included deliberately to demonstrate that limitation.
_Avoid_: Preset, dataset, function

**View**:
One of two ways of visualizing the same shared perceptron/gate/training state — Truth table or Plane. Switching views via the top menu is instant and never resets the gate, weights, or training progress (see ADR-0004).
_Avoid_: Page, tab, mode (mode means Manual/Training, a different axis)

**Truth table**:
A view showing all 4 possible input combinations — (0,0), (0,1), (1,0), (1,1) — as rows, each with its expected output (from the selected Gate), the perceptron's current weighted sum, and its actual output.
_Avoid_: Input space, plane, grid

**Plane**:
A view plotting the same 4 input combinations geometrically on a 2D plane, each point colored by its expected output and ringed if misclassified, with the perceptron's decision boundary drawn through them.
_Avoid_: Graph, chart, canvas

**Decision boundary**:
The straight line, shown in the Plane view, where the perceptron's weighted sum equals zero — the dividing line between the two output classes.
_Avoid_: Separating line, threshold line

**Row**:
One of the 4 fixed input combinations, shown as a table row in the Truth table view or a point in the Plane view.
_Avoid_: Point, entry, case

**Manual mode**:
An interaction mode where the presenter directly sets weights and bias via sliders, observing the sum/actual columns of the truth table update live for all 4 rows. No learning occurs in this mode.
_Avoid_: Explore mode, sandbox mode

**Training mode**:
An interaction mode where the presenter runs the perceptron learning algorithm — via Step or Run — over the truth table's 4 rows for the selected Gate, watching weights update and the actual column converge toward the expected column over successive epochs.
_Avoid_: Learning mode, practice mode

**Learning rate**:
A presenter-adjustable value controlling how large a weight correction is applied per misclassified row during Training mode.
_Avoid_: Step size, alpha

**Epoch**:
One full pass of the perceptron learning algorithm over all 4 rows of the truth table, applying a weight update for each misclassified row. Training mode is capped at a fixed maximum number of epochs.
_Avoid_: Iteration, pass, generation

**Convergence**:
The state Training mode reaches when every row's actual output matches its expected output and no further weight updates occur. XOR never converges and instead stops at the epoch cap.
_Avoid_: Success, done

## Freeform Classifier (separate page)

`freeform.html` is a self-contained second demo, linked from the main page but not part of the shared gate/view state (see ADR-0005). It reuses the term **Perceptron** above, and has a single unified interaction (no Manual/Training mode split, unlike the main app): weight/bias sliders are always live, and clicking the plane always places a **Freeform point** — an (x, y) coordinate on a continuous plane labeled Class A or B — which is added directly to the training set. Its **Preset dataset** loads a ready-made separable or non-separable set of freeform points, standing in for the Gate concept on this page. These terms only apply within `freeform.html` and should not be conflated with the Gate/Truth table/Plane vocabulary above.

## XOR Network (separate page)

`xor-network.html` is a third self-contained demo, linked from the main page, showing why XOR needs more than one Perceptron. It introduces its own vocabulary, scoped to this page only:

**Network**:
Several Perceptrons wired together — 2 inputs, a fixed hidden layer of 2 **Hidden neurons**, and 1 **Output neuron** — all using the same weighted-sum + step activation as the single Perceptron elsewhere in this project. There is no training here: weights and biases are adjusted only via sliders (see ADR-0006).
_Avoid_: Model, brain (the main Perceptron entry's "avoid: network" does not apply on this page — here "Network" is the whole point)

**Hidden neuron**:
One of the Network's 2 fixed intermediate Perceptrons. Its output feeds the Output neuron rather than being read directly. The hidden layer's size is fixed at 2 and is not adjustable on this page.
_Avoid_: Node, unit

**Output neuron**:
The Network's final Perceptron, whose output is the Network's overall prediction for the current row.
_Avoid_: Final layer, result neuron

**Solution**:
The pre-loaded, hand-crafted set of weights/biases for all 3 neurons that correctly solves XOR on all 4 rows. The page loads with the Solution active; a "Reset to solution" action restores it after the presenter has perturbed sliders away from it.
_Avoid_: Preset, answer, correct weights

This page is always fixed to XOR — it has no Gate selector, unlike the main app.
