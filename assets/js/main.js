/* =================================================================
   AI Repairing Assistant — site interactions
   No third-party scripts, no trackers, no eval. CSP-friendly.
   ================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- sticky nav shadow ---- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 12);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- mobile menu ---- */
  var burger = document.getElementById("burger");
  var menu = document.getElementById("mobileMenu");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      menu.hidden = !open;
      burger.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        menu.classList.remove("open");
        menu.hidden = true;
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---- scroll reveal ---- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---- card spotlight (follows cursor) ---- */
  if (!reduce) {
    document.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      });
    });
  }

  /* ---- count-up stats ---- */
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target) || reduce) { return; }
    var start = performance.now(), dur = 1100;
    function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toString();
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && !reduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { countUp(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---- copy SHA-256 ---- */
  var copyBtn = document.getElementById("copyHash");
  var hashCode = document.getElementById("hashCode");
  if (copyBtn && hashCode) {
    copyBtn.addEventListener("click", function () {
      var text = hashCode.textContent.trim();
      var done = function () {
        copyBtn.textContent = "Copied ✓";
        copyBtn.classList.add("copied");
        setTimeout(function () { copyBtn.textContent = "Copy"; copyBtn.classList.remove("copied"); }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(fallback);
      } else { fallback(); }
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", "");
        ta.style.position = "absolute"; ta.style.left = "-9999px";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  }

  /* ---- one-click SHA-256 integrity verifier ---- */
  var verifyBtn = document.getElementById("verifyBtn");
  var verifyInput = document.getElementById("verifyInput");
  var verifyResult = document.getElementById("verifyResult");
  var hashEl = document.getElementById("hashCode");
  if (verifyBtn && verifyInput && verifyResult && hashEl) {
    var expected = (hashEl.textContent || "").replace(/[^0-9a-fA-F]/g, "").toLowerCase();
    var setRes = function (cls, msg) {
      verifyResult.classList.remove("ok", "bad", "hint");
      verifyResult.classList.add(cls);
      verifyResult.textContent = msg;
    };
    var runVerify = function () {
      var compact = (verifyInput.value || "").replace(/\s+/g, "");   // strip spaces/newlines (certutil)
      var m = compact.match(/[0-9a-fA-F]{64}/);                       // find a 64-hex run
      if (!m) {
        setRes("hint", "Paste the 64-character SHA-256 from PowerShell above, then click Check.");
        return;
      }
      if (m[0].toLowerCase() === expected) {
        setRes("ok", "✅ Verified — genuine, untampered file. Safe to install.");
      } else {
        setRes("bad", "⚠️ No match! This file may be corrupted or tampered with. Delete it and download again — do not install.");
      }
    };
    verifyBtn.addEventListener("click", runVerify);
    verifyInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); runVerify(); }
    });
  }

  /* ---- smooth-scroll the data-dl buttons to #download ---- */
  document.querySelectorAll('a[data-dl]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var href = a.getAttribute("href");
      if (href === "#download") {
        e.preventDefault();
        var dl = document.getElementById("download");
        if (dl) dl.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }
    });
  });

  /* ---- current year ---- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear().toString();
})();
