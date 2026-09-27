/* =========================================================================
   lmsAdapter.js — LMSAdapter: the ONLY module that talks to the LMS
   -------------------------------------------------------------------------
   - SCORM 1.2 (default) and SCORM 2004 behind one interface.
   - Auto-detects window.API / API_1484_11 across parent frames and opener.
   - No LMS found (local file, preview server): falls back to a mock API
     that logs every call to the console and (optionally) persists to
     localStorage, so bookmarking/resume can be debugged offline.
   - Never throws: every LMS call is wrapped and errors are logged.
   ========================================================================= */
(function (CruCo) {
  "use strict";

  var cfg = function () { return CruCo.config || {}; };
  var scormCfg = function () { return cfg().SCORM || {}; };

  var METHODS = {
    "1.2": { init: "LMSInitialize", finish: "LMSFinish", get: "LMSGetValue", set: "LMSSetValue",
             commit: "LMSCommit", err: "LMSGetLastError", errStr: "LMSGetErrorString", diag: "LMSGetDiagnostic" },
    "2004": { init: "Initialize", finish: "Terminate", get: "GetValue", set: "SetValue",
              commit: "Commit", err: "GetLastError", errStr: "GetErrorString", diag: "GetDiagnostic" }
  };

  var MODEL = {
    "1.2": { status: "cmi.core.lesson_status", location: "cmi.core.lesson_location", suspend: "cmi.suspend_data",
             entry: "cmi.core.entry", exit: "cmi.core.exit", sessionTime: "cmi.core.session_time",
             scoreRaw: "cmi.core.score.raw", scoreMin: "cmi.core.score.min", scoreMax: "cmi.core.score.max",
             learnerName: "cmi.core.student_name" },
    "2004": { status: "cmi.completion_status", location: "cmi.location", suspend: "cmi.suspend_data",
              entry: "cmi.entry", exit: "cmi.exit", sessionTime: "cmi.session_time",
              scoreRaw: "cmi.score.raw", scoreMin: "cmi.score.min", scoreMax: "cmi.score.max",
              scoreScaled: "cmi.score.scaled", progress: "cmi.progress_measure", learnerName: "cmi.learner_name" }
  };

  var LIMITS = {
    "1.2": { suspend: 4096, location: 255 },
    "2004": { suspend: 64000, location: 1000 }
  };

  // ---- API discovery (ADL algorithm, cross-origin safe) ---------------------
  function scan(win, name) {
    for (var tries = 0; win && tries < 12; tries++) {
      try { if (win[name]) return win[name]; } catch (e) { /* cross-origin frame */ }
      var parent = null;
      try { parent = win.parent; } catch (e) { parent = null; }
      if (!parent || parent === win) break;
      win = parent;
    }
    return null;
  }

  function findAPI(name) {
    var api = scan(window, name);
    if (!api) { try { if (window.opener) api = scan(window.opener, name); } catch (e) { /* ignore */ } }
    if (!api) { try { if (window.top && window.top.opener) api = scan(window.top.opener, name); } catch (e) { /* ignore */ } }
    return api;
  }

  // ---- Time formatting ------------------------------------------------------------
  function pad(n, len) {
    var s = String(Math.floor(n));
    while (s.length < len) s = "0" + s;
    return s;
  }

  /** SCORM 1.2 CMITimespan: HH:MM:SS (hours 2-4 digits). */
  function formatScorm12Time(ms) {
    var total = Math.max(0, Math.round(ms / 1000));
    var hh = Math.min(9999, Math.floor(total / 3600));
    var mm = Math.floor((total % 3600) / 60);
    var ss = total % 60;
    return pad(hh, 2) + ":" + pad(mm, 2) + ":" + pad(ss, 2);
  }

  /** SCORM 2004 timeinterval (ISO 8601): PT#H#M#S. */
  function formatScorm2004Time(ms) {
    var total = Math.max(0, Math.round(ms / 1000));
    return "PT" + Math.floor(total / 3600) + "H" + Math.floor((total % 3600) / 60) + "M" + (total % 60) + "S";
  }

  function parseScorm12Time(str) {
    var m = /^(\d{2,4}):(\d{2}):(\d{2})(\.\d{1,2})?$/.exec(str || "");
    return m ? ((+m[1] * 3600) + (+m[2] * 60) + (+m[3])) * 1000 : 0;
  }

  // ---- Mock API (SCORM 1.2 semantics) for local / offline debugging ------------
  function createMockAPI() {
    var key = "cruco-scorm-mock:" + (cfg().COURSE_ID || "course");
    var persist = scormCfg().MOCK_PERSIST !== false;
    var data = {};
    if (persist) {
      try { data = JSON.parse(window.localStorage.getItem(key) || "{}") || {}; } catch (e) { data = {}; }
    }
    var defaults = {
      "cmi.core.lesson_status": "not attempted",
      "cmi.core.student_name": "Prueba, Estudiante",
      "cmi.core.student_id": "local",
      "cmi.core.lesson_mode": "normal",
      "cmi.core.credit": "credit",
      "cmi.core.total_time": "0000:00:00",
      "cmi.launch_data": ""
    };

    function log(fn, args, result) {
      if (scormCfg().MOCK_LOG === false) return;
      console.info("%c[SCORM mock]%c " + fn + "(" + args.map(function (a) { return JSON.stringify(a); }).join(", ") + ") -> " + JSON.stringify(result),
        "color:#8c2f39;font-weight:bold", "color:inherit");
    }

    function save() {
      if (!persist) return;
      try { window.localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
    }

    return {
      LMSInitialize: function (arg) {
        // Entry mirrors an LMS: resume only after a suspended exit.
        data["cmi.core.entry"] = data["cmi.core.exit"] === "suspend" ? "resume" : (data["cmi.core.lesson_status"] ? "" : "ab-initio");
        log("LMSInitialize", [arg], "true");
        return "true";
      },
      LMSGetValue: function (el) {
        var v = Object.prototype.hasOwnProperty.call(data, el) ? data[el] : (defaults[el] || "");
        log("LMSGetValue", [el], v);
        return v;
      },
      LMSSetValue: function (el, v) {
        if (el === "cmi.suspend_data" && String(v).length > LIMITS["1.2"].suspend) {
          console.warn("[SCORM mock] cmi.suspend_data exceeds 4096 chars (" + String(v).length + ")");
        }
        data[el] = String(v);
        log("LMSSetValue", [el, String(v)], "true");
        return "true";
      },
      LMSCommit: function (arg) { save(); log("LMSCommit", [arg], "true"); return "true"; },
      LMSFinish: function (arg) {
        var total = parseScorm12Time(data["cmi.core.total_time"]) + parseScorm12Time(data["cmi.core.session_time"]);
        data["cmi.core.total_time"] = formatScorm12Time(total);
        save();
        log("LMSFinish", [arg], "true");
        return "true";
      },
      LMSGetLastError: function () { return "0"; },
      LMSGetErrorString: function () { return "No error"; },
      LMSGetDiagnostic: function () { return ""; },
      __mock: true,
      __reset: function () { data = {}; try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ } },
      __data: function () { return data; }
    };
  }

  // ---- Adapter ------------------------------------------------------------------------
  var LMSAdapter = {
    mode: "none",            // "scorm12" | "scorm2004" | "mock"
    version: "1.2",
    api: null,
    connected: false,
    finished: false,
    startTime: 0,
    limits: LIMITS["1.2"],
    _commitTimer: null,

    /** Finds the API, initializes the session and returns the saved context. */
    init: function () {
      var want = String(scormCfg().VERSION || "auto");
      var api = null;
      var version = "1.2";

      if (want === "auto" || want === "1.2") { api = findAPI("API"); version = "1.2"; }
      if (!api && (want === "auto" || want === "2004")) { api = findAPI("API_1484_11"); version = "2004"; }

      if (!api) {
        api = createMockAPI();
        version = "1.2";
        this.mode = "mock";
        console.info("[CruCo] No LMS API found: running in local mock mode (SCORM 1.2 semantics).");
      } else {
        this.mode = version === "2004" ? "scorm2004" : "scorm12";
      }

      this.api = api;
      this.version = version;
      this.limits = LIMITS[version];
      this.startTime = Date.now();
      this.connected = this._call("init", "");

      if (!this.connected && this.mode !== "mock") {
        console.error("[CruCo] LMS initialization failed; switching to mock mode (progress will NOT be tracked).");
        this.api = createMockAPI();
        this.mode = "mock";
        this.version = "1.2";
        this.limits = LIMITS["1.2"];
        this.connected = this._call("init", "");
      }

      var status = this.getStatus();
      if (!status || status === "not attempted" || status === "unknown") {
        this.setValue(this._el("status"), "incomplete");   // first launch: known not completed
      }

      return {
        mode: this.mode,
        entry: this.getValue(this._el("entry")),
        status: this.getStatus(),
        location: this.getValue(this._el("location")),
        suspendData: this.getValue(this._el("suspend")),
        learnerName: this.getValue(this._el("learnerName"))
      };
    },

    // ---- Low-level access (never throws) -------------------------------------
    _el: function (key) { return MODEL[this.version][key]; },

    _call: function (method, a, b) {
      if (!this.api) return false;
      var name = METHODS[this.version][method];
      try {
        var fn = this.api[name];
        if (typeof fn !== "function") { console.error("[CruCo] LMS API lacks " + name); return false; }
        var res = b === undefined ? fn.call(this.api, a) : fn.call(this.api, a, b);
        if (method === "get") return res == null ? "" : String(res);
        var ok = String(res) === "true";
        if (!ok) this._logError(name, a, b);
        return ok;
      } catch (e) {
        console.error("[CruCo] LMS call " + name + " threw:", e);
        return method === "get" ? "" : false;
      }
    },

    _logError: function (name, a, b) {
      try {
        var code = String(this.api[METHODS[this.version].err]());
        if (code === "0") return;
        var msg = this.api[METHODS[this.version].errStr](code);
        var diag = this.api[METHODS[this.version].diag](code);
        console.error("[CruCo] " + name + "(" + [a, b].filter(function (x) { return x !== undefined; }).join(", ") + ") failed: " + code + " " + msg + (diag ? " — " + diag : ""));
      } catch (e) { /* ignore */ }
    },

    getValue: function (el) { return el ? this._call("get", el) : ""; },
    setValue: function (el, value) { return el ? this._call("set", el, String(value)) : false; },

    // ---- Status -------------------------------------------------------------------
    getStatus: function () { return this.getValue(this._el("status")); },

    isCompleted: function () {
      var s = this.getStatus();
      return s === "completed" || s === "passed";
    },

    setIncomplete: function () {
      if (this.isCompleted()) return false;   // never downgrade a completion
      return this.setValue(this._el("status"), "incomplete");
    },

    setCompleted: function () {
      if (this.version === "1.2" && this.getStatus() === "passed") return true;
      var ok = this.setValue(this._el("status"), "completed");
      this.commit();
      return ok;
    },

    // ---- Bookmark & suspend data -----------------------------------------------
    setLocation: function (screenId) {
      var v = String(screenId || "").slice(0, this.limits.location);
      return this.setValue(this._el("location"), v);
    },

    setSuspendData: function (str) {
      if (str.length > this.limits.suspend) {
        console.warn("[CruCo] suspend_data is " + str.length + " chars; SCORM " + this.version + " guarantees " + this.limits.suspend + ".");
      }
      return this.setValue(this._el("suspend"), str);
    },

    // ---- Score (non-graded course: reported for compatibility only) ----------
    setScore: function (raw, min, max) {
      min = min == null ? 0 : min;
      max = max == null ? 100 : max;
      raw = Math.max(min, Math.min(max, Math.round(raw)));
      var range = min + ":" + max;
      if (this._scoreRange !== range) {          // min/max first (some LMSs validate raw against them)
        this.setValue(this._el("scoreMin"), min);
        this.setValue(this._el("scoreMax"), max);
        this._scoreRange = range;
      }
      this.setValue(this._el("scoreRaw"), raw);
      if (this.version === "2004") {
        this.setValue(this._el("scoreScaled"), max > min ? ((raw - min) / (max - min)).toFixed(4) : "0");
      }
    },

    setProgressMeasure: function (fraction) {
      if (this.version !== "2004") return;
      this.setValue(this._el("progress"), Math.max(0, Math.min(1, fraction)).toFixed(4));
    },

    // ---- Persistence ------------------------------------------------------------
    commit: function () {
      clearTimeout(this._commitTimer);
      this._commitTimer = null;
      if (this.finished) return false;
      return this._call("commit", "");
    },

    scheduleCommit: function () {
      var self = this;
      clearTimeout(this._commitTimer);
      this._commitTimer = setTimeout(function () { self.commit(); }, scormCfg().COMMIT_DEBOUNCE_MS || 800);
    },

    sessionTime: function () {
      var ms = Date.now() - this.startTime;
      return this.version === "2004" ? formatScorm2004Time(ms) : formatScorm12Time(ms);
    },

    /** Ends the session: exit mode + session time + commit + finish (once). */
    finish: function () {
      if (this.finished || !this.api) return;
      var exitMode = scormCfg().EXIT_MODE == null ? "suspend" : scormCfg().EXIT_MODE;
      this.setValue(this._el("exit"), exitMode);
      this.setValue(this._el("sessionTime"), this.sessionTime());
      this._call("commit", "");
      this._call("finish", "");
      this.finished = true;
      clearTimeout(this._commitTimer);
    },

    /** Local mock only: wipe stored progress. */
    resetMock: function () {
      if (this.api && this.api.__mock) this.api.__reset();
    }
  };

  LMSAdapter.formatScorm12Time = formatScorm12Time;
  LMSAdapter.formatScorm2004Time = formatScorm2004Time;

  CruCo.lms = LMSAdapter;
  window.LMSAdapter = LMSAdapter;
})(window.CruCo = window.CruCo || {});
