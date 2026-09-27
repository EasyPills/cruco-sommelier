/* =========================================================================
   editor.js — author mode: edit every image / video / audio in place
   -------------------------------------------------------------------------
   Enabled with ?edit=1 (prototype) or EDITOR:true in courseConfig
   (04-Build/build.py --editor produces a review package with it on).
   It is NEVER active in the LMS package: the final build sets
   EDITOR:false and ALLOW_URL_FLAGS:false.

   How it works
   - Every media node is rendered with a stable path ("2.3#1",
     "2.3#4/cards/2/image", "2.1#bg", "2.1#audio"). Media components ask
     CruCo.resolveMedia(path, data) before rendering, so an override for
     that path replaces src/alt/caption/title/script/poster/captions.
   - Overrides come from two places, merged in this order:
       1. content/overrides.js  (applied edits, shipped with the course)
       2. localStorage          (edits the author is working on now)
   - "Descargar overrides.js" writes file (1) so the changes become part of
     the course. Chosen local files are not uploaded: the editor stores the
     target path (assets/…) and lists the files to copy into the project.
   ========================================================================= */
(function (CruCo) {
  "use strict";

  var U = CruCo.utils;
  var h = U.h;
  var t = U.t;

  // Fields offered per media kind (order matters in the dialog).
  var FIELDS = {
    image: [["src", "editorFieldSrc", "text"], ["alt", "editorFieldAlt", "text"], ["caption", "editorFieldCaption", "text"]],
    video: [["src", "editorFieldSrc", "text"], ["title", "editorFieldTitle", "text"], ["poster", "editorFieldPoster", "text"],
            ["captions", "editorFieldCaptions", "text"], ["script", "editorFieldScript", "area"], ["transcript", "editorFieldTranscript", "area"]],
    audio: [["src", "editorFieldSrc", "text"], ["transcript", "editorFieldTranscript", "area"]]
  };
  var ACCEPT = { image: "image/*", video: "video/*", audio: "audio/*" };
  var ASSET_DIR = { image: "images", video: "video", audio: "audio" };

  var editor = {
    active: false,
    local: {},          // path -> { field: value }  (this browser only, exportable)
    previews: {},       // path -> { field: blob URL }  (this session only)
    files: {},          // path -> { name, target }     (files the author must copy)
    panelBtn: null,

    storageKey: function () {
      return "cruco-editor:" + ((CruCo.config && CruCo.config.COURSE_ID) || "course");
    },

    // ---- Lifecycle ---------------------------------------------------------
    /** Step 1 (before the course model is built): bring back saved changes. */
    load: function () {
      this.active = true;
      this.restore();
    },

    /** Step 2 (after the shell exists): badge + editor affordances. */
    mount: function () {
      var self = this;
      document.querySelector(".app").dataset.editor = "on";
      this.mountBadge();
      window.addEventListener("beforeunload", function () { self.persist(); });
    },

    restore: function () {
      var raw = null;
      try { raw = window.localStorage.getItem(this.storageKey()); } catch (e) { /* storage off */ }
      if (!raw) return;
      try {
        var data = JSON.parse(raw) || {};
        this.local = data.overrides || {};
        this.files = data.files || {};
      } catch (e) { U.warn("Editor: unreadable saved changes; starting clean."); return; }
      var self = this;
      Object.keys(this.local).forEach(function (path) { CruCo.applyOverride(path, self.local[path]); });
    },

    persist: function () {
      try {
        window.localStorage.setItem(this.storageKey(), JSON.stringify({ overrides: this.local, files: this.files }));
      } catch (e) { /* quota or private mode: changes stay in memory */ }
    },

    count: function () { return Object.keys(this.local).length; },

    // ---- Piece decoration --------------------------------------------------
    /**
     * Wraps any piece of a screen (block, screen audio, background, or a
     * media item nested in a component) with its author toolbar:
     * "Editar" when the piece has editable fields, "Borrar" always.
     */
    frame: function (node, opts) {
      var self = this;
      if (!this.active || !node || !opts || !opts.path) return node;
      var edited = !!this.local[opts.path];
      var canEdit = opts.canEdit !== false && !!FIELDS[opts.kind];
      var tools = h("div", { class: "editable__tools" });

      if (canEdit) {
        var label = t(opts.kind === "video" ? "editVideo" : opts.kind === "audio" ? "editAudio" : "editImage");
        var edit = h("button", {
          class: "editable__btn",
          attrs: { type: "button", "aria-label": label + " · " + opts.path }
        }, U.iconEl("pencil"), h("span", { text: t("editorEdit") }));
        edit.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.openDialog(opts);
        });
        tools.appendChild(edit);
      }

      var del = h("button", {
        class: "editable__btn editable__btn--danger",
        attrs: { type: "button", "aria-label": t("editorDeleteAria", { what: opts.name || opts.path }) }
      }, U.iconEl("trash"), h("span", { text: t("editorDelete") }));
      del.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        self.remove(opts.path);
      });
      tools.appendChild(del);

      return h("div", {
        class: "editable",
        dataset: { kind: opts.kind || "block", edited: String(edited), path: opts.path },
        attrs: { "data-piece": opts.name || null }
      },
        node,
        tools,
        edited ? h("span", { class: "editable__badge", text: t("editorEdited") }) : null);
    },

    /** Kept for media components that decorate nested items. */
    decorate: function (node, opts) { return this.frame(node, opts); },

    // ---- Delete & restore --------------------------------------------------
    remove: function (path) {
      this.local[path] = Object.assign({}, this.local[path], { _deleted: true });
      CruCo.applyOverride(path, { _deleted: true });
      this.after(true);
    },

    restorePiece: function (path) {
      var patch = Object.assign({}, this.local[path]);
      delete patch._deleted;
      if (Object.keys(patch).length) this.local[path] = patch;
      else delete this.local[path];
      CruCo.setOverride(path, this.local[path] || null);
      this.after(true);
    },

    /** Placeholder left where a deleted piece was, so it can come back. */
    deletedChip: function (path, name) {
      var self = this;
      var btn = h("button", { class: "btn btn--secondary", attrs: { type: "button" } },
        U.iconEl("rotate"), t("editorRestorePiece"));
      btn.addEventListener("click", function () { self.restorePiece(path); });
      return h("div", { class: "editable-deleted" },
        h("p", { class: "editable-deleted__label", text: t("editorDeletedPiece", { what: name || path }) }),
        btn);
    },

    // ---- Edit dialog -------------------------------------------------------
    openDialog: function (opts) {
      var self = this;
      var kind = FIELDS[opts.kind] ? opts.kind : "image";
      var current = CruCo.resolveMedia(opts.path, opts.data || {});
      var inputs = {};
      var form = h("div", { class: "editor-form" });

      FIELDS[kind].forEach(function (field) {
        var name = field[0];
        var id = U.uid("ed");
        var value = current[name] == null ? "" : String(current[name]);
        var input = field[2] === "area"
          ? h("textarea", { class: "editor-form__input", attrs: { id: id, rows: "3" } })
          : h("input", { class: "editor-form__input", attrs: { id: id, type: "text", autocomplete: "off" } });
        input.value = value;
        inputs[name] = input;
        form.appendChild(h("div", { class: "editor-form__row" },
          h("label", { attrs: { for: id }, text: t(field[1]) }),
          input,
          name === "src" ? h("p", { class: "editor-form__help", text: t("editorFieldSrcHelp") }) : null));
      });

      // Local file picker: previews now, records the file to copy into the project.
      var lesson = this.lessonOf(opts.path);
      var picker = h("input", { attrs: { type: "file", accept: ACCEPT[kind] || "*/*" }, class: "visually-hidden" });
      var pickHint = h("p", { class: "editor-form__help" });
      var pickBtn = h("button", { class: "btn btn--secondary", attrs: { type: "button" } }, U.iconEl("upload"), t("editorPick"));
      pickBtn.addEventListener("click", function () { picker.click(); });
      picker.addEventListener("change", function () {
        var file = picker.files && picker.files[0];
        if (!file) return;
        // NFD + ASCII-only keeps file names inside CLAUDE.md rule 5.7.
        var safe = file.name.normalize("NFD").replace(/[^\x20-\x7E]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-").toLowerCase();
        var target = "assets/" + (ASSET_DIR[kind] || "images") + "/" + lesson + "/" + safe;
        inputs.src.value = target;
        self.previews[opts.path] = self.previews[opts.path] || {};
        self.previews[opts.path].src = URL.createObjectURL(file);
        self.files[opts.path] = { name: file.name, target: target };
        pickHint.textContent = t("editorPickHint", { path: target });
      });
      form.appendChild(h("div", { class: "editor-form__row" }, pickBtn, picker, pickHint));

      CruCo.layers.open({
        title: t(kind === "video" ? "editorDialogVideo" : kind === "audio" ? "editorDialogAudio" : "editorDialogImage"),
        body: form,
        wide: true,
        actions: [
          { label: t("editorApply"), primary: true, onClick: function () {
            var patch = {};
            FIELDS[kind].forEach(function (field) {
              var value = inputs[field[0]].value.trim();
              var base = opts.data && opts.data[field[0]] != null ? String(opts.data[field[0]]) : "";
              if (value !== base) patch[field[0]] = value;
            });
            if (Object.keys(patch).length) self.local[opts.path] = patch;
            else { delete self.local[opts.path]; delete self.files[opts.path]; }
            CruCo.setOverride(opts.path, self.local[opts.path] || null);
            self.after();
          } },
          { label: t("editorRestore"), onClick: function () {
            delete self.local[opts.path];
            delete self.files[opts.path];
            delete self.previews[opts.path];
            CruCo.setOverride(opts.path, null);
            self.after(true);
          } },
          { label: t("editorCancel") }
        ]
      });
    },

    /** Lesson folder used to suggest asset paths ("ml01"). */
    lessonOf: function (path) {
      var screen = CruCo.course.screenById[String(path).split("#")[0]];
      var id = screen && screen.module ? screen.module.id : "curso";
      return String(id).replace(/[^A-Za-z0-9._-]+/g, "-").toLowerCase();
    },

    /** `structural` = a piece appeared/disappeared: the course model changes
        (a deleted quiz must stop counting for completion). */
    after: function (structural) {
      this.persist();
      this.updateBadge();
      if (!CruCo.player) return;
      if (structural) CruCo.player.refreshModel();
      else CruCo.player.rerender();
    },

    // ---- Badge + changes panel --------------------------------------------
    mountBadge: function () {
      var self = this;
      this.panelBtn = h("button", {
        class: "editor-badge",
        attrs: { type: "button", "aria-label": t("editorPanelOpen") }
      }, U.iconEl("pencil"), h("span", { class: "editor-badge__text" }));
      this.panelBtn.addEventListener("click", function () { self.openPanel(); });
      document.body.appendChild(this.panelBtn);
      this.updateBadge();
    },

    updateBadge: function () {
      if (!this.panelBtn) return;
      var n = this.count();
      var label = n === 1 ? t("editorCountOne") : t("editorCount", { n: n });
      this.panelBtn.querySelector(".editor-badge__text").textContent = t("editorBadge") + " · " + label;
    },

    openPanel: function () {
      var self = this;
      var dialog = null;
      var body = h("div");
      var paths = Object.keys(this.local).sort();

      if (!paths.length) {
        body.appendChild(h("p", { text: t("editorPanelEmpty") }));
      } else {
        var list = h("dl", { class: "editor-changes" });
        paths.forEach(function (path) {
          var patch = self.local[path];
          list.appendChild(h("dt", { text: t("editorScreen", { id: path.split("#")[0] }) + " · " + path }));
          var dd = h("dd");
          if (patch._deleted) {
            dd.appendChild(h("p", { class: "editor-changes__deleted", text: t("editorDeletedLabel") }));
            var back = h("button", { class: "link-btn", attrs: { type: "button" } }, t("editorRestorePiece"));
            back.addEventListener("click", function () {
              if (dialog) dialog.close();
              self.restorePiece(path);
            });
            dd.appendChild(back);
          }
          Object.keys(patch).forEach(function (k) {
            if (k.charAt(0) === "_") return;
            dd.appendChild(h("p", { text: k + ": " + (patch[k] || "—") }));
          });
          list.appendChild(dd);
        });
        body.appendChild(list);

        var files = Object.keys(this.files).map(function (p) { return self.files[p]; })
          .filter(function (f) { return f && f.name; });
        if (files.length) {
          body.appendChild(h("h3", { text: t("editorFilesPending") }));
          body.appendChild(h("ul", { class: "editor-files" }, files.map(function (f) {
            return h("li", { text: f.name + "  →  " + f.target });
          })));
        }

        var out = h("textarea", { class: "editor-export", attrs: { rows: "8", readonly: "readonly", "aria-label": t("editorExport") } });
        out.value = this.exportText();
        body.appendChild(h("p", { class: "editor-form__help", text: t("editorExportHelp") }));
        body.appendChild(out);
      }

      dialog = CruCo.layers.open({
        title: t("editorPanel"),
        body: body,
        wide: true,
        actions: paths.length ? [
          { label: t("editorExport"), primary: true, onClick: function () { self.download(); } },
          { label: t("editorCopy"), onClick: function () { self.copy(); } },
          { label: t("editorClear"), onClick: function () {
            if (!window.confirm(t("editorClearConfirm"))) return;
            Object.keys(self.local).forEach(function (p) { CruCo.setOverride(p, null); });
            self.local = {}; self.files = {}; self.previews = {};
            self.after();
          } },
          { label: t("editorCancel") }
        ] : [{ label: t("editorCancel") }]
      });
    },

    /** content/overrides.js, in the same marker format build.py can read. */
    exportText: function () {
      var clean = {};
      var self = this;
      Object.keys(this.local).sort().forEach(function (path) {
        var patch = {};
        Object.keys(self.local[path]).forEach(function (k) {
          // `_deleted` travels with the course; `_preview` is session-only.
          if (k.charAt(0) !== "_" || k === "_deleted") patch[k] = self.local[path][k];
        });
        if (Object.keys(patch).length) clean[path] = patch;
      });
      var stamp = new Date().toISOString().slice(0, 10);
      return "/* =========================================================================\n" +
        "   overrides.js — media replacements made in the CruCo editor (" + stamp + ")\n" +
        "   Generated by the editor (?edit=1). Keys are media paths:\n" +
        "   \"<screen id>#<block index>[/sub/path]\". Delete an entry to go back to\n" +
        "   the value written in the storyboard content file.\n" +
        "   ========================================================================= */\n" +
        "window.CruCo = window.CruCo || {};\n" +
        "CruCo.applyOverrides(/*<overrides>*/" + JSON.stringify(clean, null, 2) + "/*</overrides>*/);\n";
    },

    download: function () {
      var blob = new Blob([this.exportText()], { type: "text/javascript;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = h("a", { attrs: { href: url, download: "overrides.js" } });
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    },

    copy: function () {
      var text = this.exportText();
      var ta = h("textarea", { class: "visually-hidden" });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) { /* clipboard blocked */ }
      document.body.removeChild(ta);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () { /* ignore */ });
      }
      U.announce(t("editorCopied"));
    }
  };

  CruCo.editor = editor;
})(window.CruCo = window.CruCo || {});
