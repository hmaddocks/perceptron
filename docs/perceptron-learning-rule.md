# The Perceptron Learning Rule

Training in this project (the Gate demo and the Freeform Classifier) uses the classic **Perceptron Learning Rule** (Rosenblatt's original algorithm) — not gradient descent. It's implemented once, in `perceptron.js`, and shared by both pages:

```js
applyUpdate(x1, x2, expected, learningRate) {
  const pred = this.predict(x1, x2);
  const error = expected - pred;
  if (error !== 0) {
    this.w1 += learningRate * error * x1;
    this.w2 += learningRate * error * x2;
    this.bias += learningRate * error;
  }
  return { pred, error };
}
```

## How it reduces error

- **Error signal**: `error = expected - predicted`, always exactly `-1`, `0`, or `+1` (both are binary 0/1) — a discrete correctness signal, not a continuous loss gradient.
- **Update rule**: when a row/point is misclassified, each weight is nudged by `learningRate × error × input` (and the bias by `learningRate × error`), pushing the weighted sum in the direction that would have produced the correct output for *that specific example*.
- **Correct examples do nothing**: if `error === 0`, no update happens — this is a purely corrective, mistake-driven rule.
- **Online, per-example**: it updates after every single row (Gate demo) or point (Freeform Classifier), one at a time. An Epoch is one full pass applying this to every row/point (`stepOnce` in `app.js`, `applyOnePoint` in `freeform-controller.js`).

## Why not gradient descent

The step activation (`sum >= 0 ? 1 : 0`) isn't differentiable, so there's no gradient to descend. The Perceptron Convergence Theorem guarantees this rule finds a separating line in a finite number of epochs *if one exists* — true for AND/OR/NAND/NOR and the Freeform Classifier's separable preset.

If the data isn't linearly separable — XOR, or the Freeform Classifier's non-separable preset — the rule never converges, and training just runs until `EPOCH_CAP` (100 epochs) stops it. This is deliberate: XOR's non-convergence under this rule is the whole reason the [XOR Network page](../xor-network.html) exists (see [ADR-0006](adr/0006-xor-network-fixed-solution-no-training.md)).
