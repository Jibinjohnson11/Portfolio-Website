/* ==========================================================================
   about.js — Lenis smooth scroll, the push-into-the-hero transition and the
   About section animations. Needs GSAP + ScrollTrigger and Lenis
   (CDN scripts in index.html, all `defer`, loaded before this file).

   One easing everywhere: expo.out, the GSAP twin of cubic-bezier(0.22, 1, 0.36, 1).
   Scrubbed tweens use ease "none" so the scroll itself is the timing curve.

   Reduced motion: no Lenis, no pin, no zoom; the hero simply darkens as it
   scrolls away. The CSS has no hidden starting states, so everything else is
   shown statically.
   ========================================================================== */
(function () {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const hero = document.querySelector(".hero");
  const about = document.getElementById("about");
  if (!gsap || !ScrollTrigger || !hero || !about) return;

  gsap.registerPlugin(ScrollTrigger);
  const EASE = "expo.out";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const stage = hero.querySelector(".hero__stage"); // portrait + orbiting cards, one wrapper
  const copy = hero.querySelector(".hero__copy");
  const glow = hero.querySelector(".hero__glow");
  const portrait = hero.querySelector(".hero__img");
  const orbitBox = hero.querySelector("[data-orbit]");

  /* Background crossfade as opacity only: a #F0F1EF layer over the hero's
     background, under the portrait stage. It is #F0F1EF from the start, so the
     hero moves straight to the About colour and never passes through a dark
     state. Built here so the hero markup is untouched. */
  const shade = document.createElement("div");
  shade.className = "hero__shade";
  shade.setAttribute("aria-hidden", "true");
  Object.assign(shade.style, {
    position: "absolute", inset: "0", zIndex: "1", pointerEvents: "none",
    background: "#F0F1EF", opacity: "0",
  });
  hero.insertBefore(shade, stage);
  if (portrait && !reduce) portrait.classList.add("is-dissolvable"); // feathered mask, css/hero.css

  /* No portrait dimming: the background now stays light (#F0F1EF), and
     portrait.png's leftover near-white halo pixels are invisible on a light
     backdrop, so the portrait keeps its normal brightness until it fades out. */

  // Re-measure every trigger once images (and fonts) have loaded
  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

  /* One-screen About: type and spacing in .about-story scale with --k (css/about.css).
     Find the largest --k (≤ 1) at which the whole section fits one screen, so it is
     never taller than the viewport and nothing is cut off. The screen height is the
     hero's (100svh), which matches the section's own min-height. */
  const fitStory = () => {
    const screen = hero.clientHeight || window.innerHeight;
    const fits = () => about.offsetHeight <= screen + 1;
    about.style.setProperty("--k", "1");
    if (fits()) return;
    let lo = 0.6, hi = 1;
    for (let i = 0; i < 9; i++) {
      const mid = (lo + hi) / 2;
      about.style.setProperty("--k", mid.toFixed(3));
      if (fits()) lo = mid; else hi = mid;
    }
    about.style.setProperty("--k", lo.toFixed(3));
  };
  ScrollTrigger.addEventListener("refreshInit", fitStory);
  fitStory();

  /* Reduced motion: no pin, no zoom, no smooth scroll. The hero simply darkens
     as it scrolls away; everything in the About section stays static. */
  if (reduce) {
    gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
    })
      .to(shade, { opacity: 1, duration: 1 }, 0);
    return;
  }

  /* ======================================================================
     Smooth scroll (Lenis), driven by GSAP's ticker so ScrollTrigger stays in sync
     ====================================================================== */
  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ======================================================================
     1. Transition: push into the hero
     The hero pins and the camera moves forward into the scene, toward eye
     level: the stage (portrait + cards) scales 1 → 2.5 around the face area.
     Timeline runs 0 → 1 over 150% of the viewport height:
       0   – 0.3   headline + CTAs drift up and fade out
       0   – 0.6   cards fly ahead of the portrait (parallax), blur to 8px, fade
       0.6 – 1     background crossfades to #F0F1EF; the portrait dissolves into it
                   (feathered mask + soft blur), its remainder fading out from 0.85
     Only transform and opacity are animated (plus the cards' blur, in orbit.js).
     ====================================================================== */
  const ZOOM = 2.5;
  const UNIT = 1.5; // viewport heights of scroll per timeline unit
  const orbitExit = { v: 0 };
  // orbit.js reads the live tweened value every frame. (An onUpdate copy goes stale:
  // a refresh rewinds the timeline and restores it without firing onUpdate again.)
  if (orbitBox) Object.defineProperty(orbitBox, "_exit", { get: () => orbitExit.v, configurable: true });
  gsap.set(stage, { transformOrigin: "50% 45%" }); // the face area of the composition

  const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } })
    .fromTo(stage, { scale: 1 }, { scale: ZOOM, duration: 1 }, 0)
    .to(copy, { yPercent: -20, autoAlpha: 0, duration: 0.3 }, 0)
    // orbit.js scales the ring further on top of the stage zoom, so the cards
    // rush past the camera faster than the portrait; it also blurs and fades them
    .to(orbitExit, { v: 1, duration: 0.6 }, 0)
    // the portrait dissolves into the #F0F1EF backdrop alongside the background
    // change: a feathered mask closes in from its edges toward the face
    // (--dissolve, css/hero.css) while it softens and desaturates, so no hard
    // edge ever shows; whatever is left fades out at the very end
    .fromTo(portrait,
      { "--dissolve": 0, filter: "blur(0px) saturate(1)" },
      { "--dissolve": 1, filter: "blur(6px) saturate(0.75)", duration: 0.4, ease: "power1.in" }, 0.6)
    .to(portrait, { autoAlpha: 0, duration: 0.15 }, 0.85)
    .to(glow, { autoAlpha: 0, duration: 0.4 }, 0.6)
    .to(shade, { opacity: 1, duration: 0.4 }, 0.6);

  // Attached after the timeline is built, so the scroll length follows its duration
  const heroTrigger = ScrollTrigger.create({
    animation: tl,
    trigger: hero,
    start: "top top",
    end: () => "+=" + Math.round(window.innerHeight * UNIT * tl.duration()),
    pin: true,
    pinSpacing: true,
    scrub: 1,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    // will-change only while the camera move is live
    onToggle: (self) => { stage.style.willChange = self.isActive ? "transform" : ""; },
  });

  /* ======================================================================
     2. About arrival: the reveal starts inside the hero's dark phase
     From DARK_AT of the hero zoom (still pinned, background turning dark
     charcoal) until the About section reaches the top of the screen, the About
     content is held still on screen: the inner wrapper sits exactly as far above
     the section as the section still is below the top of the viewport, so it is
     drawn over the darkening hero first and then stays put as the (identical
     #F0F1EF) section slides in under it.
     In order, on one exactly-scrubbed timeline (see below): text + stats on the
     the #F0F1EF background → a short pause (where the background used to change)
     → the image. No dark state anywhere.
     It only reads the hero trigger's scroll positions; the hero animation
     itself is unchanged, and no scroll is added.
     ====================================================================== */
  const inner = about.querySelector("[data-about-inner]");
  const frame = about.querySelector(".story__frame");
  const storyImg = about.querySelector("[data-story-img]");
  const reveals = [
    ...about.querySelectorAll(".story__text [data-reveal]"),
    ...about.querySelectorAll(".stats__grid, .stat"), // the hairline frame, then each stat
  ];
  const DARK_AT = 0.9; // share of the hero zoom where the text starts (the dark charcoal phase)
  const revealStart = () => heroTrigger.start + DARK_AT * (heroTrigger.end - heroTrigger.start);
  const aboutTop = () => about.getBoundingClientRect().top + window.scrollY; // doc position; the inner's transform doesn't affect it
  const ARRIVE = { trigger: about, start: revealStart, end: "top top", invalidateOnRefresh: true };

  // Hold the content still: exact (unsmoothed) so it never drifts against the scroll
  if (inner) {
    gsap.fromTo(inner, { y: () => -(aboutTop() - revealStart()) }, {
      y: 0,
      ease: "none",
      scrollTrigger: { ...ARRIVE, scrub: true },
    });
  }

  // Stats count up once, when the reveal reaches them
  const counters = [...about.querySelectorAll("[data-count]")].map((el) => {
    const to = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    el.setAttribute("aria-label", `${to}${suffix}`); // screen readers get the final value
    el.textContent = `0${suffix}`;
    const n = { v: 0 };
    let done = false;
    return () => {
      if (done) return;
      done = true;
      gsap.to(n, {
        v: to,
        duration: 1.2,
        ease: EASE,
        onUpdate: () => { el.textContent = `${Math.round(n.v)}${suffix}`; },
      });
    };
  });

  /* One timeline for the whole sequence, scrubbed exactly (no smoothing), from
     the dark phase to the section reaching the top. Each step starts at the exact
     moment the previous one ends:
       0  → T        text + stats reveal (T = the share up to the pin's end, so the
                     text is 100% visible exactly as the pin releases)
       T  → T+BG     pause: the background is already #F0F1EF, so the step that used
                     to change it is kept empty to preserve the image's timing
       T+BG → +IMG   image fades in, scaling 1.06 → 1, starting the instant it's black */
  const textPx = (1 - DARK_AT) * UNIT * tl.duration();       // in viewport heights
  const T = textPx / (textPx + 1);                           // + the one screen after the pin
  const BG = 0.16, IMG = 0.42;
  const seq = gsap.timeline({
    defaults: { ease: "power3.out" },
    scrollTrigger: { trigger: about, start: revealStart, end: "top top", scrub: true, invalidateOnRefresh: true },
  });
  const STEP = 0.08 * T, LINE = 0.36 * T; // 9 items: the last one lands at exactly T
  reveals.forEach((el, i) => {
    seq.fromTo(el, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: LINE }, i * STEP);
  });
  const firstStat = reveals.findIndex((el) => el.classList.contains("stat"));
  if (firstStat >= 0) seq.call(() => counters.forEach((start) => start()), null, firstStat * STEP + LINE * 0.5);
  seq.to({}, { duration: BG }, T); // pause: keeps the image starting exactly where it did
  if (frame) seq.fromTo(frame, { autoAlpha: 0, scale: 1.06 }, { autoAlpha: 1, scale: 1, duration: IMG }, T + BG);
  seq.to({}, { duration: Math.max(0, 1 - seq.duration()) }); // spans exactly 0 → 1

  // Colour photo: grayscale → colour over the arrival
  if (storyImg) {
    gsap.fromTo(storyImg, { filter: "grayscale(1)" }, {
      filter: "grayscale(0)",
      ease: "none",
      scrollTrigger: { ...ARRIVE, scrub: true },
    });
    // lazy image: its box is reserved by width/height, but re-measure once it's in
    if (!storyImg.complete) storyImg.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  }

  /* "About" anchor links glide (via Lenis) to where the About screen has fully arrived */
  document.querySelectorAll('a[href="#about"], a[href="/#about"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const y = aboutTop(); // the section at the top: everything revealed
      if (lenis) lenis.scrollTo(y);
      else window.scrollTo({ top: y });
      history.replaceState(null, "", "#about");
    });
  });

  /* ======================================================================
     5. Exit: settles on the page off-white as the section scrolls away (it is
        already #F0F1EF with ink text by then, so this is nearly a no-op),
        so the next section (Work) starts light. With no next section yet the
        page ends here, so this only runs once one is added below.
        Tweening the section's own variables recolours everything that uses them.
     ====================================================================== */
  gsap.fromTo(about, { "--about-bg": "rgb(240, 241, 239)", "--about-fg": "rgb(31, 35, 33)" }, {
    "--about-bg": "rgb(241, 241, 238)",
    "--about-fg": "rgb(31, 35, 33)",
    ease: "none",
    immediateRender: false, // starts from the black the section has by then; doesn't touch it before
    scrollTrigger: { trigger: about, start: "bottom bottom", end: "bottom 30%", scrub: true },
  });
})();
