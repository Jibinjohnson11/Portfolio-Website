import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown } from "./icons.jsx";

const NAV = [
  { label: "Home", href: "/", current: true },
  { label: "About", href: "/about/" },
  { label: "Work", href: "/portfolio/" },
  { label: "Services", menu: true },
  { label: "Blog", href: "/blog/" },
  { label: "Contact", href: "/contact/" },
];

const SERVICES = {
  Kerala: [
    ["Web Developer in Kerala", "/services/web-developer-kerala/"],
    ["SEO Specialist in Kerala", "/services/seo-specialist-kerala/"],
    ["SEO Services in Kerala", "/services/seo-services-kerala/"],
    ["Full Stack Developer in Kerala", "/services/full-stack-developer-kerala/"],
    ["AI Developer in Kerala", "/services/ai-developer-kerala/"],
    ["Freelance Website Developer", "/services/freelance-website-developer-kerala/"],
  ],
  Trivandrum: [
    ["Web Developer in Trivandrum", "/services/web-developer-trivandrum/"],
    ["Full Stack Developer in Trivandrum", "/services/web-developer-trivandrum/#full-stack"],
    ["SEO Specialist in Trivandrum", "/services/seo-specialist-trivandrum/"],
    ["SEO Services in Trivandrum", "/services/seo-services-trivandrum/"],
    ["AI Developer in Trivandrum", "/services/ai-developer-kerala/#trivandrum"],
  ],
};

