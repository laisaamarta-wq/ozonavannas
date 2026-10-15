/* global React, ReactDOM */
const { useState, useEffect, useRef } = React;

/* Helper: render a heading where the LAST `n` words are italic-accented.
   Locale-safe — doesn't depend on punctuation being present in the source string. */
function SplitLast({ text, n = 1 }) {
  if (!text) return null;
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length <= n) return <em>{text}</em>;
  const front = parts.slice(0, parts.length - n).join(" ");
  const back = parts.slice(parts.length - n).join(" ");
  return <>{front} <em>{back}</em></>;
}

// Image set — curated Unsplash photos for wellness/spa/water imagery.
// We pre-build URLs with reasonable sizing.
const img = (id, w = 1200) =>
`https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

const IMG = {
  hero: "images/hero-bath.jpg",
  // Six audience cards (3 dark/3 light alternating)
  aud: [
  img("photo-1591343395082-e120087004b4", 800), // towels stacked
  img("photo-1519823551278-64ac92734fb1", 800), // water surface
  img("photo-1540555700478-4be289fbecef", 800), // dark spa moody
  img("photo-1559131397-f94da358f7ca", 800), // water ripples
  img("photo-1620916566398-39f1143ab7be", 800), // foam bath close
  img("photo-1544161515-4ab6ce6db874", 800) // spa candle
  ],
  howVisual: img("photo-1582719471384-894fbb16e074", 900), // water close-up
  svc1: "images/svc-ozone-bath.jpg",
  svc2: "images/svc-massage.jpg",
  bookingBg: img("photo-1556909114-44e3e9399a2d", 1000)
};

/* ---------------- WhatsApp CTA ----------------
   "Pieteikties" buttons open WhatsApp chat in a new tab. */
function openWhatsApp(e) {
  if (e) e.preventDefault();
  const msg = encodeURIComponent("Labdien! Vēlos pieteikties ozona vannas procedūrai.");
  window.open(`https://wa.me/37129405327?text=${msg}`, "_blank");
}

/* ---------------- Smooth in-page navigation ----------------
   Anchor clicks scroll smoothly to the target section. We compute the
   target's document offset and use window.scrollTo (never scrollIntoView). */
