/* =========================================================================
   debug.js — review/QA panel (only with DEBUG:true or ?debug=1)
   -------------------------------------------------------------------------
   Shows live tracking values (LMS mode, status, bookmark, progress,
   suspend_data size vs. limit, session time) and the current screen's
   storyboard metadata (objective, visual brief, references, AI prompt,
   stripped notes) so reviewers can check fidelity against the storyboard.
   Never active in LMS builds (build.py sets ALLOW_URL_FLAGS:false).
   ========================================================================= */
(function (CruCo) {
  "use strict";

  var U = CruCo.utils;
  var h = U.h;

  var CSS = [
    ".dbg-toggle{position:fixed;right:12px;bottom:calc(var(--navbar-h) + 12px);z-index:var(--z-debug);padding:6px 12px;border:0;border-radius:999px;background:#1f1d1b;color:#fff;font:600 12px/1.2 var(--font-mono);box-shadow:var(--shadow-2)}",
    ".dbg{position:fixed;right:12px;bottom:calc(var(--navbar-h) + 52px);z-index:var(--z-debug);width:min(420px,calc(100vw - 24px));max-height:min(70vh,640px);overflow:auto;padding:14px 16px;border-radius:12px;background:#1f1d1b;color:#f3efe9;font:12px/1.5 var(--font-mono);box-shadow:var(--shadow-3)}",
    ".dbg h2{margin:0 0 8px;color:#fff;font:700 12px/1.3 var(--font-mono);letter-spacing:.08em;text-transform:uppercase}",
    ".dbg h2:not(:first-child){margin-top:14px}",
    ".dbg dl{display:grid;grid-template-columns:max-content 1fr;gap:2px 12px;margin:0}",
    ".dbg dt{color:#b8ada0}.dbg dd{margin:0;word-break:break-word;white-space:pre-wrap}",
    ".dbg .ok{color:#9bd3a8}.dbg .warn{color:#f2c46d}",
    ".dbg-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}",
    ".dbg-actions button{padding:4px 10px;border:1px solid #6b635a;border-radius:6px;background:none;color:#fff;font:inherit}"
  ].join("\n");

  var debug = {
    panel: null,
    body: null,

    init: function () {
      var self = this;
      document.head.appendChild(h("style", { text: CSS }));
      var toggle = h("button", { class: "dbg-toggle", attrs: { type: "button", "aria-expanded": "false" }, text: "DEBUG" });
      this.body = h("div");
      var reset = h("button", { attrs: { type: "button" }, text: "Reiniciar progreso" });
      var visitAll = h("button", { attrs: { type: "button" }, text: "Marcar todo visitado" });
      this.panel = h("section", { class: "dbg", attrs: { "aria-label": "Debug" }, hidden: true }, this.body,
        h("div", { class: "dbg-actions" }, visitAll, reset));

      toggle.addEventListener("click", function () {
        self.panel.hidden = !self.panel.hidden;
        toggle.setAttribute("aria-expanded", String(!self.panel.hidden));
      });
      reset.addEventListener("click", function () {
        if (CruCo.lms.mode !== "mock") { alert("Solo disponible en modo local (mock)."); return; }
        CruCo.lms.finished = true;              // skip the unload sync that would re-save progress
        CruCo.lms.resetMock();
        window.location.reload();
      });
      visitAll.addEventListener("click", function () {
        CruCo.course.screens.forEach(function (s) { CruCo.state.visited[s.id] = true; });
        CruCo.state.emit("progress");
      });

      document.body.appendChild(toggle);
      document.body.appendChild(this.panel);
      CruCo.state.onChange(function () { self.update(); });
      setInterval(function () { if (!self.panel.hidden) self.update(); }, 1000);
      this.update();
    },

    row: function (dl, k, v, cls) {
      dl.appendChild(h("dt", { text: k }));
      dl.appendChild(h("dd", { class: cls || null, text: v == null || v === "" ? "—" : String(v) }));
    },

    update: function () {
      if (!this.body) return;
      var L = CruCo.lms;
      var S = CruCo.state;
      var C = CruCo.course;
      var p = S.progress();
      var suspend = S.serialize();
      var threshold = CruCo.config.COMPLETION_THRESHOLD;
      this.body.innerHTML = "";

      var dl = h("dl");
      this.row(dl, "Modo", L.mode + " (SCORM " + L.version + ")");
      this.row(dl, "Estado", L.getStatus ? L.getStatus() : "", L.isCompleted && L.isCompleted() ? "ok" : null);
      this.row(dl, "Marcador", S.current);
      this.row(dl, "Progreso", p.percent + " % (" + p.done + "/" + p.total + " pantallas) · umbral " + Math.round(threshold * 100) + " %");
      this.row(dl, "Actividades", p.testsDone + "/" + p.testsTotal + (CruCo.config.REQUIRE_ALL_TESTS ? " (obligatorias)" : ""));
      this.row(dl, "Completado", p.complete ? "sí" : "no", p.complete ? "ok" : null);
      this.row(dl, "suspend_data", suspend.length + " / " + L.limits.suspend + " car.", suspend.length > L.limits.suspend * 0.8 ? "warn" : null);
      this.row(dl, "Sesión", L.sessionTime ? L.sessionTime() : "");
      this.row(dl, "Contenido", "v" + (CruCo.config.CONTENT_VERSION || "?") + " · " + C.modules.length + " storyboard(s)");
      this.body.appendChild(h("h2", { text: "Seguimiento" }));
      this.body.appendChild(dl);

      var screen = C.screenById[S.current];
      if (!screen) return;
      var sb = screen.storyboard || {};
      var dl2 = h("dl");
      this.row(dl2, "ID", screen.id + " (" + (sb.screen || "sin ref.") + ")");
      this.row(dl2, "Fuente", screen.module.source);
      this.row(dl2, "Layout", screen.layout || "standard");
      this.row(dl2, "Objetivo", sb.objective);
      this.row(dl2, "Brief", sb.brief);
      this.row(dl2, "Ref. visual", sb.visualRefs);
      this.row(dl2, "Prompt IA", sb.aiPrompt);
      this.row(dl2, "Notas", (sb.notes || []).join(" | "));
      this.body.appendChild(h("h2", { text: "Storyboard" }));
      this.body.appendChild(dl2);
    }
  };

  CruCo.debug = debug;
})(window.CruCo = window.CruCo || {});
