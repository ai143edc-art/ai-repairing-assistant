/* =================================================================
   Arc-reactor HUD — HTML5 Canvas port of the app's SkiaSharp JarvisHud.
   Layered additive glow, rotating radar sweep, counter-rotating arc
   segments, orbiting data nodes, reactor coils, pulsing bars + hot core.
   ================================================================= */
(function () {
  "use strict";

  var ACCENT = { r: 0x22, g: 0xD3, b: 0xEE };   // app AccentBrush #22D3EE
  var WHITE  = { r: 0xEA, g: 0xFB, b: 0xFF };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function rgba(c, a) { return "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")"; }

  function initReactor(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cssW, cssH;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      cssW = rect.width || canvas.width;
      cssH = rect.height || canvas.height;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    var phase = 0, spin = 0, level = 0, lvlTarget = 0.12;

    // ---- helpers (mirrors the SkiaSharp helpers) ----
    function glow(cx, cy, r, color, a) {
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, rgba(color, a));
      g.addColorStop(1, rgba(color, 0));
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }
    function ring(cx, cy, r, color, a, w) {
      ctx.strokeStyle = rgba(color, a); ctx.lineWidth = w;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    }
    function dashRing(cx, cy, r, color, a, w, dashPhase) {
      ctx.save();
      ctx.setLineDash([r * 0.05, r * 0.09]);
      ctx.lineDashOffset = dashPhase;
      ctx.strokeStyle = rgba(color, a); ctx.lineWidth = w;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    function arc(cx, cy, r, startDeg, sweepDeg, color, a, w, additive) {
      ctx.save();
      if (additive) ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = rgba(color, a); ctx.lineWidth = w; ctx.lineCap = "round";
      var s = startDeg * Math.PI / 180, e = (startDeg + sweepDeg) * Math.PI / 180;
      ctx.beginPath(); ctx.arc(cx, cy, r, s, e); ctx.stroke();
      ctx.restore();
    }
    function dot(cx, cy, r, color, a) {
      ctx.fillStyle = rgba(color, a);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }

    function frame() {
      var w = canvas.width, h = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);

      var cx = w / 2, cy = h / 2;
      var R = Math.min(w, h) * 0.5;
      if (R <= 2) { schedule(); return; }

      // gentle synthetic "audio" level so the bars breathe (no mic needed)
      lvlTarget = 0.10 + 0.06 * (0.5 + 0.5 * Math.sin(phase * 0.9));
      level += (lvlTarget - level) * 0.08;
      var lvl = level;
      var pulse = 0.5 + 0.5 * Math.sin(phase * 4.0);
      var breathe = 0.5 + 0.5 * Math.sin(phase * 1.3);

      // 0. ambient halo
      glow(cx, cy, R * (0.62 + lvl * 0.18), ACCENT, 0.24);

      // 1. rotating radar sweep (conic gradient)
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(phase * 46 * Math.PI / 180); ctx.translate(-cx, -cy);
      ctx.globalCompositeOperation = "lighter";
      if (typeof ctx.createConicGradient === "function") {
        var sweep = ctx.createConicGradient(0, cx, cy);
        sweep.addColorStop(0.00, rgba(ACCENT, 0));
        sweep.addColorStop(0.55, rgba(ACCENT, 0));
        sweep.addColorStop(0.74, rgba(ACCENT, 0.28));
        sweep.addColorStop(0.79, rgba(ACCENT, 0));
        sweep.addColorStop(1.00, rgba(ACCENT, 0));
        ctx.strokeStyle = sweep; ctx.lineWidth = R * 0.30;
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.66, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();

      // 2. outer ring + dashed rings
      ring(cx, cy, R * 0.95, ACCENT, 0.28, Math.max(1, R * 0.006));
      dashRing(cx, cy, R * 0.90, ACCENT, 0.60, Math.max(1.2, R * 0.012), phase * 26);
      dashRing(cx, cy, R * 0.83, ACCENT, 0.24, Math.max(1, R * 0.008), -phase * 16);

      // 3. counter-rotating arc segments (the signature)
      var k, rot1 = phase * 42;
      for (k = 0; k < 3; k++) arc(cx, cy, R * 0.88, rot1 + k * 120, 54, ACCENT, 0.86, R * 0.020, true);
      var rot2 = -phase * 30;
      for (k = 0; k < 4; k++) arc(cx, cy, R * 0.78, rot2 + k * 90, 30, ACCENT, 0.51, R * 0.013, false);
      var rot3 = phase * 20;
      for (k = 0; k < 2; k++) arc(cx, cy, R * 0.70, rot3 + k * 180, 76, ACCENT, 0.35, R * 0.010, false);

      // 4. fine tick reticle
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(phase * 8 * Math.PI / 180); ctx.translate(-cx, -cy);
      ctx.lineWidth = Math.max(1, R * 0.008);
      var ticks = 60;
      for (var i = 0; i < ticks; i++) {
        var a = Math.PI * 2 * i / ticks, major = i % 5 === 0;
        var r0 = R * 0.62, r1 = major ? R * 0.52 : R * 0.58;
        ctx.strokeStyle = rgba(ACCENT, major ? 0.70 : 0.31);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.stroke();
      }
      ctx.restore();

      // 5. orbiting data nodes
      for (k = 0; k < 6; k++) {
        var ang = phase * 0.9 + k * Math.PI / 3.0;
        var nx = cx + Math.cos(ang) * R * 0.90, ny = cy + Math.sin(ang) * R * 0.90;
        var nr = R * (0.015 + (k % 2 === 0 ? 0.010 : 0));
        glow(nx, ny, nr * 3.2, ACCENT, 0.58);
        dot(nx, ny, nr, WHITE, 0.92);
      }

      // 6. reactor coils
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(-phase * 14 * Math.PI / 180); ctx.translate(-cx, -cy);
      for (k = 0; k < 8; k++) arc(cx, cy, R * 0.46, k * 45 + 7, 31, ACCENT, (150 + pulse * 70) / 255, R * 0.030, true);
      ctx.restore();

      // 7. audio-reactive bars
      var bars = 72, baseR = R * 0.36;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round"; ctx.lineWidth = Math.max(1.4, R * 0.011);
      for (i = 0; i < bars; i++) {
        var ba = Math.PI * 2 * i / bars;
        var amp = (0.5 + 0.5 * Math.sin(spin * 0.05 + i * 0.5)) * (0.10 + lvl * 1.0);
        var len = baseR * (0.10 + amp * 0.60);
        ctx.strokeStyle = rgba(ACCENT, Math.min(1, 0.35 + amp * 0.6));
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ba) * baseR, cy + Math.sin(ba) * baseR);
        ctx.lineTo(cx + Math.cos(ba) * (baseR + len), cy + Math.sin(ba) * (baseR + len));
        ctx.stroke();
      }
      ctx.restore();

      // 8. containment ring
      var coreR = R * 0.27 * (1 + lvl * 0.30 + pulse * 0.04);
      ring(cx, cy, coreR * 1.30, ACCENT, 0.78, Math.max(1.2, R * 0.012));
      ring(cx, cy, coreR * 1.30, WHITE, (40 + breathe * 60) / 255, Math.max(1, R * 0.006));

      // 9. core
      glow(cx, cy, coreR * 1.5, ACCENT, 0.58);
      var cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      cg.addColorStop(0, rgba(WHITE, 1));
      cg.addColorStop(0.5, rgba(ACCENT, 1));
      cg.addColorStop(1, rgba(ACCENT, 0));
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2); ctx.fill();
      // hot white centre
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      var hotR = coreR * (0.42 + pulse * 0.06);
      var hg = ctx.createRadialGradient(cx, cy, 0, cx, cy, hotR);
      hg.addColorStop(0, rgba(WHITE, (210 + breathe * 45) / 255));
      hg.addColorStop(1, rgba(WHITE, 0));
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(cx, cy, hotR, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      phase += 0.02;
      spin += 0.6 + lvl * 1.2;
      schedule();
    }

    var raf = 0;
    function schedule() {
      if (reduce) return;            // static single frame for reduced-motion
      raf = requestAnimationFrame(frame);
    }

    // pause when offscreen / tab hidden (perf + battery)
    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !reduce && !raf) schedule();
        else if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
      }, { threshold: 0.05 }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
      else if (!document.hidden && visible && !reduce && !raf) schedule();
    });

    frame(); // draw at least one frame immediately
  }

  function boot() {
    var main = document.getElementById("reactor");
    if (main) initReactor(main);
    var small = document.getElementById("reactorSmall");
    if (small) initReactor(small);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
