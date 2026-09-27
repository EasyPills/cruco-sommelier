/* =========================================================================
   renderer.js — turns a screen object into DOM
   -------------------------------------------------------------------------
   Screen schema (content/*.js):
   {
     id: "2.3", title, subtitle, eyebrow, duration,
     layout: "standard" | "split" | "cover" | "centered",
     asideFirst: false,                 // split: media column first
     background: { src, alt, layout } | { brand: true },   // cover: "full" | "side"
     avatar: { src, alt },              // round presenter portrait, above the title
     audio: { src, transcript, hidden }, // VO (`hidden`: plays with no bar)
     blocks: [ { type, ..., region: "aside" (split only),
                 // type "screenAudio" = place the screen's VO bar here
                 //   instead of directly under the title
                 wide: true,          // ignore the reading measure
                 reveal: { at|delay|afterAudio, effect, duration } } ],
     storyboard: { screen, objective, brief, visualRefs, aiPrompt, notes }
   }
   The storyboard object is traceability data: never rendered (objective
   becomes an HTML comment; debug mode shows it in the debug panel).

   Timed reveals (Storyline-style triggers). A block can appear:
     { "reveal": { "at": 5.7 } }        when the screen VO reaches 5.7 s
     { "reveal": { "afterAudio": true } } when the VO ends
     { "reveal": { "delay": 1.2 } }     1.2 s after the screen opens
   `effect`: "write" (wipe, default for text) | "fade" | "rise" | "pulse".
   Safety net: if the VO never starts (autoplay blocked, missing file) the
   block is revealed anyway, so content is never lost.
   ========================================================================= */
