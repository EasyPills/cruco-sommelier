/* =========================================================================
   disclosure.js — accordion, tabs, flip cards, timeline
   -------------------------------------------------------------------------
   accordion : { type:"accordion", multiple:false, items:[{ title, text, image }] }
   tabs      : { type:"tabs", items:[{ title, text, image }] }
   flipcards : { type:"flipcards", variant:"grid"|"timeline",
                 cards:[{ front, frontText, back, image }] }
               variant "timeline" = the storyboard's clickable era line:
               the image is the front, the era name is revealed on the back,
               and a connector line joins the steps.
   Open/selected/flipped states survive revisits during the session
   (ctx.memory). Keyboard: WAI-ARIA Authoring Practices patterns.
   ========================================================================= */
(function (CruCo) {
  "use strict";

  var U = CruCo.utils;
  var h = U.h;
  var t = U.t;
  CruCo.components = CruCo.components || {};

  function itemBody(item, path) {
    return [
      item.text ? U.prose(item.text) : null,
      item.image ? h("figure", { class: "figure" }, CruCo.media.createImage(item.image, path)) : null
    ];
  }

  // ---- Accordion ----------------------------------------------------------------
  CruCo.components.accordion = function (block, ctx) {
    var mem = ctx.memory;
    mem.open = mem.open || {};
    var root = h("div", { class: "accordion" });
    var triggers = [];

    (block.items || []).forEach(function (item, i) {
      var btnId = U.uid("acc-btn");
      var panelId = U.uid("acc-panel");
      var open = !!mem.open[i];
      var btn = h("button", {
        class: "accordion__trigger",
        attrs: { type: "button", id: btnId, "aria-expanded": String(open), "aria-controls": panelId }
      }, h("span", { html: U.mdInline(item.title) }), U.iconEl("chevronDown"));
      var panel = h("div", {
        class: "accordion__panel",
        attrs: { id: panelId, role: "region", "aria-labelledby": btnId },
        hidden: !open
      }, itemBody(item, ctx.path && ctx.path + "/items/" + i + "/image"));

      btn.addEventListener("click", function () {
        var willOpen = btn.getAttribute("aria-expanded") !== "true";
        if (willOpen && !block.multiple) {
          triggers.forEach(function (other, j) {
            if (other.btn !== btn && other.btn.getAttribute("aria-expanded") === "true") {
              other.btn.setAttribute("aria-expanded", "false");
              other.panel.hidden = true;
              mem.open[j] = false;
            }
          });
        }
        btn.setAttribute("aria-expanded", String(willOpen));
        panel.hidden = !willOpen;
        mem.open[i] = willOpen;
      });

      triggers.push({ btn: btn, panel: panel });
      root.appendChild(h("div", { class: "accordion__item" },
        h("h3", { class: "accordion__heading" }, btn), panel));
    });
    return root;
  };

  // ---- Tabs -----------------------------------------------------------------------
  CruCo.components.tabs = function (block, ctx) {
    var mem = ctx.memory;
    var items = block.items || [];
    var selected = Math.min(mem.selected || 0, Math.max(items.length - 1, 0));
    var tablist = h("div", { class: "tabs__list", attrs: { role: "tablist" } });
    // ML02 screen 5 (client 2026-09-16): `vertical` stacks the icons in a rail
    // on the left and shows the selected panel beside them.
    var root = h("div", {
      class: "tabs block--wide" + (block.vertical ? " tabs--vertical" : "") +
        (block.stacked ? " tabs--stacked" : "") +
        // Client 2026-09-23: `"dividers": false` drops the grey rules between
        // the items, which on ML03 screen 5 only added noise.
        (block.dividers === false ? " tabs--no-dividers" : "")
    }, block.hint ? h("p", { class: "block-hint tabs__hint", text: U.plain(block.hint) }) : null, tablist);
    var tabs = [];
    var panels = [];

    items.forEach(function (item, i) {
      var tabId = U.uid("tab");
      var panelId = U.uid("tabpanel");
      // ML02 screen 5: "all icons aligned in tabs" — an item may carry an
      // `icon` name from the brand set, shown above its label.
      var tab = h("button", {
        class: "tabs__tab" + (item.icon ? " tabs__tab--icon" : ""),
        attrs: { type: "button", role: "tab", id: tabId, "aria-controls": panelId,
                 "aria-selected": String(i === selected), tabindex: i === selected ? "0" : "-1" }
      },
        item.icon ? U.iconEl(item.icon) : null,
        h("span", { html: U.mdInline(item.title) }));
      var panel = h("div", {
        class: "tabs__panel",
        attrs: { role: "tabpanel", id: panelId, "aria-labelledby": tabId, tabindex: "0" },
        hidden: i !== selected
      }, itemBody(item, ctx.path && ctx.path + "/items/" + i + "/image"));
      tab.addEventListener("click", function () { select(i, false); });
      // ML02 screen 5: "Icons appear when the VO mentions them".
      if (item.reveal && CruCo.renderer) CruCo.renderer.revealLater(tab, item.reveal);
      tabs.push(tab);
      panels.push(panel);
      tablist.appendChild(tab);
      root.appendChild(panel);
    });

    // The text area waits for the first item to be named, so the description
    // never shows before its tab exists.
    var firstReveal = null;
    items.forEach(function (item) {
      if (item.reveal && typeof item.reveal.at === "number" &&
          (!firstReveal || item.reveal.at < firstReveal.at)) firstReveal = item.reveal;
    });
    if (firstReveal && CruCo.renderer) {
      panels.forEach(function (pn) { CruCo.renderer.revealLater(pn, { at: firstReveal.at, effect: "fade" }); });
    }

    function select(i, focus) {
      tabs.forEach(function (tb, j) {
        tb.setAttribute("aria-selected", String(j === i));
        tb.setAttribute("tabindex", j === i ? "0" : "-1");
        panels[j].hidden = j !== i;
      });
      mem.selected = i;
      if (focus) tabs[i].focus();
    }

    tablist.addEventListener("keydown", function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var n = tabs.length;
      var next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % n;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + n) % n;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = n - 1;
      if (next === null) return;
      e.preventDefault();
      select(next, true);
    });
    return root;
  };

  // ---- Carousel (ML02 screen 4: swipeable fields of action) ----------------
  /**
   * { type:"carousel", banner:"Campos de acción:", items:[{ title, text, image }],
   *   hint:"…", completeAudio:{ src } }   // completeAudio: once every slide has been seen
   * The banner stays put while the slides move. Swiping is native horizontal
   * scrolling with scroll-snap, so it works with a finger, a trackpad, the
   * arrow buttons and the keyboard.
   */
  CruCo.components.carousel = function (block, ctx) {
    var mem = ctx.memory;
    var items = block.items || [];
    var at = Math.min(mem.at || 0, Math.max(items.length - 1, 0));
    var trackId = U.uid("carousel");
    var track = h("div", {
      class: "carousel__track",
      attrs: { id: trackId, role: "group", "aria-label": t("carouselLabel"), tabindex: "0" }
    });
    var dots = h("div", { class: "carousel__dots", attrs: { role: "tablist", "aria-label": t("carouselLabel") } });
    var slides = [];
    var buttons = [];

    items.forEach(function (item, i) {
      var slide = h("div", {
        class: "carousel__slide",
        attrs: { role: "group", "aria-roledescription": "slide",
                 "aria-label": t("carouselSlide", { n: i + 1, total: items.length }) }
      },
        item.image ? h("figure", { class: "figure carousel__figure" },
          CruCo.media.createImage(item.image, ctx.path && ctx.path + "/items/" + i + "/image")) : null,
        h("div", { class: "carousel__body" },
          item.title ? h("h3", { class: "carousel__title", html: U.mdInline(item.title) }) : null,
          item.text ? U.prose(item.text) : null));
      slides.push(slide);
      track.appendChild(slide);

      var dot = h("button", {
        class: "carousel__dot",
        attrs: { type: "button", role: "tab", "aria-selected": String(i === at),
                 "aria-label": t("carouselGoTo", { n: i + 1, title: U.plain(item.title || "") }) }
      });
      dot.addEventListener("click", function () { go(i); });
      buttons.push(dot);
      dots.appendChild(dot);
    });

    var prev = h("button", {
      class: "icon-btn carousel__arrow",
      attrs: { type: "button", "aria-label": t("carouselPrev"), "aria-controls": trackId },
      html: U.icon("chevronLeft")
    });
    var next = h("button", {
      class: "icon-btn carousel__arrow",
      attrs: { type: "button", "aria-label": t("carouselNext"), "aria-controls": trackId },
      html: U.icon("chevronRight")
    });
    prev.addEventListener("click", function () { go(at - 1); });
    next.addEventListener("click", function () { go(at + 1); });

    // ML02 screen 4 (storyboard v2): "Audio 2 is heard after the text has
    // completely been displayed". It plays once every field has been on
    // screen and the screen narration (Audio 1) is over. The element lives in
    // the stage, so leaving the screen cuts it like any other audio.
    var seen = {};
    var completeAudio = null;
    var completePlayed = false;
    var waitingVo = false;
    if (block.completeAudio && block.completeAudio.src) {
      completeAudio = h("audio", {
        class: "carousel__complete-audio",
        attrs: { preload: "auto", src: U.resolveAsset(block.completeAudio.src) }
      });
    }
    function maybeCompleteAudio() {
      if (!completeAudio || completePlayed) return;
      if (items.some(function (_, i) { return !seen[i]; })) return;
      var vo = CruCo.media.screenAudio;
      if (vo && !vo.paused && !vo.ended) {
        if (!waitingVo) {                    // listen once, however often sync() runs
          waitingVo = true;
          vo.addEventListener("ended", function () { waitingVo = false; maybeCompleteAudio(); }, { once: true });
        }
        return;
      }
      completePlayed = true;
      try {
        var pr = completeAudio.play();
        if (pr && pr.catch) pr.catch(function () { completePlayed = false; });
      } catch (e) { completePlayed = false; }
    }

    function sync() {
      buttons.forEach(function (b, i) { b.setAttribute("aria-selected", String(i === at)); });
      prev.disabled = at <= 0;
      next.disabled = at >= items.length - 1;
      mem.at = at;
      seen[at] = true;
      maybeCompleteAudio();
    }

    function go(i) {
      at = Math.max(0, Math.min(i, items.length - 1));
      if (slides[at]) {
        track.scrollTo({ left: slides[at].offsetLeft - track.offsetLeft, behavior: "smooth" });
      }
      sync();
    }

    // Swiping moves the highlighted dot without fighting the native scroll.
    var tick = null;
    track.addEventListener("scroll", function () {
      if (tick) return;
      tick = setTimeout(function () {
        tick = null;
        var mid = track.scrollLeft + track.clientWidth / 2;
        var nearest = 0;
        slides.forEach(function (sl, i) {
          var c = sl.offsetLeft - track.offsetLeft + sl.offsetWidth / 2;
          if (Math.abs(c - mid) < Math.abs(slides[nearest].offsetLeft - track.offsetLeft + slides[nearest].offsetWidth / 2 - mid)) nearest = i;
        });
        at = nearest;
        sync();
      }, 90);
    });

    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(at + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(at - 1); }
      else if (e.key === "Home") { e.preventDefault(); go(0); }
      else if (e.key === "End") { e.preventDefault(); go(items.length - 1); }
    });

    sync();
    if (at) setTimeout(function () { go(at); }, 0);

    return h("div", { class: "carousel block--wide" },
      block.banner ? h("p", { class: "carousel__banner", html: U.mdInline(block.banner) }) : null,
      // Client 2026-09-18: instruction right under the banner.
      block.hint ? h("p", { class: "block-hint", text: U.plain(block.hint) }) : null,
      h("div", { class: "carousel__viewport" }, track),
      h("div", { class: "carousel__nav" }, prev, dots, next),
      completeAudio);
  };

  // ---- Flip cards (grid + timeline) ----------------------------------------
  CruCo.components.flipcards = function (block, ctx) {
    var mem = ctx.memory;
    mem.flipped = mem.flipped || {};
    mem.seen = mem.seen || {};
    var timeline = block.variant === "timeline";
    var list = h("ul", {
      class: (timeline ? "flipcards flipcards--timeline" : "flipcards") + " block--wide",
      attrs: { role: "list" }
    });
    list.style.listStyle = "none";
    list.style.padding = "0";
    list.style.margin = "0";

    (block.cards || []).forEach(function (card, i) {
      var backId = U.uid("flip-back");
      var frontTitle = U.plain(card.front || card.back || "");
      var flipped = !!mem.flipped[i];
      var imagePath = ctx.path && ctx.path + "/cards/" + i + "/image";

      var front = h("div", { class: "flipcard__face flipcard__front", attrs: { "aria-hidden": String(flipped) } },
        card.image ? CruCo.media.createImage(card.image, imagePath) : null,
        card.front ? h("p", { class: "flipcard__title", html: U.mdInline(card.front) }) : null,
        card.frontText ? U.prose(card.frontText) : null,
        // Client 2026-09-15: no "Girar tarjeta" hint on the timeline.
        timeline ? null : h("span", { class: "flipcard__hint" }, U.iconEl("rotate"), t("flipHintFront"))
      );
      var back = h("div", { class: "flipcard__face flipcard__back", attrs: { id: backId, "aria-hidden": String(!flipped) } },
        U.prose(card.back),
        timeline ? null : h("span", { class: "flipcard__hint" }, U.iconEl("rotate"), t("flipHintBack"))
      );
      var btn = h("button", {
        class: "flipcard__btn",
        attrs: { type: "button", "aria-expanded": String(flipped), "aria-controls": backId }
      }, h("span", {
        class: "visually-hidden",
        text: frontTitle + ". " + t(timeline ? "timelineReveal" : "flipHintFront")
      }));
      var dot = h("span", { class: "visited-dot", html: U.icon("check"), hidden: !mem.seen[i] });
      var li = h("li", { class: "flipcard", dataset: { flipped: String(flipped) } },
        timeline ? h("span", { class: "flipcard__step", attrs: { "aria-hidden": "true" }, text: String(i + 1) }) : null,
        btn, h("div", { class: "flipcard__inner" }, front, back), dot);

      btn.addEventListener("click", function () {
        var now = li.dataset.flipped !== "true";
        li.dataset.flipped = String(now);
        btn.setAttribute("aria-expanded", String(now));
        front.setAttribute("aria-hidden", String(now));
        back.setAttribute("aria-hidden", String(!now));
        mem.flipped[i] = now;
        if (now) { mem.seen[i] = true; dot.hidden = false; }
      });
      list.appendChild(li);
    });

    if (!timeline) return list;
    // Client 2026-09-15: the instruction goes ABOVE the images.
    return h("div", { class: "timeline block--wide" },
      h("p", { class: "timeline__hint", text: block.legend ? U.plain(block.legend) : t("timelineHint") }),
      list);
  };
})(window.CruCo = window.CruCo || {});
