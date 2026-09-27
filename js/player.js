/* =========================================================================
   player.js — boot sequence and screen navigation
   -------------------------------------------------------------------------
   boot  : loads the storyboard data files listed in courseConfig.js (in
           order), builds the course model, starts the LMS session and
           restores progress (with a resume prompt, Storyline-style).
   goTo  : renders a screen, marks it visited, updates menu/progress,
           moves focus to the screen title and syncs with the LMS.
   exit  : on page hide/unload, saves and closes the LMS session once.
   ========================================================================= */
(function (CruCo) {
  "use strict";

  var U = CruCo.utils;
  var t = U.t;
  var cfgEditor = function () { return !!(CruCo.config && CruCo.config.EDITOR); };

  /** Loads content files in order. `optional` entries may be absent. */
  function loadScripts(list, done) {
    var i = 0;
    (function next() {
      if (i >= list.length) { done(); return; }
      var entry = list[i++];
      var src = typeof entry === "string" ? entry : entry.src;
      var s = document.createElement("script");
      // While reviewing (URL flags allowed, i.e. never in the LMS package) the
      // content files are always fetched fresh, so an updated lesson shows at
      // once instead of a copy the browser kept (client report 2026-09-17).
      s.src = CruCo.config && CruCo.config.ALLOW_URL_FLAGS
        ? src + (src.indexOf("?") === -1 ? "?" : "&") + "t=" + Date.now()
        : src;
      s.onload = next;
      s.onerror = function () {
        if (entry.optional) console.info("[CruCo] Optional file not present: " + src);
        else console.error("[CruCo] Could not load content file: " + src);
        next();
      };
      document.body.appendChild(s);
    })();
  }

  var player = {
    debug: false,
    els: {},
    exited: false,
    launch: null,

    boot: function () {
      var self = this;
      var cfg = CruCo.config || {};
      this.debug = cfg.DEBUG === true || U.getUrlFlag("debug") === "1";
      if (U.getUrlFlag("reset") === "1") {
        try { window.localStorage.removeItem("cruco-scorm-mock:" + cfg.COURSE_ID); } catch (e) { /* ignore */ }
      }
      // The approved table of contents (the whole course, produced or not):
      // the menu is built from it, so a lesson is always seen in its place.
      var files = ["content/" + (cfg.COURSE_MAP || "mapa-del-curso.js")]
        .concat((cfg.STORYBOARDS || []).map(function (f) { return "content/" + f; }));

      // Review one lesson: ?leccion=ml03 opens the course straight at that
      // lesson. Client 2026-09-21: the whole course is loaded, because the menu
      // has to keep showing the lesson in its place — lesson 3 under lesson 2,
      // not alone as if it were a module of its own. `start()` jumps to it and
      // opens navigation, so nothing before it has to be walked through.

      if (U.getUrlFlag("demo") === "1") files.push("content/_dev/demo-engine.js");
      // Media replacements made in the editor. Empty by default; the build
      // sets it automatically when content/overrides.js exists.
      if (cfg.OVERRIDES) files.push({ src: "content/" + cfg.OVERRIDES, optional: true });
      loadScripts(files, function () { self.start(); });
    },

    start: function () {
      var self = this;
      var C = CruCo.course;
      var S = CruCo.state;
      var L = CruCo.lms;

      // Author mode loads first: pieces deleted in the editor must be out of
      // the model before it is built (a deleted check must not block completion).
      var authoring = (cfgEditor() || U.getUrlFlag("edit") === "1") && CruCo.editor;
      if (authoring) CruCo.editor.load();

      C.build();
      this.cacheEls();
      this.applyStrings();

      this.launch = L.init();
      if (this.launch.status === "completed" || this.launch.status === "passed") S.completedReported = true;
      S.restore(this.launch.suspendData);

      if (authoring) CruCo.editor.mount();

      // Each piece that appears may unlock Next.
      CruCo.renderer.onRevealed = function () { self.updateNav(); self.scrollCue(); };

      CruCo.sidebar.init();
      if (CruCo.slide) CruCo.slide.init();
      this.wire();
      S.onChange(function (type) {
        if (type === "progress") self.onProgress();
        else if (type === "completed") self.onCompleted();
      });
      if (this.debug && CruCo.debug) CruCo.debug.init();

      this.finishBoot();

      if (!C.totalScreens) {
        CruCo.renderer.renderEmpty(this.els.stageInner);
        this.updateNav();
        this.updateProgress();
        return;
      }

      var first = C.first().id;
      var flagScreen = U.getUrlFlag("screen");
      if (flagScreen && C.screenById[flagScreen]) { this.goTo(flagScreen, { initial: true }); return; }

      // ?leccion=ml03 — open at that lesson, with the rest of the course in the
      // menu around it and navigation free, so it can be reviewed on its own.
      var only = U.getUrlFlag("leccion") || U.getUrlFlag("lesson");
      if (only) {
        var wanted = only.split(",").map(function (x) { return x.trim().toLowerCase(); })[0];
        var mod = C.modules.filter(function (m) {
          return String(m.id).toLowerCase().indexOf(wanted) !== -1;
        })[0];
        if (mod && mod.screens.length) {
          CruCo.config.NAVIGATION_MODE = "free";
          this.goTo(mod.screens[0].id, { initial: true });
          return;
        }
        U.warn("No lesson matches ?leccion=" + only + "; opening the course from the start.");
      }

      var bookmark = this.launch.location && C.screenById[this.launch.location] ? this.launch.location : null;
      var mode = CruCo.config.RESUME || "prompt";
      if (!bookmark || bookmark === first || mode === "never") { this.goTo(first, { initial: true }); return; }
      if (mode === "auto") { this.goTo(bookmark, { initial: true }); return; }

      CruCo.layers.open({
        title: t("resumeTitle"),
        body: t("resumeBody"),
        dismissible: false,
        initialFocus: "action",
        actions: [
          { label: t("resumeYes"), primary: true, onClick: function () { self.goTo(bookmark); } },
          { label: t("resumeNo"), onClick: function () { self.goTo(first); } }
        ]
      });
    },

    cacheEls: function () {
      var $ = function (id) { return document.getElementById(id); };
      this.els = {
        app: document.querySelector(".app"),
        stage: $("stage"),
        stageInner: $("stage-inner"),
        prev: $("nav-prev"),
        next: $("nav-next"),
        counter: $("nav-counter"),
        hint: $("nav-hint"),
        courseTitle: $("course-title"),
        moduleTitle: $("module-title"),
        progress: $("progress"),
        progressFill: $("progress-fill"),
        progressLabel: $("progress-label"),
        badge: $("badge-complete"),
        toastRoot: $("toast-root")
      };
    },

    /** Fills static shell labels from uiStrings.js (data-i18n / data-i18n-aria). */
    applyStrings: function () {
      Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (el) {
        el.textContent = t(el.getAttribute("data-i18n"));
      });
      Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-aria]"), function (el) {
        el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
      });
      var title = CruCo.config.COURSE_TITLE || "";
      document.title = title;
      this.els.courseTitle.textContent = title;
    },

    finishBoot: function () {
      var app = this.els.app;
      requestAnimationFrame(function () { requestAnimationFrame(function () { app.classList.remove("is-booting"); }); });
    },

    wire: function () {
      var self = this;
      var S = CruCo.state;
      this.els.prev.addEventListener("click", function () { self.prev(); });
      this.els.next.addEventListener("click", function () { self.next(); });

      document.addEventListener("click", function (e) {
        var term = e.target && e.target.closest ? e.target.closest(".term") : null;
        if (term) self.showTerm(term.getAttribute("data-term"));
      });

      // The slide itself scrolls, and answering a check makes it grow.
      this.els.stageInner.addEventListener("scroll", function () { self.scrollCue(); });
      this.els.stageInner.addEventListener("click", function () {
        setTimeout(function () { self.scrollCue(); }, 60);
      });
      window.addEventListener("resize", function () { self.scrollCue(); });

      window.addEventListener("pagehide", function () { self.exit(); });
      window.addEventListener("beforeunload", function () { self.exit(); });
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden" && !self.exited) S.sync({ immediate: true });
      });
    },

    // ---- Navigation ---------------------------------------------------------------
    /** Slide change animations, unless the learner asked for reduced motion. */
    transitions: function () {
      if (CruCo.config && CruCo.config.TRANSITIONS === false) return false;
      try { return !window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return true; }
    },

    goTo: function (id, opts) {
      opts = opts || {};
      var self = this;
      var C = CruCo.course;
      var S = CruCo.state;
      var screen = C.screenById[id];
      if (!screen) { U.warn("Unknown screen:", id); return; }
      if (!opts.initial && !S.isReachable(screen)) return;

      // Client 2026-09-15: leaving a screen cuts the narration (or video)
      // straight away, not when the next screen finishes painting.
      CruCo.media.stopAll(this.els.stageInner);

      var from = C.screenById[S.current];
      var direction = from
        ? (screen.globalIndex > from.globalIndex ? "next" : screen.globalIndex < from.globalIndex ? "prev" : "jump")
        : "jump";

      S.current = screen.id;
      S.visited[screen.id] = true;

      var paint = function () {
        self._pending = null;
        var rendered = CruCo.renderer.render(screen, self.els.stageInner, { direction: direction });
        delete self.els.stageInner.dataset.leaving;
        self.els.stage.scrollTop = 0;
        self.els.stageInner.scrollTop = 0;     // the slide is what scrolls in slide mode
        self.scrollCue();
        self.holdNav();

        self.updateNav();
        self.updateHeader(screen);
        self.onProgress();
        CruCo.sidebar.revealCurrent();

        if (!opts.initial) rendered.title.focus({ preventScroll: true });
        U.announce(t("screenAnnounce", {
          n: screen.indexInModule + 1,
          total: screen.module.screens.length,
          title: U.plain(screen.title) || ""
        }));
      };

      clearTimeout(this._pending);
      if (!opts.initial && from && this.transitions()) {
        this.els.stageInner.dataset.leaving = direction;   // current slide steps out
        this._pending = setTimeout(paint, 130);
      } else {
        paint();
      }
    },

    next: function () {
      var n = CruCo.course.next(CruCo.course.screenById[CruCo.state.current]);
      if (n) this.goTo(n.id);
    },

    prev: function () {
      var p = CruCo.course.prev(CruCo.course.screenById[CruCo.state.current]);
      if (p) this.goTo(p.id);
    },

    // ---- UI updates ------------------------------------------------------------------
    onProgress: function () {
      this.updateProgress();
      this.updateNav();
      CruCo.sidebar.refresh();
      CruCo.state.sync();
      if (this.debug && CruCo.debug) CruCo.debug.update();
    },

    updateNav: function () {
      var C = CruCo.course;
      var S = CruCo.state;
      var screen = C.screenById[S.current];
      var next = screen ? C.next(screen) : null;
      // Blocked either because the next screen is not open yet (a pending
      // activity) or because this one has not finished revealing its content.
      var blocked = !!next && !S.isReachable(next);
      var revealing = !!next && CruCo.renderer.hasHiddenContent();
      // …and, on every screen alike, never the instant it opens (NAV_MIN_MS).
      var tooSoon = !!next && !this._navOpen;
      this.els.prev.disabled = !screen || !C.prev(screen);
      this.els.next.disabled = !next || blocked || revealing || tooSoon;
      this.els.counter.innerHTML = screen
        ? t("screenCounter", { n: "<strong>" + (screen.indexInModule + 1) + "</strong>", total: screen.module.screens.length })
        : "";
      // Say why Next is off instead of leaving a dead button.
      var pending = blocked && S.hasPendingChecks(screen);
      var why = pending ? "navLockedHint" : (revealing ? "navRevealingHint" : "");
      this.els.hint.textContent = why ? t(why) : "";
      this.els.hint.hidden = !why;
    },

    /**
     * Client 2026-09-21: every screen behaves the same way — "Siguiente" is
     * never live the instant a screen opens. It waits NAV_MIN_MS; a screen with
     * a check waits for the answer, and one still showing its content waits for
     * the content. Screens with nothing to wait for get just the three seconds.
     */
    holdNav: function () {
      var self = this;
      var wait = (CruCo.config && CruCo.config.NAV_MIN_MS) || 0;
      clearTimeout(this._navTimer);
      this._navOpen = !wait;
      if (!wait) return;
      this._navTimer = setTimeout(function () {
        self._navOpen = true;
        self.updateNav();
      }, wait);
    },

    /**
     * A slide has a fixed height and some screens hold more than fits (a check
     * with two questions). Since 2026-09-21 the learner cannot advance until
     * the check is answered, so anything out of sight would leave them stuck:
     * this marks the slide when there is more below, and the button scrolls.
     */
    scrollCue: function () {
      var el = this.els.stageInner;
      if (!el) return;
      var more = el.scrollHeight - el.scrollTop - el.clientHeight > 8;
      el.dataset.scroll = more ? "more" : "end";
      if (more && !el.querySelector(".slide-more")) {
        var btn = U.h("button", {
          class: "slide-more",
          attrs: { type: "button", "aria-label": t("scrollMore") },
          title: t("scrollMore")
        }, U.iconEl("chevronDown"));
        btn.addEventListener("click", function () {
          el.scrollBy({ top: Math.round(el.clientHeight * 0.7), behavior: "smooth" });
        });
        el.appendChild(btn);
      }
    },

    /** Re-renders the current screen (used by the editor after a change). */
    rerender: function () {
      var screen = CruCo.course.screenById[CruCo.state.current];
      if (!screen) return;
      var scroll = this.els.stage.scrollTop;
      CruCo.renderer.render(screen, this.els.stageInner, { direction: "jump" });
      this.els.stage.scrollTop = scroll;
    },

    /**
     * Editor deleted or restored a piece: the course model itself changed
     * (screens keep their ids, but a deleted knowledge check must disappear
     * from progress), so rebuild model + menu and repaint.
     */
    refreshModel: function () {
      CruCo.course.build();
      CruCo.sidebar.rebuild();
      this.rerender();
      this.onProgress();
    },

    updateHeader: function (screen) {
      var mod = screen.module;
      var title = U.plain(mod.title);
      if (mod.intro) {                       // introductory section: no number
        this.els.moduleTitle.textContent = title;
        return;
      }
      var label = t("moduleLabel", { n: mod.lesson || mod.index });
      this.els.moduleTitle.textContent = title ? label + " · " + title : label;
    },

    updateProgress: function () {
      var p = CruCo.state.progress();
      this.els.progressFill.style.width = p.percent + "%";
      this.els.progressLabel.textContent = t("progressValue", { pct: p.percent });
      this.els.progress.setAttribute("aria-valuenow", String(p.percent));
      this.els.progress.setAttribute("aria-valuetext", t("progressValue", { pct: p.percent }));
      this.els.badge.hidden = !(p.complete || CruCo.state.completedReported);
    },

    onCompleted: function () {
      var root = this.els.toastRoot;
      root.innerHTML = "";
      var toast = U.h("div", { class: "toast", attrs: { role: "status" } },
        // Reviewing a single lesson (?leccion=…): finishing it is not finishing
        // the course, so the message says so. (URL flags are off in the LMS.)
        U.iconEl("award"), U.h("span", {
          text: t(U.getUrlFlag("leccion") || U.getUrlFlag("lesson") ? "lessonCompletedToast" : "courseCompletedToast")
        }));
      root.appendChild(toast);
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 7000);
      this.updateProgress();
    },

    showTerm: function (term) {
      var g = CruCo.course.findTerm(term);
      if (!g) { U.warn("Glossary term not found:", term); return; }
      CruCo.layers.open({ title: g.term, body: g.definition });
    },

    /** Saves and closes the LMS session exactly once. */
    exit: function () {
      if (this.exited || !CruCo.lms.api || CruCo.lms.finished) return;
      this.exited = true;
      if (CruCo.course.totalScreens) CruCo.state.sync({ immediate: true });
      CruCo.lms.finish();
    }
  };

  CruCo.player = player;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { player.boot(); });
  } else {
    player.boot();
  }
})(window.CruCo = window.CruCo || {});