(function (CruCo) {
  "use strict";

  var U = CruCo.utils;
  var h = U.h;
  var t = U.t;
  var LAYOUTS = ["standard", "split", "cover", "centered"];
  var MEDIA_KIND = { image: "image", video: "video", audio: "audio" };
  var cleanups = [];
  var REVEAL_MAX_WAIT = 8000;       // ms before a waiting block is shown anyway

  function transitionsOn() {
    return !(CruCo.config && CruCo.config.TRANSITIONS === false);
  }

  /** True when a block asks for the full stage width (`"wide": true`). */
  function hasWideBlock(screen) {
    return (screen.blocks || []).some(function (b, i) {
      return b && b.wide && !CruCo.isDeleted(screen.id + "#" + i);
    });
  }

  function comment(label, text) {
    return document.createComment(" " + label + ": " + String(text).replace(/--/g, "- -") + " ");
  }

  var renderer = {
    /** Components register teardown work (e.g. pause media) for screen exit. */
    onCleanup: function (fn) { cleanups.push(fn); },

    cleanup: function () {
      cleanups.splice(0).forEach(function (fn) { try { fn(); } catch (e) { /* ignore */ } });
      CruCo.media.resetScreenAudio();
    },

    renderBlock: function (block, screen, index) {
      var type = block && block.type;
      var key = screen.id + "#" + index;
      var editorOn = !!(CruCo.editor && CruCo.editor.active);
      var name = U.pieceName(type);

      // Deleted in the editor: gone for learners, restorable for the author.
      if (CruCo.isDeleted(key)) {
        return editorOn ? CruCo.editor.deletedChip(key, name) : null;
      }

      var comp = CruCo.components && CruCo.components[type];
      if (!comp) {
        U.warn("Unknown block type '" + type + "' on screen " + screen.id);
        return CruCo.player && CruCo.player.debug
          ? h("div", { class: "dev-marker" }, h("strong", { text: "Bloque desconocido" }), String(type))
          : null;
      }
      var memory = CruCo.state.memory[key] = CruCo.state.memory[key] || {};
      var node;
      try {
        node = comp(block, { screen: screen, index: index, key: key, path: key, memory: memory });
      } catch (e) {
        console.error("[CruCo] Block '" + type + "' on screen " + screen.id + " failed to render:", e);
        return null;
      }
      if (!node) return null;

      // A block of the first scene leaves when another takes the screen over
      // (ML03 screen 3). It may have no reveal of its own, so the mark goes on
      // the node itself, not on the reveal wrapper.
      if (block.stepsAside && node.classList) node.classList.add("block--steps-aside");

      if (block.reveal) node = this.wrapReveal(node, block.reveal, block);
      else node = this.stagger(node, index + 1);

      if (editorOn) {
        node = CruCo.editor.frame(node, {
          path: key,
          kind: MEDIA_KIND[type],          // image/video/audio → also editable
          name: name,
          data: block
        });
      }
      return node;
    },

    /** Storyline-like timeline feel: blocks enter one after the other. */
    stagger: function (node, order) {
      if (!node || node.nodeType !== 1 || !transitionsOn()) return node;
      node.classList.add("block-enter");
      node.style.setProperty("--i", String(order));
      return node;
    },

    /** Hides a block until its trigger fires (see header). */
    wrapReveal: function (node, reveal, block) {
      var effect = reveal.effect || "write";
      // A wide block stays wide once wrapped: otherwise the wrapper, not the
      // block, is the one the layout measures (client 2026-09-15).
      // `"takesOver": true` (client 2026-09-21, the welcome video): the block
      // takes no room before its turn and the screen's hero steps aside for it,
      // so the banner does not decide how big the video window can be.
      var wrap = h("div", {
        class: "reveal reveal--" + effect +
          (block && block.wide ? " block--wide" : "") +
          (block && block.takesOver ? " reveal--takeover" : "") +
          // `"collapsed": true` on the reveal: the block keeps no room while it
          // waits. Without it a late block leaves a hole on the screen — on a
          // phone, a long one (client 2026-09-21, ML03 screen 5).
          (block && block.reveal && block.reveal.collapsed ? " reveal--collapsed" : "") +
          (block && block.stepsAside ? " block--steps-aside" : ""),
        dataset: { revealState: "hidden" },
        attrs: { "aria-hidden": "true" }
      }, node);
      // `duration` (seconds) overrides the default entrance length.
      if (typeof reveal.duration === "number") {
        wrap.style.setProperty("--dur-reveal", reveal.duration + "s");
      }
      this.pending.push({ el: wrap, reveal: reveal });
      return wrap;
    },

    pending: [],

    /**
     * For components: hold back a piece INSIDE a block (a tab, a card…) until
     * its trigger fires, with the same triggers and safety nets as a block
     * reveal. Call it while the block renders.
     */
    revealLater: function (el, reveal) {
      if (!el || !reveal) return el;
      el.classList.add("reveal", "reveal--" + (reveal.effect || "fade"));
      el.dataset.revealState = "hidden";
      el.setAttribute("aria-hidden", "true");
      this.pending.push({ el: el, reveal: reveal });
      return el;
    },

    show: function (entry) {
      if (!entry || entry.done) return;
      entry.done = true;
      entry.el.dataset.revealState = "shown";
      entry.el.removeAttribute("aria-hidden");
      // An entry may carry work of its own — ML03 screen 3 turns the whole
      // screen onto the CruCo ground halfway through the narration.
      if (entry.apply) entry.apply(entry.el);
      if (this.onRevealed) this.onRevealed();
    },

    /** Client 2026-09-21: Next stays off until the screen is fully revealed. */
    waiting: [],

    hasHiddenContent: function () {
      return this.waiting.some(function (e) { return !e.done; });
    },

    /** Wires pending reveals to the screen VO / timers. */
    scheduleReveals: function () {
      var self = this;
      var entries = this.pending.splice(0);
      this.waiting = entries;
      if (this.onRevealed) this.onRevealed();
      if (!entries.length) return;
      var audio = CruCo.media.screenAudio;
      var timers = [];

      var showAll = function () { entries.forEach(function (e) { self.show(e); }); };
      var timed = entries.filter(function (e) { return typeof e.reveal.at === "number"; });
      var afterAudio = entries.filter(function (e) { return e.reveal.afterAudio; });

      entries.forEach(function (entry) {
        if (typeof entry.reveal.delay === "number") {
          timers.push(setTimeout(function () { self.show(entry); }, entry.reveal.delay * 1000));
        }
      });

      if (timed.length || afterAudio.length) {
        if (!audio) {
          timers.push(setTimeout(showAll, 400));            // no VO on this screen
        } else {
          var onTime = function () {
            timed.forEach(function (entry) {
              if (audio.currentTime >= entry.reveal.at) self.show(entry);
            });
          };
          var onEnded = function () {
            afterAudio.forEach(function (e) { self.show(e); });
            timed.forEach(function (e) { self.show(e); });
          };
          audio.addEventListener("timeupdate", onTime);
          audio.addEventListener("ended", onEnded);
          audio.addEventListener("error", showAll);
          // Autoplay blocked / learner never presses play: reveal anyway.
          timers.push(setTimeout(function () { if (audio.paused && !audio.currentTime) showAll(); }, 2500));
          // Safety net for a VO that stops: after REVEAL_MAX_WAIT, reveal
          // everything only if the narration is no longer playing. A long VO
          // that is still running keeps its timing (a reveal at 21 s must not
          // fire at 8 s — found on ML02 screen 5, also ML01's WhatsApp badge).
          var watchdog = null;
          timers.push(setTimeout(function () {
            watchdog = setInterval(function () {
              if (audio.ended) { onEnded(); clearInterval(watchdog); }
              else if (audio.paused) { showAll(); clearInterval(watchdog); }
            }, 1000);
          }, REVEAL_MAX_WAIT));
          this.onCleanup(function () {
            if (watchdog) clearInterval(watchdog);
            audio.removeEventListener("timeupdate", onTime);
            audio.removeEventListener("ended", onEnded);
            audio.removeEventListener("error", showAll);
          });
        }
      }
      this.onCleanup(function () { timers.forEach(clearTimeout); });
    },

    /** The screen narration bar, or null when there is none. */
    screenAudio: function (screen, editorOn) {
      var audioPath = screen.id + "#audio";
      if (CruCo.isDeleted(audioPath)) {
        return editorOn
          ? h("div", { class: "screen__audio" }, CruCo.editor.deletedChip(audioPath, U.pieceName("screenAudio")))
          : null;
      }
      if (!screen.audio) return null;
      var audio = CruCo.media.createAudioPlayer(screen.audio, audioPath);
      if (!audio) return null;
      // `"hidden": true` on the screen audio: the narration still plays (and
      // still drives the timed reveals), but the bar is not shown. Used on the
      // welcome screen, where the player competed with the logo. The author
      // still sees and can edit it in the editor.
      var hidden = screen.audio.hidden && !editorOn;
      return h("div", {
        class: "screen__audio" + (hidden ? " screen__audio--hidden" : ""),
        attrs: hidden ? { "aria-hidden": "true" } : null
      }, editorOn
        ? CruCo.editor.frame(audio, { path: audioPath, kind: "audio", name: U.pieceName("screenAudio"), data: screen.audio })
        : audio);
    },

    render: function (screen, container, opts) {
      var self = this;
      var editorOn = !!(CruCo.editor && CruCo.editor.active);
      this.cleanup();
      this.pending = [];

      var layout = LAYOUTS.indexOf(screen.layout) !== -1 ? screen.layout : "standard";
      var titleId = U.uid("screen-title");
      var titleText = U.plain(screen.title || "");
      var C = CruCo.course;
      var bgPath = screen.id + "#bg";
      var bgDeleted = CruCo.isDeleted(bgPath);
      var bg = screen.background && !bgDeleted && CruCo.resolveMedia(bgPath, screen.background);

      var section = h("section", {
        class: "screen screen--" + layout +
          (screen.asideFirst ? " screen--aside-first" : "") +
          (screen.asideFirstOnMobile ? " screen--aside-first-mobile" : "") +
          (bg && bg.layout === "side" ? " screen--cover-side" : "") +
          // A photo behind the screen gets the light veil; the CruCo ground is
          // dark and paints itself, so it must not also get it.
          (bg && layout !== "cover" && !screen.background.brand ? " screen--bg-light" : "") +
          (hasWideBlock(screen) ? " screen--wide-body" : ""),
        attrs: { "aria-labelledby": titleId },
        dataset: { screenId: screen.id, enter: (opts && opts.direction) || "jump" }
      });

      var sb = screen.storyboard || {};
      if (sb.screen) section.appendChild(comment("Storyboard screen", sb.screen));
      if (sb.objective) section.appendChild(comment("Objective", sb.objective));

      // `"background": { "brand": true }` paints the CruCo ground (no image file).
      // With `at` / `afterAudio` it arrives on cue instead of being there from
      // the start: ML03 screen 3, "the whole screen goes blue" when the second
      // half of the narration begins.
      if (screen.background && screen.background.brand && !bgDeleted) {
        var bgCue = screen.background;
        if (typeof bgCue.at === "number" || bgCue.afterAudio) {
          section.classList.add("brand-bg--later");
          section.dataset.revealState = "hidden";
          this.pending.push({
            el: section,
            reveal: { at: bgCue.at, afterAudio: bgCue.afterAudio },
            apply: function (el) { el.classList.add("screen--brand-bg", "brand-bg"); }
          });
        } else {
          section.classList.add("screen--brand-bg", "brand-bg");
        }
      } else if (screen.background && !bgDeleted && layout !== "cover") {
        // Light background photo behind a normal screen: a veil keeps the
        // dark brand text readable (client test, screen 2.1).
        var lightBg = h("div", { class: "screen__bg" },
          CruCo.media.createImage(Object.assign({ decorative: true }, screen.background), bgPath));
        section.appendChild(editorOn
          ? CruCo.editor.frame(lightBg, { path: bgPath, kind: "image", name: U.pieceName("background"), data: screen.background })
          : lightBg);
      } else if (layout === "cover" && screen.background && !bgDeleted) {
        var bgNode = h("div", { class: "screen__bg" },
          CruCo.media.createImage(Object.assign({ decorative: true }, screen.background), bgPath));
        section.appendChild(editorOn
          ? CruCo.editor.frame(bgNode, { path: bgPath, kind: "image", name: U.pieceName("background"), data: screen.background })
          : bgNode);
      } else if (bgDeleted && editorOn) {
        section.appendChild(h("div", { class: "screen__bg-deleted" },
          CruCo.editor.deletedChip(bgPath, U.pieceName("background"))));
      }

      // Client 2026-09-15: `avatar` puts the presenter's round portrait at the
      // very top of the screen, above the eyebrow and the title.
      var avatarPath = screen.id + "#avatar";
      if (screen.avatar && !CruCo.isDeleted(avatarPath)) {
        var avatar = h("figure", { class: "figure figure--avatar screen__avatar" },
          CruCo.media.createImage(screen.avatar, avatarPath));
        section.appendChild(this.stagger(editorOn
          ? CruCo.editor.frame(avatar, { path: avatarPath, kind: "image", name: U.pieceName("avatar"), data: screen.avatar })
          : avatar, 0));
      } else if (screen.avatar && editorOn) {
        section.appendChild(CruCo.editor.deletedChip(avatarPath, U.pieceName("avatar")));
      }

      // Client 2026-09-15: only an eyebrow written in the storyboard is shown;
      // the player no longer invents a "Lección N" label on cover screens.
      var eyebrow = screen.eyebrow ? U.plain(screen.eyebrow) : "";

      // `titleSpacer`: the heading is not shown but its room is kept, so the
      // screen stays balanced (client 2026-09-21, opening screen).
      var title = h("h1", {
        class: "screen__title" + (titleText ? "" : (screen.titleSpacer ? " screen__title--spacer" : " visually-hidden")),
        attrs: { id: titleId, tabindex: "-1" },
        html: titleText
          ? U.mdInline(screen.title)
          : U.escapeHtml(t("screenCounter", {
              n: screen.indexInModule + 1,
              total: screen.module.screens.length
            }))
      });

      // Estimated time: on the screen that opens the lesson, right under the
      // title. `duration` on the screen wins over the lesson's own.
      var duration = screen.duration ||
        (screen.indexInModule === 0 && screen.module ? screen.module.duration : "");
      var durationEl = duration
        ? h("p", { class: "screen__duration" },
            U.iconEl("clock"),
            h("span", { class: "visually-hidden", text: t("durationLabel") + ": " }),
            h("span", { text: U.plain(duration) }))
        : null;

      // With nothing visible in it the header still pushed the content down by
      // its bottom margin, and the slide has a fixed height: the heading stays
      // in the DOM for screen readers, but the room goes back to the content.
      var bareHeader = !eyebrow && !titleText && !screen.titleSpacer && !durationEl && !screen.subtitle;

      section.appendChild(this.stagger(h("header", { class: "screen__header" + (bareHeader ? " screen__header--bare" : "") },
        eyebrow ? h("span", { class: "eyebrow", text: eyebrow }) : null,
        title,
        durationEl,
        screen.subtitle ? h("p", { class: "screen__subtitle", html: U.mdInline(screen.subtitle) }) : null), 0));

      // The screen narration normally sits right under the title. A block of
      // type "screenAudio" moves it into the flow at that exact spot instead
      // (client 2026-09-15: title -> logo -> audio bar -> video on screen 1).
      var blocks = screen.blocks || [];
      var audioSlot = blocks.findIndex
        ? blocks.findIndex(function (b, i) { return b && b.type === "screenAudio" && !CruCo.isDeleted(screen.id + "#" + i); })
        : -1;
      var audioNode = this.screenAudio(screen, editorOn);
      if (audioNode && audioSlot === -1) section.appendChild(audioNode);

      var body = h("div", { class: "screen__body" });
      var place = function (b, i, target) {
        if (b && b.type === "screenAudio") {
          if (i === audioSlot && audioNode) target.appendChild(audioNode);
          return;
        }
        var node = self.renderBlock(b, screen, i);
        if (node) target.appendChild(node);
      };
      if (layout === "split") {
        var main = h("div", { class: "screen__main" });
        var aside = h("div", { class: "screen__aside" });
        blocks.forEach(function (b, i) { place(b, i, b.region === "aside" ? aside : main); });
        body.appendChild(main);
        body.appendChild(aside);
      } else {
        blocks.forEach(function (b, i) { place(b, i, body); });
      }
      section.appendChild(body);

      container.innerHTML = "";
      container.appendChild(section);
      this.scheduleReveals();
      return { section: section, title: title };
    },

    renderEmpty: function (container) {
      container.innerHTML = "";
      container.appendChild(h("section", { class: "empty-course" },
        h("h1", { attrs: { tabindex: "-1" }, text: t("emptyTitle") }),
        h("p", { text: t("emptyBody") })));
    }
  };

  CruCo.renderer = renderer;
})(window.CruCo = window.CruCo || {});