const pill = "inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[15px] font-medium tracking-[-0.005em] transition-colors duration-200";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const closeTimer = useRef();
  const isDesktop = () => window.matchMedia("(min-width: 961px)").matches;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    const onKey = (e) => { if (e.key === "Escape") { setMenuOpen(false); setNavOpen(false); } };
    const onClick = (e) => { if (isDesktop() && menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const hoverOpen = () => { if (isDesktop()) { clearTimeout(closeTimer.current); setMenuOpen(true); } };
  const hoverClose = () => { if (isDesktop()) closeTimer.current = setTimeout(() => setMenuOpen(false), 160); };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300 ${
        scrolled ? "bg-canvas/85 shadow-[0_1px_0_rgba(31,35,33,0.1)] backdrop-blur-xl" : ""
      }`}
    >
      <div className="relative mx-auto grid max-w-[1600px] grid-cols-[1fr_auto] items-center gap-6 px-[clamp(16px,5.1vw,82px)] py-3.5 min-[961px]:grid-cols-[1fr_auto_1fr] min-[961px]:py-[18px]">
        <a href="/" aria-label="Jibin Johnson, home" className="inline-flex items-center gap-2 justify-self-start text-[20px] font-semibold tracking-[-0.03em] min-[961px]:text-[23px]">
          Jibin Johnson
          <span aria-hidden="true" className="mt-[3px] h-[7px] w-[7px] rounded-full bg-sage-dot" />
        </a>

        {/* Primary navigation: inline on desktop, dropdown panel on mobile */}
        <nav
          id="primary-nav"
          aria-label="Main"
          className={`max-[960px]:absolute max-[960px]:inset-x-4 max-[960px]:top-[calc(100%-4px)] max-[960px]:rounded-3xl max-[960px]:border max-[960px]:border-ink/10 max-[960px]:bg-canvas-raise max-[960px]:p-2.5 max-[960px]:shadow-[0_30px_60px_-30px_rgba(31,35,33,0.4)] max-[960px]:transition max-[960px]:duration-300 ${
            navOpen ? "" : "max-[960px]:pointer-events-none max-[960px]:invisible max-[960px]:-translate-y-2 max-[960px]:opacity-0"
          }`}
        >
          <ul className="flex flex-col gap-0.5 min-[961px]:flex-row min-[961px]:items-center min-[961px]:gap-2.5">
            {NAV.map((item) =>
              item.menu ? (
                <li key={item.label} ref={menuRef} className="relative" onMouseEnter={hoverOpen} onMouseLeave={hoverClose}>
                  <button
                    type="button"
                    aria-expanded={menuOpen}
                    aria-controls="services-menu"
                    onClick={() => setMenuOpen((o) => !o)}
                    className={`${pill} w-full justify-between hover:bg-sage-soft/60 max-[960px]:rounded-2xl max-[960px]:py-3.5 max-[960px]:text-base ${menuOpen ? "bg-sage-soft/60" : ""}`}
                  >
                    Services
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div
                    id="services-menu"
                    className={`grid gap-2 transition duration-200 min-[961px]:absolute min-[961px]:left-1/2 min-[961px]:top-[calc(100%+16px)] min-[961px]:w-[min(760px,calc(100vw-48px))] min-[961px]:-translate-x-1/2 min-[961px]:grid-cols-[1fr_1fr_0.9fr] min-[961px]:rounded-3xl min-[961px]:border min-[961px]:border-ink/10 min-[961px]:bg-canvas-raise min-[961px]:p-2.5 min-[961px]:shadow-[0_40px_80px_-30px_rgba(31,35,33,0.4)] min-[961px]:before:absolute min-[961px]:before:inset-x-0 min-[961px]:before:-top-4 min-[961px]:before:h-4 ${
                      menuOpen ? "opacity-100" : "max-[960px]:hidden min-[961px]:pointer-events-none min-[961px]:invisible min-[961px]:opacity-0"
                    }`}
                  >
                    {Object.entries(SERVICES).map(([group, links]) => (
                      <div key={group} className="flex flex-col px-2 py-2 min-[961px]:py-3">
                        <p className="mb-1 border-b border-ink/10 px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">{group}</p>
                        {links.map(([label, href]) => (
                          <a key={href} href={href} className="rounded-[10px] px-2.5 py-2 text-sm font-medium transition-all duration-200 hover:bg-canvas-sink hover:pl-3.5">
                            {label}
                          </a>
                        ))}
                      </div>
                    ))}
                    <a href="/services/" className="hidden flex-col gap-2.5 rounded-[18px] bg-ink p-5 text-canvas min-[961px]:flex">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-canvas/60">One partner</span>
                      <span className="text-xl font-semibold leading-tight tracking-[-0.02em]">Websites, rankings and AI tools, together.</span>
                      <span className="mt-auto text-sm font-semibold text-[#B8CDB6]">View all services →</span>
                    </a>
                  </div>
                </li>
              ) : (
                <li key={item.label}>
                  <a
                    href={item.href}
                    aria-current={item.current ? "page" : undefined}
                    className={`${pill} w-full max-[960px]:rounded-2xl max-[960px]:py-3.5 max-[960px]:text-base ${
                      item.current ? "bg-sage-soft" : "hover:bg-sage-soft/60"
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              )
            )}
          </ul>
          <a href="/contact/" className="mx-1 mb-1 mt-2 flex items-center justify-center gap-2 rounded-full bg-ink py-3.5 font-semibold text-canvas min-[961px]:hidden">
            Start a Project <ArrowUpRight className="h-4 w-4" />
          </a>
        </nav>

        <div className="flex items-center gap-2.5 justify-self-end">
          <a
            href="/contact/"
            className="hidden items-center gap-2.5 rounded-full bg-ink px-[22px] py-[11px] text-[15px] font-semibold text-canvas transition hover:-translate-y-px hover:bg-black min-[961px]:inline-flex"
          >
            Start a Project <ArrowUpRight className="h-4 w-4" />
          </a>
          <button
            type="button"
            aria-expanded={navOpen}
            aria-controls="primary-nav"
            aria-label={navOpen ? "Close menu" : "Open menu"}
            onClick={() => setNavOpen((o) => !o)}
            className="relative h-11 w-11 rounded-full bg-canvas-sink min-[961px]:hidden"
          >
            <span className={`absolute inset-x-[13px] h-[1.6px] rounded bg-ink transition-all duration-300 ${navOpen ? "top-[21.5px] rotate-45" : "top-[18px]"}`} />
            <span className={`absolute inset-x-[13px] h-[1.6px] rounded bg-ink transition-all duration-300 ${navOpen ? "top-[21.5px] -rotate-45" : "top-[25px]"}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
