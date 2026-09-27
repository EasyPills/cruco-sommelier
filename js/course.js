/* =========================================================================
   course.js — content registry and course model
   -------------------------------------------------------------------------
   Each storyboard data file (content/*.js) calls CruCo.registerStoryboard().
   build() concatenates them in STORYBOARDS order, so screens of storyboard
   N+1 follow the last screen of storyboard N. Totals (menu, progress,
   bookmark) are always derived from the model: nothing is hard-coded.
   ========================================================================= */
(function (CruCo) {
  "use strict";

  var U = CruCo.utils;
  var pending = [];

  CruCo.registerStoryboard = function (data) {
    if (!data || typeof data !== "object") { U.warn("registerStoryboard() called without data"); return; }
    pending.push(data);
  };

  /* ---- Media overrides ---------------------------------------------------
     Media replacements made in the editor (js/editor.js), keyed by media
     path ("2.3#1", "2.3#4/cards/2/image", "2.1#bg", "2.1#audio").
     content/overrides.js calls applyOverrides(); the editor adds its own on
     top. Media components call resolveMedia() before rendering.          */
  CruCo.overrides = {};

  CruCo.applyOverride = function (path, patch) {
    if (!path || !patch) return;
    CruCo.overrides[path] = Object.assign({}, CruCo.overrides[path], patch);
  };

  CruCo.applyOverrides = function (map) {
    Object.keys(map || {}).forEach(function (path) { CruCo.applyOverride(path, map[path]); });
  };

  /** Editor use: replaces (patch) or clears (null) one override. */
  CruCo.setOverride = function (path, patch) {
    if (patch) CruCo.overrides[path] = Object.assign({}, patch);
    else delete CruCo.overrides[path];
  };

  /**
   * True when the author deleted this piece in the editor. Deleted blocks
   * are skipped everywhere: not rendered, and their knowledge checks are not
   * counted for completion (the editor can always restore them).
   */
  CruCo.isDeleted = function (path) {
    var patch = path && CruCo.overrides[path];
    return !!(patch && patch._deleted);
  };

  /** Storyboard data + override for this path (+ live editor preview). */
  CruCo.resolveMedia = function (path, data) {
    var patch = path && CruCo.overrides[path];
    if (!patch) return data || {};
    var merged = Object.assign({}, data, patch);
    var preview = CruCo.editor && CruCo.editor.active && CruCo.editor.previews[path];
    if (preview) merged = Object.assign({}, merged, preview);
    return merged;
  };

  var course = {
    modules: [],
    screens: [],
    screenById: {},
    tests: [],
    testById: {},
    glossary: [],
    downloads: [],

    build: function () {
      var self = this;
      var seenScreens = {};
      var seenTests = {};

      this.modules = []; this.screens = []; this.screenById = {};
      this.tests = []; this.testById = {}; this.glossary = []; this.downloads = [];

      // Client 2026-09-15: a storyboard marked `"kind": "intro"` is the
      // introductory section — it is not numbered and does not consume a
      // lesson number, so the first real lesson is "Lección 1".
      var lessonNo = 0;

      pending.forEach(function (sb, mIdx) {
        var intro = sb.kind === "intro";
        if (!intro) lessonNo += 1;
        var mod = {
          id: sb.id || "m" + (mIdx + 1),
          index: mIdx + 1,          // position: screen ids and ordering
          // Learner-facing lesson number. A storyboard may declare it ("lesson": 2)
          // so it stays right when only some lessons are loaded (?leccion=ml02);
          // otherwise it is counted from the loaded lessons.
          lesson: intro ? 0 : (Number(sb.lesson) || lessonNo),
          intro: intro,
          title: sb.title || "",
          source: sb.source || "",
          // Client 2026-09-18: estimated time, shown under the title on the
          // lesson's opening screen ("~ 3 min").
          duration: sb.duration ? U.plain(sb.duration) : "",
          // Client 2026-09-16: the 19 lessons are grouped into the modules of
          // the approved table of contents (Introductorio, Enología y
          // Viticultura, Servicio en Sala, Venta Sugestiva, Gestión de Cava).
          group: sb.module && sb.module.id ? String(sb.module.id) : null,
          groupTitle: sb.module ? U.plain(sb.module.title || "") : "",
          // Client 2026-09-22: the module is numbered in the menu too.
          groupNumber: sb.module && sb.module.number ? String(sb.module.number) : "",
          // Point of the approved table of contents this lesson belongs to.
          // Several lessons may share one point (client 2026-09-18).
          point: sb.point && sb.point.title ? U.plain(sb.point.title) : "",
          pointNumber: sb.point && sb.point.number ? String(sb.point.number) : "",
          screens: []
        };

        (sb.screens || []).forEach(function (raw, sIdx) {
          var id = String(raw.id || (mod.index + "." + (sIdx + 1)));
          if (seenScreens[id]) {
            U.warn("Duplicate screen id '" + id + "' in " + mod.id + "; renamed to '" + id + "~" + mod.index + "'.");
            id = id + "~" + mod.index;
          }
          seenScreens[id] = true;

          var screen = Object.assign({}, raw, {
            id: id,
            module: mod,
            // Menu number: "lesson.screen" (Lección 2 → 2.1, 2.2…); the
            // introductory section has no lesson, so just its screen order.
            number: raw.number || (intro ? String(sIdx + 1) : mod.lesson + "." + (sIdx + 1)),
            globalIndex: self.screens.length,
            // Client 2026-09-16: the learner counts screens within the lesson,
            // not across the whole course (200+ screens would discourage anyone).
            indexInModule: sIdx,
            tests: []
          });

          (screen.blocks || []).forEach(function (block, bIdx) {
            if (!block || block.type !== "quiz") return;
            if (CruCo.isDeleted(id + "#" + bIdx)) return;   // deleted in the editor
            var testId = String(block.id || (id + "/q" + (bIdx + 1)));
            if (seenTests[testId]) { testId = testId + "~" + bIdx; }
            seenTests[testId] = true;
            block._testId = testId;
            var test = {
              id: testId,
              screenId: id,
              questionKeys: (block.questions || []).map(function (q, qIdx) {
                q._key = testId + "/" + (q.id || "p" + (qIdx + 1));
                return q._key;
              }),
              questions: block.questions || []
            };
            self.tests.push(test);
            self.testById[testId] = test;
            screen.tests.push(testId);
          });

          mod.screens.push(screen);
          self.screens.push(screen);
          self.screenById[id] = screen;
        });

        (sb.glossary || []).forEach(function (g) {
          if (!g || !g.term) return;
          self.glossary.push({ term: g.term, definition: g.definition || "", screen: g.screen || null, moduleId: mod.id });
        });

        (sb.downloads || []).forEach(function (d) { if (d && d.file) self.downloads.push(Object.assign({ moduleId: mod.id }, d)); });

        self.modules.push(mod);
      });

      ((CruCo.config && CruCo.config.DOWNLOADS) || []).forEach(function (d) {
        if (d && d.file) self.downloads.unshift(d);
      });

      this.glossary.sort(function (a, b) { return a.term.localeCompare(b.term, "es", { sensitivity: "base" }); });
      return this;
    },

    get totalScreens() { return this.screens.length; },

    first: function () { return this.screens[0] || null; },
    next: function (screen) { return screen ? this.screens[screen.globalIndex + 1] || null : null; },
    prev: function (screen) { return screen ? this.screens[screen.globalIndex - 1] || null : null; },

    /**
     * Menu label for a screen. Many storyboard screens carry no title, so
     * the first piece of their own on-screen text is used (question prompt,
     * key message, heading…) instead of a bare "Pantalla 5 de 11".
     */
    labelOf: function (screen) {
      if (!screen) return "";
      var label = U.plain(screen.title || "");
      if (!label) {
        (screen.blocks || []).some(function (b) {
          if (!b) return false;
          if (b.type === "quiz") {
            var q = (b.questions || [])[0];
            label = q ? U.plain(q.prompt) : "";
          } else if (b.type === "heading" || b.type === "text" || b.type === "callout") {
            label = U.plain(b.title || b.text || "");
          } else if (b.type === "cards") {
            label = U.plain(((b.items || [])[0] || {}).title || "");
          } else if (b.type === "video") {
            label = U.plain(b.title || "");
          } else if (b.type === "carousel") {
            label = U.plain(b.banner || ((b.items || [])[0] || {}).title || "");
          } else if (b.type === "tabs") {
            label = U.plain(((b.items || [])[0] || {}).title || "");
          }
          return !!label;
        });
      }
      if (label.length > 72) label = label.slice(0, 71).replace(/[\s,;:.]+\S*$/, "") + "…";
      return label;
    },

    findTerm: function (term) {
      var key = U.normalize(term);
      for (var i = 0; i < this.glossary.length; i++) {
        if (U.normalize(this.glossary[i].term) === key) return this.glossary[i];
      }
      return null;
    }
  };

  CruCo.course = course;
})(window.CruCo = window.CruCo || {});
