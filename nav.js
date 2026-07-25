const PAGES = [
  { href: "index.html", label: "Logic Gate Demo" },
  { href: "freeform.html", label: "Freeform Classifier" },
  { href: "xor-network.html", label: "XOR Network" },
];

// Shared across all 3 standalone pages (see CONTEXT.md "Site nav"). Inserted
// as the first element of <body> so it appears above each page's own header.
export function mountSiteNav(activeHref) {
  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.innerHTML = PAGES.map((page) => {
    const isActive = page.href === activeHref;
    return `<a href="${page.href}" class="site-nav-link${isActive ? " active" : ""}">${page.label}</a>`;
  }).join("");
  document.body.insertBefore(nav, document.body.firstChild);
}
