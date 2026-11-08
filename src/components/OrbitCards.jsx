import { useEffect, useRef, useState } from "react";
import { useAnimationFrame, useReducedMotion } from "framer-motion";
import muziris from "../assets/work-muziris.jpg";
import airaq from "../assets/work-airaq.jpg";
import nova from "../assets/work-nova.jpg";
import { BrainIcon, CodeIcon, LayersIcon, PenToolIcon, PythonIcon, SparkIcon, TrendIcon } from "./icons.jsx";

/**
 * Glass carousel band around the head, modelled on the reference video
 * (Glass_cards_orbiting_human_portrait_43a12ad7_1080p.mp4).
 *
 * The portrait and the panels share one preserve-3d scene:
 *   - the portrait is a plane at z = 0, so it hides panels that pass behind the head
 *   - the panels sit on a cylinder ring (rotateY(slot) translateZ(R)), i.e. tangent to the
 *     ring like a carousel: face-on at the front, edge-on at the sides, backs showing behind
 *   - the whole ring spins about its axis, tipped towards the camera and slightly rolled
 * Direction (front moves right → left):  back → right → front → left → back.
 */

// Panel kinds: "card" = icon + title, "img" = picture panel, "glass" = blank frosted pane.
// Every panel shares ONE size, corner radius and border — only the content differs.
const PANELS = [
  { kind: "card", title: "Web Development", caption: "Fast, modern sites", icon: CodeIcon },
  { kind: "img", src: muziris } /* Muziris — City at Sea */,
  { kind: "card", title: "Full Stack Development", caption: "End-to-end apps", icon: LayersIcon },
  { kind: "card", title: "Python Development", caption: "Django · pandas", icon: PythonIcon },
  { kind: "glass" },
  { kind: "card", title: "Artificial Intelligence", caption: "Models that learn", icon: BrainIcon },
  { kind: "img", src: airaq } /* AirAQ */,
  { kind: "card", title: "Generative AI", caption: "RAG chatbots", icon: SparkIcon },
  { kind: "card", title: "UI/UX Design", caption: "Clean interfaces", icon: PenToolIcon },
  { kind: "img", src: nova } /* NOVA dashboard */,
  { kind: "card", title: "Search Engine Optimization (SEO)", caption: "Rank higher", icon: TrendIcon },
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
 * Panels are tangent to the ring, so adjacent near edges are
 *   2R·sin(θ/2) − w·cos(θ/2)   apart  (θ = 2π/n)  →  solve for w.
 */
const panelWidth = (R, n, gap, max) => {
  const half = Math.PI / n;
  return Math.max(0, Math.min(max, (2 * R * Math.sin(half) - gap) / Math.cos(half)));
};

export default function OrbitCards({ children }) {
  const reduce = useReducedMotion();
  const box = useRef(null);
  const ring = useRef(null);
  const faceRefs = useRef([]);  // per card: the visible strips (opacity lives here — see CurvedCard)
  const hingeRefs = useRef([]); // per card: { r: [...], l: [...] } hinge elements, bent every frame
  const size = useRef({ w: 0, h: 0 });
  const [layout, setLayout] = useState(() => layoutFor(typeof window === "undefined" ? 1440 : window.innerWidth));
  const [vw, setVw] = useState(() => (typeof window === "undefined" ? 1440 : window.innerWidth));

  const panels = layout.set.map((i) => PANELS[i]);
  const n = panels.length;
  const R = Math.min(vw * layout.r, layout.rMax);
  // One size for every panel; never changes during the spin (only the camera's perspective does)
  const cardW = panelWidth(R, n, layout.gap, layout.cardW);
  const cardH = layout.cardH;

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => { size.current = { w: e.contentRect.width, h: e.contentRect.height }; });
    ro.observe(box.current);
    const onResize = () => { setLayout(layoutFor(window.innerWidth)); setVw(window.innerWidth); };
    window.addEventListener("resize", onResize);
    return () => { ro.disconnect(); window.removeEventListener("resize", onResize); };
  }, []);

  useAnimationFrame((t) => {
    const { w: W, h: H } = size.current;
    if (!W || !ring.current) return;
    const L = layout;
    // Ring centre ≈ eye level of the head in portrait.png
    const cx = W * 0.6, cy = H * 0.31;
    box.current.style.perspective = `${L.cam}px`;
    box.current.style.perspectiveOrigin = `${cx.toFixed(1)}px ${(cy - H * 0.06).toFixed(1)}px`;

    // spin decreases → the front of the ring travels right → left
    const spin = reduce ? -20 : -((t / 1000) / L.period) * 360;
    ring.current.style.transform =
      `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) rotateZ(${L.roll}deg) rotateX(${-L.tilt}deg) rotateY(${spin.toFixed(3)}deg)`;

    const intro = reduce ? 1 : Math.min(1, Math.max(0, (t - 400) / 900));
    for (let i = 0; i < n; i++) {
      const faces = faceRefs.current[i];
      const hinges = hingeRefs.current[i];
      if (!faces || !hinges) continue;
      const a = ((spin + (i * 360) / n) * Math.PI) / 180;
      const near = (Math.cos(a) + 1) / 2;            // 0 = back of the ring, 1 = front
      const op = ((0.55 + 0.45 * near) * intro).toFixed(3);
      for (const f of faces) if (f) { f.style.opacity = op; fitSeams(f, +op); }

      // Flex: sin(a) > 0 on the right side, < 0 on the left; 0 at the front and back.
      // The half of the card nearer the back of the ring curls inward — the +x half on the right,
      // the −x half on the left — so the bend mirrors between the sides and peaks at them.
      const s = Math.sin(a);
      const amt = BEND * Math.abs(s);
      for (let k = 0; k < HALF; k++) {
        const step = (amt * k) / BEND_SUM;            // hinge k of the active half
        const r = hinges.r[k], l = hinges.l[k];
        if (r) r.style.transform = `rotateY(${(s > 0 ? step : 0).toFixed(3)}deg)`;
        if (l) l.style.transform = `rotateY(${(s < 0 ? -step : 0).toFixed(3)}deg)`;
      }
    }
  });

  return (
    // Perspective camera. Nothing on these wrappers may set opacity / filter / overflow, or the scene flattens.
    <div ref={box} className="absolute inset-0">
      <div className="absolute inset-0 [transform-style:preserve-3d]">
        <div className="absolute inset-0 [transform:translateZ(0)]">{children}</div>

        <div ref={ring} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-0 w-0 [transform-style:preserve-3d] will-change-transform">
          {panels.map((p, i) => (
            <div
              key={i}
              className="absolute [transform-style:preserve-3d]"
              style={{
                width: cardW,
                height: cardH,
                left: -cardW / 2,
                top: -cardH / 2,
                transform: `rotateY(${(i * 360) / n}deg) translateZ(${R.toFixed(1)}px)`,
              }}
            >
              <CurvedCard
                w={cardW}
                h={cardH}
                faces={(faceRefs.current[i] ??= [])}
                hinges={(hingeRefs.current[i] ??= { r: [], l: [] })}
                opaque={p.kind === "img"}
              >
                <Panel {...p} compact={cardW < 170} />
              </CurvedCard>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Flexible card: the panel is cut into SLICES vertical strips joined by hinges, chained outward from
 * the card's centre line (right half and left half). Each strip shows its own slice of the same
 * panel, so the content stays continuous; strips are rigid, so bending never stretches the card —
 * its width, height and corners are unchanged, it only curls in depth.
 *
 * Opacity is set on the strips, never on a wrapper: opacity on a preserve-3d parent flattens it.
 */
const SLICES = 8;
const HALF = SLICES / 2;
const BEND = 36;                                   // max curl (deg) at the far edge, reached at the sides
const BEND_SUM = (HALF * (HALF - 1)) / 2;          // hinge k turns k/BEND_SUM of it → total = BEND

/**
 * Seamless joins. Strips that merely abut leave a visible hairline at every join (each strip's edge is
 * anti-aliased on its own), and strips that overlap paint the translucent glass twice (a bright line).
 * Instead, neighbouring strips overlap by SEAM px and cross-fade through a mask. The fade curve m(t) is
 * chosen so that two layers of glass with alpha ≈ SEAM_ALPHA composite back to exactly one layer:
 *   a·m(t) + a·m(1−t) − a²·m(t)·m(1−t) = a      (symmetric, so it holds whichever strip paints on top)
 * The raw strip edges then sit where their mask is 0, so no edge is ever visible.
 */
const SEAM = 12;
const SEAM_ALPHA = { glass: 0.6, opaque: 1 };     // translucent glass cards vs solid picture panels
// Room around each strip for the panel's drop shadow. The shadow is drawn in the card's own (tilted,
// bending) plane, so a long shadow smears into grey trails below cards seen side-on near the edges
// of the ring. It is kept short (≈ 12px) and these pads only fit that.
const PAD_TOP = 8, PAD_BOTTOM = 18, PAD_SIDE = 14;

const makeRamp = (a) => {
  const mid = (1 - Math.sqrt(1 - a)) / a;           // m(½), from 2x − a·x² = 1
  const f = (t) => 2 * mid * t;                     // first half: linear up to mid
  const m = (t) => (t <= 0.5 ? f(t) : (1 - f(1 - t)) / (1 - a * f(1 - t)));
  return Array.from({ length: 9 }, (_, i) => i / 8).map((t) => [t, m(t)]);
};

// The cross-fade must match the alpha a strip is actually drawn at, which includes its fade-out
// towards the back of the ring. Ramps are cached per 5 % step of that alpha, and a strip's mask is
// rewritten only when its step changes.
const rampCache = new Map();
const rampFor = (alpha) => {
  const key = Math.max(1, Math.min(20, Math.round(alpha * 20)));
  if (!rampCache.has(key)) rampCache.set(key, makeRamp(key / 20));
  return [key, rampCache.get(key)];
};
const fitSeams = (face, opacity) => {
  const seam = face._seam;
  if (!seam) return;
  const [key, ramp] = rampFor(seam.alpha * opacity);
  if (face._rampKey === key) return;
  face._rampKey = key;
  const mask = seamMask(seam.width, seam.fadeL, seam.fadeR, ramp);
  face.style.webkitMaskImage = mask;
  face.style.maskImage = mask;
};

// mask for a face `width` px wide; fade in over SEAM px on each side that meets another strip
const seamMask = (width, fadeLeft, fadeRight, seamRamp) => {
  const stops = [];
  if (fadeLeft) for (const [t, m] of seamRamp) stops.push(`rgba(0,0,0,${m.toFixed(3)}) ${(t * SEAM).toFixed(2)}px`);
  else stops.push("#000 0px");
  if (fadeRight) for (const [t, m] of [...seamRamp].reverse()) stops.push(`rgba(0,0,0,${m.toFixed(3)}) ${(width - t * SEAM).toFixed(2)}px`);
  else stops.push(`#000 ${width}px`);
  return `linear-gradient(to right, ${stops.join(", ")})`;
};

function CurvedCard({ w, h, faces, hinges, opaque, children }) {
  const alpha = opaque ? SEAM_ALPHA.opaque : SEAM_ALPHA.glass;
  const sw = w / SLICES;
  const chain = (side) => {
    let node = null;
    for (let k = HALF - 1; k >= 0; k--) {
      const right = side > 0;
      const outer = k === HALF - 1;
      const from = right ? w / 2 + k * sw : w / 2 - (k + 1) * sw; // slice's left edge within the panel
      // each face reaches SEAM/2 past every join (to cross-fade with its neighbour) and further past
      // the card's outer edge so the drop shadow isn't cut off
      const extL = right ? SEAM / 2 : outer ? PAD_SIDE : SEAM / 2;
      const extR = right ? (outer ? PAD_SIDE : SEAM / 2) : SEAM / 2;
      const fadeL = right || !outer;
      const fadeR = !right || !outer;
      const faceW = sw + extL + extR;
      node = (
        <div
          ref={(el) => ((right ? hinges.r : hinges.l)[k] = el)}
          className="absolute top-0 [transform-style:preserve-3d]"
          style={{ left: right ? (k === 0 ? 0 : sw) : -sw, width: sw, height: h, transformOrigin: right ? "0 50%" : "100% 50%" }}
        >
          <div
            ref={(el) => {
              faces[(right ? HALF : HALF - 1) + (right ? k : -k)] = el;
              // mask is applied per frame by fitSeams; reset so it is rebuilt after any re-render
              if (el) { el._seam = { width: faceW, fadeL, fadeR, alpha }; el._rampKey = null; }
            }}
            className="absolute opacity-0"
            style={{
              left: -extL,
              top: -PAD_TOP,
              width: faceW,
              height: h + PAD_TOP + PAD_BOTTOM,
            }}
          >
            <div className="absolute" style={{ left: extL - from, top: PAD_TOP, width: w, height: h }}>{children}</div>
          </div>
          {node}
        </div>
      );
    }
    return node;
  };
  return (
    <div className="absolute top-0 h-full w-0 [transform-style:preserve-3d]" style={{ left: w / 2 }}>
      {chain(1)}
      {chain(-1)}
    </div>
  );
}

const glass =
  "border-[1.5px] border-white/75 bg-[linear-gradient(140deg,rgba(255,255,255,0.82),rgba(236,238,235,0.55)_55%,rgba(255,255,255,0.7))] " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(31,35,33,0.06),0_6px_14px_-8px_rgba(31,35,33,0.28)]";

const ART = {
  hill:
    "bg-[linear-gradient(200deg,transparent_50%,rgba(20,40,26,0.55)_51%,rgba(20,40,26,0.9)),linear-gradient(160deg,transparent_36%,#4A6E50_37%,#24382A_72%),linear-gradient(180deg,#EEF1EC,#B5C6B3_62%)]",
  valley:
    "bg-[linear-gradient(165deg,transparent_42%,#5F8664_43%,#2C4532_75%),linear-gradient(195deg,transparent_48%,#7FA083_49%,#3D5E44_80%),linear-gradient(180deg,#F2F4F0,#C9D5C6_58%)]",
  mist:
    "bg-[radial-gradient(120%_70%_at_50%_115%,#3F5F45_0_38%,transparent_39%),radial-gradient(90%_60%_at_20%_100%,#7C9C7F_0_40%,transparent_41%),linear-gradient(180deg,#F4F6F2,#D3DDD0)]",
  planet:
    "bg-[radial-gradient(circle_at_58%_112%,#B9BFBB_0_22%,#5B615E_34%,#1E2120_46%,transparent_47%),radial-gradient(circle_at_24%_22%,#fff_0_1px,transparent_2px),radial-gradient(circle_at_72%_30%,rgba(255,255,255,.8)_0_1px,transparent_1.6px),linear-gradient(165deg,#3A3E3C,#0E100F)]",
};

function Panel({ kind, title, caption, icon: Icon, art, src, compact }) {
  if (kind === "img") {
    return (
      <div className={`relative h-full w-full overflow-hidden rounded-[16px] border-[1.5px] border-white/85 shadow-[0_6px_14px_-8px_rgba(31,35,33,0.35)] ${src ? "bg-[#1f2321]" : ART[art]}`}>
        {/* decorative: the ring is aria-hidden and each card is drawn once per strip */}
        {src && <img src={src} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover object-center" />}
        <span className="absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.35),rgba(255,255,255,0)_40%)]" />
      </div>
    );
  }
  if (kind === "glass") return <div className={`h-full w-full rounded-[16px] ${glass}`} />;
  return (
    <div className={`relative flex h-full w-full items-center overflow-hidden rounded-[16px] ${compact ? "gap-2 px-2.5" : "gap-3 px-3.5"} ${glass}`}>
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0)_38%,rgba(255,255,255,0.2)_60%,rgba(255,255,255,0)_74%)]" />
      <span
        className={`relative grid shrink-0 place-items-center rounded-[10px] bg-[linear-gradient(150deg,#8DBE85,#4F8A55)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_12px_-6px_rgba(47,69,54,0.6)] ${
          compact ? "h-6 w-6" : "h-9 w-9"
        }`}
      >
        <Icon className={compact ? "h-3.5 w-3.5" : "h-[18px] w-[18px]"} />
      </span>
      <span className="relative flex min-w-0 flex-col leading-tight">
        <span className={`line-clamp-3 font-bold tracking-[-0.02em] text-ink ${compact ? "text-[10.5px]" : "text-[14.5px]"}`}>{title}</span>
        <span className={`mt-0.5 truncate text-ink-2 ${compact ? "text-[8.5px]" : "text-[11.5px]"}`}>{caption}</span>
      </span>
    </div>
  );
}
