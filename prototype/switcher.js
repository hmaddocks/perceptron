// PROTOTYPE — throwaway UI-layout exploration. Not production code.

const VARIANTS = [
  { key: "A", name: "Side-by-side dashboard" },
  { key: "B", name: "Signal-flow (stacked)" },
  { key: "C", name: "Full-bleed canvas" },
];

export function initSwitcher({ appEl, mountVariant }) {
  let currentCleanup = null;

  function currentIndex() {
    const key = new URLSearchParams(location.search).get("variant") || "A";
    const idx = VARIANTS.findIndex((v) => v.key === key);
    return idx === -1 ? 0 : idx;
  }

  function setVariant(index) {
    const variant = VARIANTS[(index + VARIANTS.length) % VARIANTS.length];
    const url = new URL(location.href);
    url.searchParams.set("variant", variant.key);
    history.replaceState(null, "", url);

    currentCleanup?.();
    currentCleanup = mountVariant(variant.key, appEl);

    label.textContent = `${variant.key} — ${variant.name}`;
  }

  const bar = document.createElement("div");
  bar.className = "proto-switcher";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "←";
  prevBtn.addEventListener("click", () => setVariant(currentIndex() - 1));

  const label = document.createElement("span");
  label.className = "label";

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "→";
  nextBtn.addEventListener("click", () => setVariant(currentIndex() + 1));

  bar.append(prevBtn, label, nextBtn);
  document.body.appendChild(bar);

  window.addEventListener("keydown", (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;
    if (e.key === "ArrowLeft") setVariant(currentIndex() - 1);
    if (e.key === "ArrowRight") setVariant(currentIndex() + 1);
  });

  setVariant(currentIndex());
}
