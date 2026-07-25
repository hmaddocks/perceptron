# Perceptron Demo

An interactive, educational web simulation of a single perceptron (Rosenblatt model), used to demonstrate to an audience how a perceptron computes its output.

## Language

**Perceptron**:
A single artificial neuron with 2 numeric inputs, one weight per input, a bias, a weighted-sum step, and a step activation function producing a binary output (0 or 1). This project models exactly one perceptron — not a multi-layer network.
_Avoid_: Neuron, node, unit (when referring to the whole model), network

**Input space**:
The 2D plane (x, y) that the perceptron's two inputs are plotted on. Every point in the input space maps to a class via the decision boundary.
_Avoid_: Feature space, coordinate grid

**Decision boundary**:
The straight line in the input space where the perceptron's weighted sum equals zero — the dividing line between the two output classes.
_Avoid_: Separating line, threshold line

**Manual mode**:
An interaction mode where the presenter directly sets weights and bias (e.g. via sliders) and/or drags a single test point, observing the decision boundary and output update live. No learning occurs in this mode.
_Avoid_: Explore mode, sandbox mode

**Training mode**:
An interaction mode where the presenter places labeled training points on the input space, then runs the perceptron learning algorithm, watching the decision boundary converge over successive epochs.
_Avoid_: Learning mode, practice mode

**Computation view**:
A live diagram showing the perceptron's arithmetic for the current/selected point: each input multiplied by its weight, summed with the bias, then passed through the step function to produce the output. Updates in real time alongside the input-space plot.
_Avoid_: Network diagram, node graph

**Learning rate**:
A presenter-adjustable value controlling how large a weight correction is applied per misclassified training point during Training mode.
_Avoid_: Step size, alpha

**Class**:
The label (A or B, corresponding to output 0 or 1) assigned to a training point when it is placed, and to the current-class toggle used to place new points.
_Avoid_: Category, group, tag

**Preset dataset**:
A one-click, pre-defined set of labeled training points loaded into Training mode, used to jump straight into a demo. Includes at least one linearly-separable example and one non-separable example.
_Avoid_: Sample data, template

**Epoch**:
One full pass of the perceptron learning algorithm over every training point, applying a weight update for each misclassified point. Training mode is capped at a fixed maximum number of epochs.
_Avoid_: Iteration, pass, generation

**Convergence**:
The state Training mode reaches when every training point is correctly classified and no further weight updates occur. Non-separable data never converges and instead stops at the epoch cap.
_Avoid_: Success, done

**Test point**:
The single draggable marker shown only in Manual mode, used to probe the current decision boundary and see its classification and computation view update live. Distinct from training points — it is never used to update weights.
_Avoid_: Probe, cursor point, sample point
