/* =========================================================================
   sidebar.js — collapsible course menu
   -------------------------------------------------------------------------
   Lessons (table of contents) fill the panel; the tab bar sits at the
   BOTTOM with Descargas · Wiki · Ayuda, because the course tutorial tells
   the learner: "Al final del menú principal encontrarás el apartado
   DESCARGAS …, la Wiki … y la sección de AYUDA".
   Desktop (>= 1024px): docked panel that collapses. Smaller screens: modal
   drawer with focus trap, scrim and Esc to close. Open/closed state, the
   active tab and collapsed modules are persisted in suspend_data.
   ========================================================================= */
(function (CruCo) {
  "use strict";

  var U = CruCo.utils;
  var h = U.h;
  var t = U.t;

  var TABS = [
    { id: "toc", icon: "list", label: "tabModules" },
    { id: "downloads", icon: "download", label: "tabDownloads" },
    { id: "glossary", icon: "book", label: "tabGlossary" },
    { id: "help", icon: "help", label: "tabHelp" }
  ];

  var mq = window.matchMedia("(max-width: 1023.98px)");

  function highlight(text, q) {
    var raw = U.plain(text);
    if (!q) return U.escapeHtml(raw);
    var folded = U.fold(raw);
    var i = folded.length === raw.length ? folded.indexOf(q) : -1;
    if (i < 0) return U.escapeHtml(raw);
    return U.escapeHtml(raw.slice(0, i)) + "<mark>" + U.escapeHtml(raw.slice(i, i + q.length)) + "</mark>" +
      U.escapeHtml(raw.slice(i + q.length));
  }

  var sidebar = {
    el: null,
    app: null,
    toggleBtn: null,
    scrim: null,
    tabs: {},
    panels: {},
    toc: {},
    modules: {},
    releaseTrap: null,

    init: function () {
      this.app = document.querySelector(".app");
      this.el = document.getElementById("sidebar");
      this.toggleBtn = document.getElementById("menu-toggle");
      this.scrim = document.getElementById("scrim");
      this.el.setAttribute("aria-label", t("courseMenu"));

      this.build();
      this.wireGlobal();
      this.selectTab(this.tabs[CruCo.state.ui.tab] ? CruCo.state.ui.tab : "toc", false);
      this.applyMode();
    },

    /** Editor deleted/restored a piece: rebuild the menu from the new model. */
    rebuild: function () {
      if (!this.el) return;
      this.el.innerHTML = "";
      this.tabs = {};
      this.panels = {};
      this.toc = {};
      this.modules = {};
      this.build();
      this.selectTab(this.tabs[CruCo.state.ui.tab] ? CruCo.state.ui.tab : "toc", false);
      this.refresh();
    },

    /** Creates the menu DOM (head, panels, bottom tab bar). */
    build: function () {
      var self = this;
      var closeBtn = h("button", { class: "icon-btn", attrs: { type: "button", "aria-label": t("closeMenu") }, html: U.icon("close") });
      closeBtn.addEventListener("click", function () { self.setOpen(false, { returnFocus: true }); });
      this.el.appendChild(h("div", { class: "sidebar__head" }, h("h2", { text: t("courseMenu") }), closeBtn));

      // Panels first, tab bar last: the tabs sit at the bottom of the menu.
      var tablist = h("div", { class: "sidebar__tabs", attrs: { role: "tablist", "aria-label": t("courseMenu") } });
      TABS.forEach(function (tab) {
        var tabId = "sb-tab-" + tab.id;
        var panelId = "sb-panel-" + tab.id;
        var btn = h("button", {
          class: "sidebar__tab",
          attrs: { type: "button", role: "tab", id: tabId, "aria-controls": panelId, "aria-selected": "false", tabindex: "-1" }
        }, U.iconEl(tab.icon), h("span", { text: t(tab.label) }));
        btn.addEventListener("click", function () { self.selectTab(tab.id, false); });
        var panel = h("div", {
          class: "sidebar__panel",
          attrs: { role: "tabpanel", id: panelId, "aria-labelledby": tabId, tabindex: "0" },
          hidden: true
        });
        self.tabs[tab.id] = btn;
        self.panels[tab.id] = panel;
        tablist.appendChild(btn);
        self.el.appendChild(panel);
      });
      this.el.appendChild(tablist);
      tablist.addEventListener("keydown", function (e) { self.onTabKey(e); });

      this.buildToc(this.panels.toc);
      this.buildGlossary(this.panels.glossary);
      this.buildHelp(this.panels.help);
      this.buildDownloads(this.panels.downloads);
    },

    /** Listeners on elements outside the menu DOM: attached once. */
    wireGlobal: function () {
      var self = this;
      if (this._wired) return;
      this._wired = true;
      this.toggleBtn.addEventListener("click", function () { self.setOpen(!self.isOpen(), { returnFocus: true }); });
      this.scrim.addEventListener("click", function () { self.setOpen(false, { returnFocus: true }); });
      this.el.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && self.isDrawer() && self.isOpen()) { e.preventDefault(); self.setOpen(false, { returnFocus: true }); }
      });
      var onMode = function () { self.applyMode(); };
      if (mq.addEventListener) mq.addEventListener("change", onMode); else mq.addListener(onMode);
    },

    isDrawer: function () { return mq.matches; },
    isOpen: function () { return this.app.dataset.sidebar === "open"; },

    applyMode: function () {
      if (this.isDrawer()) { this.setOpen(false, { silent: true }); return; }
      var pref = CruCo.state.ui.sidebar || (CruCo.config.SIDEBAR_DEFAULT === "closed" ? "closed" : "open");
      this.setOpen(pref === "open", { silent: true });
    },

    setOpen: function (open, opts) {
      opts = opts || {};
      var drawer = this.isDrawer();
      this.app.dataset.sidebar = open ? "open" : "closed";
      this.el.inert = !open;
      this.toggleBtn.setAttribute("aria-expanded", String(open));
      this.toggleBtn.setAttribute("aria-label", t(open ? "closeMenu" : "openMenu"));
      this.scrim.hidden = !(open && drawer);

      ["topbar", "stage", "navbar"].forEach(function (cls) {
        var node = document.querySelector("." + cls);
        if (node) node.inert = open && drawer;
      });

      if (this.releaseTrap) { this.releaseTrap(); this.releaseTrap = null; }
      if (open && drawer) {
        this.releaseTrap = U.trapFocus(this.el);
        var sel = this.tabs[CruCo.state.ui.tab] || this.tabs.toc;
        setTimeout(function () { sel.focus(); }, 60);
      } else if (!open && opts.returnFocus) {
        this.toggleBtn.focus();
      }

      if (!drawer && !opts.silent) {
        CruCo.state.ui.sidebar = open ? "open" : "closed";
        CruCo.state.sync();
      }
    },

    selectTab: function (id, focus) {
      var self = this;
      TABS.forEach(function (tab) {
        var on = tab.id === id;
        self.tabs[tab.id].setAttribute("aria-selected", String(on));
        self.tabs[tab.id].setAttribute("tabindex", on ? "0" : "-1");
        self.panels[tab.id].hidden = !on;
      });
      if (focus) this.tabs[id].focus();
      if (CruCo.state.ui.tab !== id) {
        CruCo.state.ui.tab = id;
        if (CruCo.lms && CruCo.lms.api) CruCo.state.sync();
      }
    },

    onTabKey: function (e) {
      var ids = TABS.map(function (tb) { return tb.id; });
      var i = ids.indexOf(CruCo.state.ui.tab);
      var next = null;
      if (e.key === "ArrowRight") next = (i + 1) % ids.length;
      else if (e.key === "ArrowLeft") next = (i - 1 + ids.length) % ids.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = ids.length - 1;
      if (next === null) return;
      e.preventDefault();
      this.selectTab(ids[next], true);
    },

    // ---- Índice: módulo -> punto -> lecciones --------------------------------
    // Client 2026-09-18: the menu mirrors the approved table of contents and
    // stops at the lesson — a link per screen would mean ~195 rows once the 19
    // lessons are in. The author still gets the screen list in the editor.
    buildToc: function (panel) {
      var self = this;
      var C = CruCo.course;
      var editorOn = !!(CruCo.editor && CruCo.editor.active);
      if (!C.modules.length) {
        panel.appendChild(h("p", { class: "empty-note", text: t("emptyBody") }));
        return;
      }
      var nav = h("nav", { class: "toc", attrs: { "aria-label": t("tabModules") } });
      var byId = {};
      C.modules.forEach(function (m) { byId[m.id] = m; });

      // Client 2026-09-23: the menu is the approved table of contents, whole.
      // What is produced is a link; what is still to come is listed and dimmed,
      // so the learner sees where each lesson sits. Without a map (a single
      // lesson under review, say) the produced lessons are the map.
      var map = CruCo.courseMap;
      if (!map || !map.length) {
        map = [];
        var seen = {};
        C.modules.forEach(function (m) {
          var g = m.group || "m";
          if (!seen[g]) { seen[g] = { title: m.groupTitle || "", items: [] }; map.push(seen[g]); }
          seen[g].items.push({ title: m.title, lesson: m.id });
        });
      }

      // a, b, c… for the points of a numbered module; i, ii, iii below them
      function letter(i) { return String.fromCharCode(97 + (i % 26)) + "."; }
      function roman(i) {
        return ["i.", "ii.", "iii.", "iv.", "v.", "vi.", "vii.", "viii.", "ix.", "x."][i] || (i + 1) + ".";
      }

      function marker(level, index, numbered) {
        if (level === 0) return numbered ? numbered + "." : null;
        if (!numbered) return null;                   // the intro module bullets
        return level === 1 ? letter(index) : roman(index);
      }

      /** A produced lesson: the row that opens it and tracks its progress. */
      function lessonRow(mod, label, num) {
        var status = h("span", { class: "toc__status", attrs: { "aria-hidden": "true" } });
        var sr = h("span", { class: "visually-hidden" });
        var count = h("span", { class: "toc__module-count", attrs: { "aria-hidden": "true" } });
        var countSr = h("span", { class: "visually-hidden" });
        var listId = U.uid("toc-list");
        var first = mod.screens[0];

        var head = h("button", {
          class: "toc__module-head",
          attrs: { type: "button" },
          dataset: { screenId: first ? first.id : null }
        },
          status,
          num ? h("span", { class: "toc__module-num toc__module-num--point",
                            attrs: { "aria-hidden": "true" }, text: num }) : null,
          h("span", { class: "toc__module-title" },
            mod.intro ? null : h("span", { class: "visually-hidden", text: t("moduleLabel", { n: mod.lesson }) + ": " }),
            label || U.plain(mod.title), countSr, sr),
          count);

        head.addEventListener("click", function () {
          if (!first) return;
          CruCo.player.goTo(first.id);
          if (self.isDrawer()) self.setOpen(false, { returnFocus: false });
        });

        // Author only: the screens of the lesson, to jump straight to one.
        var list = h("ol", { class: "toc__screens", attrs: { id: listId }, hidden: !editorOn });
        if (editorOn) {
          head.setAttribute("aria-controls", listId);
          mod.screens.forEach(function (screen) {
            var sStatus = h("span", { class: "toc__status", attrs: { "aria-hidden": "true" } });
            var sSr = h("span", { class: "visually-hidden" });
            var lbl = C.labelOf(screen) ||
              t("screenCounter", { n: screen.indexInModule + 1, total: screen.module.screens.length });
            var btn = h("button", { class: "toc__screen", attrs: { type: "button" }, dataset: { screenId: screen.id } },
              sStatus,
              h("span", { class: "toc__num", text: screen.number }),
              h("span", { class: "toc__label" }, lbl, sSr));
            btn.addEventListener("click", function () {
              CruCo.player.goTo(screen.id);
              if (self.isDrawer()) self.setOpen(false, { returnFocus: false });
            });
            self.toc[screen.id] = { btn: btn, status: sStatus, sr: sSr };
            list.appendChild(h("li", null, btn));
          });
        }

        var section = h("section", { class: "toc__module" }, head, list);
        self.modules[mod.id] = { section: section, head: head, list: list, count: count,
                                 countSr: countSr, status: status, sr: sr, first: first };
        return section;
      }

      /** Not produced yet: listed, so the map is complete, but not a link. */
      function pendingRow(label, num, level) {
        return h("p", { class: "toc__soon toc__soon--l" + level },
          num ? h("span", { class: "toc__soon-num", attrs: { "aria-hidden": "true" }, text: num }) : null,
          h("span", { class: "toc__soon-title" }, label,
            h("span", { class: "visually-hidden", text: " (" + t("soon") + ")" })));
      }

      function render(node, level, index, numbered, into) {
        var num = marker(level, index, numbered);
        var mod = node.lesson && byId[node.lesson];
        if (level === 0) {
          into.appendChild(h("h3", { class: "toc__group" },
            node.number ? h("span", { class: "toc__group-num", text: node.number + "." }) : null,
            h("span", { text: node.title })));
        } else if (mod) {
          into.appendChild(lessonRow(mod, node.title, num));
        } else if (node.items && node.items.length) {
          into.appendChild(h("h4", { class: "toc__point toc__point--l" + level },
            num ? h("span", { class: "toc__point-num", text: num }) : null,
            h("span", { text: node.title })));
        } else {
          into.appendChild(pendingRow(node.title, num, level));
        }
        (node.items || []).forEach(function (child, i) {
          render(child, level + 1, i, node.number || (level > 0 && numbered), into);
        });
      }

      map.forEach(function (module) { render(module, 0, 0, module.number, nav); });
      panel.appendChild(nav);
    },

    setCollapsed: function (moduleId, collapsed) {
      var m = this.modules[moduleId];
      if (!m) return;
      m.head.setAttribute("aria-expanded", String(!collapsed));
      m.list.hidden = collapsed;
      CruCo.state.ui.collapsed[moduleId] = collapsed;
      CruCo.state.sync();
    },

    /** Updates statuses in place (keeps focus and scroll position). */
    refresh: function () {
      var self = this;
      var C = CruCo.course;
      var S = CruCo.state;
      C.modules.forEach(function (mod) {
        var m = self.modules[mod.id];
        if (!m) return;
        var done = mod.screens.filter(function (s) { return S.isScreenDone(s); }).length;
        m.count.textContent = done + "/" + mod.screens.length;
        m.countSr.textContent = ". " + t("moduleProgress", { done: done, total: mod.screens.length });
        m.section.dataset.done = String(S.isModuleDone(mod));

        var reachable = !m.first || S.isReachable(m.first);
        var state = !reachable ? "locked" : (S.isModuleDone(mod) ? "done" : (done ? "pending" : "new"));
        m.head.dataset.status = state;
        m.head.disabled = !reachable;
        if (m.status) m.status.innerHTML = U.icon({ done: "checkCircle", pending: "pending", locked: "lock" }[state] || "circle");
        if (m.sr) m.sr.textContent = ", " + t({ done: "statusDone", pending: "statusPending", locked: "statusLocked" }[state] || "statusNew");
        var here = CruCo.course.screenById[S.current];
        if (here && here.module.id === mod.id) m.head.setAttribute("aria-current", "step");
        else m.head.removeAttribute("aria-current");
      });
      C.screens.forEach(function (screen) {
        var item = self.toc[screen.id];
        if (!item) return;
        var reachable = S.isReachable(screen);
        var status = reachable ? S.screenStatus(screen) : "locked";
        item.btn.dataset.status = status;
        item.btn.disabled = !reachable;
        if (S.current === screen.id) item.btn.setAttribute("aria-current", "step");
        else item.btn.removeAttribute("aria-current");
        item.status.innerHTML = U.icon({ done: "checkCircle", pending: "pending", locked: "lock" }[status] || "circle");
        item.sr.textContent = ", " + t({ done: "statusDone", pending: "statusPending", locked: "statusLocked" }[status] || "statusNew");
      });
    },

    /** Expands the current module and scrolls its entry into view. */
    revealCurrent: function () {
      var screen = CruCo.course.screenById[CruCo.state.current];
      if (!screen) return;
      var m = this.modules[screen.module.id];
      var item = this.toc[screen.id];
      var target = (item && item.btn) || (m && m.head);
      if (target && this.isOpen() && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ block: "nearest" });
      }
    },

    // ---- Glosario -------------------------------------------------------------------
    buildGlossary: function (panel) {
      var self = this;
      var C = CruCo.course;
      var inputId = U.uid("glossary-search");
      var input = h("input", { attrs: { id: inputId, type: "search", placeholder: t("glossaryPlaceholder"), autocomplete: "off" } });
      var count = h("p", { class: "glossary__count", attrs: { "aria-live": "polite" } });
      var list = h("dl", { class: "glossary__list" });
      var empty = h("p", { class: "empty-note", hidden: true });
      panel.appendChild(h("label", { class: "visually-hidden", attrs: { for: inputId }, text: t("glossarySearch") }));
      panel.appendChild(h("div", { class: "search" }, U.iconEl("search"), input));
      panel.appendChild(count);
      panel.appendChild(list);
      panel.appendChild(empty);

      if (!C.glossary.length) {
        input.disabled = true;
        count.hidden = true;
        empty.textContent = t("glossaryEmpty");
        empty.hidden = false;
        return;
      }

      function render() {
        var q = U.fold(input.value.trim());
        list.innerHTML = "";
        var items = C.glossary.filter(function (g) {
          return !q || U.fold(g.term + " " + U.plain(g.definition)).indexOf(q) !== -1;
        });
        items.forEach(function (g) {
          var dd = h("dd", null, U.prose(g.definition));
          if (g.screen && C.screenById[g.screen]) {
            var go = h("button", { class: "link-btn", attrs: { type: "button" } }, t("glossaryGoTo"), U.iconEl("chevronRight"));
            go.addEventListener("click", function () {
              CruCo.player.goTo(g.screen);
              if (self.isDrawer()) self.setOpen(false, { returnFocus: false });
            });
            dd.appendChild(go);
          }
          list.appendChild(h("div", { class: "glossary__item" }, h("dt", { html: highlight(g.term, q) }), dd));
        });
        count.textContent = items.length === 1 ? t("glossaryCountOne") : t("glossaryCount", { n: items.length });
        empty.hidden = items.length > 0;
        empty.textContent = items.length ? "" : t("glossaryNoResults", { q: input.value.trim() });
      }
      input.addEventListener("input", render);
      render();
    },

    // ---- Ayuda ----------------------------------------------------------------------
    buildHelp: function (panel) {
      var support = (CruCo.config && CruCo.config.SUPPORT) || {};
      var list = function (items) {
        return h("ul", null, (items || []).map(function (s) { return h("li", { html: U.mdInline(s) }); }));
      };
      panel.appendChild(h("section", { class: "help-section" },
        h("h3", { text: t("helpNavTitle") }), list(CruCo.strings.helpNavItems)));

      var rows = [];
      if (support.whatsapp) {
        rows.push([t("helpSupportWhatsapp"), h("a", {
          attrs: { href: "https://wa.me/" + String(support.whatsapp).replace(/\D/g, ""), target: "_blank", rel: "noopener" },
          text: support.whatsapp
        })]);
      }
      if (support.email) rows.push([t("helpSupportEmail"), h("a", { attrs: { href: "mailto:" + support.email }, text: support.email })]);
      if (support.phone) rows.push([t("helpSupportPhone"), h("a", { attrs: { href: "tel:" + String(support.phone).replace(/[^\d+]/g, "") }, text: support.phone })]);
      if (support.location) rows.push([t("helpSupportLocation"), support.location]);
      if (support.hours) rows.push([t("helpSupportHours"), support.hours]);
      if (support.url) rows.push([t("helpSupportUrl"), h("a", { attrs: { href: support.url, target: "_blank", rel: "noopener" }, text: support.url })]);
      if (rows.length) {
        var dl = h("dl", { class: "contact-list" });
        rows.forEach(function (r) { dl.appendChild(h("dt", { text: r[0] })); dl.appendChild(h("dd", null, r[1])); });
        panel.appendChild(h("section", { class: "help-section" },
          h("h3", { text: t("helpSupportTitle") }), h("p", { text: t("helpSupportIntro") }), dl));
      }

      panel.appendChild(h("section", { class: "help-section" },
        h("h3", { text: t("helpTechTitle") }), list(CruCo.strings.helpTechItems)));
    },

    // ---- Descargas ------------------------------------------------------------------
    buildDownloads: function (panel) {
      var items = CruCo.course.downloads;
      if (!items.length) {
        panel.appendChild(h("p", { class: "empty-note", text: t("downloadsEmpty") }));
        return;
      }
      panel.appendChild(h("p", { class: "glossary__count", text: t("downloadsIntro") }));
      items.forEach(function (d) {
        var driveId = U.getDriveFileId(d.file);
        var localCopy = driveId && CruCo.assetMap && CruCo.assetMap[driveId];
        var href = driveId ? (localCopy ? U.resolveAsset(localCopy) : d.file) : U.resolveAsset(d.file);
        var ext = (String(d.file).split(/[?#]/)[0].match(/\.([a-z0-9]{2,5})$/i) || [])[1];
        var meta = [d.description ? U.plain(d.description) : null, d.size, ext ? ext.toUpperCase() : null]
          .filter(Boolean).join(" · ");
        panel.appendChild(h("a", {
          class: "download",
          attrs: { href: href, download: /^https?:/i.test(href) ? null : "", target: "_blank", rel: "noopener" }
        },
          h("span", { class: "download__icon", html: U.icon("file") }),
          h("span", null,
            h("span", { class: "download__title", text: U.plain(d.title || d.file) }),
            meta ? h("span", { class: "download__meta", text: meta }) : null)));
      });
    }
  };

  CruCo.sidebar = sidebar;
})(window.CruCo = window.CruCo || {});
