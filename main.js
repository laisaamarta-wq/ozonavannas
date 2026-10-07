/* Ozona vannas — interactions
   1. Surface: hero photo rendered as live water (WebGL ripples + rising ozone bubbles)
   2. States: pick a state, the lens answers
   3. The curve: the session drawn as one line, scroll moves you along it
   4. Session dial: choose 20 / 30 / 45 min
   Everything degrades to a plain, readable page without JS or with reduced motion. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------------------------------------------------------- bubbles */
  function Bubbles(canvas, o) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, parts = [], running = false, last = 0, acc = 0;
    var self = {
      rate: o.rate || 20,        // bubbles per second
      speed: o.speed || 1,
      top: o.top == null ? 0 : o.top,     // fraction of height where bubbles fade out
      bottom: o.bottom == null ? 1 : o.bottom,
      size: o.size || 1,
      alpha: o.alpha || .7,
      circle: !!o.circle
    };
    function resize() {
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(x, y, big) {
      var r = (Math.random() < .12 ? 2.2 + Math.random() * 2.6 : .6 + Math.random() * 1.6) * self.size * (big ? 1.4 : 1);
      parts.push({
        x: x == null ? Math.random() * w : x,
        y: y == null ? h * self.bottom + 6 : y,
        r: r, vy: (18 + r * 16 + Math.random() * 20) * self.speed,
        ph: Math.random() * 6.28, amp: 4 + Math.random() * 10, f: .8 + Math.random() * 1.6, a: 0
      });
    }
    function frame(t) {
      if (!running) return;
      var dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
      acc += self.rate * dt;
      while (acc > 1) { spawn(); acc -= 1; }
      ctx.clearRect(0, 0, w, h);
      var topY = h * self.top, cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2;
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.y -= p.vy * dt;
        p.ph += p.f * dt;
        var x = p.x + Math.sin(p.ph) * p.amp * .3;
        var fade = clamp((p.y - topY) / (h * .12), 0, 1);
        p.a = Math.min(1, p.a + dt * 3) * fade;
        if (p.y < topY - 10 || p.a <= 0 && p.y < h * self.bottom - 20) { parts.splice(i, 1); continue; }
        if (self.circle) { var dx = x - cx, dy = p.y - cy; if (dx * dx + dy * dy > R * R) continue; }
        ctx.globalAlpha = p.a * self.alpha;
        ctx.beginPath(); ctx.arc(x, p.y, p.r, 0, 6.2832);
        ctx.lineWidth = .8; ctx.strokeStyle = "#ffffff"; ctx.stroke();
        if (p.r > 1.4) { ctx.beginPath(); ctx.arc(x - p.r * .35, p.y - p.r * .35, p.r * .28, 0, 6.2832); ctx.fillStyle = "#ffffff"; ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    self.burst = function (n, x, y) { for (var i = 0; i < n; i++) spawn(x == null ? null : x + (Math.random() - .5) * 30, y == null ? null : y + Math.random() * 10, true); };
    self.start = function () { if (running) return; running = true; last = performance.now(); requestAnimationFrame(frame); };
    self.stop = function () { running = false; };
    resize();
    window.addEventListener("resize", resize);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { en[0].isIntersecting ? self.start() : self.stop(); }).observe(canvas);
    } else self.start();
    return self;
  }

  /* ---------------------------------------------------------- hero water (WebGL) */
  function heroWater(hero) {
    var canvas = $("[data-hero-gl]", hero), img = $("[data-hero-img]", hero);
    if (!canvas || !img || reduce) return null;
    var gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) return null;
    var MAX = 14;
    var vs = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
    var fs = [
      "precision highp float;varying vec2 v;uniform sampler2D tex;uniform vec2 res;uniform vec2 isz;uniform vec2 pos;uniform float time;",
      "uniform vec4 drops[" + MAX + "];",
      "vec2 cover(vec2 uv){float ra=res.x/res.y,ri=isz.x/isz.y;vec2 s=vec2(1.);if(ra>ri)s.y=ri/ra;else s.x=ra/ri;return (1.-s)*pos+uv*s;}",
      "void main(){float asp=res.x/res.y;vec2 off=vec2(0.);float hl=0.;",
      "for(int i=0;i<" + MAX + ";i++){vec4 d=drops[i];float age=time-d.z;if(d.w<=0.||age<0.||age>3.2)continue;",
      "vec2 dv=v-d.xy;dv.x*=asp;float r=length(dv);float front=age*.32;float band=smoothstep(.16,0.,abs(r-front));",
      "float w=sin((r-front)*80.)*band*exp(-age*1.25)*d.w;if(r>.0001)off+=dv/r*w*.011;hl+=w;}",
      "off.x/=asp;float m=smoothstep(.46,.06,v.y);",
      "off+=m*vec2(sin(v.y*140.+time*1.6)+.6*sin(v.x*60.-time*1.1),cos(v.x*110.+time*1.3))*.0011;",
      "vec3 c=texture2D(tex,cover(clamp(v+off,0.,1.))).rgb;c+=hl*.07;gl_FragColor=vec4(c,1.);}"
    ].join("");
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var a = sh(gl.VERTEX_SHADER, vs), b = sh(gl.FRAGMENT_SHADER, fs);
    if (!a || !b) return null;
    var prog = gl.createProgram(); gl.attachShader(prog, a); gl.attachShader(prog, b); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ["tex", "res", "isz", "pos", "time", "drops"].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    var drops = new Float32Array(MAX * 4), di = 0, t0 = performance.now(), running = false, ready = false;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var tex = gl.createTexture();

    function load() {
      var src = img.currentSrc || img.src;
      var im = new Image(); im.decoding = "async";
      im.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform2f(U.isz, im.naturalWidth, im.naturalHeight);
        ready = true; resize(); hero.classList.add("gl-on"); start();
      };
      im.src = src;
    }
    function resize() {
      var r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.res, r.width, r.height);
      var op = getComputedStyle(img).objectPosition.split(" ");
      var px = parseFloat(op[0]) / 100, py = parseFloat(op[1] || "50") / 100;
      gl.uniform2f(U.pos, isNaN(px) ? .5 : px, 1 - (isNaN(py) ? .5 : py));
    }
    function drop(x, y, amp) {
      var r = canvas.getBoundingClientRect();
      drops[di * 4] = (x - r.left) / r.width;
      drops[di * 4 + 1] = 1 - (y - r.top) / r.height;
      drops[di * 4 + 2] = (performance.now() - t0) / 1000;
      drops[di * 4 + 3] = amp;
      di = (di + 1) % MAX;
    }
    function frame() {
      if (!running) return;
      gl.uniform1f(U.time, (performance.now() - t0) / 1000);
      gl.uniform4fv(U.drops, drops);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(frame);
    }
    function start() { if (ready && !running) { running = true; requestAnimationFrame(frame); } }
    function stop() { running = false; }
    if (img.complete) load(); else img.addEventListener("load", load, { once: true });
    window.addEventListener("resize", function () { if (ready) resize(); });
    new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }).observe(hero);
    // ambient drops in the water
    setInterval(function () {
      if (!running) return;
      var r = canvas.getBoundingClientRect();
      drop(r.left + r.width * (.25 + Math.random() * .7), r.top + r.height * (.72 + Math.random() * .22), .45);
    }, 2600);
    return { drop: drop };
  }

  /* ---------------------------------------------------------- smooth scroll + GSAP */
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var lenis = null;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: .1, smoothWheel: true });
    if (hasGsap) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var el = $(id); if (!el) return;
      e.preventDefault();
      setMenu(false);
      if (lenis) lenis.scrollTo(el, { offset: -64, duration: 1.4 });
      else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* ---------------------------------------------------------- header, sticky CTA */
  var header = $("[data-header]"), sticky = $(".sticky-cta"), booking = $("#pieraksts");
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle("is-scrolled", y > 40);
    header.classList.toggle("is-hidden", y > 700 && y > lastY && !doc.classList.contains("menu-open"));
    lastY = y;
    if (sticky) {
      var near = false;
      if (booking) { var r = booking.getBoundingClientRect(); near = r.top < window.innerHeight && r.bottom > 0; }
      sticky.classList.toggle("is-visible", y > window.innerHeight * .8 && !near);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var burger = $("[data-burger]"), menu = $("[data-menu]");
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    menu.hidden = !open;
    doc.classList.toggle("menu-open", open);
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  if (burger) {
    burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  /* ---------------------------------------------------------- 1. surface */
  var hero = $("[data-hero]");
  if (hero) {
    var water = heroWater(hero);
    var hb = Bubbles($('[data-bubbles="hero"]', hero), { rate: reduce ? 0 : 26, top: .5, bottom: 1, speed: .8, alpha: .75 });
    var lastDrop = 0, lx = 0, ly = 0;
    hero.addEventListener("pointermove", function (e) {
      var now = performance.now(), dx = e.clientX - lx, dy = e.clientY - ly;
      if (now - lastDrop > 90 && dx * dx + dy * dy > 2500) {
        lastDrop = now; lx = e.clientX; ly = e.clientY;
        if (water) water.drop(e.clientX, e.clientY, .55);
        var r = hero.getBoundingClientRect();
        if (e.clientY - r.top > r.height * .55) hb.burst(2, e.clientX - r.left, e.clientY - r.top);
      }
    });
    hero.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a,button")) return;
      if (water) water.drop(e.clientX, e.clientY, 1.1);
      var r = hero.getBoundingClientRect();
      hb.burst(10, e.clientX - r.left, e.clientY - r.top);
    });

    var chars = $$(".ch", hero), rises = $$("[data-rise]", hero);
    if (hasGsap && !reduce) {
      gsap.to(chars, { y: 0, opacity: 1, duration: 1.6, ease: "expo.out", stagger: { each: .055, from: "start" }, delay: .25 });
      gsap.to(rises, { y: 0, opacity: 1, duration: 1.1, ease: "power3.out", stagger: .08, delay: .9 });
      // letters drift up like bubbles when the pointer passes close
      if (finePointer) {
        var movers = chars.map(function (c) { return gsap.quickTo(c, "y", { duration: .9, ease: "power3.out" }); });
        var h1 = $(".display", hero);
        h1.addEventListener("pointermove", function (e) {
          chars.forEach(function (c, i) {
            var b = c.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
            var d = Math.hypot(e.clientX - cx, e.clientY - cy);
            movers[i](-Math.max(0, 1 - d / 160) * 22);
          });
        });
        h1.addEventListener("pointerleave", function () { movers.forEach(function (m) { m(0); }); });
      }
      // leaving the surface: the photo sinks, the text lifts away
      gsap.to("[data-hero-stage]", { scale: 1.08, yPercent: 6, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero-content, .hero-note", { yPercent: -18, opacity: 0, ease: "none", scrollTrigger: { trigger: hero, start: "35% top", end: "bottom top", scrub: true } });
    } else {
      chars.concat(rises).forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
    }
  }

  /* ---------------------------------------------------------- 2. states */
  var states = $("[data-states]");
  if (states) {
    var btns = $$("[data-state]", states), texts = $$("[data-state-text]", states);
    var lens = $("[data-lens]", states), ring = $("[data-lens-ring]", states);
    var lb = lens ? Bubbles($('[data-bubbles="lens"]', lens), { rate: reduce ? 0 : 14, circle: true, speed: .7, size: 1.2, alpha: .85 }) : null;
    var rates = [10, 16, 22, 12, 18, 26];
    function pick(i, focus) {
      btns.forEach(function (b, k) { b.setAttribute("aria-selected", k === i ? "true" : "false"); b.tabIndex = k === i ? 0 : -1; });
      texts.forEach(function (t, k) { t.classList.toggle("is-on", k === i); });
      if (ring) ring.style.strokeDashoffset = String(-i);
      if (lb) { lb.rate = reduce ? 0 : rates[i]; lb.burst(reduce ? 0 : 18); }
      $$("[data-lens-img]", states).forEach(function (im, k) { im.classList.toggle("is-on", k === i); });
      if (focus) btns[i].focus();
    }
    btns.forEach(function (b, i) {
      b.addEventListener("click", function () { pick(i); });
      if (finePointer) b.addEventListener("mouseenter", function () { pick(i); });
      b.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); pick((i + 1) % btns.length, true); }
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); pick((i - 1 + btns.length) % btns.length, true); }
      });
    });
    pick(0);
    if (hasGsap && !reduce) {
      gsap.from($$(".states-list li", states), { y: 24, opacity: 0, duration: 1, ease: "power3.out", stagger: .07, scrollTrigger: { trigger: ".states-list", start: "top 82%" } });
      if (lens) gsap.from(lens, { scale: .82, opacity: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: lens, start: "top 85%" } });
    }
  }

  /* ---------------------------------------------------------- 3. the curve */
  var curve = $("[data-curve]");
  if (curve) {
    var path = $("[data-curve-path]", curve), svg = $("[data-curve-svg]", curve);
    var dot = $("[data-curve-dot]", curve), marks = $$("[data-mark]", curve), steps = $$("[data-step]", curve);
    var bands = $$("[data-band]", curve), area = $("[data-curve-area]", curve), clip = $("[data-curve-clip]", curve), grad = $("[data-curve-grad]", curve);
    var markX = [];
    var cimg = $("[data-curve-img]", curve);
    var cb = Bubbles($('[data-bubbles="curve"]', curve), { rate: reduce ? 0 : 12, speed: .6, alpha: .45 });
    var F = [.08, .33, .5, .66, .93];
    var BASE = path.getAttribute("d"), L = 1;
    // Rebuild the path in screen pixels so the drawn line, the dot and the marks share one length.
    function layout() {
      var r = svg.getBoundingClientRect(), W = r.width, H = r.height;
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      var k = 0;
      var d = BASE.replace(/-?\d*\.?\d+/g, function (n) { var v = parseFloat(n); return (k++ % 2 === 0 ? v / 1000 * W : v / 300 * H).toFixed(1); });
      $$("path", svg).forEach(function (el) { el.setAttribute("d", d); });
      var base = $(".curve-base", svg); base.setAttribute("x2", W); base.setAttribute("y1", 200 / 300 * H); base.setAttribute("y2", 200 / 300 * H);
      L = path.getTotalLength();
      path.style.strokeDasharray = L + " " + L;
      var baseY = (200 / 300 * H).toFixed(1);
      area.setAttribute("d", d + " L" + (986 / 1000 * W).toFixed(1) + "," + baseY + " L" + (14 / 1000 * W).toFixed(1) + "," + baseY + " Z");
      grad.setAttribute("y2", H);
      clip.setAttribute("height", H);
      markX = [];
      marks.forEach(function (m, i) {
        var pt = path.getPointAtLength(F[i] * L);
        m.style.left = pt.x + "px"; m.style.top = pt.y + "px";
        markX.push(pt.x);
      });
      // phase bands: from halfway to the previous mark to halfway to the next one
      bands.forEach(function (b, i) {
        var l = i === 0 ? 0 : (markX[i - 1] + markX[i]) / 2;
        var r = i === bands.length - 1 ? W : (markX[i] + markX[i + 1]) / 2;
        b.style.left = l + "px"; b.style.width = (r - l) + "px";
      });
      return H;
    }
    var plotH = layout();
    var active = -1;
    function setP(p) {
      p = clamp(p, 0, 1);
      path.style.strokeDashoffset = String(L * (1 - p));
      var pt = path.getPointAtLength(p * L);
      dot.style.transform = "translate(" + pt.x + "px," + pt.y + "px)";
      clip.setAttribute("width", pt.x);
      var idx = 0;
      F.forEach(function (f, i) { if (p >= f - .06) idx = i; });
      marks.forEach(function (m, i) { m.classList.toggle("is-past", p >= F[i] - .06); });
      if (idx !== active) {
        active = idx;
        steps.forEach(function (st, i) { st.classList.toggle("is-on", i === idx); });
        bands.forEach(function (b, i) { b.classList.toggle("is-on", i === idx); b.classList.toggle("is-past", i <= idx); });
      }
      var intensity = clamp((200 - pt.y / plotH * 300) / 164, -.35, 1);   // 1 at the peak, negative in deep recovery
      cb.rate = reduce ? 0 : 6 + Math.max(0, intensity) * 46;
      cb.speed = .35 + Math.max(0, intensity) * 1.1;
      if (cimg) cimg.style.opacity = String(.2 + Math.max(0, intensity) * .28);
    }
    window.addEventListener("resize", function () { plotH = layout(); });
    if (hasGsap && !reduce) {
      var st = ScrollTrigger.create({
        trigger: curve, start: "top top", end: function () { return "+=" + Math.round(window.innerHeight * 3.2); },
        pin: true, scrub: .6, onUpdate: function (self) { setP(self.progress); },
        onRefresh: function (self) { plotH = layout(); setP(self.progress); }
      });
      setP(0);
    } else {
      doc.classList.add("no-motion");
      setP(1);
    }
  }

  /* ---------------------------------------------------------- 4. session dial */
  var session = $("[data-session]");
  if (session) {
    var opts = $$("[data-opt]", session), dial = $("[data-dial]", session);
    var minEl = $("[data-dial-min]", session), unitEl = $("[data-dial-unit]", session), priceEl = $("[data-dial-price]", session);
    var cta = $("[data-session-cta]", session);
    var current = { v: parseInt(minEl.textContent, 10) || 20 };
    function choose(i) {
      var o = opts[i], svc = o.getAttribute("data-svc"), min = parseInt(o.getAttribute("data-min"), 10);
      opts.forEach(function (b, k) { b.setAttribute("aria-checked", k === i ? "true" : "false"); b.tabIndex = k === i ? 0 : -1; });
      $$("[data-svc-info]", session).forEach(function (el) { el.classList.toggle("is-on", el.getAttribute("data-svc-info") === svc); });
      $$("[data-svc-photo]", session).forEach(function (el) { el.classList.toggle("is-on", el.getAttribute("data-svc-photo") === svc); });
      dial.style.strokeDasharray = min + " 45";
      priceEl.textContent = o.getAttribute("data-price");
      var unit = (o.querySelector(".opt-min").textContent.split(" ")[1]) || "";
      unitEl.textContent = unit;
      cta.href = o.getAttribute("data-wa");
      if (hasGsap && !reduce) gsap.to(current, { v: min, duration: 1, ease: "power3.out", onUpdate: function () { minEl.textContent = Math.round(current.v); } });
      else minEl.textContent = min;
    }
    opts.forEach(function (o, i) {
      o.addEventListener("click", function () { choose(i); });
      o.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); choose((i + 1) % opts.length); opts[(i + 1) % opts.length].focus(); }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); choose((i - 1 + opts.length) % opts.length); opts[(i - 1 + opts.length) % opts.length].focus(); }
      });
    });
    choose(0);
  }

  /* ---------------------------------------------------------- section entrances (one quiet move per section) */
  if (hasGsap && !reduce) {
    $$(".section-head, .curve-head, .spec-grid, .faq-grid, .booking-body").forEach(function (el) {
      gsap.from(el.children, { y: 30, opacity: 0, duration: 1.1, ease: "power3.out", stagger: .08, scrollTrigger: { trigger: el, start: "top 80%" } });
    });
    var fw = $(".footer-word");
    if (fw) gsap.from(fw, { yPercent: 40, opacity: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: fw, start: "top 95%" } });
  }

  /* ---------------------------------------------------------- FAQ: animated open/close */
  $$(".faq details").forEach(function (d) {
    var sum = $("summary", d), body = $(".faq-a", d);
    sum.addEventListener("click", function (e) {
      if (reduce || !body.animate) return;
      e.preventDefault();
      if (d.open) {
        var h = body.offsetHeight;
        body.animate([{ height: h + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 380, easing: "cubic-bezier(.22,.61,.36,1)" }).onfinish = function () { d.open = false; };
      } else {
        d.open = true;
        var h2 = body.offsetHeight;
        body.animate([{ height: "0px", opacity: 0 }, { height: h2 + "px", opacity: 1 }], { duration: 480, easing: "cubic-bezier(.16,1,.3,1)" });
      }
    });
  });

  /* ---------------------------------------------------------- buttons: the fill starts where the pointer enters */
  $$(".btn").forEach(function (b) {
    b.addEventListener("pointerenter", function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty("--x", (e.clientX - r.left) + "px");
      b.style.setProperty("--y", (e.clientY - r.top) + "px");
    });
  });

  /* ---------------------------------------------------------- cursor ring */
  var cur = $("[data-cursor]");
  if (cur && finePointer && !reduce) {
    var cx = -100, cy = -100, tx = -100, ty = -100;
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY; cur.classList.add("is-on");
      var t = e.target;
      cur.classList.toggle("is-link", !!(t.closest && t.closest("a,button,summary,label")));
      cur.classList.toggle("is-dark", !!(t.closest && t.closest(".curve")));
    });
    document.addEventListener("pointerleave", function () { cur.classList.remove("is-on"); });
    (function loop() {
      cx += (tx - cx) * .2; cy += (ty - cy) * .2;
      cur.style.transform = "translate(" + cx + "px," + cy + "px)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------------------------------------------------- privacy dialog */
  var dialog = $("[data-privacy]");
  $$("[data-privacy-open]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      if (dialog && typeof dialog.showModal === "function") dialog.showModal();
    });
  });
  if (dialog) dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });

  /* ---------------------------------------------------------- booking form → FormSubmit */
  var form = $("[data-form]");
  if (form) {
    var status = $(".form-status", form), submit = $("[type=submit]", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      $$("input[required]", form).forEach(function (f) {
        var valid = f.type === "checkbox" ? f.checked : f.checkValidity();
        f.setAttribute("aria-invalid", valid ? "false" : "true");
        if (!valid) ok = false;
      });
      if (!ok) return;
      if (form._honey && form._honey.value) return;
      var label = submit.textContent;
      submit.disabled = true;
      submit.textContent = form.dataset.sending;
      status.classList.remove("is-error");
      status.textContent = "";
      fetch("https://formsubmit.co/ajax/ozonavannas@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: form.elements.name.value,
          phone: form.elements.phone.value,
          when: form.elements.when.value,
          message: form.elements.message.value,
          page: location.pathname,
          _subject: form.dataset.subject,
          _template: "table",
          _captcha: "false"
        })
      }).then(function (r) {
        if (!r.ok) throw new Error("bad status");
        status.textContent = status.dataset.success;
        form.reset();
      }).catch(function () {
        status.classList.add("is-error");
        status.textContent = form.dataset.error;
      }).finally(function () {
        submit.disabled = false;
        submit.textContent = label;
      });
    });
  }

  window.addEventListener("load", function () { if (hasGsap) ScrollTrigger.refresh(); });
})();
