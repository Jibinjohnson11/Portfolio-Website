/* ==========================================================================
   header.js — mobile menu toggle and the Services mega-menu
   - Desktop (≥ 961px): Services opens on hover (160ms close delay) or click
   - Escape, scrolling, or clicking outside closes any open menu
   ========================================================================== */
(function () {
  const nav = document.getElementById("primary-nav");
  const burger = document.querySelector(".burger");
  const services = document.querySelector("[data-services]");
  const toggle = services.querySelector(".services__toggle");
  const menu = document.getElementById("services-menu");
  const desktop = window.matchMedia("(min-width: 961px)");

  let navOpen = false;
  let menuOpen = false;
  let closeTimer;
  let anchorY = window.scrollY;

  function setNav(open) {
    navOpen = open;
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) anchorY = window.scrollY;
  }

  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (open) anchorY = window.scrollY;
  }

  burger.addEventListener("click", () => setNav(!navOpen));
  toggle.addEventListener("click", () => setMenu(!menuOpen));

  // Hover intent on desktop
  services.addEventListener("mouseenter", () => {
    if (!desktop.matches) return;
    clearTimeout(closeTimer);
    setMenu(true);
  });
  services.addEventListener("mouseleave", () => {
    if (!desktop.matches) return;
    closeTimer = setTimeout(() => setMenu(false), 160);
  });

  // Click outside the Services item closes the mega-menu (desktop)
  document.addEventListener("click", (e) => {
    if (desktop.matches && !services.contains(e.target)) setMenu(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { setMenu(false); setNav(false); }
  });

  // Collapse any open overlay once the page actually scrolls
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (Math.abs(y - anchorY) > 12) {
      anchorY = y;
      if (menuOpen) setMenu(false);
      if (navOpen) setNav(false);
    }
  }, { passive: true });
})();
