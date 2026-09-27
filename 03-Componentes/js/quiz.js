/* =========================================================================
   quiz.js — non-graded knowledge checks
   -------------------------------------------------------------------------
   { type:"quiz", id, title, intro, questions:[ ... ] }
   Question types:
     single    : { prompt, options:[{ text, correct, feedback }], shuffle }
     multiple  : same as single, several options with correct:true
     truefalse : { prompt, answer: true|false }
     matching  : { prompt, pairs:[{ left, right }], distractors:[...] }
     ordering  : { prompt, items:[ ...in the correct order ] }
     fillblank : { prompt, accepted:[ "respuesta", ... ] }   accent/case-insensitive
     recall    : { prompt, modelAnswer }                     reveal = completed
     cloze     : { prompt, text:"… la {1} …", blanks:[{ options:[…], answer:0 }] }
   Every question: feedback:{ correct, incorrect }  (descriptive text)
   Correct -> "Correcto". Incorrect -> "Incorrecto" + text + "Repetir"
   (retry is optional: the check already counts as attempted).
   Answers persist on revisit (session memory + cmi.suspend_data).
   ========================================================================= */
(function (CruCo) {
  "use strict";

  var U = CruCo.utils;
  var h = U.h;
  var t = U.t;
  CruCo.components = CruCo.components || {};

  // ---- Type handlers ----------------------------------------------------------------
  // Each returns { el, hint, isAnswered(), response(), apply(r), evaluate(),
  //                mark(on), lock(on), reset(), focusFirst(), recall? }

  function choiceHandler(q, mem) {
    var type = q.type === "truefalse" ? "truefalse" : (q.type === "multiple" ? "multiple" : "single");
    var options = type === "truefalse"
      ? [{ text: t("optionTrue"), correct: q.answer === true }, { text: t("optionFalse"), correct: q.answer === false }]
      : (q.options || []);
    if (!mem.order || mem.order.length !== options.length) {
      var base = options.map(function (o, i) { return i; });
      mem.order = q.shuffle && type !== "truefalse" ? U.shuffle(base) : base;
    }
    var name = U.uid("q");
    var rows = [];
    var box = h("div", { class: "options" });

    mem.order.forEach(function (idx) {
      var opt = options[idx];
      var input = h("input", { attrs: { type: type === "multiple" ? "checkbox" : "radio", name: name, value: String(idx) } });
      var sr = h("span", { class: "visually-hidden" });
      var mark = h("span", { class: "option__mark", attrs: { "aria-hidden": "true" } });
      var fb = opt.feedback ? h("p", { class: "option__feedback", html: U.mdInline(opt.feedback), hidden: true }) : null;
      var label = h("label", { class: "option" },
        input,
        h("span", { class: "option__box", attrs: { "aria-hidden": "true" } }),
        h("span", { class: "option__text" }, h("span", { html: U.mdInline(opt.text) }), sr),
        mark, fb);
      rows.push({ idx: idx, opt: opt, input: input, label: label, mark: mark, fb: fb, sr: sr });
      box.appendChild(label);
    });

    function selected() {
      return rows.filter(function (r) { return r.input.checked; })
        .map(function (r) { return r.idx; }).sort(function (a, b) { return a - b; });
    }

    return {
      el: box,
      hint: t(type === "multiple" ? "hintMultiple" : type === "truefalse" ? "hintTrueFalse" : "hintSingle"),
      isAnswered: function () { return selected().length > 0; },
      response: function () { return selected().join("."); },
      apply: function (r) {
        var set = String(r).split(".").filter(function (x) { return x !== ""; }).map(Number);
        rows.forEach(function (row) { row.input.checked = set.indexOf(row.idx) !== -1; });
      },
      evaluate: function () {
        var sel = selected();
        if (type !== "multiple") return sel.length === 1 && !!options[sel[0]].correct;
        var correct = [];
        options.forEach(function (o, i) { if (o.correct) correct.push(i); });
        return sel.length === correct.length && sel.every(function (i) { return correct.indexOf(i) !== -1; });
      },
      mark: function (on) {
        rows.forEach(function (row) {
          var show = on && row.input.checked;
          if (show) {
            row.label.dataset.result = row.opt.correct ? "correct" : "incorrect";
            row.mark.innerHTML = U.icon(row.opt.correct ? "checkCircle" : "xCircle");
            row.sr.textContent = " (" + t(row.opt.correct ? "feedbackCorrect" : "feedbackIncorrect") + ")";
          } else if (on && q.revealCorrect && row.opt.correct) {
            // Storyboard: "on reveal, highlight option B" even if not chosen.
            row.label.dataset.result = "answer";
            row.mark.innerHTML = U.icon("checkCircle");
            row.sr.textContent = " (" + t("correctAnswerMark") + ")";
          } else {
            delete row.label.dataset.result;
            row.mark.innerHTML = "";
            row.sr.textContent = "";
          }
          if (row.fb) row.fb.hidden = !show;
        });
      },
      lock: function (on) { rows.forEach(function (row) { row.input.disabled = on; }); },
      reset: function () { rows.forEach(function (row) { row.input.checked = false; }); },
      focusFirst: function () { if (rows[0]) rows[0].input.focus(); }
    };
  }

  function matchingHandler(q, mem) {
    var pairs = q.pairs || [];
    var rights = pairs.map(function (p) { return p.right; }).concat(q.distractors || []);
    if (!mem.order || mem.order.length !== rights.length) {
      mem.order = U.shuffle(rights.map(function (r, i) { return i; }));
    }
    var rows = [];
    var box = h("div", { class: "matching" });

    pairs.forEach(function (pair, i) {
      var selId = U.uid("match");
      var select = h("select", { class: "select", attrs: { id: selId } },
        h("option", { attrs: { value: "" }, text: t("selectPlaceholder") }));
      mem.order.forEach(function (ri) {
        select.appendChild(h("option", { attrs: { value: String(ri) }, text: U.plain(rights[ri]) }));
      });
      var sr = h("span", { class: "visually-hidden" });
      var mark = h("span", { class: "matching__mark", attrs: { "aria-hidden": "true" } });
      var row = h("div", { class: "matching__row" },
        h("label", { class: "matching__left", attrs: { for: selId } }, h("span", { html: U.mdInline(pair.left) }), sr),
        select, mark);
      rows.push({ i: i, select: select, row: row, mark: mark, sr: sr });
      box.appendChild(row);
    });

    function isRight(r) {
      return r.select.value !== "" && U.normalize(rights[+r.select.value]) === U.normalize(pairs[r.i].right);
    }

    return {
      el: box,
      hint: t("hintMatching"),
      isAnswered: function () { return rows.every(function (r) { return r.select.value !== ""; }); },
      response: function () { return rows.map(function (r) { return r.select.value === "" ? "x" : r.select.value; }).join("."); },
      apply: function (resp) {
        var parts = String(resp).split(".");
        rows.forEach(function (r, i) { r.select.value = parts[i] && parts[i] !== "x" ? parts[i] : ""; });
      },
      evaluate: function () { return rows.every(isRight); },
      mark: function (on) {
        rows.forEach(function (r) {
          if (on) {
            var ok = isRight(r);
            r.row.dataset.result = ok ? "correct" : "incorrect";
            r.mark.innerHTML = U.icon(ok ? "checkCircle" : "xCircle");
            r.sr.textContent = " (" + t(ok ? "feedbackCorrect" : "feedbackIncorrect") + ")";
          } else {
            delete r.row.dataset.result;
            r.mark.innerHTML = "";
            r.sr.textContent = "";
          }
        });
      },
      lock: function (on) { rows.forEach(function (r) { r.select.disabled = on; }); },
      reset: function () { rows.forEach(function (r) { r.select.value = ""; }); },
      focusFirst: function () { if (rows[0]) rows[0].select.focus(); }
    };
  }

  function orderingHandler(q, mem) {
    var items = q.items || [];
    if (!mem.order || mem.order.length !== items.length) {
      var order = U.shuffle(items.map(function (x, i) { return i; }));
      if (items.length > 1 && order.every(function (v, i) { return v === i; })) order.push(order.shift());
      mem.order = order;
    }
    var list = h("ol", { class: "ordering" });
    var locked = false;
    var marked = false;
    var drag = null;

    // Pointer drag & drop (storyboard asks for drag-and-drop). The up/down
    // buttons stay as the keyboard + screen-reader path, so no action
    // depends on dragging (WCAG 2.5.7).
    function nodes() { return Array.prototype.slice.call(list.children); }

    function onPointerDown(e, li) {
      if (locked || drag || e.button > 0) return;
      if (e.target.closest && e.target.closest("button")) return;
      drag = { li: li, id: e.pointerId };
      try { li.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
      li.dataset.dragging = "true";
      list.dataset.dragging = "true";
    }

    function onPointerMove(e) {
      if (!drag) return;
      e.preventDefault();
      var others = nodes().filter(function (n) { return n !== drag.li; });
      var before = null;
      for (var i = 0; i < others.length; i++) {
        var box = others[i].getBoundingClientRect();
        if (e.clientY < box.top + box.height / 2) { before = others[i]; break; }
      }
      if (before) list.insertBefore(drag.li, before);
      else list.appendChild(drag.li);
    }

    function onPointerUp() {
      if (!drag) return;
      try { drag.li.releasePointerCapture(drag.id); } catch (err) { /* ignore */ }
      delete drag.li.dataset.dragging;
      delete list.dataset.dragging;
      drag = null;
      mem.order = nodes().map(function (li) { return Number(li.dataset.item); });
      render();
    }

    function render(focusItem, dir) {
      list.innerHTML = "";
      mem.order.forEach(function (itemIdx, pos) {
        var text = U.plain(items[itemIdx]);
        var up = h("button", { class: "icon-btn", attrs: { type: "button", "aria-label": t("moveUp", { item: text }) }, html: U.icon("arrowUp") });
        var down = h("button", { class: "icon-btn", attrs: { type: "button", "aria-label": t("moveDown", { item: text }) }, html: U.icon("arrowDown") });
        up.disabled = locked || pos === 0;
        down.disabled = locked || pos === mem.order.length - 1;
        up.addEventListener("click", function () { move(pos, -1); });
        down.addEventListener("click", function () { move(pos, 1); });
        var li = h("li", {
          class: "ordering__item",
          dataset: { item: String(itemIdx) },
          attrs: { title: locked ? null : t("dragHandle", { item: text }) }
        },
          h("span", { class: "ordering__pos", attrs: { "aria-hidden": "true" }, text: String(pos + 1) }),
          h("span", { class: "ordering__text", html: U.mdInline(items[itemIdx]) }),
          h("span", { class: "ordering__moves" }, up, down));
        if (marked) li.dataset.result = itemIdx === pos ? "correct" : "incorrect";
        li.addEventListener("pointerdown", function (e) { onPointerDown(e, li); });
        li.addEventListener("pointermove", onPointerMove);
        li.addEventListener("pointerup", onPointerUp);
        li.addEventListener("pointercancel", onPointerUp);
        list.appendChild(li);
        if (focusItem === itemIdx) {
          var target = dir < 0 ? (up.disabled ? down : up) : (down.disabled ? up : down);
          setTimeout(function () { target.focus(); }, 0);
        }
      });
    }

    function move(pos, dir) {
      var to = pos + dir;
      if (locked || to < 0 || to >= mem.order.length) return;
      var itemIdx = mem.order.splice(pos, 1)[0];
      mem.order.splice(to, 0, itemIdx);
      render(itemIdx, dir);
      U.announce(t("movedTo", { item: U.plain(items[itemIdx]), pos: to + 1, total: mem.order.length }));
    }

    render();
    return {
      el: list,
      hint: t("hintOrdering"),
      isAnswered: function () { return true; },
      response: function () { return mem.order.join("."); },
      apply: function (r) {
        var parts = String(r).split(".").map(Number);
        var valid = parts.length === items.length && parts.every(function (n) { return n >= 0 && n < items.length; });
        if (valid) { mem.order = parts; render(); }
      },
      evaluate: function () { return mem.order.every(function (v, i) { return v === i; }); },
      mark: function (on) { marked = on; render(); },
      lock: function (on) { locked = on; render(); },
      reset: function () { /* keep the current order for another try */ },
      focusFirst: function () { var b = list.querySelector("button:not(:disabled)"); if (b) b.focus(); }
    };
  }

  function fillHandler(q, mem) {
    var input = h("input", {
      class: "text-answer",
      attrs: { type: "text", autocomplete: "off", spellcheck: "false", "aria-label": t("answerLabel") }
    });
    input.value = mem.txt || "";
    input.addEventListener("input", function () { mem.txt = input.value; });
    var accepted = (q.accepted || []).map(U.normalize);
    return {
      el: input,
      hint: t("hintFillblank"),
      isAnswered: function () { return input.value.trim() !== ""; },
      response: function () { return null; },            // free text: session memory only
      apply: function () {},
      evaluate: function () { return accepted.indexOf(U.normalize(input.value)) !== -1; },
      mark: function () {},
      lock: function (on) { input.disabled = on; },
      reset: function () { input.value = ""; mem.txt = ""; },
      focusFirst: function () { input.focus(); }
    };
  }

  function recallHandler(q, mem) {
    var ta = h("textarea", { class: "text-answer", attrs: { rows: "4", "aria-label": t("answerLabel") } });
    ta.value = mem.txt || "";
    ta.addEventListener("input", function () { mem.txt = ta.value; });
    return {
      el: ta,
      hint: t("hintRecall"),
      recall: true,
      isAnswered: function () { return true; },
      response: function () { return null; },
      apply: function () {},
      evaluate: function () { return true; },
      mark: function () {},
      lock: function () {},
      reset: function () {},
      focusFirst: function () { ta.focus(); }
    };
  }

  /**
   * Categorize (ML02 screen 6): drop each task into the function it belongs to.
   *   { type:"categorize", buckets:["Curaduría", …], items:[{ text, bucket }] }
   * Every chip carries a <select> as well as being draggable, so the exercise
   * works with a finger, a mouse, the keyboard and a screen reader alike.
   */
  function categorizeHandler(q, mem) {
    var buckets = q.buckets || [];
    var items = q.items || [];
    if (!mem.order || mem.order.length !== items.length) {
      mem.order = U.shuffle(items.map(function (_, i) { return i; }));
    }
    mem.place = mem.place || {};
    var locked = false;
    var marked = false;

    var tray = h("div", { class: "categorize__tray", attrs: { "aria-label": t("categorizeTray") } });
    var zones = [];
    var board = h("div", { class: "categorize__board" });
    buckets.forEach(function (name, b) {
      var drop = h("div", { class: "categorize__drop", dataset: { bucket: String(b) } });
      zones.push(drop);
      board.appendChild(h("div", { class: "categorize__bucket" },
        h("h4", { class: "categorize__name", html: U.mdInline(name) }), drop));
    });
    var box = h("div", { class: "categorize block--wide" }, tray, board);

    function chipFor(i) {
      var text = U.plain(items[i].text);
      var select = h("select", {
        class: "select categorize__select",
        attrs: { "aria-label": t("categorizeAssign", { item: text }) }
      }, h("option", { attrs: { value: "" }, text: t("categorizeNone") }));
      buckets.forEach(function (name, b) {
        select.appendChild(h("option", { attrs: { value: String(b) }, text: U.plain(name) }));
      });
      select.value = mem.place[i] == null ? "" : String(mem.place[i]);
      select.disabled = locked;
      select.addEventListener("change", function () {
        mem.place[i] = select.value === "" ? null : Number(select.value);
        render();
      });

      var chip = h("div", {
        class: "categorize__chip",
        dataset: { item: String(i) },
        attrs: { title: locked ? null : t("categorizeDrag", { item: text }) }
      },
        h("span", { class: "categorize__text", html: U.mdInline(items[i].text) }),
        h("span", { class: "categorize__mark", attrs: { "aria-hidden": "true" } }),
        select);
      if (marked) {
        var ok = mem.place[i] != null && U.normalize(buckets[mem.place[i]]) === U.normalize(items[i].bucket);
        chip.dataset.result = ok ? "correct" : "incorrect";
        chip.querySelector(".categorize__mark").innerHTML = U.icon(ok ? "checkCircle" : "xCircle");
        chip.appendChild(h("span", { class: "visually-hidden",
          text: " (" + t(ok ? "feedbackCorrect" : "feedbackIncorrect") + ")" }));
      }
      if (!locked) wireDrag(chip, i);
      return chip;
    }

    var drag = null;
    function wireDrag(chip, i) {
      chip.addEventListener("pointerdown", function (e) {
        if (e.target.closest("select") || locked) return;
        drag = { chip: chip, i: i, id: e.pointerId };
        chip.dataset.dragging = "true";
        box.dataset.dragging = "true";
        try { chip.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      });
      chip.addEventListener("pointermove", function (e) {
        if (!drag) return;
        e.preventDefault();
        var over = document.elementFromPoint(e.clientX, e.clientY);
        var zone = over && over.closest ? over.closest(".categorize__drop, .categorize__tray") : null;
        zones.concat([tray]).forEach(function (z) { delete z.dataset.over; });
        if (zone) zone.dataset.over = "true";
      });
      var drop = function (e) {
        if (!drag) return;
        try { chip.releasePointerCapture(drag.id); } catch (err) { /* ignore */ }
        var over = document.elementFromPoint(e.clientX, e.clientY);
        var zone = over && over.closest ? over.closest(".categorize__drop, .categorize__tray") : null;
        zones.concat([tray]).forEach(function (z) { delete z.dataset.over; });
        delete chip.dataset.dragging;
        delete box.dataset.dragging;
        var idx = drag.i;
        drag = null;
        if (zone) {
          mem.place[idx] = zone.dataset.bucket == null ? null : Number(zone.dataset.bucket);
          render();
        }
      };
      chip.addEventListener("pointerup", drop);
      chip.addEventListener("pointercancel", function () {
        if (!drag) return;
        delete drag.chip.dataset.dragging;
        delete box.dataset.dragging;
        zones.concat([tray]).forEach(function (z) { delete z.dataset.over; });
        drag = null;
      });
    }

    function render() {
      tray.innerHTML = "";
      zones.forEach(function (z) { z.innerHTML = ""; });
      mem.order.forEach(function (i) {
        var b = mem.place[i];
        (b == null || !zones[b] ? tray : zones[b]).appendChild(chipFor(i));
      });
      if (!tray.childNodes.length) {
        tray.appendChild(h("p", { class: "categorize__empty", text: t("categorizeEmpty") }));
      }
    }
    render();

    return {
      el: box,
      hint: t("hintCategorize"),
      isAnswered: function () {
        return items.every(function (_, i) { return mem.place[i] != null; });
      },
      response: function () {
        return items.map(function (_, i) { return mem.place[i] == null ? "x" : mem.place[i]; }).join(".");
      },
      apply: function (resp) {
        String(resp).split(".").forEach(function (v, i) { mem.place[i] = v === "x" || v === "" ? null : Number(v); });
        render();
      },
      evaluate: function () {
        return items.every(function (it, i) {
          return mem.place[i] != null && U.normalize(buckets[mem.place[i]]) === U.normalize(it.bucket);
        });
      },
      mark: function (on) { marked = on; render(); },
      lock: function (on) { locked = on; render(); },
      reset: function () { mem.place = {}; marked = false; render(); },
      focusFirst: function () {
        var first = box.querySelector("select");
        if (first) first.focus();
      }
    };
  }

  /**
   * cloze: a sentence with dropdown gaps — "elige la opción correcta en cada
   * espacio" (ML03 screen 6; a technique the course had not used yet).
   *   { type:"cloze", text:"… era la {1}. Hoy … la {2}.",
   *     blanks:[{ options:["seguridad","elegancia","tradición"], answer:0 }] }
   * The number in braces is the blank's place in `blanks`, 1-based; the
   * options are shuffled once per learner so the answer is not always first.
   */
  function clozeHandler(q, mem) {
    var blanks = q.blanks || [];
    if (!mem.order || mem.order.length !== blanks.length) {
      mem.order = blanks.map(function (b) {
        return U.shuffle((b.options || []).map(function (_, i) { return i; }));
      });
    }
    mem.pick = mem.pick || {};
    var locked = false;
    var marked = false;
    var box = h("p", { class: "cloze" });

    function gap(n) {
      var b = blanks[n];
      var wrap = h("span", { class: "cloze__gap" });
      var select = h("select", {
        class: "select cloze__select",
        attrs: { "aria-label": t("clozeGap", { n: n + 1 }) }
      }, h("option", { attrs: { value: "" }, text: t("clozeChoose") }));
      mem.order[n].forEach(function (oi) {
        select.appendChild(h("option", { attrs: { value: String(oi) }, text: U.plain(b.options[oi]) }));
      });
      select.value = mem.pick[n] == null ? "" : String(mem.pick[n]);
      select.disabled = locked;
      select.addEventListener("change", function () {
        // no re-render here: it would take the focus out of the sentence
        mem.pick[n] = select.value === "" ? null : Number(select.value);
        wrap.dataset.filled = select.value === "" ? "false" : "true";
      });
      wrap.dataset.filled = mem.pick[n] == null ? "false" : "true";
      wrap.appendChild(select);
      if (marked) {
        var ok = mem.pick[n] === b.answer;
        wrap.dataset.result = ok ? "correct" : "incorrect";
        wrap.appendChild(h("span", { class: "cloze__mark", attrs: { "aria-hidden": "true" },
          html: U.icon(ok ? "checkCircle" : "xCircle") }));
        wrap.appendChild(h("span", { class: "visually-hidden",
          text: " (" + t(ok ? "feedbackCorrect" : "feedbackIncorrect") + ")" }));
      }
      return wrap;
    }

    function render() {
      box.innerHTML = "";
      // "…{1}…" splits into [text, "1", text, "2", text…]
      String(q.text || "").split(/\{(\d+)\}/).forEach(function (part, i) {
        if (i % 2 === 0) {
          if (part) box.appendChild(h("span", { html: U.mdInline(part) }));
        } else if (blanks[Number(part) - 1]) {
          box.appendChild(gap(Number(part) - 1));
        }
      });
    }
    render();

    return {
      el: box,
      hint: t("hintCloze"),
      isAnswered: function () {
        return blanks.every(function (_, n) { return mem.pick[n] != null; });
      },
      response: function () {
        return blanks.map(function (_, n) { return mem.pick[n] == null ? "x" : mem.pick[n]; }).join(".");
      },
      apply: function (resp) {
        String(resp).split(".").forEach(function (v, n) {
          mem.pick[n] = v === "x" || v === "" ? null : Number(v);
        });
        render();
      },
      evaluate: function () {
        return blanks.every(function (b, n) { return mem.pick[n] === b.answer; });
      },
      mark: function (on) { marked = on; render(); },
      lock: function (on) { locked = on; render(); },
      reset: function () { mem.pick = {}; marked = false; render(); },
      focusFirst: function () {
        var first = box.querySelector("select");
        if (first) first.focus();
      }
    };
  }

  var HANDLERS = {
    single: choiceHandler, multiple: choiceHandler, truefalse: choiceHandler,
    matching: matchingHandler, ordering: orderingHandler, fillblank: fillHandler, recall: recallHandler,
    categorize: categorizeHandler, cloze: clozeHandler
  };

  // ---- Question -----------------------------------------------------------------------
  function renderQuestion(q, index, total, onUpdate) {
    var S = CruCo.state;
    var key = q._key;
    var mem = S.memory[key] = S.memory[key] || {};
    var type = HANDLERS[q.type] ? q.type : "single";
    if (!HANDLERS[q.type]) U.warn("Unknown question type '" + q.type + "', rendered as single choice.");
    var handler = HANDLERS[type](q, mem);

    var hintId = U.uid("qhint");
    var fieldset = h("fieldset", { class: "question__fieldset", attrs: { "aria-describedby": hintId } },
      h("legend", { class: "question__prompt" },
        total > 1 ? h("span", { class: "question__num", text: t("questionNum", { n: index + 1, total: total }) }) : null,
        h("span", { html: U.mdInline(q.prompt) })),
      h("p", { class: "question__hint", attrs: { id: hintId }, text: q.hint ? U.plain(q.hint) : handler.hint }),
      handler.el);

    var checkBtn = h("button", { class: "btn btn--primary", attrs: { type: "button" }, text: t(handler.recall ? "reveal" : "check") });
    var msg = h("p", { class: "question__hint", attrs: { role: "alert" } });
    var actions = h("div", { class: "question__actions" }, checkBtn);
    var feedbackSlot = h("div");
    var wrap = h("div", { class: "question", dataset: { type: type } }, fieldset, actions, msg, feedbackSlot);

    function showFeedback(kind, focus) {
      feedbackSlot.innerHTML = "";
      var fb = q.feedback || {};
      var title = t(kind === "correct" ? "feedbackCorrect" : kind === "incorrect" ? "feedbackIncorrect" : "feedbackRecall");
      var iconName = kind === "correct" ? "checkCircle" : kind === "incorrect" ? "xCircle" : "info";
      var text = kind === "recall" ? q.modelAnswer : fb[kind];
      var retry = null;
      if (kind === "incorrect") {
        retry = h("button", { class: "btn btn--secondary", attrs: { type: "button" } }, U.iconEl("retry"), t("retry"));
        retry.addEventListener("click", doRetry);
      }
      var panel = h("div", {
        class: "feedback feedback--" + (kind === "recall" ? "neutral" : kind),
        attrs: { tabindex: "-1" }
      },
        h("p", { class: "feedback__head" }, U.iconEl(iconName), h("span", { text: title })),
        text ? U.prose(text) : null,
        retry ? h("div", { class: "question__actions" }, retry) : null);
      feedbackSlot.appendChild(panel);
      if (focus) panel.focus();
    }

    function setAnswered(kind, focus) {
      handler.lock(true);
      handler.mark(kind !== "recall");
      actions.hidden = true;
      wrap.dataset.locked = "true";
      wrap.dataset.status = kind;
      showFeedback(kind, focus);
    }

    function doCheck() {
      if (!handler.isAnswered()) { msg.textContent = t("answerRequired"); return; }
      msg.textContent = "";
      var correct = handler.evaluate();
      var prev = S.getQuestion(key) || {};
      mem.retrying = false;
      if (handler.recall) mem.rev = true;
      setAnswered(handler.recall ? "recall" : (correct ? "correct" : "incorrect"), true);
      // Storyboard: "When correct: cheering noise" (SFX in courseConfig).
      if (correct && !handler.recall) CruCo.media.playSfx("correct");
      S.setQuestion(key, { a: (prev.a || 0) + 1, c: correct ? 1 : 0, r: handler.response() });
      onUpdate();
    }

    function doRetry() {
      handler.lock(false);
      handler.mark(false);
      handler.reset();
      actions.hidden = false;
      feedbackSlot.innerHTML = "";
      delete wrap.dataset.locked;
      wrap.dataset.status = "retry";
      mem.retrying = true;
      handler.focusFirst();
    }

    checkBtn.addEventListener("click", doCheck);

    // Restore a previous answer (same session or from suspend_data).
    var st = S.getQuestion(key);
    if (st && st.a > 0 && !mem.retrying) {
      if (handler.recall) setAnswered("recall", false);
      else if (st.r != null && st.r !== "") { handler.apply(st.r); setAnswered(st.c ? "correct" : "incorrect", false); }
      else if (type === "fillblank" && mem.txt) setAnswered(st.c ? "correct" : "incorrect", false);
    }
    return wrap;
  }

  // ---- Quiz block -------------------------------------------------------------------------
  CruCo.components.quiz = function (block) {
    var S = CruCo.state;
    var testId = block._testId;
    var questions = block.questions || [];
    var titleId = U.uid("quiz-title");
    var status = h("p", { class: "quiz__status", hidden: true }, U.iconEl("checkCircle"), h("span", { text: t("quizCompleted") }));

    function onUpdate() { status.hidden = !S.isTestComplete(testId); }

    var root = h("section", { class: "quiz", attrs: { "aria-labelledby": titleId }, dataset: { testId: testId } },
      h("header", { class: "quiz__head" },
        // Storyboard: "Icon: question icon" on every knowledge check.
        // Client 2026-09-15: AUTOEVALUACIÓN in brand gold, and no meta line.
        h("span", { class: "eyebrow eyebrow--icon eyebrow--gold" }, U.iconEl("question"), t("quizEyebrow")),
        h("h2", {
          class: "quiz__title" + (block.title ? "" : " visually-hidden"),
          attrs: { id: titleId },
          html: block.title ? U.mdInline(block.title) : U.escapeHtml(t("quizEyebrow"))
        }),
        null),
      block.intro ? U.prose(block.intro) : null,
      questions.map(function (q, i) { return renderQuestion(q, i, questions.length, onUpdate); }),
      status);
    onUpdate();
    return root;
  };
})(window.CruCo = window.CruCo || {});
