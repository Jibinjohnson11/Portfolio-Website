/* ==========================================================================
   icons.js — SVG icon strings used by the orbiting cards (js/orbit.js)
   ========================================================================== */
(function () {
  const svg = (paths, strokeWidth = 1.9) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

  window.Icons = {
    code: svg('<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12"/>'),
    trend: svg('<path d="M4 17l5-5 4 3 7-8"/><path d="M15 7h5v5"/>'),
    layers: svg('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'),
    spark: svg('<path d="M12 3c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8z"/>'),
    brain: svg('<path d="M9 4a3 3 0 0 0-3 3v.2A3 3 0 0 0 4 10a3 3 0 0 0 1.2 2.4A3 3 0 0 0 6 17a3 3 0 0 0 3 3V4z"/><path d="M15 4a3 3 0 0 1 3 3v.2a3 3 0 0 1 2 2.8 3 3 0 0 1-1.2 2.4A3 3 0 0 1 18 17a3 3 0 0 1-3 3V4z"/><path d="M9 9h1.5M13.5 9H15M9 15h1.5M13.5 15H15"/>'),
    python: svg('<path d="M12 3c-4 0-4 1.6-4 3v2h4.5M8 8H5.5C4 8 3 9.4 3 12s1 4 2.5 4H8"/><path d="M12 21c4 0 4-1.6 4-3v-2h-4.5M16 16h2.5c1.5 0 2.5-1.4 2.5-4s-1-4-2.5-4H16v3.5c0 1-.8 1.5-1.5 1.5h-5c-.8 0-1.5.6-1.5 1.5V16"/><circle cx="10.5" cy="5.5" r=".6" fill="currentColor"/><circle cx="13.5" cy="18.5" r=".6" fill="currentColor"/>'),
    penTool: svg('<path d="M12 19l7-7 3 3-7 7z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z"/><path d="M2 2l7.6 7.6"/><circle cx="11" cy="11" r="2"/>'),
  };
})();
