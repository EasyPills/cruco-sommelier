/* =========================================================================
   content.js — static content blocks
   -------------------------------------------------------------------------
   text      : { type:"text", text }                       markdown-lite
   heading   : { type:"heading", text, level: 2|3 }
   callout   : { type:"callout", variant:"key"|"info"|"quote"|"whatsapp", title, text }
               "key" renders the storyboard's "Key message icon".
   cards     : { type:"cards", columns: 2|3, items:[{ title, text, image:{src,alt} }] }
   reactions : { type:"reactions", emojis:[...] }
               Storyboard (Screen 9): "a sort of emoji reaction to the screen
               (similar to a reaction on a teams call)". Decorative only.
   ========================================================================= */
(function (CruCo) {
  "use strict";

  var U = CruCo.utils;
  var h = U.h;
  CruCo.components = CruCo.components || {};

  /** `"variant": "hint"` — an instruction ("Haz clic sobre los botones +"),
      smaller and quieter than the content it introduces. */
  CruCo.components.text = function (block) {
    var node = U.prose(block.text);
    if (block.variant) node.classList.add("prose--" + block.variant);
    return node;
  };

  CruCo.components.heading = function (block) {
    var level = block.level === 3 ? "h3" : "h2";
    return h(level, { html: U.mdInline(block.text) });
  };

  var CALLOUT_ICON = { info: "info", key: "key", whatsapp: "whatsapp", quote: null, objective: null };

  CruCo.components.callout = function (block) {
    var variant = block.variant || "key";
    var iconName = Object.prototype.hasOwnProperty.call(CALLOUT_ICON, variant) ? CALLOUT_ICON[variant] : "bulb";
    // `band`: gold highlight box that bleeds off the edge (client 2026-09-15).
    return h("aside", {
      class: "callout callout--" + variant +
        (block.band ? " callout--band" : "") +
        (block.outline ? " callout--outline" : "") +
        (block.wide ? " block--wide" : "")
    },
      iconName ? U.iconEl(iconName) : null,
      h("div", null,
        block.title ? h("p", { class: "callout__title", html: U.mdInline(block.title) }) : null,
        U.prose(block.text)
      )
    );
  };

  /**
   * banner : { type:"banner", alt:"…" }
   * The CruCo brand ground with the white lockup centred, 3:1 — the hero of
   * the course's opening screen (client 2026-09-21).
   */
  /** spacer : { type:"spacer" } — deliberate breathing room. */
  /** A hairline that closes one part of a screen before the next (ML03
      screen 5: the pillars, then the message). */
  CruCo.components.divider = function () {
    return h("hr", { class: "divider", attrs: { "aria-hidden": "true" } });
  };

  CruCo.components.spacer = function () {
    return h("div", { class: "spacer", attrs: { "aria-hidden": "true" } });
  };

  CruCo.components.banner = function (block) {
    var alt = U.plain(block.alt || "CruCo. Wine Studio");
    return h("div", { class: "banner brand-bg", attrs: { role: "img", "aria-label": alt } },
      h("img", {
        class: "banner__logo",
        attrs: { src: U.resolveAsset(block.src || "assets/images/brand/cruco-logo-horizontal-blanco.svg"),
                 alt: "", "aria-hidden": "true" }
      }));
  };

  /**
   * Cards, optionally expandable: `"expandable": true` puts each card's text
   * behind a "+" the learner opens (ML03 screen 4 — image on top, title over
   * it, description on click). `note` prints a line under the grid, for the
   * legal footnote the CruCo bottles need.
   */
  CruCo.components.cards = function (block, ctx) {
    var path = ctx && ctx.path;
    var expandable = !!block.expandable;
    var list = h("ul", {
      class: "cards" + (expandable ? " cards--expandable" : "") +
        (block.variant ? " cards--" + block.variant : ""),
      attrs: { role: "list", "data-columns": block.columns ? String(block.columns) : null }
    });
    list.style.listStyle = "none";
    list.style.padding = "0";
    list.style.margin = "0";
    (block.items || []).forEach(function (item, i) {
      var media = item.image
        ? h("figure", { class: "figure" }, CruCo.media.createImage(item.image, path && path + "/cards/" + i + "/image"))
        : null;
      if (!expandable || !item.text) {
        var plain = h("li", { class: "card" }, media,
          item.title ? h("h3", { class: "card__title", html: U.mdInline(item.title) }) : null,
          item.text ? U.prose(item.text) : null);
        // A card can wait for its cue, like a tab item: ML03 screen 3 brings
        // the five roles back one after another while the VO retells them.
        list.appendChild(item.reveal ? CruCo.renderer.revealLater(plain, item.reveal) : plain);
        return;
      }
      var bodyId = U.uid("card-body");
      var body = h("div", { class: "card__body", attrs: { id: bodyId, hidden: "hidden" } }, U.prose(item.text));
      var trigger = h("button", {
        class: "card__toggle",
        attrs: { type: "button", "aria-expanded": "false", "aria-controls": bodyId }
      },
        h("span", { class: "card__title", html: U.mdInline(item.title || "") }),
        h("span", { class: "card__sign", attrs: { "aria-hidden": "true" }, text: "+" }));
      trigger.addEventListener("click", function () {
        var open = trigger.getAttribute("aria-expanded") === "true";
        trigger.setAttribute("aria-expanded", String(!open));
        body.hidden = open;
        card.dataset.open = String(!open);
      });
      var card = h("li", { class: "card card--expandable", dataset: { open: "false" } },
        h("div", { class: "card__head" }, media, trigger), body);
      list.appendChild(card);
    });
    if (block.note) {
      return h("div", { class: "cards-wrap" }, list,
        h("p", { class: "cards__note", html: U.mdInline(block.note) }));
    }
    return list;
  };

  /* Small icon + label chip, for storyboard lines like "Icon: WhatsApp icon". */
  CruCo.components.badge = function (block) {
    var icon = block.icon || "info";
    return h("p", { class: "badge-chip badge-chip--" + icon },
      U.iconEl(icon),
      block.text ? h("span", { text: U.plain(block.text) }) : null);
  };

  /* Emoji reactions that float up once, like a video-call reaction.
     Decorative: hidden from assistive tech, still (no motion) when the
     learner asks for reduced motion. */
  CruCo.components.reactions = function (block) {
    var emojis = (block.emojis && block.emojis.length ? block.emojis : ["👏", "🎉", "👍", "⭐"]).slice(0, 8);
    var root = h("div", { class: "reactions", attrs: { "aria-hidden": "true" } });
    emojis.forEach(function (emoji, i) {
      var span = h("span", { class: "reactions__item", text: emoji });
      span.style.setProperty("--i", String(i));
      root.appendChild(span);
    });
    return root;
  };
})(window.CruCo = window.CruCo || {});
