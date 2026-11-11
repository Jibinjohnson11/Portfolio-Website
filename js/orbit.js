/* ==========================================================================
   orbit.js — glass carousel band orbiting the hero portrait
   Modelled on the reference video (Glass_cards_orbiting_human_portrait_43a12ad7_1080p.mp4).

   The portrait and the panels share one preserve-3d scene:
     - the portrait is a plane at z = 0, so it hides panels that pass behind the head
     - panels sit on a cylinder ring (rotateY(slot) translateZ(R)), tangent to it like a
       carousel: face-on at the front, edge-on at the sides, backs showing behind
     - the whole ring spins about its axis, tipped towards the camera and slightly rolled
   Direction (front moves right → left):  back → right → front → left → back.
   ========================================================================== */
(function () {
  const box = document.querySelector("[data-orbit]");
  const ring = document.querySelector("[data-orbit-ring]");
  if (!box || !ring) return;

  const Icons = window.Icons || {};
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Content ---------- */
  // kind: "card" = icon + title, "img" = picture panel, "glass" = blank frosted pane.
  // Every panel shares ONE size, radius and border — only the content differs.
  const PANELS = [
    { kind: "card", title: "Web Development", caption: "Fast, modern sites", icon: "code" },
    { kind: "img", src: "assets/img/work-muziris.jpg" },
    { kind: "card", title: "Full Stack Development", caption: "End-to-end apps", icon: "layers" },
    { kind: "card", title: "Python Development", caption: "Django · pandas", icon: "python" },
    { kind: "glass" },
    { kind: "card", title: "Artificial Intelligence", caption: "Models that learn", icon: "brain" },
    { kind: "img", src: "assets/img/work-airaq.jpg" },
    { kind: "card", title: "Generative AI", caption: "RAG chatbots", icon: "spark" },
    { kind: "card", title: "UI/UX Design", caption: "Clean interfaces", icon: "penTool" },
    { kind: "img", src: "assets/img/work-nova.jpg" },
    { kind: "card", title: "Search Engine Optimization (SEO)", caption: "Rank higher", icon: "trend" },
    { kind: "glass" },
    { kind: "img", art: "mist" },
  ];
  // 10 panels on tablet/desktop, 8 on phones — few enough that each slot leaves room for a readable card
  const WIDE_SET = [0, 1, 2, 3, 5, 6, 7, 8, 9, 10];
  const MOBILE_SET = [0, 1, 2, 5, 6, 7, 8, 9];

  /**
   * Per breakpoint, in px unless noted
   *   r      ring radius as a share of viewport width (capped at rMax)
   *   cardW  max panel width           cardH  panel height (same for every panel)
   *   gap    guaranteed edge-to-edge gap between neighbouring panels
   *   tilt   ring tipped towards the camera (deg)     roll  ring roll (deg)
   *   cam    perspective distance      period seconds per lap
   */
  const layoutFor = (w) =>
    w < 768
      ? { set: MOBILE_SET, r: 0.47, rMax: 200, cardW: 150, cardH: 48, gap: 18, tilt: 14, roll: 7, cam: 1100, period: 16 }
      : w < 1024
        ? { set: WIDE_SET, r: 0.43, rMax: 340, cardW: 224, cardH: 70, gap: 26, tilt: 13, roll: 7, cam: 1600, period: 18 }
        : { set: WIDE_SET, r: 0.25, rMax: 420, cardW: 232, cardH: 78, gap: 28, tilt: 12, roll: 7, cam: 2000, period: 20 };

  /**
   * Widest flat panel that still leaves `gap` between neighbours on a ring of radius R with n slots.
   * Panels are tangent to the ring, so adjacent near edges are 2R·sin(θ/2) − w·cos(θ/2) apart (θ = 2π/n).
   */
  const panelWidth = (R, n, gap, max) => {
    const half = Math.PI / n;
    return Math.max(0, Math.min(max, (2 * R * Math.sin(half) - gap) / Math.cos(half)));
  };

  /* ---------- Flexible cards ----------
     Each panel is cut into SLICES vertical strips joined by hinges, chained outward from the card's
     centre line. Each strip shows its own slice of the same panel, so content stays continuous;
     strips are rigid, so bending never stretches the card — it only curls in depth.
     Opacity is set on the strips, never on a wrapper: opacity on a preserve-3d parent flattens it. */
  const SLICES = 8;
  const HALF = SLICES / 2;
  const BEND = 36;                          // max curl (deg) at the far edge, reached at the sides
  const BEND_SUM = (HALF * (HALF - 1)) / 2; // hinge k turns k/BEND_SUM of it → total = BEND

  /* Seamless joins: neighbouring strips overlap by SEAM px and cross-fade through a mask whose curve
     m(t) makes two layers of glass with alpha a composite back to exactly one:
       a·m(t) + a·m(1−t) − a²·m(t)·m(1−t) = a */
  const SEAM = 12;
  const SEAM_ALPHA = { glass: 0.6, opaque: 1 };
  // Room around each strip for the panel's short drop shadow
  const PAD_TOP = 8, PAD_BOTTOM = 18, PAD_SIDE = 14;

  const makeRamp = (a) => {
    const mid = (1 - Math.sqrt(1 - a)) / a;   // m(½), from 2x − a·x² = 1
    const f = (t) => 2 * mid * t;
    const m = (t) => (t <= 0.5 ? f(t) : (1 - f(1 - t)) / (1 - a * f(1 - t)));
    return Array.from({ length: 9 }, (_, i) => i / 8).map((t) => [t, m(t)]);
  };

  // Ramps cached per 5 % step of the strip's drawn alpha; a mask is rewritten only when its step changes
  const rampCache = new Map();
  const rampFor = (alpha) => {
    const key = Math.max(1, Math.min(20, Math.round(alpha * 20)));
    if (!rampCache.has(key)) rampCache.set(key, makeRamp(key / 20));
    return [key, rampCache.get(key)];
  };

  const seamMask = (width, fadeLeft, fadeRight, ramp) => {
    const stops = [];
    if (fadeLeft) for (const [t, m] of ramp) stops.push(`rgba(0,0,0,${m.toFixed(3)}) ${(t * SEAM).toFixed(2)}px`);
    else stops.push("#000 0px");
    if (fadeRight) for (const [t, m] of [...ramp].reverse()) stops.push(`rgba(0,0,0,${m.toFixed(3)}) ${(width - t * SEAM).toFixed(2)}px`);
    else stops.push(`#000 ${width}px`);
    return `linear-gradient(to right, ${stops.join(", ")})`;
  };

  const fitSeams = (face, opacity) => {
    const seam = face._seam;
    const [key, ramp] = rampFor(seam.alpha * opacity);
    if (face._rampKey === key) return;
    face._rampKey = key;
    const mask = seamMask(seam.width, seam.fadeL, seam.fadeR, ramp);
    face.style.webkitMaskImage = mask;
    face.style.maskImage = mask;
  };

  /* ---------- Panel markup ---------- */
  const panelHTML = (p, compact) => {
    if (p.kind === "img") {
      // decorative: the ring is aria-hidden and each card is drawn once per strip
      return p.src
        ? `<div class="panel panel--img"><img src="${p.src}" alt="" draggable="false"><span class="panel__gloss"></span></div>`
        : `<div class="panel panel--img panel--${p.art}"><span class="panel__gloss"></span></div>`;
    }
    if (p.kind === "glass") return `<div class="panel panel--glass"></div>`;
    return (
      `<div class="panel panel--card${compact ? " panel--compact" : ""}">` +
        `<span class="panel__sheen"></span>` +
        `<span class="panel__icon">${Icons[p.icon] || ""}</span>` +
        `<span class="panel__text">` +
          `<span class="panel__title">${p.title}</span>` +
          `<span class="panel__caption">${p.caption}</span>` +
        `</span>` +
      `</div>`
    );
  };

  const el = (cls, style) => {
    const d = document.createElement("div");
    d.className = cls;
    Object.assign(d.style, style);
    return d;
  };

  // Builds one curling card; returns its face (strip) and hinge elements for the frame loop
  function buildCard(w, h, html, opaque) {
    const alpha = opaque ? SEAM_ALPHA.opaque : SEAM_ALPHA.glass;
    const sw = w / SLICES;
    const faces = new Array(SLICES);
    const hinges = { r: [], l: [] };
    const root = el("orbit__curve", { left: `${w / 2}px` });

    for (const side of [1, -1]) {
      const right = side > 0;
      let node = null;
      for (let k = HALF - 1; k >= 0; k--) {
        const outer = k === HALF - 1;
        const from = right ? w / 2 + k * sw : w / 2 - (k + 1) * sw; // slice's left edge within the panel
        // each face reaches SEAM/2 past every join and further past the outer edge for the shadow
        const extL = right ? SEAM / 2 : outer ? PAD_SIDE : SEAM / 2;
        const extR = right ? (outer ? PAD_SIDE : SEAM / 2) : SEAM / 2;
        const fadeL = right || !outer;
        const fadeR = !right || !outer;
        const faceW = sw + extL + extR;

        const hinge = el("orbit__hinge", {
          left: `${right ? (k === 0 ? 0 : sw) : -sw}px`,
          width: `${sw}px`,
          height: `${h}px`,
          transformOrigin: right ? "0 50%" : "100% 50%",
        });
        const face = el("orbit__face", {
          left: `${-extL}px`,
          top: `${-PAD_TOP}px`,
          width: `${faceW}px`,
          height: `${h + PAD_TOP + PAD_BOTTOM}px`,
        });
        face._seam = { width: faceW, fadeL, fadeR, alpha };
        face._rampKey = null;
        const clip = el("orbit__clip", { left: `${extL - from}px`, top: `${PAD_TOP}px`, width: `${w}px`, height: `${h}px` });
        clip.innerHTML = html;
        face.appendChild(clip);
        hinge.appendChild(face);
        if (node) hinge.appendChild(node);
        node = hinge;

        faces[right ? HALF + k : HALF - 1 - k] = face;
        (right ? hinges.r : hinges.l)[k] = hinge;
      }
      root.appendChild(node);
    }
    return { root, faces, hinges };
  }

  /* ---------- Build / rebuild the ring ---------- */
  let layout, cards = [], n = 0;
  let size = { w: 0, h: 0 };
  let builtFor = { vw: -1 };

  function build() {
    const vw = window.innerWidth;
    if (vw === builtFor.vw) return;
    builtFor.vw = vw;
    layout = layoutFor(vw);
    const panels = layout.set.map((i) => PANELS[i]);
    n = panels.length;
    const R = Math.min(vw * layout.r, layout.rMax);
    const cardW = panelWidth(R, n, layout.gap, layout.cardW);
    const cardH = layout.cardH;
    const compact = cardW < 170;

    ring.textContent = "";
    lastBlur = null; // new strips: re-apply any exit blur on the next frame
    cards = panels.map((p, i) => {
      const slot = el("orbit__slot", {
        width: `${cardW}px`,
        height: `${cardH}px`,
        left: `${-cardW / 2}px`,
        top: `${-cardH / 2}px`,
        transform: `rotateY(${(i * 360) / n}deg) translateZ(${R.toFixed(1)}px)`,
      });
      const card = buildCard(cardW, cardH, panelHTML(p, compact), p.kind === "img");
      slot.appendChild(card.root);
      ring.appendChild(slot);
      return card;
    });
  }

  /* ---------- Frame loop ---------- */
  let start = null;
  let lastBlur = "";
  let ringGone = false;
  function frame(now) {
    if (start === null) start = now;
    const t = now - start;
    const { w: W, h: H } = size;

    // Full exit (set by js/about.js): hide the ring outright rather than relying on the last
    // frame's opacities, which can be stale if the exit jumped. visibility doesn't flatten 3D.
    const exit = box._exit || 0;
    const gone = exit >= 0.999;
    if (gone !== ringGone) { ringGone = gone; ring.style.visibility = gone ? "hidden" : ""; }
    if (W && !gone) {
      const L = layout;
      // Ring centre ≈ eye level of the head in portrait.png
      const cx = W * 0.6, cy = H * 0.31;
      box.style.perspective = `${L.cam}px`;
      box.style.perspectiveOrigin = `${cx.toFixed(1)}px ${(cy - H * 0.06).toFixed(1)}px`;

      // spin decreases → the front of the ring travels right → left
      const spin = reduce ? -20 : -((t / 1000) / L.period) * 360;
      ring.style.transform =
        `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) rotateZ(${L.roll}deg) rotateX(${-L.tilt}deg) rotateY(${spin.toFixed(3)}deg)` +
        (exit ? ` scale3d(${(1 + 1.6 * exit).toFixed(3)}, ${(1 + 1.6 * exit).toFixed(3)}, ${(1 + 1.6 * exit).toFixed(3)})` : "");

      // Exit (0 → 1, set by js/about.js): the ring keeps spinning but grows on top of the stage
      // zoom, so the cards come at the camera faster than the portrait; they blur and fade.
      // The blur goes on the strips only: a filter on the 3D wrappers would flatten the scene.
      const blur = exit > 0.001 ? `blur(${(exit * 8).toFixed(1)}px)` : "";
      const blurChanged = blur !== lastBlur;
      lastBlur = blur;

      const intro = (reduce ? 1 : Math.min(1, Math.max(0, (t - 400) / 900))) * (1 - exit);
      for (let i = 0; i < n; i++) {
        const { faces, hinges } = cards[i];
        const a = ((spin + (i * 360) / n) * Math.PI) / 180;
        const near = (Math.cos(a) + 1) / 2; // 0 = back of the ring, 1 = front
        const op = (0.55 + 0.45 * near) * intro;
        const opStr = op.toFixed(3);
        for (const f of faces) {
          f.style.opacity = opStr;
          fitSeams(f, op);
          if (blurChanged) f.style.filter = blur;
        }

        // The half of the card nearer the back of the ring curls inward — mirrored between the sides
        const s = Math.sin(a);
        const amt = BEND * Math.abs(s);
        for (let k = 0; k < HALF; k++) {
          const step = (amt * k) / BEND_SUM;
          hinges.r[k].style.transform = `rotateY(${(s > 0 ? step : 0).toFixed(3)}deg)`;
          hinges.l[k].style.transform = `rotateY(${(s < 0 ? -step : 0).toFixed(3)}deg)`;
        }
      }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Init ---------- */
  new ResizeObserver(([e]) => {
    size = { w: e.contentRect.width, h: e.contentRect.height };
  }).observe(box);

  let resizeQueued = false;
  window.addEventListener("resize", () => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => { resizeQueued = false; build(); });
  });

  build();
  requestAnimationFrame(frame);
})();
