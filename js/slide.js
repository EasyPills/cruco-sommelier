/* =========================================================================
   slide.js — Storyline-style stage
   -------------------------------------------------------------------------
   Renders each screen inside a fixed 1280x720 "slide" that is scaled to the
   window, the way Storyline scales its stage: nothing reflows, everything
   (text included) grows and shrinks together, and the page never scrolls.

   Where it does NOT apply — the layout falls back to the responsive one:
     · window narrower than SLIDE.MIN_VIEWPORT_W (phones, split screens)
     · window shorter than SLIDE.MIN_VIEWPORT_H (landscape phones)
     · when the scale needed would drop below SLIDE.MIN_SCALE, i.e. text would
       get too small — this also keeps browser zoom useful (WCAG 1.4.4):
       zooming in shrinks the available slide, and past ~130% the course
       switches to the readable, scrollable layout.
   Content taller than the slide scrolls inside it (Storyline does the same
   with scrolling panels).
   ========================================================================= */
(function (CruCo) {
  "use strict";

  var slide = {
    on: false,
    app: null,
    stage: null,

    cfg: function () {
      var c = (CruCo.config && CruCo.config.SLIDE) || {};
      return {
        enabled: c.ENABLED !== false,
        w: c.WIDTH || 1280,
        h: c.HEIGHT || 720,
        minW: c.MIN_VIEWPORT_W || 900,
        minH: c.MIN_VIEWPORT_H || 520,
        minScale: typeof c.MIN_SCALE === "number" ? c.MIN_SCALE : 0.78,
        maxScale: typeof c.MAX_SCALE === "number" ? c.MAX_SCALE : 1.5
      };
    },

    init: function () {
      var self = this;
      this.app = document.querySelector(".app");
      this.stage = document.getElementById("stage");
      if (!this.app || !this.stage) return;

      var cfg = this.cfg();
      this.app.style.setProperty("--slide-w", cfg.w + "px");
      this.app.style.setProperty("--slide-h", cfg.h + "px");

      var apply = function () { self.apply(); };
      window.addEventListener("resize", apply);
      window.addEventListener("orientationchange", apply);
      // The sidebar opening/closing changes the space left for the slide.
      if (window.ResizeObserver) {
        new window.ResizeObserver(apply).observe(this.stage);
      }
      this.apply();
    },

    /** Measures the stage and either scales the slide or steps aside. */
    apply: function () {
      var cfg = this.cfg();
      if (!cfg.enabled) { this.setMode(false, 1); return; }

      var vw = window.innerWidth;
      var vh = window.innerHeight;
      if (vw < cfg.minW || vh < cfg.minH) { this.setMode(false, 1); return; }

      // Space the stage can give the slide (its padding stays outside).
      var box = this.stage.getBoundingClientRect();
      var available = { w: box.width - 32, h: box.height - 32 };
      if (available.w <= 0 || available.h <= 0) return;

      var scale = Math.min(available.w / cfg.w, available.h / cfg.h);
      if (scale < cfg.minScale) { this.setMode(false, 1); return; }
      this.setMode(true, Math.min(scale, cfg.maxScale));
    },

    setMode: function (on, scale) {
      if (this.on === on && this.scale === scale) return;
      this.on = on;
      this.scale = scale;
      this.app.dataset.slide = on ? "on" : "off";
      this.app.style.setProperty("--slide-scale", String(scale));
    }
  };

  CruCo.slide = slide;
})(window.CruCo = window.CruCo || {});
