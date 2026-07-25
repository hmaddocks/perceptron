export const CLASS_A = 0;
export const CLASS_B = 1;

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
