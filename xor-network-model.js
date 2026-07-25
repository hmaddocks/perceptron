import { Perceptron } from "./perceptron.js";

// The 4 XOR rows: [x1, x2, expected]
export const XOR_ROWS = [
  [0, 0, 0],
  [0, 1, 1],
  [1, 0, 1],
  [1, 1, 0],
];

// Classic hand-crafted Solution: h1 approximates OR, h2 approximates NAND,
// and the output neuron ANDs them together — a standard minimal XOR network.
// Each is a Perceptron (see CONTEXT.md "Hidden neuron"/"Output neuron").
export const SOLUTION = {
  h1: new Perceptron(1, 1, -0.5),
  h2: new Perceptron(-1, -1, 1.5),
  out: new Perceptron(1, 1, -1.5),
};

// Runs one forward pass through the network for a given (x1, x2) input pair.
export function computeNetwork(neurons, x1, x2) {
  const h1 = { sum: neurons.h1.sum(x1, x2), output: neurons.h1.predict(x1, x2) };
  const h2 = { sum: neurons.h2.sum(x1, x2), output: neurons.h2.predict(x1, x2) };
  const out = { sum: neurons.out.sum(h1.output, h2.output), output: neurons.out.predict(h1.output, h2.output) };
  return { h1, h2, out };
}

export function cloneNeurons(neurons) {
  return {
    h1: new Perceptron(neurons.h1.w1, neurons.h1.w2, neurons.h1.bias),
    h2: new Perceptron(neurons.h2.w1, neurons.h2.w2, neurons.h2.bias),
    out: new Perceptron(neurons.out.w1, neurons.out.w2, neurons.out.bias),
  };
}
