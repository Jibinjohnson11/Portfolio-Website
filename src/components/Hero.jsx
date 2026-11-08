import { motion } from "framer-motion";
import OrbitCards from "./OrbitCards.jsx";
import { ArrowUpRight, ChatIcon } from "./icons.jsx";
import portrait from "../assets/portrait.png";

const rise = (delay) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: [0.2, 0.7, 0.1, 1] },
});

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="hero relative isolate flex h-screen h-svh flex-col overflow-hidden bg-canvas"
    >
      {/* Soft light behind the portrait */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_42%_52%_at_50%_72%,rgba(255,255,255,0.95),rgba(255,255,255,0)_70%)]"
      />

      {/* ---------- Headline + CTAs ---------- */}
      <div className="relative z-40 shrink-0 px-4 pt-[clamp(92px,12.5vh,116px)] text-center">
        <motion.h1
          id="hero-title"
          {...rise(0.05)}
          className="mx-auto font-serif text-[clamp(40px,5.4vw,88px)] font-normal leading-[0.92] tracking-[-0.02em] text-ink"
        >
          <span className="block">Thoughtfully designed</span>
          <em className="block italic text-sage-deep">websites for established brands.</em>
        </motion.h1>

        <motion.div
          {...rise(0.18)}
          className="mt-[clamp(18px,3.6vh,34px)] flex flex-wrap justify-center gap-[clamp(10px,2vw,32px)]"
        >
          <a
            href="/contact/"
            className="inline-flex h-[clamp(44px,5.2vh,48px)] items-center gap-2.5 rounded-full bg-sage px-[clamp(18px,2vw,32px)] text-[clamp(13.5px,1.05vw,16.5px)] font-semibold text-white transition duration-300 ease-premium hover:-translate-y-0.5 hover:bg-sage-deep"
          >
            Start a project <ArrowUpRight className="h-4 w-4" />
          </a>
          <a
            href="https://wa.me/917736208172"
            target="_blank"
            rel="noopener"
            className="inline-flex h-[clamp(44px,5.2vh,48px)] items-center gap-2.5 rounded-full border-[1.5px] border-ink/20 bg-white/40 px-[clamp(18px,2vw,32px)] text-[clamp(13.5px,1.05vw,16.5px)] font-semibold text-ink transition duration-300 ease-premium hover:-translate-y-0.5 hover:border-ink hover:bg-white"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-canvas">
              <ChatIcon className="h-3.5 w-3.5" />
            </span>
            <span><span className="max-[400px]:hidden">Chat on </span>WhatsApp</span>
          </a>
        </motion.div>
      </div>

      {/* ---------- Portrait stage: fills the rest of the screen, never under the CTAs.
           The portrait never moves; only the orbiting cards do. ---------- */}
      <div className="relative z-10 mt-[clamp(10px,3vh,32px)] min-h-0 flex-1">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.2, 0.7, 0.1, 1] }}
          className="absolute bottom-[-12%] left-1/2 aspect-[1029/1046] h-[min(112%,140vw)] -translate-x-[60%] md:h-[min(112%,88vw)]"
        >
          {/* Portrait and orbiting glass cards share one 3D scene: the cards revolve around
              the head and the portrait occludes them while they pass behind it */}
          <OrbitCards>
            <img
              src={portrait}
              alt=""
              width={1029}
              height={1046}
              fetchPriority="high"
              className="relative z-20 h-full w-full select-none object-contain object-bottom"
              draggable="false"
            />
          </OrbitCards>
        </motion.div>
      </div>

    </section>
  );
}
