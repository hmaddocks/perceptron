
# Ruby code to emulate the perceptron inference

def and_gate(x1, x2)
  if x1 == 1
    if x2 == 1
      1
    else
      0
    end
  else
    0
  end
end

def or_gate(x1, x2)
  if x1 == 1
    1
  elsif x2 == 1
    1
  else
    0
  end
end


def infer(x1, x2, weights)
  w1, w2, bias = weights
  sum = bias + w1 * x1 + w2 * x2

  if sum >= 0
    1
  else
    0
  end
end

and_weights = [0.2, 0.2, -0.3]
or_weights = [0.1, 0.1, -0.05]

infer(1.0, 0.0, and_weights)
infer(1.0, 0.0, or_weights)

def infer_xor(x1, x2, xor_weights)
  h1 = infer(x1, x2, xor_weights[0])
  h2 = infer(x1, x2, xor_weights[1])
  infer(h1, h2, xor_weights[2])
end

xor_h1_weights = [1, 1, -0.5]
xor_h2_weights = [-1, -1, 1.5]
xor_out_weights = [1, 1, -1.5]

infer_xor(1.0, 0.0, [xor_h1_weights, xor_h2_weights, xor_out_weights])
