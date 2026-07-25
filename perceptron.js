export const EPOCH_CAP = 100;

export class Perceptron {
  constructor(w1 = 0, w2 = 0, bias = 0) {
    this.w1 = w1;
    this.w2 = w2;
    this.bias = bias;
  }

  sum(x1, x2) {
    return this.w1 * x1 + this.w2 * x2 + this.bias;
  }

  predict(x1, x2) {
    return this.sum(x1, x2) >= 0 ? 1 : 0;
  }

  // Shared perceptron-learning-rule update. Returns the prediction/error
  // made *before* the update, for display.
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

  // One perceptron-learning-rule update for a single truth-table row.
  applyRow(row, learningRate) {
    const [x1, x2, expected] = row;
    return this.applyUpdate(x1, x2, expected, learningRate);
  }

  // One perceptron-learning-rule update for a single freeform point.
  applyPoint(point, learningRate) {
    return this.applyUpdate(point.x, point.y, point.label, learningRate);
  }
}

// Each row is [x1, x2, expected]. AND/OR/NAND/NOR are linearly separable;
// XOR is included deliberately — it never converges (see ADR-0003).
export const GATES = {
  AND: [
    [0, 0, 0],
    [0, 1, 0],
    [1, 0, 0],
    [1, 1, 1],
  ],
  OR: [
    [0, 0, 0],
    [0, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  NAND: [
    [0, 0, 1],
    [0, 1, 1],
    [1, 0, 1],
    [1, 1, 0],
  ],
  NOR: [
    [0, 0, 1],
    [0, 1, 0],
    [1, 0, 0],
    [1, 1, 0],
  ],
  XOR: [
    [0, 0, 0],
    [0, 1, 1],
    [1, 0, 1],
    [1, 1, 0],
  ],
};
