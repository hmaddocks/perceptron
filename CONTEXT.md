# Perceptron Demo

An interactive, educational web simulation of a single perceptron (Rosenblatt model), used to demonstrate to an audience how a perceptron implements a 2-input logic gate.

## Language

**Perceptron**:
A single artificial neuron with 2 numeric inputs, one weight per input, a bias, a weighted-sum step, and a step activation function producing a binary output (0 or 1). This project models exactly one perceptron — not a multi-layer network.
_Avoid_: Neuron, node, unit (when referring to the whole model), network

**Gate**:
The 2-input binary logic function currently being demonstrated — AND, OR, NAND, NOR, or XOR. Selecting a gate fixes the "expected" column of the truth table. AND/OR/NAND/NOR are linearly separable and Training mode converges on them; XOR is not, and is included deliberately to demonstrate that limitation.
_Avoid_: Preset, dataset, function

**Truth table**:
The always-visible table of all 4 possible input combinations — (0,0), (0,1), (1,0), (1,1) — each shown as a row with its expected output (from the selected Gate), the perceptron's current weighted sum, and its actual output. Replaces a geometric/plane visualization by deliberate choice (see ADR-0003).
_Avoid_: Input space, plane, grid

**Row**:
One of the 4 fixed input combinations in the truth table.
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
