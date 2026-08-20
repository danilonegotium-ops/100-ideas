/*!
 * Tier 2 ("Expressive") vanilla-JS helpers — no dependencies, no build step.
 * Pairs with tier2.css. Safe to drop into any static idea folder as-is:
 *   <script src="tier2.js" defer></script>
 * Then either call the functions manually, or just add the data-* attributes
 * below and call Tier2.autoInit() once (it also runs itself on DOMContentLoaded).
 *
 * All effects respect prefers-reduced-motion and no-op cleanly if their
 * target elements aren't present, so this file is safe to include even in
 * an app that only uses a couple of the effects.
 */
(function (global) {
  "use strict";

  var reduceMotion =
    global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------------
   * initSpotlight(root)
   * For every element matching [data-spotlight] (or passed directly),
   * tracks the cursor and updates --x/--y so the .spotlight-card CSS
   * (tier2.css) can render a glow that follows the pointer.
   * ---------------------------------------------------------------- */
  function initSpotlight(root) {
    var els = collect(root, "[data-spotlight]");
    els.forEach(function (el) {
      el.classList.add("spotlight-card");
      if (reduceMotion) return; // static glow position is fine, skip tracking
      var ticking = false;
      var lastX = 0, lastY = 0;

      function apply() {
        el.style.setProperty("--x", lastX + "px");
        el.style.setProperty("--y", lastY + "px");
        ticking = false;
      }

      el.addEventListener("pointermove", function (e) {
        var rect = el.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(apply);
        }
      });
      el.addEventListener("pointerenter", function () { el.classList.add("is-active"); });
      el.addEventListener("pointerleave", function () { el.classList.remove("is-active"); });
    });
    return els;
  }

  /* ----------------------------------------------------------------
   * initTilt(root, options)
   * For every element matching [data-tilt], applies a subtle 3D rotation
   * following the cursor. options: { max: degrees (default 8), scale: 1.02 }
   * ---------------------------------------------------------------- */
  function initTilt(root, options) {
    if (reduceMotion) return [];
    var opts = options || {};
    var max = opts.max || 8;
    var scale = opts.scale || 1.02;
    var els = collect(root, "[data-tilt]");

    els.forEach(function (el) {
      el.classList.add("tilt-card");
      var ticking = false;
      var rectCache = null;

      function onMove(e) {
        if (!rectCache) rectCache = el.getBoundingClientRect();
        var px = (e.clientX - rectCache.left) / rectCache.width; // 0..1
        var py = (e.clientY - rectCache.top) / rectCache.height; // 0..1
        var rotX = (0.5 - py) * max;
        var rotY = (px - 0.5) * max;
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(function () {
            el.style.transform =
              "rotateX(" + rotX.toFixed(2) + "deg) rotateY(" + rotY.toFixed(2) + "deg) scale(" + scale + ")";
            ticking = false;
          });
        }
      }

      el.addEventListener("pointerenter", function () { rectCache = el.getBoundingClientRect(); });
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", function () {
        rectCache = null;
        el.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
      });
    });
    return els;
  }

  /* ----------------------------------------------------------------
   * initReveal(root, options)
   * IntersectionObserver-driven entrance animation. Add [data-reveal] to a
   * container (its direct children get a staggered delay) or to individual
   * elements. options: { stagger: ms (default 70), threshold: 0-1 }
   * ---------------------------------------------------------------- */
  function initReveal(root, options) {
    var opts = options || {};
    var stagger = opts.stagger != null ? opts.stagger : 70;
    var targets = collect(root, "[data-reveal]");
    if (!targets.length) return [];

    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return targets;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var group = el.hasAttribute("data-reveal-group")
            ? Array.prototype.slice.call(el.children)
            : [el];
          group.forEach(function (child, i) {
            setTimeout(function () { child.classList.add("is-visible"); }, i * stagger);
          });
          io.unobserve(el);
        });
      },
      { threshold: opts.threshold || 0.15 }
    );

    targets.forEach(function (el) {
      if (el.hasAttribute("data-reveal-group")) {
        Array.prototype.forEach.call(el.children, function (child) {
          child.classList.add("reveal");
        });
      }
      io.observe(el);
    });
    return targets;
  }

  /* ----------------------------------------------------------------
   * createMeshBackground(canvas, options)
   * Lightweight animated gradient-mesh background, canvas-based (no images,
   * no shader/WebGL dependency — plain 2D radial gradients drifting slowly).
   * options: { colors: ["#rrggbb", ...], blobCount, speed }
   * Returns { start, stop } — call stop() if the canvas is ever removed.
   * Honors prefers-reduced-motion by drawing one static frame only.
   * ---------------------------------------------------------------- */
  function createMeshBackground(canvas, options) {
    if (!canvas || !canvas.getContext) return { start: function () {}, stop: function () {} };
    var ctx = canvas.getContext("2d");
    var opts = options || {};
    var colors = opts.colors || [
      "rgba(52,211,153,0.55)",
      "rgba(96,165,250,0.45)",
      "rgba(167,139,250,0.45)",
    ];
    var speed = opts.speed || 0.0004;
    var blobCount = opts.blobCount || colors.length;
    var raf = null;
    var w = 0, h = 0, dpr = Math.min(global.devicePixelRatio || 1, 2);
    var blobs = [];

    function resize() {
      w = canvas.clientWidth || canvas.parentElement.clientWidth || global.innerWidth;
      h = canvas.clientHeight || canvas.parentElement.clientHeight || global.innerHeight;
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeBlobs() {
      blobs = [];
      for (var i = 0; i < blobCount; i++) {
        blobs.push({
          color: colors[i % colors.length],
          baseX: Math.random() * w,
          baseY: Math.random() * h,
          radius: (0.35 + Math.random() * 0.25) * Math.max(w, h),
          phase: Math.random() * Math.PI * 2,
          orbit: 0.15 * Math.min(w, h) * (0.5 + Math.random()),
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      blobs.forEach(function (b) {
        var angle = b.phase + t * speed;
        var x = b.baseX + Math.cos(angle) * b.orbit;
        var y = b.baseY + Math.sin(angle) * b.orbit;
        var grad = ctx.createRadialGradient(x, y, 0, x, y, b.radius);
        grad.addColorStop(0, b.color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      });
    }

    function loop(t) {
      draw(t);
      raf = requestAnimationFrame(loop);
    }

    function start() {
      resize();
      makeBlobs();
      if (reduceMotion) {
        draw(0); // single static frame, no animation loop
        return;
      }
      global.addEventListener("resize", handleResize);
      raf = requestAnimationFrame(loop);
    }

    function handleResize() {
      resize();
      makeBlobs();
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      global.removeEventListener("resize", handleResize);
    }

    return { start: start, stop: stop };
  }

  /* ----------------------------------------------------------------
   * autoInit()
   * Scans the document for data-attributes and wires everything up with
   * zero manual JS required by the idea's own app.js. Also auto-creates a
   * mesh background for any <canvas data-mesh-bg> found.
   * ---------------------------------------------------------------- */
  function autoInit() {
    initSpotlight(document);
    initTilt(document);
    initReveal(document);

    var canvases = collect(document, "canvas[data-mesh-bg]");
    canvases.forEach(function (canvas) {
      var attr = canvas.getAttribute("data-mesh-bg");
      var colors = attr && attr !== "true" ? splitTopLevelColors(attr) : undefined;
      var mesh = createMeshBackground(canvas, { colors: colors });
      mesh.start();
    });
  }

  /**
   * Splits a comma-separated color list on top-level commas only, so
   * rgba(r,g,b,a)/hsl(h,s%,l%) values with internal commas survive intact.
   * e.g. "rgba(167,139,250,0.5),#60a5fa" -> ["rgba(167,139,250,0.5)", "#60a5fa"]
   */
  function splitTopLevelColors(str) {
    var parts = [];
    var depth = 0;
    var current = "";
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "," && depth === 0) {
        if (current.trim()) parts.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  }

  function collect(root, selector) {
    var scope = root && root.querySelectorAll ? root : document;
    return Array.prototype.slice.call(scope.querySelectorAll(selector));
  }

  var Tier2 = {
    initSpotlight: initSpotlight,
    initTilt: initTilt,
    initReveal: initReveal,
    createMeshBackground: createMeshBackground,
    autoInit: autoInit,
  };

  global.Tier2 = Tier2;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }
})(window);
