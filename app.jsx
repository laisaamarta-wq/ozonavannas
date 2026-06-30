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
  window.open("https://wa.me/37129405327", "_blank");
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
const NBSP = "\u00A0";
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

/* ---------------- Logo mark: glass ozone orb ----------------
   Inline SVG so we get a real radial-gradient glass sphere with a
   specular highlight. Unique gradient ids per instance. */
let _markSeq = 0;
function LogoMark() {
  const id = React.useMemo(() => `om${++_markSeq}`, []);
  return (
    <span className="mark" aria-hidden="true">
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={`${id}-body`} cx="34%" cy="27%" r="80%">
            <stop offset="0%" stopColor="#ffffff"></stop>
            <stop offset="20%" stopColor="#ecf7f6"></stop>
            <stop offset="50%" stopColor="#c2e2e0"></stop>
            <stop offset="80%" stopColor="#9bc3c3"></stop>
            <stop offset="100%" stopColor="#c9cdc9"></stop>
          </radialGradient>
          <radialGradient id={`${id}-hl`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95"></stop>
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.35"></stop>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"></stop>
          </radialGradient>
        </defs>
        <circle cx="20" cy="20" r="18.5" fill={`url(#${id}-body)`}></circle>
        <circle cx="20" cy="20" r="18.5" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="0.7"></circle>
        <circle cx="20" cy="20" r="14.5" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="0.6"></circle>
        <ellipse cx="13.8" cy="12.6" rx="7.2" ry="4.8" fill={`url(#${id}-hl)`} transform="rotate(-26 13.8 12.6)"></ellipse>
      </svg>
    </span>);

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
      {/* ---- Mobile hero: image-led, result-first, single CTA ---- */}
      <div className="hero-m">
        <div className="hero-m-photo">
          <img src={IMG.hero} alt="" loading="eager" />
          <span className="hero-m-photo-fade" aria-hidden="true"></span>
        </div>
        <div className="hero-m-body reveal in">
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

      {/* ---- Desktop / tablet hero (unchanged) ---- */}
      <span className="hero-bubble b1"></span>
      <span className="hero-bubble b2"></span>
      <span className="hero-bubble b3"></span>
      <div className="hero-shell">
        <div className="hero-copy reveal in">
          <div className="eyebrow">{t.hero.eyebrow}</div>
          <h1>
            <span className="word1">{t.hero.title[0]}</span>
            <span className="word2">{t.hero.title[1]}</span>
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
        <div className="hero-art reveal d2 in">
          <span className="hero-art-bar" aria-hidden="true"></span>
          <img src={IMG.hero} alt="" loading="eager" />
          <div className="hero-tag">{t.hero.eyebrow}</div>
        </div>
      </div>
    </section>);

}

/* ---------------- Audience ---------------- */
function Audience({ t }) {
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
        <div className="audience-grid">
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
  return (
    <section className="how" id="how">
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
          <div className="how-steps">
            {t.how.steps.map((s, i) =>
            <div key={i} className={`how-step reveal d${i + 1}`}>
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
          <article key={i} className={`svc-card reveal ${i % 2 === 1 ? "reverse" : ""}`}>
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
              <img src="images/nikolai.jpg" alt={t.specialist.name} />
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
  const [form, setForm] = useState({ name: "", email: "", phone: "", consent: false });
  async function onSubmit(e) {
    e.preventDefault();
    if (!form.consent) return;
    try {
      await fetch("https://formsubmit.co/ajax/hello@ozonavannas.lv", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          _subject: "Jauns pieteikums — Ozona Vannas",
          _captcha: "false"
        })
      });
    } catch (_) {}
    setSent(true);
    setTimeout(() => setSent(false), 6000);
    setForm({ name: "", email: "", phone: "", consent: false });
  }
  return (
    <section className="booking" id="booking">
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
                  <a href="mailto:hello@ozonavannas.lv">hello@ozonavannas.lv</a>
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
              <LogoMark />
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
              <li><a href="mailto:hello@ozonavannas.lv">hello@ozonavannas.lv</a></li>
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
    const onScroll = () => setScrolled(window.scrollY > 30);
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
