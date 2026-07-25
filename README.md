# Perceptron Demo

An interactive, educational web simulation of the perceptron (Rosenblatt model). It demonstrates how a single artificial neuron learns.

## Pages

A shared top navbar links all three.

| Page | File | Description |
| --- | --- | --- |
| Logic Gate Demo | `index.html` | A single Perceptron learns AND/OR/NAND/NOR/XOR, shown as a Truth table or a Plane with a live decision boundary. Manual mode hand-sets weights; Training mode runs the [learning rule](docs/perceptron-learning-rule.md) step-by-step or continuously. |
| Freeform Classifier | `freeform.html` | The same Perceptron classifies points you place on a continuous plane, with separable and non-separable preset datasets. |
| XOR Network | `xor-network.html` | A hand-crafted network of 3 Perceptrons solves XOR, where a single Perceptron can't. There's no training here; see [ADR-0006](docs/adr/0006-xor-network-fixed-solution-no-training.md) for why. |

## Getting Started

No build step. Plain HTML/CSS/JS with ES modules. Serve the directory with any static file server:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html`. Opening the HTML files directly with `file://` won't work, since browsers block ES module imports from the filesystem.

## Project Structure

Each page is a self-contained trio: `<page>.html`, `<page>.js` for the template and mount, and `<page>-controller.js` for state and wiring, plus page-specific rendering or model modules (`plane.js`, `freeform-plane.js`, `xor-network-diagram.js`, `xor-network-model.js`). `perceptron.js` holds the one `Perceptron` class shared by all three pages. `nav.js` and `nav.css` render the shared navbar.

## Documentation

- [`CONTEXT.md`](CONTEXT.md): the project's domain glossary (Perceptron, Gate, View, Row, Learning rate, etc.)
- [`docs/adr/`](docs/adr): architecture decision records explaining why things are structured the way they are
- [`docs/perceptron-learning-rule.md`](docs/perceptron-learning-rule.md): how training actually reduces error
