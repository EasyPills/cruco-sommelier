/* =========================================================================
   layers.js — Storyline-style layers (modal popups) and hotspots
   -------------------------------------------------------------------------
   CruCo.layers.open({ title, body, actions, wide, dismissible, onClose })
     Accessible modal dialog: focus trap, Esc to close, focus returns to
     the trigger. `body` is a Node or markdown-lite text.
   layers   : { type:"layers", items:[{ label, title, text, image }] }
   hotspots : { type:"hotspots", image:{src,alt},
                spots:[{ x, y, label, title, text, image }] }   x/y in %
   ========================================================================= */
(function (CruCo) {
  "use strict";

  var U = CruCo.utils;
  var h = U.h;
  var t = U.t;
  CruCo.components = CruCo.components || {};

  var stack = [];

  function open(opts) {
    opts = opts || {};
    var returnFocus = document.activeElement;
    var titleId = U.uid("modal-title");
    var dismissible = opts.dismissible !== false;
    var app = document.querySelector(".app");

    var body = typeof opts.body === "string" ? U.prose(opts.body) : opts.body;
    var actions = (opts.actions || []).map(function (a) {
      var b = h("button", {
        class: "btn " + (a.primary ? "btn--primary" : "btn--secondary"),
        attrs: { type: "button" },
        text: a.label
      });
      b.addEventListener("click", function () { close(); if (a.onClick) a.onClick(); });
      return b;
    });

    var closeBtn = dismissible
      ? h("button", { class: "icon-btn modal__close", attrs: { type: "button", "aria-label": t("close") }, html: U.icon("close") })
      : null;

    var dialog = h("div", {
      class: "modal__dialog" + (opts.wide ? " modal__dialog--wide" : ""),
      attrs: { role: "dialog", "aria-modal": "true", "aria-labelledby": titleId }
    },
      closeBtn,
      h("h2", { class: "modal__title", attrs: { id: titleId, tabindex: "-1" }, html: U.mdInline(opts.title || "") }),
      h("div", { class: "modal__body" }, body),
      actions.length ? h("div", { class: "modal__actions" }, actions) : null
    );
    var backdrop = h("div", { class: "modal__backdrop" });
    var root = h("div", { class: "modal" }, backdrop, dialog);

    var release = U.trapFocus(dialog);
    function onKey(e) {
      if (e.key === "Escape" && dismissible) { e.stopPropagation(); close(); }
    }

    function close() {
      if (!root.parentNode) return;
      release();
      document.removeEventListener("keydown", onKey, true);
      root.parentNode.removeChild(root);
      stack.pop();
      if (app && !stack.length) app.inert = false;
      if (opts.onClose) opts.onClose();
      if (returnFocus && typeof returnFocus.focus === "function" && document.contains(returnFocus)) {
        returnFocus.focus();
      }
    }

    if (closeBtn) closeBtn.addEventListener("click", close);
    if (dismissible) backdrop.addEventListener("click", close);
    document.addEventListener("keydown", onKey, true);

    (document.getElementById("modal-root") || document.body).appendChild(root);
    stack.push(root);
    if (app) app.inert = true;          // background unreachable while the layer is open

    var focusTarget = opts.initialFocus === "action" && actions[0] ? actions[0] : dialog.querySelector(".modal__title");
    setTimeout(function () { focusTarget.focus(); }, 30);
    return { close: close, element: dialog };
  }

  CruCo.layers = { open: open, isOpen: function () { return stack.length > 0; } };

  function layerBody(item, path) {
    return h("div", null,
      item.image ? h("figure", { class: "figure" }, CruCo.media.createImage(item.image, path)) : null,
      item.text ? U.prose(item.text) : null
    );
  }

  // ---- Layer buttons ----------------------------------------------------------
  CruCo.components.layers = function (block, ctx) {
    var mem = ctx.memory;
    mem.seen = mem.seen || {};
    var root = h("div", { class: "layer-buttons" });
    (block.items || []).forEach(function (item, i) {
      var btn = h("button", {
        class: "btn btn--secondary",
        attrs: { type: "button", "aria-haspopup": "dialog" },
        dataset: { visited: String(!!mem.seen[i]) }
      }, U.iconEl("plus"), h("span", { html: U.mdInline(item.label || item.title) }));
      btn.addEventListener("click", function () {
        mem.seen[i] = true;
        btn.dataset.visited = "true";
        open({
          title: item.title || item.label,
          body: layerBody(item, ctx.path && ctx.path + "/items/" + i + "/image"),
          wide: !!item.image
        });
      });
      root.appendChild(btn);
    });
    return root;
  };

  // ---- Hotspots -------------------------------------------------------------------
  CruCo.components.hotspots = function (block, ctx) {
    var mem = ctx.memory;
    mem.seen = mem.seen || {};
    var canvas = h("div", { class: "hotspots__canvas" },
      CruCo.media.createImage(block.image || {}, ctx.path && ctx.path + "/image"));
    var spots = block.spots || [];

    spots.forEach(function (spot, i) {
      var label = U.plain(spot.label || spot.title || "");
      var btn = h("button", {
        class: "hotspot",
        attrs: {
          type: "button",
          "aria-haspopup": "dialog",
          "aria-label": t("hotspotLabel", { n: i + 1, label: label }) + (mem.seen[i] ? " (" + t("visited") + ")" : "")
        },
        dataset: { visited: String(!!mem.seen[i]) },
        html: mem.seen[i] ? U.icon("check") : String(i + 1)
      });
      btn.style.left = Math.max(0, Math.min(100, Number(spot.x) || 0)) + "%";
      btn.style.top = Math.max(0, Math.min(100, Number(spot.y) || 0)) + "%";
      btn.addEventListener("click", function () {
        if (!mem.seen[i]) {
          mem.seen[i] = true;
          btn.dataset.visited = "true";
          btn.innerHTML = U.icon("check");
          btn.setAttribute("aria-label", t("hotspotLabel", { n: i + 1, label: label }) + " (" + t("visited") + ")");
        }
        open({
          title: spot.title || spot.label,
          body: layerBody(spot, ctx.path && ctx.path + "/spots/" + i + "/image"),
          wide: !!spot.image
        });
      });
      canvas.appendChild(btn);
    });

    return h("div", { class: "hotspots block--wide" },
      canvas,
      h("p", { class: "hotspots__legend", text: block.legend ? U.plain(block.legend) : t("hotspotLegend") })
    );
  };
})(window.CruCo = window.CruCo || {});
