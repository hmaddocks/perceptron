// The 4 XOR rows: [x1, x2, expected]
export const XOR_ROWS = [
  [0, 0, 0],
  [0, 1, 1],
  [1, 0, 1],
  [1, 1, 0],
];

// Classic hand-crafted Solution: h1 approximates OR, h2 approximates NAND,
// and the output neuron ANDs them together — a standard minimal XOR network.
export const SOLUTION = {
  h1: { w1: 1, w2: 1, bias: -0.5 },
  h2: { w1: -1, w2: -1, bias: 1.5 },
  out: { w1: 1, w2: 1, bias: -1.5 },
};

function neuronOutput(neuron, i1, i2) {
  const sum = neuron.w1 * i1 + neuron.w2 * i2 + neuron.bias;
  const output = sum >= 0 ? 1 : 0;
  return { sum, output };
}

// Runs one forward pass through the network for a given (x1, x2) input pair.
export function computeNetwork(neurons, x1, x2) {
  const h1 = neuronOutput(neurons.h1, x1, x2);
  const h2 = neuronOutput(neurons.h2, x1, x2);
  const out = neuronOutput(neurons.out, h1.output, h2.output);
  return { h1, h2, out };
}

export function cloneNeurons(neurons) {
  return {
    h1: { ...neurons.h1 },
    h2: { ...neurons.h2 },
    out: { ...neurons.out },
  };
}
