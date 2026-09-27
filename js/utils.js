/* =========================================================================
   utils.js — shared helpers (no dependencies)
   i18n lookup, DOM builder, safe markdown-lite, asset/Drive URL handling,
   instruction-note stripping, text normalization, icons, a11y helpers.
   ========================================================================= */
(function (CruCo) {
  "use strict";

  var cfg = function () { return CruCo.config || {}; };

  // ---- Logging -------------------------------------------------------------
  function warn() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("[CruCo]");
    console.warn.apply(console, args);
  }

  // ---- i18n ------------------------------------------------------------------
  function fmt(str, params) {
    if (!params) return str;
    return String(str).replace(/\{(\w+)\}/g, function (m, k) {
      return params[k] != null ? params[k] : m;
    });
  }

  /** Learner-facing string. Missing keys return "" (never an English key). */
  function t(key, params) {
    var s = CruCo.strings && CruCo.strings[key];
    if (s == null) {
      warn("Missing UI string:", key);
      return "";
    }
    return fmt(s, params);
  }

  // ---- DOM builder ------------------------------------------------------------
  /**
   * h("button", { class: "btn", attrs: { "aria-expanded": "false" },
   *               on: { click: fn }, text: "Hola" }, child1, child2)
   */
  function h(tag, props) {
    var node = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (key) {
      var val = props[key];
      if (val == null || val === false) return;
      if (key === "class") node.className = val;
      else if (key === "text") node.textContent = val;
      else if (key === "html") node.innerHTML = val;
      else if (key === "attrs") {
        Object.keys(val).forEach(function (a) {
          if (val[a] != null && val[a] !== false) node.setAttribute(a, val[a] === true ? "" : val[a]);
        });
      } else if (key === "on") {
        Object.keys(val).forEach(function (ev) { node.addEventListener(ev, val[ev]); });
      } else if (key === "dataset") {
        Object.keys(val).forEach(function (d) { node.dataset[d] = val[d]; });
      } else {
        node[key] = val;
      }
    });
    for (var i = 2; i < arguments.length; i++) append(node, arguments[i]);
    return node;
  }

  function append(parent, child) {
    if (child == null || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { append(parent, c); }); return; }
    parent.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }

  var idCounter = 0;
  function uid(prefix) {
    idCounter += 1;
    return (prefix || "id") + "-" + idCounter;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ---- Instruction notes ----------------------------------------------------
  // Storyboards may embed English production notes as -like this-. Spanish
  // also uses hyphens for asides ("-dijo-"), so a segment is only treated as
  // a note when it looks English: no Spanish letters and at least one
  // English marker word. Authoritative stripping happens when a storyboard
  // is converted to data; this is the runtime safety net.
  var NOTE_RE = /(^|\s)-(?=\S)([^\n-]*?\S)-(?=$|[\s.,;:!?)\]»"'])/g;
  var SPANISH_CHARS = /[áéíóúüñ¿¡]/i;
  // Only words that are NOT also Spanish ("video", "audio", "todo" are excluded).
  var ENGLISH_MARKERS = /\b(the|and|of|to|with|for|on|show|shows|click|add|insert|use|image|animation|animate|appear|appears|button|screen|slide|here|this|that|fade|when|then|after|before|layer|trigger|text|icon|background|note|see|placeholder|tbd|voice|over|sfx|music|popup|hover|highlight)\b/i;

  function looksLikeNote(segment) {
    return !SPANISH_CHARS.test(segment) && ENGLISH_MARKERS.test(segment);
  }

  /** Returns { text, notes[] } with English -notes- removed. */
  function stripInstructionNotes(text) {
    var notes = [];
    if (typeof text !== "string" || text.indexOf("-") === -1) return { text: text, notes: notes };
    var out = text.replace(NOTE_RE, function (match, lead, inner) {
      if (!looksLikeNote(inner)) return match;
      notes.push(inner.trim());
      return lead;
    });
    out = out.replace(/[ \t]{2,}/g, " ").replace(/ +([.,;:!?])/g, "$1").replace(/^[ \t]+|[ \t]+$/gm, "");
    return { text: out, notes: notes };
  }

  function cleanText(text) {
    if (!cfg().STRIP_INSTRUCTION_NOTES) return text;
    var res = stripInstructionNotes(text);
    if (res.notes.length) warn("Instruction note(s) removed from on-screen text:", res.notes);
    return res.text;
  }

  // ---- Markdown-lite (safe) --------------------------------------------------
  // Supports: paragraphs (blank line), line breaks, "- " / "1. " lists,
  // **bold**, *italic*, [text](url), [[term]] / [[term|shown text]].
  function inline(s) {
    var tokens = [];
    var keep = function (html) { tokens.push(html); return "\u0001" + (tokens.length - 1) + "\u0002"; };

    s = escapeHtml(s);
    s = s.replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, function (m, term, shown) {
      return keep('<button type="button" class="term" data-term="' + term.trim() + '">' + (shown || term).trim() + "</button>");
    });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, label, url) {
      var safe = /^(https?:|mailto:|tel:|#|assets\/)/i.test(url) ? url : "#";
      if (/^assets\//i.test(safe)) safe = resolveAsset(safe);
      var ext = /^https?:/i.test(safe) ? ' target="_blank" rel="noopener"' : "";
      return keep('<a href="' + safe + '"' + ext + ">" + label + "</a>");
    });
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>");
    s = s.replace(/\n/g, "<br>");
    return s.replace(/\u0001(\d+)\u0002/g, function (m, i) { return tokens[+i]; });
  }

  function md(text) {
    if (text == null || text === "") return "";
    var src = cleanText(String(text)).replace(/\r\n?/g, "\n").trim();
    return src.split(/\n{2,}/).map(function (block) {
      var lines = block.split("\n");
      if (lines.every(function (l) { return /^\s*[-*•]\s+/.test(l); })) {
        return "<ul>" + lines.map(function (l) { return "<li>" + inline(l.replace(/^\s*[-*•]\s+/, "")) + "</li>"; }).join("") + "</ul>";
      }
      if (lines.every(function (l) { return /^\s*\d+[.)]\s+/.test(l); })) {
        return "<ol>" + lines.map(function (l) { return "<li>" + inline(l.replace(/^\s*\d+[.)]\s+/, "")) + "</li>"; }).join("") + "</ol>";
      }
      return "<p>" + inline(block) + "</p>";
    }).join("");
  }

  /** Inline-only markdown (no <p>), for legends, labels and titles. */
  function mdInline(text) {
    if (text == null || text === "") return "";
    return inline(cleanText(String(text)).trim());
  }

  /** Plain text (for aria-labels, titles): notes stripped, markup removed. */
  function plain(text) {
    return cleanText(String(text == null ? "" : text))
      .replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, function (m, a, b) { return b || a; })
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*?(.+?)\*\*?/g, "$1")
      .trim();
  }

  function prose(text, extraClass) {
    return h("div", { class: "prose" + (extraClass ? " " + extraClass : ""), html: md(text) });
  }

  // ---- Assets & Google Drive ---------------------------------------------------
  var DRIVE_PATTERNS = [
    /drive\.google\.com\/file\/d\/([-\w]{10,})/i,
    /drive\.google\.com\/(?:open|uc|thumbnail)\?(?:[^#]*&)?id=([-\w]{10,})/i,
    /docs\.google\.com\/(?:uc|file\/d\/)(?:\?(?:[^#]*&)?id=)?([-\w]{10,})/i,
    /lh3\.googleusercontent\.com\/d\/([-\w]{10,})/i
  ];

  function getDriveFileId(url) {
    if (typeof url !== "string") return null;
    for (var i = 0; i < DRIVE_PATTERNS.length; i++) {
      var m = url.match(DRIVE_PATTERNS[i]);
      if (m) return m[1];
    }
    return null;
  }

  /** Local "assets/..." paths get ASSET_BASE; absolute URLs pass through. */
  function resolveAsset(path) {
    if (!path || typeof path !== "string") return "";
    var p = path.trim();
    if (/^(https?:|data:|blob:|\/\/|\/)/i.test(p)) return p;
    return (cfg().ASSET_BASE || "") + p.replace(/^\.\//, "");
  }

  /**
   * Spec: converts Google Drive share links into direct image URLs
   * (https://lh3.googleusercontent.com/d/FILE_ID). If the build localized
   * the file (build.py --localize-drive -> assets/drive/), the local copy
   * wins, so the course keeps working offline.
   */
  function formatImageUrl(url) {
    if (!url || typeof url !== "string") return "";
    var id = getDriveFileId(url);
    if (id) {
      var local = CruCo.assetMap && CruCo.assetMap[id];
      return local ? resolveAsset(local) : "https://lh3.googleusercontent.com/d/" + id;
    }
    return resolveAsset(url);
  }

  /** Classifies a video source: none | file | iframe (Drive/YouTube/Vimeo/embed). */
  function formatVideoSource(src) {
    if (!src || typeof src !== "string" || !src.trim()) return { kind: "none" };
    var s = src.trim();
    var id = getDriveFileId(s);
    if (id) {
      var local = CruCo.assetMap && CruCo.assetMap[id];
      if (local) return { kind: "file", url: resolveAsset(local) };
      return { kind: "iframe", url: "https://drive.google.com/file/d/" + id + "/preview" };
    }
    var yt = s.match(/(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/)|youtu\.be\/)([-\w]{6,})/i);
    if (yt) return { kind: "iframe", url: "https://www.youtube-nocookie.com/embed/" + yt[1] };
    var vimeo = s.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vimeo) return { kind: "iframe", url: "https://player.vimeo.com/video/" + vimeo[1] };
    if (/\.(mp4|webm|ogv|m4v|mov)(\?|#|$)/i.test(s)) return { kind: "file", url: resolveAsset(s) };
    if (/^https?:/i.test(s)) return { kind: "iframe", url: s };
    return { kind: "file", url: resolveAsset(s) };
  }

  // ---- Text helpers -------------------------------------------------------------
  /** Lowercase, accent-insensitive, trimmed (for search and fill-in answers). */
  function normalize(s) {
    return String(s == null ? "" : s)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  }

  /** Lowercase + accents removed, same length as the input (for highlighting). */
  function fold(s) {
    return String(s == null ? "" : s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function formatClock(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  // ---- Icons (inline SVG, stroke-based, 24x24) ---------------------------------
  var ICONS = {
    menu: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>',
    close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    chevronLeft: '<polyline points="15 18 9 12 15 6"/>',
    chevronRight: '<polyline points="9 18 15 12 9 6"/>',
    chevronDown: '<polyline points="6 9 12 15 18 9"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><polyline points="16 9.5 10.8 15 8 12.2"/>',
    circle: '<circle cx="12" cy="12" r="8"/>',
    pending: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>',
    xCircle: '<circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    search: '<circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.2" y2="16.2"/>',
    list: '<line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.2 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4.5"/><line x1="12" y1="17.5" x2="12.01" y2="17.5"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    transcript: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/>',
    play: '<polygon points="7 4 20 12 7 20 7 4" fill="currentColor"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>',
    video: '<rect x="2" y="5" width="14" height="14" rx="2"/><polygon points="22 7 16 12 22 17 22 7"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="11"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    bulb: '<path d="M12 2.5a6.5 6.5 0 0 0-3.9 11.7c.6.5 1 1.2 1.1 2l.1.8h5.4l.1-.8c.1-.8.5-1.5 1.1-2A6.5 6.5 0 0 0 12 2.5z"/><line x1="9.4" y1="19.4" x2="14.6" y2="19.4"/><line x1="10.2" y1="21.8" x2="13.8" y2="21.8"/><path d="M10.4 8.6 12 12l1.6-3.4"/>',
    retry: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    arrowUp: '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
    arrowDown: '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
    rotate: '<path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
    bottle: '<path d="M7.6 22v-7.6c0-2.6 2.6-3.9 2.6-5.2V2.6h3.6v6.6c0 1.3 2.6 2.6 2.6 5.2V22"/><line x1="10.2" y1="5.4" x2="13.8" y2="5.4"/><line x1="7.8" y1="16.4" x2="16.2" y2="16.4"/>',
    dollar: '<line x1="12" y1="2.4" x2="12" y2="21.6"/><path d="M16.6 6.6H10a3.2 3.2 0 0 0 0 6.4h4a3.2 3.2 0 0 1 0 6.4H7.2"/>',
    award: '<circle cx="12" cy="8" r="6"/><polyline points="8.2 13.4 7 22 12 19 17 22 15.8 13.4"/>',
    // Storyboard icons: "Key message icon", "question icon", "WhatsApp icon".
    key: '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2 20 3"/><path d="M17 6l2.5 2.5"/><path d="M14.5 8.5 17 11"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.3 9.2a2.8 2.8 0 0 1 5.4.9c0 1.9-2.7 2.4-2.7 4.1"/><line x1="12" y1="17.6" x2="12.01" y2="17.6"/>',
    whatsapp: '<path d="M20.2 11.6a8.2 8.2 0 0 1-12.2 7.2L3.8 20l1.3-4a8.2 8.2 0 1 1 15.1-4.4z"/><path d="M9.2 9c.3 1.3 1.2 2.8 2.3 3.8 1 1 2.2 1.6 3.3 1.9l.9-1.4-2-1-.9.8a7 7 0 0 1-2.4-2.5l.8-.8-1-2z" fill="currentColor" stroke="none"/>',
    // Media + editor controls
    stop: '<rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none"/>',
    cc: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M10 10.3a2.4 2.4 0 1 0 0 3.4"/><path d="M17 10.3a2.4 2.4 0 1 0 0 3.4"/>',
    expand: '<polyline points="4 9 4 4 9 4"/><polyline points="15 4 20 4 20 9"/><polyline points="20 15 20 20 15 20"/><polyline points="9 20 4 20 4 15"/>',
    collapse: '<polyline points="9 4 9 9 4 9"/><polyline points="20 9 15 9 15 4"/><polyline points="15 20 15 15 20 15"/><polyline points="4 15 9 15 9 20"/>',
    pencil: '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><line x1="14.5" y1="6.5" x2="17.5" y2="9.5"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 8 12 3 17 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>'
  };

  function icon(name, cls) {
    return '<svg class="icon' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      (ICONS[name] || "") + "</svg>";
  }

  function iconEl(name, cls) {
    var tpl = document.createElement("template");
    tpl.innerHTML = icon(name, cls);
    return tpl.content.firstChild;
  }

  // ---- Accessibility helpers ------------------------------------------------------
  var liveRegion = null;
  function announce(msg) {
    if (!liveRegion) liveRegion = document.getElementById("live-region");
    if (!liveRegion || !msg) return;
    liveRegion.textContent = "";
    setTimeout(function () { liveRegion.textContent = msg; }, 40);
  }

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

  /** Keeps Tab inside `container`. Returns a release function. */
  function trapFocus(container) {
    function onKey(e) {
      if (e.key !== "Tab") return;
      var items = Array.prototype.filter.call(container.querySelectorAll(FOCUSABLE), function (n) {
        return n.offsetParent !== null || n === document.activeElement;
      });
      if (!items.length) { e.preventDefault(); return; }
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener("keydown", onKey);
    return function () { container.removeEventListener("keydown", onKey); };
  }

  /** Spanish name of a piece ("Imagen", "Actividad"…) for the editor UI. */
  function pieceName(type) {
    var names = (CruCo.strings && CruCo.strings.pieceNames) || {};
    return names[type] || names.piece || "";
  }

  function getUrlFlag(name) {
    if (!cfg().ALLOW_URL_FLAGS) return null;
    try { return new URLSearchParams(window.location.search).get(name); } catch (e) { return null; }
  }

  CruCo.utils = {
    warn: warn, fmt: fmt, t: t, h: h, append: append, uid: uid, escapeHtml: escapeHtml,
    stripInstructionNotes: stripInstructionNotes, cleanText: cleanText, md: md, mdInline: mdInline, plain: plain, prose: prose,
    getDriveFileId: getDriveFileId, resolveAsset: resolveAsset, formatImageUrl: formatImageUrl,
    formatVideoSource: formatVideoSource, normalize: normalize, fold: fold, shuffle: shuffle, formatClock: formatClock,
    icon: icon, iconEl: iconEl, announce: announce, trapFocus: trapFocus, getUrlFlag: getUrlFlag,
    pieceName: pieceName
  };

  // Spec name: expose formatImageUrl globally as well.
  window.formatImageUrl = formatImageUrl;
})(window.CruCo = window.CruCo || {});
