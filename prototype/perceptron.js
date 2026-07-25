// PROTOTYPE — throwaway UI-layout exploration. Not production code.

export const EPOCH_CAP = 100;
export const CLASS_A = 0;
export const CLASS_B = 1;

function randWeight() {
  return (Math.random() * 2 - 1) * 0.5;
}

export class Perceptron {
  constructor(w1 = randWeight(), w2 = randWeight(), bias = randWeight()) {
    this.w1 = w1;
    this.w2 = w2;
    this.bias = bias;
  }

  sum(x, y) {
    return this.w1 * x + this.w2 * y + this.bias;
  }

  predict(x, y) {
    return this.sum(x, y) >= 0 ? 1 : 0;
  }

  // Endpoints of the line w1*x + w2*y + bias = 0, clipped to a generous range.
  boundaryEndpoints() {
    const clamp = (v) => Math.max(-5, Math.min(5, v));
    if (Math.abs(this.w2) > 1e-6) {
      const yAt = (x) => -(this.w1 * x + this.bias) / this.w2;
      return [
        { x: -1.5, y: clamp(yAt(-1.5)) },
        { x: 1.5, y: clamp(yAt(1.5)) },
      ];
    }
    if (Math.abs(this.w1) > 1e-6) {
      const x0 = -this.bias / this.w1;
      return [
        { x: x0, y: -1.5 },
        { x: x0, y: 1.5 },
      ];
    }
    return null;
  }

  // One perceptron-learning-rule update for a single point. Returns the
  // prediction/error made *before* the update, for display in the computation view.
  applyPoint(point, learningRate) {
    const pred = this.predict(point.x, point.y);
    const error = point.label - pred;
    if (error !== 0) {
      this.w1 += learningRate * error * point.x;
      this.w2 += learningRate * error * point.y;
      this.bias += learningRate * error;
    }
    return { pred, error };
  }
}

export const PRESET_SEPARABLE = [
  { x: -0.7, y: -0.6, label: CLASS_A },
  { x: -0.5, y: -0.8, label: CLASS_A },
  { x: -0.8, y: -0.3, label: CLASS_A },
  { x: -0.3, y: -0.5, label: CLASS_A },
  { x: -0.6, y: -0.2, label: CLASS_A },
  { x: 0.6, y: 0.7, label: CLASS_B },
  { x: 0.4, y: 0.5, label: CLASS_B },
  { x: 0.8, y: 0.3, label: CLASS_B },
  { x: 0.3, y: 0.8, label: CLASS_B },
  { x: 0.7, y: 0.4, label: CLASS_B },
];

// XOR-shaped — no single straight line can separate these.
export const PRESET_NON_SEPARABLE = [
  { x: -0.6, y: -0.6, label: CLASS_A },
  { x: 0.6, y: 0.6, label: CLASS_A },
  { x: -0.7, y: -0.4, label: CLASS_A },
  { x: 0.7, y: 0.4, label: CLASS_A },
  { x: -0.6, y: 0.6, label: CLASS_B },
  { x: 0.6, y: -0.6, label: CLASS_B },
  { x: -0.4, y: 0.7, label: CLASS_B },
  { x: 0.4, y: -0.7, label: CLASS_B },
];