function smoothNav(e, href) {
  if (!href || href[0] !== "#") return;
  if (href === "#top") {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const el = document.querySelector(href);
  if (!el) return;
  e.preventDefault();
  const y = el.getBoundingClientRect().top + window.pageYOffset;
  window.scrollTo({ top: y, behavior: "smooth" });
}

/* ---------------- Typography: glue hanging prepositions ----------------
   Replaces the space AFTER short prepositions/conjunctions with a
   non-breaking space so they never get stranded at a line end.
   Runs once over the whole TRANSLATIONS tree (covers desktop + mobile). */
const NBSP = " ";
const SHORT_WORDS = {
  ru: ["а","и","в","во","к","ко","о","об","обо","с","со","у","на","за","по","до","из","от","не","ни","же","бы","ли","или","но","да","то","что","как","для","без","под","над","при","про","это","я"],
  lv: ["un","ar","uz","no","pie","par","pēc","bez","līdz","caur","pa","ap","aiz","pret","gar","starp","kā","ka","ne","jo","vai","arī","gan","to","un"],
  en: ["a","an","the","in","on","at","to","of","by","is","as","or","and","for","but","no","so","we","it","my","up","if","be","do"]
};
function glueShort(str, lang) {
  const set = new Set((SHORT_WORDS[lang] || []).map((w) => w.toLowerCase()));
  if (!set.size) return str;
  const tokens = str.split(/(\s+)/);
  for (let i = 0; i < tokens.length - 2; i++) {
    if (/^\s+$/.test(tokens[i])) continue;
    const clean = tokens[i].replace(/[«»"'(),.;:!?—–-]/g, "").toLowerCase();
    if (set.has(clean) && /^[ \t]+$/.test(tokens[i + 1])) {
      tokens[i + 1] = NBSP;
    }
  }
  return tokens.join("");
}
function deepTypo(node, lang) {
  if (typeof node === "string") return glueShort(node, lang);
  if (Array.isArray(node)) return node.map((n) => deepTypo(n, lang));
  if (node && typeof node === "object") {
    const out = {};
    for (const k in node) out[k] = deepTypo(node[k], lang);
    return out;
  }
  return node;
}
if (window.TRANSLATIONS && !window.__typoApplied) {
  for (const l in window.TRANSLATIONS) {
    window.TRANSLATIONS[l] = deepTypo(window.TRANSLATIONS[l], l);
  }
  window.__typoApplied = true;
}

/* ---------------- Logo mark: O₃ ----------------
   Ozone is three oxygen atoms, so the mark is three water bubbles rising
   from large to small. The same three bubbles return across the site
   (button fill, process column, booking). Unique gradient ids per instance. */
const O3_BUBBLES = [
{ cls: "b1", cx: 15, cy: 26, r: 10.5 },
{ cls: "b2", cx: 28.5, cy: 15.5, r: 6.8 },
{ cls: "b3", cx: 26, cy: 4.6, r: 3.4 }];

let _markSeq = 0;
function GlassBubble({ b, fill }) {
  // body = soft gradient that brightens toward the rim (no outline),
  // plus a main highlight and a small reflected glint
  return (
    <g className={`o3 ${b.cls}`}>
      <circle cx={b.cx} cy={b.cy} r={b.r} fill={fill}></circle>
      <ellipse
        cx={b.cx - b.r * 0.36} cy={b.cy - b.r * 0.4} rx={b.r * 0.32} ry={b.r * 0.19}
        fill="#ffffff" opacity="0.95"
        transform={`rotate(-32 ${b.cx - b.r * 0.36} ${b.cy - b.r * 0.4})`}>
      </ellipse>
      <ellipse
        cx={b.cx + b.r * 0.42} cy={b.cy + b.r * 0.5} rx={b.r * 0.18} ry={b.r * 0.08}
        fill="#ffffff" opacity="0.45"
        transform={`rotate(-32 ${b.cx + b.r * 0.42} ${b.cy + b.r * 0.5})`}>
      </ellipse>
    </g>);

}
function LogoMark({ onDark = false }) {
  const id = React.useMemo(() => `om${++_markSeq}`, []);
  // light surfaces: pale water-teal glass; deep-teal footer: white glass
  const stops = onDark ?
  [["0%", "#ffffff", 0.12], ["60%", "#ffffff", 0.22], ["86%", "#E8F1EC", 0.6], ["100%", "#ffffff", 0.95]] :
  [["0%", "#DCE7E1", 0.35], ["58%", "#BFD3CB", 0.35], ["86%", "#7E9A92", 0.55], ["100%", "#55766F", 0.75]];
  return (
    <span className="mark" aria-hidden="true">
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={`${id}-g`} cx="50%" cy="50%" r="50%">
            {stops.map(([o, c, a]) => <stop key={o} offset={o} stopColor={c} stopOpacity={a}></stop>)}
          </radialGradient>
        </defs>
        {O3_BUBBLES.map((b) => <GlassBubble key={b.cls} b={b} fill={`url(#${id}-g)`} />)}
      </svg>
    </span>);

}

/* ---------------- Ambient water details (decorative only) ----------------
   Rising bubbles: each <span> rises, its inner <i> sways sideways. Pure CSS,
   aria-hidden, no pointer events, hidden under prefers-reduced-motion. */
const BUBBLE_SETS = {
  // narrow column beside the hero photo — never on top of the real water
  hero: [
  { x: 14, s: 9, d: 18, l: -2, w: 7 },
  { x: 58, s: 15, d: 24, l: -11, w: -8 },
  { x: 34, s: 6, d: 14, l: -7, w: 5 },
  { x: 76, s: 11, d: 21, l: -16, w: 7 },
  { x: 46, s: 19, d: 28, l: -20, w: -6 },
  { x: 24, s: 7, d: 16, l: -13, w: 6 }],

  // thin strip at the right edge of the mobile hero panel
  m: [
  { x: 20, s: 7, d: 16, l: -3, w: 5 },
  { x: 62, s: 9, d: 20, l: -11, w: -5 },
  { x: 40, s: 5, d: 13, l: -7, w: 4 }]

};
function Bubbles({ set }) {
  return (
    <div className={`bubbles bubbles-${set}`} aria-hidden="true">
      {BUBBLE_SETS[set].map((b, i) =>
      <span
        key={i}
        style={{ "--x": `${b.x}%`, "--s": `${b.s}px`, "--d": `${b.d}s`, "--delay": `${b.l}s`, "--sway": `${b.w}px` }}>
          <i></i>
        </span>
      )}
    </div>);

}

/* A barely-there wavy hairline. The path repeats every 1440 units, so the
   2× wide SVG can drift by -50% and loop seamlessly. */
const WAVE_D = "M0 40 C240 12 480 12 720 40 S1200 68 1440 40 S1920 12 2160 40 S2640 68 2880 40";
function WaveLine({ variant }) {
  return (
    <div className={`wave-line wave-line-${variant}`} aria-hidden="true">
      <svg viewBox="0 0 2880 80" preserveAspectRatio="none" focusable="false">
        <path d={WAVE_D}></path>
      </svg>
    </div>);

}

/* ---------------- Hero water light ----------------
   A tiny hand-written WebGL shader paints soft caustic light — the moving
   reflections water throws on a bathroom wall — on the hero BACKGROUND, never
   on the photo. The pointer leaves a slow ripple. Rendered at half
   resolution and ~30 fps, paused off-screen and in background tabs, skipped
   on phones, with reduced motion or without WebGL (the CSS gradient stays). */
const WATER_FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uT;
uniform vec2 uM;
uniform float uMA;
float field(vec2 p, float t) {
  // domain-warped sine lattice -> an organic net of thin light channels
  p += vec2(sin(p.y * 0.9 + t * 0.40), sin(p.x * 0.8 - t * 0.35)) * 0.9;
  p += vec2(sin(p.y * 1.7 - t * 0.30), sin(p.x * 1.5 + t * 0.45)) * 0.45;
  return sin(p.x) * sin(p.y);
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * asp, uv.y) * 7.0;
  vec2 m = vec2(uM.x * asp, uM.y) * 7.0;
  float d = distance(p, m);
  // a slow ring ripple around the pointer
  p += normalize(p - m + 0.0001) * sin(d * 3.2 - uT * 2.6) * exp(-d * 0.55) * uMA * 0.35;
  float t = uT * 0.6;
  float l1 = 1.0 - smoothstep(0.0, 0.07, abs(field(p, t)));
  float l2 = 1.0 - smoothstep(0.0, 0.05, abs(field(p * 1.7 + 3.1, t * 1.3)));
  float light = max(l1, l2 * 0.6);
  float mask = 0.15 + 0.85 * smoothstep(0.15, 0.7, uv.x);
  // faint water shade everywhere, bright channels cut through it
  float shade = (0.065 + exp(-d * 0.5) * uMA * 0.05) * mask;
  float a = shade * (1.0 - light * 0.95);
  vec3 col = vec3(0.30, 0.47, 0.44);
  gl_FragColor = vec4(col * a, a);
}`;

function HeroWater() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(max-width: 720px)").matches) return;
    let gl = null;
    try { gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true }); } catch (_) {}
    if (!gl) return;
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compile(gl.VERTEX_SHADER, "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}");
    const fs = compile(gl.FRAGMENT_SHADER, WATER_FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "uRes");
    const uT = gl.getUniformLocation(prog, "uT");
    const uM = gl.getUniformLocation(prog, "uM");
    const uMA = gl.getUniformLocation(prog, "uMA");

    const host = canvas.parentElement;
    let w = 1, h = 1;
    const resize = () => {
      const r = host.getBoundingClientRect();
      const s = 0.5 * Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(r.width * s));
      h = Math.max(1, Math.round(r.height * s));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // pointer → eased position + a ripple strength that fades after you stop
    const mouse = { x: 0.7, y: 0.5, tx: 0.7, ty: 0.5, a: 0, ta: 0 };
    const onMove = (e) => {
      const r = host.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = 1 - (e.clientY - r.top) / r.height;
      mouse.ta = 1;
    };
    host.addEventListener("pointermove", onMove, { passive: true });

    let visible = true, raf = 0, last = 0;
    const t0 = performance.now();
    const frame = (now) => {
      raf = 0;
      if (!visible || document.hidden) return;
      raf = requestAnimationFrame(frame);
      if (now - last < 33) return; // ~30 fps is plenty for slow water
      last = now;
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;
      mouse.a += (mouse.ta - mouse.a) * 0.06;
      mouse.ta *= 0.97;
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uT, (now - t0) / 1000);
      gl.uniform2f(uM, mouse.x, mouse.y);
      gl.uniform1f(uMA, mouse.a);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); });
    io.observe(host);
    document.addEventListener("visibilitychange", start);
    canvas.classList.add("on");
    start();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", start);
    };
  }, []);
  return <canvas className="hero-water" ref={ref} aria-hidden="true"></canvas>;
}

/* Letters that float like on water (decorative; the h1 keeps its aria-label). */
function FloatWord({ text }) {
  return (
    <>{Array.from(text || "").map((ch, i) =>
      <span key={i} className="fl" style={{ "--i": i }}>{ch}</span>
      )}</>);

}

/* ---------------- Header ---------------- */
function Header({ lang, setLang, t, scrolled, openMenu }) {
  return (
    <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
      <div className="shell">
        <div className="inner">
          <a href="#top" className="logo" aria-label={`${t.brand.word1} ${t.brand.word2}`} onClick={(e) => smoothNav(e, "#top")}>
            <LogoMark />
            <span className="name"><span className="lw">{t.brand.word1}</span><em>·</em><span className="rw">{t.brand.word2}</span></span>
          </a>
          <nav className="nav">
            <a href="#audience" onClick={(e) => smoothNav(e, "#audience")}>{t.nav.benefits}</a>
            <a href="#how" onClick={(e) => smoothNav(e, "#how")}>{t.nav.how}</a>
            <a href="#services" onClick={(e) => smoothNav(e, "#services")}>{t.nav.services}</a>
            <a href="#faq" onClick={(e) => smoothNav(e, "#faq")}>{t.nav.faq}</a>
            <a href="#specialist" onClick={(e) => smoothNav(e, "#specialist")}>{t.nav.about}</a>
          </nav>
          <div className="header-right">
            <div className="lang" role="group" aria-label="Language">
              {["lv", "ru", "en"].map((k) =>
              <button
                key={k}
                className={k === lang ? "active" : ""}
                onClick={() => setLang(k)}
                aria-pressed={k === lang}>
                
                  {k.toUpperCase()}
                </button>
              )}
            </div>
            <button className="burger" onClick={openMenu} aria-label="Menu">
              <span></span>
            </button>
          </div>
        </div>
      </div>
    </header>);

}

/* ---------------- Hero ---------------- */
function Hero({ t }) {
  const m = t.hero.m || {};
  return (
    <section className="hero" id="top">
      <HeroWater />
      {/* ---- Mobile hero: image-led, result-first, single CTA ---- */}
      <div className="hero-m">
        <div className="hero-m-photo">
          <img src={IMG.hero} alt="Ozona vanna Rīgā — wellness procedūra nervu sistēmai" loading="eager" fetchPriority="high" />
          <span className="hero-m-photo-fade" aria-hidden="true"></span>
        </div>
        <div className="hero-m-body reveal in">
          <Bubbles set="m" />
          <div className="hero-m-cat">{t.hero.eyebrow}</div>
          <h1 className="hero-m-lead"><SplitLast text={m.lead} n={1} /></h1>
          <div className="hero-m-proc">{m.procedure}</div>
          <p className="hero-m-desc">{m.desc}</p>
          <ul className="hero-m-points">
            {(m.points || []).map((p, i) =>
            <li key={i}>{p}</li>
            )}
          </ul>
          <a href="#booking" className="btn btn-primary hero-m-cta" onClick={openWhatsApp}>
            {t.bookBtn}
            <span className="arrow"></span>
          </a>
        </div>
      </div>

      {/* ---- Desktop / tablet hero ---- */}
      <div className="hero-shell">
        <div className="hero-copy reveal in">
          <div className="eyebrow">{t.hero.eyebrow}</div>
          <h1 aria-label="Ozona vannas Rīgā — wellness procedūras nervu sistēmai">
            <span className="word1">{t.hero.title[0]}</span>
            <span className="word2"><FloatWord text={t.hero.title[1]} /></span>
          </h1>
          <p className="hero-sub">{t.hero.sub}</p>
          <div className="hero-ctas">
            <a href="#booking" className="btn btn-primary" onClick={openWhatsApp}>
              {t.bookBtn}
              <span className="arrow"></span>
            </a>
            <a href="#services" className="btn btn-ghost" onClick={(e) => smoothNav(e, "#services")}>
              {t.hero.ctaSecondary}
            </a>
          </div>
          <p className="hero-disclaimer">{t.hero.disclaimer}</p>
        </div>
        {/* wrapper only adds the ambient layer; the photo block itself is unchanged */}
        <div className="hero-visual reveal d2 in">
          <Bubbles set="hero" />
          <span className="hero-bubble b1" aria-hidden="true"></span>
          <span className="hero-bubble b2" aria-hidden="true"></span>
          <span className="hero-bubble b3" aria-hidden="true"></span>
          <div className="hero-art">
            <span className="hero-art-bar" aria-hidden="true"></span>
            <img src={IMG.hero} alt="Ozona vannas Rīgā — dabiska ūdens terapija un enerģijas atjaunošana" loading="eager" fetchPriority="high" />
            <div className="hero-tag">{t.hero.eyebrow}</div>
          </div>
        </div>
      </div>
      <WaveLine variant="hero" />
    </section>);

}

/* ---------------- Audience ---------------- */
function Audience({ t }) {
  // moving the mouse over the cards releases a few small bubbles that drift up
  const trailRef = useRef(null);
  const last = useRef({ x: 0, y: 0, t: 0 });
  const trail = (e) => {
    if (e.pointerType !== "mouse") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layer = trailRef.current;
    if (!layer) return;
    const now = performance.now();
    const p = last.current;
    const moved = Math.hypot(e.clientX - p.x, e.clientY - p.y);
    if (now - p.t < 45 || moved < 12) return;
    last.current = { x: e.clientX, y: e.clientY, t: now };
    if (layer.childElementCount > 28) return;
    const r = layer.getBoundingClientRect();
    const b = document.createElement("span");
    const size = 6 + Math.random() * 9;
    b.className = "trail-bubble";
    b.style.left = `${e.clientX - r.left - size / 2}px`;
    b.style.top = `${e.clientY - r.top - size / 2}px`;
    b.style.width = b.style.height = `${size.toFixed(1)}px`;
    b.style.setProperty("--dx", `${((Math.random() - 0.5) * 26).toFixed(1)}px`);
    b.style.setProperty("--rise", `${(38 + Math.random() * 46).toFixed(0)}px`);
    b.style.setProperty("--dur", `${(1.1 + Math.random() * 0.8).toFixed(2)}s`);
    b.addEventListener("animationend", () => b.remove(), { once: true });
    layer.appendChild(b);
  };
  return (
    <section className="audience" id="audience">
      <div className="shell">
        <div className="audience-head">
          <div className="reveal">
            <div className="eyebrow">{t.audience.eyebrow}</div>
            <h2 className="section-title">
              <SplitLast text={t.audience.title} n={2} />
            </h2>
          </div>
          <p className="section-lede reveal d1">{t.audience.lede}</p>
        </div>
        <div className="audience-grid" onPointerMove={trail}>
          <div className="trail-layer" ref={trailRef} aria-hidden="true"></div>
          {t.audience.cards.map((c, i) =>
          <article key={i} className={`aud-card reveal d${i % 3 + 1}`}>
              <div className="aud-card-top">
                <span className="aud-tag">{c.tag}</span>
                <span className="aud-glyph" aria-hidden="true">
                  <span></span><span></span><span></span>
                </span>
              </div>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              <div className="aud-card-foot">
                <span className="aud-line"></span>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>);

}

/* ---------------- How it works ---------------- */
function How({ t }) {
  // A glass column runs through the step numbers and fills with water as the
  // reader scrolls; each number "fills" when the water reaches it.
  const [reached, setReached] = useState(-1);
  const stepsRef = useRef(null);
  useEffect(() => {
    const root = stepsRef.current;
    if (!root) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const dots = Array.from(root.querySelectorAll(".how-step .n"));
      if (!dots.length) return;
      const rootTop = root.getBoundingClientRect().top;
      const centers = dots.map((d) => {
        const r = d.getBoundingClientRect();
        return r.top - rootTop + r.height / 2;
      });
      const top = centers[0];
      const len = centers[centers.length - 1] - top;
      const anchor = window.innerHeight * 0.58 - rootTop; // water line ≈ just below mid-screen
      const fill = Math.max(0, Math.min(len, anchor - top));
      root.style.setProperty("--tube-top", `${top}px`);
      root.style.setProperty("--tube-h", `${len}px`);
      root.style.setProperty("--fill", `${fill}px`);
      let r = -1;
      centers.forEach((c, i) => { if (anchor >= c - 2) r = i; });
      setReached((prev) => prev === r ? prev : r);
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(measure); };
    measure();
    const late = setTimeout(measure, 1200); // after reveal transitions settle
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(late);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, [t]);
  return (
    <section className="how" id="how">
      <WaveLine variant="how" />
      <div className="shell">
        <div className="how-grid">
          <aside className="how-aside reveal">
            <div className="eyebrow">{t.how.eyebrow}</div>
            <h2 className="section-title">
              <SplitLast text={t.how.title} n={1} />
            </h2>
            <p className="section-lede" style={{ marginTop: 22 }}>{t.how.lede}</p>
            <div className="visual" style={{ backgroundImage: `url(images/bath-foam.jpg)` }}></div>
          </aside>
          <div className="how-steps" ref={stepsRef}>
            <div className="how-tube" aria-hidden="true">
              <span className="how-fill"><i></i><i></i><i></i><i></i></span>
            </div>
            {t.how.steps.map((s, i) =>
            <div
              key={i}
              className={`how-step reveal d${i + 1}`}
              /* state lives in a data attribute so React never rewrites the
                 className (which would drop the scroll-reveal "in" class) */
              data-state={i === reached ? "active" : i < reached ? "done" : "idle"}>
                <div className="n">{s.n}</div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
                <div className="marker"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>);

}

/* ---------------- Services ---------------- */
function Services({ t }) {
  const imgs = [IMG.svc1, IMG.svc2];
  const calm = typeof window !== "undefined" && window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // the card leans a few degrees toward the pointer, a soft glass glare
  // follows it and the photo drifts the other way (mouse only)
  const tilt = (e) => {
    if (calm || e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-py * 3).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * 4).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${((py + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--ix", `${(-px * 14).toFixed(1)}px`);
    el.style.setProperty("--iy", `${(-py * 10).toFixed(1)}px`);
  };
  const untilt = (e) => {
    const el = e.currentTarget;
    ["--rx", "--ry", "--ix", "--iy"].forEach((k) => el.style.removeProperty(k));
  };
  return (
    <section className="services" id="services">
      <div className="shell">
        <div className="services-head">
          <div className="reveal">
            <div className="eyebrow">{t.services.eyebrow}</div>
            <h2 className="section-title">
              <SplitLast text={t.services.title} n={1} />
            </h2>
          </div>
          <p className="section-lede reveal d1">{t.services.lede}</p>
        </div>
        <div className="svc-list">
          {t.services.items.map((s, i) =>
          <article
            key={i}
            className={`svc-card reveal ${i % 2 === 1 ? "reverse" : ""}`}
            onPointerMove={tilt}
            onPointerLeave={untilt}>
              <div className="svc-img" style={{ backgroundImage: `url(${imgs[i]})` }}></div>
              <div className="svc-body">
                <div className="num">— 0{i + 1} / 0{t.services.items.length}</div>
                <h3>{s.name}</h3>
                <p className="desc">{s.desc}</p>
                <ul className="svc-features">
                  {s.features.map((f, j) => <li key={j}>{f}</li>)}
                </ul>
                <div className="svc-opts">
                  <div className="prices">
                    {s.opts.map((o, j) =>
                  <div className="price-item" key={j}>
                        <div className="t">{o.time}</div>
                        <div className="p">{o.price}</div>
                      </div>
                  )}
                  </div>
                  <a href="#booking" className="btn btn-primary" onClick={openWhatsApp}>
                    {s.cta}
                    <span className="arrow"></span>
                  </a>
                </div>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>);

}

/* ---------------- FAQ ---------------- */
function FAQ({ t }) {
  // Multi-open: each question toggles independently so users can keep prior answers visible.
  const [openSet, setOpenSet] = useState(() => new Set([0]));
  const toggle = (i) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);else next.add(i);
      return next;
    });
  };
  return (
    <section className="faq" id="faq">
      <WaveLine variant="faq" />
      <div className="shell">
        <div className="faq-head">
          <div className="reveal">
            <div className="eyebrow">{t.faq.eyebrow}</div>
            <h2 className="section-title">
              <SplitLast text={t.faq.title} n={1} />
            </h2>
          </div>
          <p className="faq-aside reveal d1">
            {t.audience.lede}
          </p>
        </div>
        <div className="faq-list">
          {t.faq.items.map((it, i) => {
            const isOpen = openSet.has(i);
            return (
              <div key={i} className={`faq-item ${isOpen ? "open" : ""}`}>
              <button
                  className="faq-q"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}>
                  
                <span>{it.q}</span>
                <span className="icon" aria-hidden="true"></span>
              </button>
              <div className="faq-a" id={`faq-panel-${i}`} role="region">
                <div className="faq-a-inner">{it.a}</div>
              </div>
            </div>);

          })}
        </div>
      </div>
    </section>);

}

/* ---------------- Specialist ---------------- */
function Specialist({ t }) {
  return (
    <section className="specialist" id="specialist">
      <div className="shell">
        <div className="spec-grid">
          <div className="spec-photo reveal">
            <div className="frame">
              <img src="images/nikolai.jpg" alt={t.specialist.name} loading="lazy" />
            </div>
          </div>
          <div className="spec-body reveal d2">
            <div className="eyebrow">{t.specialist.eyebrow}</div>
            <h2>
              {t.specialist.name.split(" ")[0]}{" "}
              <span className="text-warm">{t.specialist.name.split(" ").slice(1).join(" ")}</span>
            </h2>
            <div className="role">{t.specialist.role}</div>
            <hr className="spec-divider" aria-hidden="true" />
            <p className="bio">{t.specialist.bio}</p>
          </div>
        </div>
      </div>
    </section>);

}

/* ---------------- Booking ---------------- */
function Booking({ t, onOpenPrivacy }) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", consent: false });
  async function onSubmit(e) {
    e.preventDefault();
    if (!form.consent) return;
    try {
      await fetch("https://formsubmit.co/ajax/ozonavannas@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          _replyto: form.email,
          message: form.message,
          _subject: "Jauns pieteikums — Ozona Vannas",
          _captcha: "false"
        })
      });
    } catch (_) {}
    setSent(true);
    setTimeout(() => setSent(false), 6000);
    setForm({ name: "", email: "", phone: "", message: "", consent: false });
  }
  return (
    <section className="booking" id="booking">
      {/* large outline O₃ — the brand mark drifting behind the final call */}
      <svg className="book-o3" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="book-o3-g" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35"></stop>
            <stop offset="62%" stopColor="#ffffff" stopOpacity="0.2"></stop>
            <stop offset="88%" stopColor="#9DB6AE" stopOpacity="0.22"></stop>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.75"></stop>
          </radialGradient>
        </defs>
        {O3_BUBBLES.map((b) => <GlassBubble key={b.cls} b={b} fill="url(#book-o3-g)" />)}
      </svg>
      <div className="shell">
        <div className="book-grid">
          <div className="book-copy reveal">
            <div className="eyebrow">{t.booking.eyebrow}</div>
            <h2 className="title">
              <SplitLast text={t.booking.title} n={2} />
            </h2>
            <p className="lede">{t.booking.lede}</p>
            <div className="book-meta">
              <div className="row">
                <div className="k">{t.footer.contacts}</div>
                <div className="v">
                  <a href="mailto:ozonavannas@gmail.com">ozonavannas@gmail.com</a>
                  <span aria-hidden="true"> · </span>
                  <a href="tel:+37129405327">+371 29 405 327</a>
                </div>
              </div>
              <div className="row">
                <div className="k">{t.footer.venue}</div>
                <div className="v">{t.footer.address}</div>
              </div>
              <div className="row">
                <div className="k">{t.footer.hoursLabel}</div>
                <div className="v">{t.footer.hours}</div>
              </div>
            </div>
          </div>
          <form className="book-form reveal d2" onSubmit={onSubmit}>
            {sent && <div className="book-success">{t.booking.success}</div>}
            <div className="field">
              <input
                type="text" required placeholder=" "
                autoComplete="name"
                minLength={2}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
              
              <label>{t.booking.name}</label>
            </div>
            <div className="field">
              <input
                type="email" required placeholder=" "
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
              
              <label>{t.booking.email}</label>
            </div>
            <div className="field">
              <input
                type="tel" required placeholder=" "
                pattern="^[+\d][\d\s\-\(\)]{6,20}$"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              
              <label>{t.booking.phone}</label>
            </div>
            <div className="field">
              <textarea
                rows={3}
                placeholder=" "
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                style={{ resize: "vertical", minHeight: 80 }}
              />
              <label>{t.booking.messagePlaceholder || "Jautājums vai komentārs"}</label>
            </div>
            <label className="consent">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
              
              <span>
                {(() => {
                  const txt = t.booking.consent;
                  const phrase = t.privacy.linkPhrase;
                  const idx = txt.indexOf(phrase);
                  if (idx === -1) return txt;
                  return (
                    <>
                      {txt.slice(0, idx)}
                      <button
                        type="button"
                        className="privacy-link"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenPrivacy(); }}>
                        {phrase}
                      </button>
                      {txt.slice(idx + phrase.length)}
                    </>);
                })()}
              </span>
            </label>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              {t.booking.submit}
              <span className="arrow"></span>
            </button>
          </form>
        </div>
      </div>
    </section>);

}

/* ---------------- Footer ---------------- */
function Footer({ t }) {
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="foot-grid">
          <div className="foot-col foot-brand">
            <a href="#top" className="logo">
              <LogoMark onDark />
              <span className="name"><span className="lw">{t.brand.word1}</span><em>·</em><span className="rw">{t.brand.word2}</span></span>
            </a>
            <p>{t.footer.tagline}</p>
            <div className="foot-social">
              <a href="https://instagram.com/ozonavannas" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5"></rect>
                  <circle cx="12" cy="12" r="4"></circle>
                  <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"></circle>
                </svg>
              </a>
              <a href="https://t.me/NikolayJa" aria-label="Telegram" target="_blank" rel="noopener noreferrer">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42Z"></path>
                </svg>
              </a>
              <a href="https://wa.me/37129405327" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.5 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.88 1.21 3.08.15.2 2.09 3.2 5.07 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z"></path>
                  <path d="M12.02 3.5A8.45 8.45 0 0 0 4.8 16.28L3.5 20.5l4.34-1.14a8.43 8.43 0 0 0 4.17 1.06h.01A8.45 8.45 0 0 0 12.02 3.5Zm0 15.21h-.01a7 7 0 0 1-3.57-.98l-.26-.15-2.65.69.71-2.58-.17-.27a7.02 7.02 0 1 1 5.95 3.29Z"></path>
                </svg>
              </a>
            </div>
          </div>
          <div className="foot-col">
            <h4>{t.footer.nav}</h4>
            <ul>
              <li><a href="#audience">{t.nav.benefits}</a></li>
              <li><a href="#how">{t.nav.how}</a></li>
              <li><a href="#services">{t.nav.services}</a></li>
              <li><a href="#faq">{t.nav.faq}</a></li>
              <li><a href="#specialist">{t.nav.about}</a></li>
            </ul>
          </div>
          <div className="foot-col foot-contact">
            <h4>{t.footer.contacts}</h4>
            <ul>
              <li><a href="mailto:ozonavannas@gmail.com">ozonavannas@gmail.com</a></li>
              <li><a href="tel:+37129405327">+371 29 405 327</a></li>
              <li><span style={{ color: "rgba(255,255,255,.7)" }}>{t.footer.address}</span></li>
              <li><span style={{ color: "rgba(255,255,255,.7)" }}>{t.footer.hours}</span></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Studio</h4>
            <ul>
              <li><a href="#booking" onClick={openWhatsApp}>{t.bookBtn}</a></li>
              <li><span style={{ color: "rgba(255,255,255,.7)" }}>Riga · Latvia</span></li>
            </ul>
          </div>
        </div>
        <p className="foot-disclaimer">{t.footer.disclaimer}</p>
        <div className="foot-bottom">
          <span>{t.footer.rights}</span>
          <span>Made with care · Riga</span>
        </div>
      </div>
    </footer>);

}

/* ---------------- Mobile menu ---------------- */
function MobileMenu({ open, close, t, lang, setLang }) {
  const links = [
    { href: "#audience", label: t.nav.benefits },
    { href: "#how", label: t.nav.how },
    { href: "#services", label: t.nav.services },
    { href: "#faq", label: t.nav.faq },
    { href: "#specialist", label: t.nav.about }];

  return (
    <div className={`mob-menu ${open ? "open" : ""}`} aria-hidden={!open}>
      <div className="mob-menu-top">
        <span className="logo">
          <LogoMark />
          <span className="name"><span className="lw">{t.brand.word1}</span><em>·</em><span className="rw">{t.brand.word2}</span></span>
        </span>
        <button className="mob-close" onClick={close} aria-label="Close">
          <span></span><span></span>
        </button>
      </div>
      <nav className="mob-nav">
        {links.map((l, i) =>
        <a key={l.href} href={l.href} onClick={(e) => { smoothNav(e, l.href); close(); }} style={{ "--mi": i }}>
            <span className="mob-idx">{String(i + 1).padStart(2, "0")}</span>
            <span className="mob-label">{l.label}</span>
            <span className="mob-arrow" aria-hidden="true"></span>
          </a>
        )}
      </nav>
      <div className="mob-foot">
        <a href="#booking" className="btn btn-primary" onClick={(e) => { openWhatsApp(e); close(); }}>
          {t.bookBtn}
          <span className="arrow"></span>
        </a>
        <div className="mob-contact">
          <a href="tel:+37129405327">+371 29 405 327</a>
          <span className="mob-hours">{t.footer.hours}</span>
        </div>
        <div className="mob-lang" role="group" aria-label="Language">
          {["lv", "ru", "en"].map((k) =>
          <button
            key={k}
            className={k === lang ? "active" : ""}
            onClick={() => setLang(k)}
            aria-pressed={k === lang}>
              {k.toUpperCase()}
            </button>
          )}
        </div>
      </div>
    </div>);

}

/* ---------------- Privacy modal ---------------- */
function PrivacyModal({ open, close, t }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const p = t.privacy;
  return (
    <div
      className={`privacy-overlay ${open ? "open" : ""}`}
      aria-hidden={!open}
      onClick={close}>
      <div
        className="privacy-modal"
        role="dialog"
        aria-modal="true"
        aria-label={p.title}
        onClick={(e) => e.stopPropagation()}>
        <button className="privacy-close" onClick={close} aria-label="Close">×</button>
        <h2 className="privacy-title">{p.title}</h2>
        <div className="privacy-body">
          {p.sections.map((s, i) =>
          <div key={i} className="privacy-section">
            <h3>{s.h}</h3>
            <p>{s.p}</p>
          </div>
          )}
          <p className="privacy-note">{p.note}</p>
        </div>
      </div>
    </div>);

}

/* ---------------- App ---------------- */
function App() {
  // Lang persistence: keep in localStorage so reload preserves choice.
  const [lang, setLangRaw] = useState(() => {
    try {
      const saved = localStorage.getItem("ozone-lang");
      if (saved && window.TRANSLATIONS[saved]) return saved;
    } catch {}
    return "lv";
  });
  const setLang = (k) => {
    setLangRaw(k);
    try {localStorage.setItem("ozone-lang", k);} catch {}
    document.documentElement.lang = k;
  };
  useEffect(() => {document.documentElement.lang = lang;}, [lang]);

  const t = window.TRANSLATIONS[lang];
  const [scrolled, setScrolled] = useState(false);
  const [mobOpen, setMobOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  // sticky header background trigger
  useEffect(() => {
    const root = document.documentElement;
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
      // reading progress → the thin water line under the header
      const max = root.scrollHeight - window.innerHeight;
      root.style.setProperty("--sp", max > 0 ? (window.scrollY / max).toFixed(4) : "0");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // intersection-based reveal animation
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => {
      if (!el.classList.contains("in")) io.observe(el);
    });
    return () => io.disconnect();
  }, [lang]); // re-observe when lang changes & DOM reflows

  return (
    <>
      <Header
        lang={lang}
        setLang={setLang}
        t={t}
        scrolled={scrolled}
        openMenu={() => setMobOpen(true)} />
      
      <MobileMenu open={mobOpen} close={() => setMobOpen(false)} t={t} lang={lang} setLang={setLang} />
      <main>
        <Hero t={t} />
        <Audience t={t} />
        <How t={t} />
        <Services t={t} />
        <FAQ t={t} />
        <Specialist t={t} />
        <Booking t={t} onOpenPrivacy={() => setPrivacyOpen(true)} />
      </main>
      <Footer t={t} />
      <PrivacyModal open={privacyOpen} close={() => setPrivacyOpen(false)} t={t} />
    </>);

}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
