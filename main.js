(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");

  // Header background on scroll + sticky CTA after the hero
  var header = document.querySelector("[data-header]");
  var sticky = document.querySelector(".sticky-cta");
  var booking = document.getElementById("pieraksts");
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("is-scrolled", y > 20);
    if (sticky) {
      var nearBooking = false;
      if (booking) {
        var r = booking.getBoundingClientRect();
        nearBooking = r.top < window.innerHeight && r.bottom > 0;
      }
      sticky.classList.toggle("is-visible", y > window.innerHeight * 0.6 && !nearBooking);
    }
  }
  // "How it works": the rail fills and steps light up as you scroll
  var steps = document.querySelector("[data-steps]");
  var stepItems = steps ? steps.querySelectorAll("li") : [];
  function onSteps() {
    if (!steps) return;
    var vh = window.innerHeight, mark = vh * 0.6;
    var r = steps.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, (mark - r.top) / r.height));
    steps.style.setProperty("--p", p.toFixed(3));
    stepItems.forEach(function (li) {
      li.classList.toggle("is-active", li.getBoundingClientRect().top < mark);
    });
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); onSteps(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", onSteps);
  onScroll();
  onSteps();

  // Mobile menu
  var burger = document.querySelector("[data-burger]");
  var menu = document.querySelector("[data-menu]");
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    menu.hidden = !open;
  }
  if (burger) {
    burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  // Reveal on scroll
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }

  // Privacy dialog
  var dialog = document.querySelector("[data-privacy]");
  document.querySelectorAll("[data-privacy-open]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      if (dialog && typeof dialog.showModal === "function") dialog.showModal();
    });
  });
  if (dialog) {
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
  }

  // Booking form -> FormSubmit
  var form = document.querySelector("[data-form]");
  if (form) {
    var status = form.querySelector(".form-status");
    var submit = form.querySelector("[type=submit]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("input[required]").forEach(function (f) {
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
          name: form.name.value,
          phone: form.phone.value,
          when: form.when.value,
          message: form.message.value,
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
})();
