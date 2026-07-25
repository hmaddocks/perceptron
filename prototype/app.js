// PROTOTYPE — throwaway UI-layout exploration. Not production code.
// Three variants, switchable via ?variant=A|B|C, on this throwaway route.

import { initSwitcher } from "./switcher.js";
import { mount as mountA } from "./variantA.js";
import { mount as mountB } from "./variantB.js";
import { mount as mountC } from "./variantC.js";

const MOUNTS = { A: mountA, B: mountB, C: mountC };

initSwitcher({
  appEl: document.getElementById("app"),
  mountVariant(key, root) {
    return MOUNTS[key](root);
  },
});
