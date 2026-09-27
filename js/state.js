/* =========================================================================
   state.js — learner progress, knowledge-check state, persistence
   -------------------------------------------------------------------------
   Progress rule (see courseConfig.js):
     screen done  = visited AND all its knowledge checks completed
     progress     = done screens / total screens
     complete     = progress >= COMPLETION_THRESHOLD
                    AND (all checks completed, if REQUIRE_ALL_TESTS)
   Persisted to cmi.suspend_data as compact JSON (SCORM 1.2: 4096 chars):
     { v, cv, vm:[fully visited module ids], vs:[other visited screen ids],
       q:{ key:[attempts, correct, response] }, ui:{ sb, tab, col:[...] } }
   ========================================================================= */
(function (CruCo) {
  "use strict";

  var U = CruCo.utils;
  var cfg = function () { return CruCo.config || {}; };
  var FORMAT_VERSION = 1;

  var listeners = [];

  var state = {
    visited: {},
    questions: {},          // key -> { a, c, r, txt?, rev?, ord? }  (txt/ord: memory only)
    ui: { sidebar: null, tab: "toc", collapsed: {} },
    memory: {},             // per-component UI state for this session only
    current: null,
    completedReported: false,
    _lastSuspend: null,
    _lastScore: null,

    onChange: function (fn) { listeners.push(fn); },
    emit: function (type, detail) { listeners.forEach(function (fn) { fn(type, detail); }); },

    // ---- Screens ------------------------------------------------------------------
    markVisited: function (id) {
      if (this.visited[id]) return;
      this.visited[id] = true;
      this.emit("progress");
    },

    isVisited: function (id) { return !!this.visited[id]; },

    // ---- Knowledge checks -------------------------------------------------------
    getQuestion: function (key) { return this.questions[key] || null; },

    setQuestion: function (key, patch) {
      this.questions[key] = Object.assign({ a: 0, c: 0 }, this.questions[key] || {}, patch);
      this.emit("progress");
      return this.questions[key];
    },

    isQuestionComplete: function (key) {
      var q = this.questions[key];
      if (!q || !q.a) return false;
      return cfg().TEST_COMPLETION_RULE === "correct" ? !!q.c : true;
    },

    isTestComplete: function (testId) {
      var test = CruCo.course.testById[testId];
      if (!test) return true;
      var self = this;
      return test.questionKeys.every(function (k) { return self.isQuestionComplete(k); });
    },

    isScreenDone: function (screen) {
      if (!screen || !this.visited[screen.id]) return false;
      var self = this;
      return screen.tests.every(function (t) { return self.isTestComplete(t); });
    },

    /** "done" | "pending" (visited, checks open) | "new" */
    screenStatus: function (screen) {
      if (this.isScreenDone(screen)) return "done";
      return this.visited[screen.id] ? "pending" : "new";
    },

    isModuleDone: function (mod) {
      var self = this;
      return mod.screens.length > 0 && mod.screens.every(function (s) { return self.isScreenDone(s); });
    },

    progress: function () {
      var C = CruCo.course;
      var self = this;
      var done = C.screens.filter(function (s) { return self.isScreenDone(s); }).length;
      var testsDone = C.tests.filter(function (t) { return self.isTestComplete(t.id); }).length;
      var total = C.screens.length;
      var fraction = total ? done / total : 0;
      var allTests = testsDone === C.tests.length;
      var threshold = typeof cfg().COMPLETION_THRESHOLD === "number" ? cfg().COMPLETION_THRESHOLD : 0.85;
      return {
        done: done,
        total: total,
        fraction: fraction,
        percent: Math.floor(fraction * 100),
        testsDone: testsDone,
        testsTotal: C.tests.length,
        complete: total > 0 && fraction >= threshold && (cfg().REQUIRE_ALL_TESTS === false || allTests)
      };
    },

    /**
     * "sequential": a screen opens once every screen before it is done
     * (visited AND its knowledge checks answered). Answering is enough —
     * being right is not required (TEST_COMPLETION_RULE: "attempted"),
     * as the course tutorial promises: "Cada lección completada te
     * permitirá avanzar a la siguiente".
     */
    isReachable: function (screen) {
      if (cfg().NAVIGATION_MODE !== "sequential") return true;
      var C = CruCo.course;
      for (var i = 0; i < screen.globalIndex; i++) {
        if (!this.isScreenDone(C.screens[i])) return false;
      }
      return true;
    },

    /** True when the learner still has a knowledge check open on this screen. */
    hasPendingChecks: function (screen) {
      var self = this;
      return !!screen && screen.tests.some(function (id) { return !self.isTestComplete(id); });
    },

    // ---- Serialization -----------------------------------------------------------
    serialize: function () {
      var C = CruCo.course;
      var self = this;
      var vm = [];
      var vs = [];
      C.modules.forEach(function (m) {
        var all = m.screens.length > 0 && m.screens.every(function (s) { return self.visited[s.id]; });
        if (all) vm.push(m.id);
        else m.screens.forEach(function (s) { if (self.visited[s.id]) vs.push(s.id); });
      });

      var q = {};
      Object.keys(this.questions).forEach(function (k) {
        var e = self.questions[k];
        if (!e.a) return;
        q[k] = e.r != null && e.r !== "" ? [e.a, e.c ? 1 : 0, String(e.r)] : [e.a, e.c ? 1 : 0];
      });

      var collapsed = Object.keys(this.ui.collapsed).filter(function (k) { return self.ui.collapsed[k]; });
      var obj = {
        v: FORMAT_VERSION,
        cv: cfg().CONTENT_VERSION || "",
        vm: vm,
        vs: vs,
        q: q,
        ui: { sb: this.ui.sidebar === "closed" ? 0 : 1, tab: this.ui.tab, col: collapsed }
      };

      var limit = (CruCo.lms && CruCo.lms.limits ? CruCo.lms.limits.suspend : 4096) - 64;
      var out = JSON.stringify(obj);
      if (out.length > limit) {                     // 1) drop stored responses
        Object.keys(q).forEach(function (k) { q[k] = q[k].slice(0, 2); });
        out = JSON.stringify(obj);
      }
      if (out.length > limit) {                     // 2) drop menu state
        delete obj.ui;
        out = JSON.stringify(obj);
      }
      if (out.length > limit) U.warn("suspend_data still over budget (" + out.length + " chars).");
      return out;
    },

    restore: function (str) {
      if (!str) return false;
      var obj;
      try { obj = JSON.parse(str); } catch (e) { U.warn("Unreadable suspend_data; starting fresh."); return false; }
      if (!obj || obj.v !== FORMAT_VERSION) { U.warn("Unknown suspend_data format; starting fresh."); return false; }

      var C = CruCo.course;
      var self = this;
      if (obj.cv && obj.cv !== cfg().CONTENT_VERSION) {
        console.info("[CruCo] Saved progress is from content version " + obj.cv + "; restoring matching screens only.");
      }

      (obj.vm || []).forEach(function (mid) {
        C.modules.forEach(function (m) { if (m.id === mid) m.screens.forEach(function (s) { self.visited[s.id] = true; }); });
      });
      (obj.vs || []).forEach(function (sid) { if (C.screenById[sid]) self.visited[sid] = true; });

      var validKeys = {};
      C.tests.forEach(function (t) { t.questionKeys.forEach(function (k) { validKeys[k] = true; }); });
      Object.keys(obj.q || {}).forEach(function (k) {
        if (!validKeys[k]) return;
        var e = obj.q[k];
        self.questions[k] = { a: e[0] || 0, c: e[1] || 0, r: e.length > 2 ? e[2] : null };
      });

      if (obj.ui) {
        this.ui.sidebar = obj.ui.sb === 0 ? "closed" : "open";
        if (obj.ui.tab) this.ui.tab = obj.ui.tab;
        (obj.ui.col || []).forEach(function (m) { self.ui.collapsed[m] = true; });
      }
      return true;
    },

    // ---- LMS sync -----------------------------------------------------------------
    /** Pushes bookmark, suspend data, score and completion to the LMS. */
    sync: function (options) {
      var lms = CruCo.lms;
      if (!lms || !lms.api || lms.finished) return;   // no calls after LMSFinish
      var p = this.progress();

      if (this.current) lms.setLocation(this.current);

      var data = this.serialize();
      if (data !== this._lastSuspend) {
        lms.setSuspendData(data);
        this._lastSuspend = data;
      }

      if ((cfg().SCORM || {}).SCORE_MODE !== "none" && p.percent !== this._lastScore) {
        lms.setScore(p.percent, 0, 100);
        this._lastScore = p.percent;
      }
      lms.setProgressMeasure(p.fraction);

      if (p.complete && !this.completedReported) {
        this.completedReported = true;
        if (!lms.isCompleted()) {
          lms.setCompleted();
          this.emit("completed");
        }
      }

      if (options && options.immediate) lms.commit();
      else lms.scheduleCommit();
    }
  };

  CruCo.state = state;
})(window.CruCo = window.CruCo || {});
