/* =========================================================================
   media.js — image, video and audio (VO) components
   -------------------------------------------------------------------------
   image : { type:"image", src, alt, caption, aiPrompt, decorative, size }
           src accepts local "assets/..." paths or Google Drive links.
           On load failure a styled placeholder with the alt text is shown.
   video : { type:"video", src, title, script, poster, captions, transcript,
             autoAdvance, startAfterAudio, endText }
           endText -> navy box shown over the last (frozen) frame when it ends
           No src -> static pink placeholder (#FFC0CB) with the script title.
           File src -> custom player (play/pause, stop, seek, speed, CC,
           fullscreen, transcript) as the storyboard requires.
           YouTube/Vimeo/Drive -> <iframe> (provider controls).
   audio : { type:"audio", src, transcript, autoplay }  (screens also accept `audio`)
           Missing/broken file -> inactive bar; transcript stays available.
   Every media node is editable in author mode: it asks CruCo.resolveMedia()
   for overrides and is wrapped by CruCo.editor.decorate() (js/editor.js).
   ========================================================================= */
(function (CruCo) {
  "use strict";

  var U = CruCo.utils;
  var h = U.h;
  var t = U.t;
  CruCo.components = CruCo.components || {};

  var RATES = [1, 1.25, 1.5, 0.75];

  function isDebug() { return !!(CruCo.player && CruCo.player.debug); }
  function editorOn() { return !!(CruCo.editor && CruCo.editor.active); }

  /** HTML comment for developer-only context (never rendered or read aloud). */
  function devComment(label, text) {
    if (!text) return null;
    return document.createComment(" " + label + ": " + String(text).replace(/--/g, "- -") + " ");
  }

  /**
   * Author toolbar for media NESTED in a component (a card image, a timeline
   * illustration, a layer picture…). Top-level blocks, the screen audio and
   * the cover background are framed by the renderer, so they are skipped
   * here — otherwise the piece would show two toolbars.
   */
  function editable(node, kind, path, data) {
    if (!editorOn() || !path || path.indexOf("/") === -1) return node;
    return CruCo.editor.frame(node, { kind: kind, path: path, data: data, name: U.pieceName(kind) });
  }

  function rateLabel(rate) { return String(rate).replace(".", ",") + "x"; }

  // ---- Images -------------------------------------------------------------------
  function imagePlaceholder(opts) {
    var desc = opts.alt ? U.plain(opts.alt) : "";
    var ph = h("div", {
      class: "img-ph",
      attrs: { role: desc ? "img" : null, "aria-label": desc || null, "aria-hidden": desc ? null : "true" }
    },
      U.iconEl("image"),
      h("span", { class: "img-ph__label", text: t("imageUnavailable") }),
      desc ? h("p", { class: "img-ph__desc", text: desc }) : null
    );
    if ((isDebug() || editorOn()) && opts.src) {
      ph.appendChild(h("code", { class: "img-ph__desc", text: opts.src, attrs: { "aria-hidden": "true" } }));
    }
    return ph;
  }

  /** Returns an <img> (or placeholder) for { src, alt, aiPrompt, decorative }. */
  function createImage(opts, path) {
    if (CruCo.isDeleted(path)) {
      return editorOn() ? CruCo.editor.deletedChip(path, U.pieceName("image")) : null;
    }
    opts = CruCo.resolveMedia(path, opts || {});
    var url = U.formatImageUrl(opts.src);
    if (!url) return editable(imagePlaceholder(opts), "image", path, opts);
    if (!opts.alt && !opts.decorative) U.warn("Image without alt text:", opts.src);

    var img = h("img", {
      attrs: {
        src: url,
        alt: opts.decorative ? "" : U.plain(opts.alt || ""),
        loading: "lazy",
        decoding: "async"
      }
    });
    img.addEventListener("error", function onError() {
      img.removeEventListener("error", onError);
      if (img.parentNode) img.parentNode.replaceChild(imagePlaceholder(opts), img);
    });
    var node = img;
    if (opts.aiPrompt) {
      var frag = document.createDocumentFragment();
      frag.appendChild(devComment("AI prompt", opts.aiPrompt));
      frag.appendChild(img);
      node = frag;
    }
    return editable(node, "image", path, opts);
  }

  CruCo.components.image = function (block, ctx) {
    var path = ctx && ctx.path;
    var data = CruCo.resolveMedia(path, block);
    return h("figure", { class: "figure" + (data.size ? " figure--" + data.size : "") },
      createImage(block, path),
      data.caption ? h("figcaption", { html: U.mdInline(data.caption) }) : null
    );
  };

  // ---- Video ----------------------------------------------------------------------
  /** Navy CruCo text box laid over a finished (frozen) video. */
  function endTextBox(text) {
    return h("div", { class: "vp__endtext", attrs: { role: "note" } }, U.prose(text));
  }

  function videoPlaceholder(block, path) {
    var data = CruCo.resolveMedia(path, block);
    var title = U.plain(data.title || "");
    var ph = h("div", {
      class: "video-ph",
      attrs: { role: "img", "aria-label": t("videoPlaceholderAria", { title: title || t("videoPlaceholderLabel") }) }
    },
      h("span", { class: "video-ph__icon", html: U.icon("video") }),
      h("span", { class: "video-ph__label", text: t("videoPlaceholderLabel") }),
      title ? h("p", { class: "video-ph__title", text: title }) : null
    );
    // The end-of-video text belongs to the END of the video (client 2026-09-18),
    // so while the file is pending only the author sees it, in the editor.
    if (data.endText && editorOn()) ph.appendChild(endTextBox(data.endText));
    var wrap = h("div", { class: "block-video" }, devComment("VO/Script", data.script), ph);
    if (isDebug() && data.script) {
      wrap.appendChild(h("div", { class: "dev-marker" },
        h("strong", { text: "VO/Script" }), U.prose(data.script)));
    }
    return editable(wrap, "video", path, block);
  }

  /**
   * Custom video player. The storyboard asks for stop / pause / speed / CC,
   * which native controls expose inconsistently across browsers.
   */
  function createVideoPlayer(data, source, block, path) {
    var title = U.plain(data.title || "");
    var video = h("video", {
      attrs: {
        preload: "metadata",
        playsinline: true,
        poster: data.poster ? U.formatImageUrl(data.poster) : null,
        "aria-label": title || t("videoLabel")
      }
    });

    var track = null;
    if (data.captions) {
      track = h("track", {
        attrs: { kind: "captions", srclang: "es", label: "Español", src: U.resolveAsset(data.captions) }
      });
      video.appendChild(track);
    }

    var playBtn = h("button", { class: "icon-btn vp__play", attrs: { type: "button", "aria-label": t("videoPlay") }, html: U.icon("play") });
    var stopBtn = h("button", { class: "icon-btn", attrs: { type: "button", "aria-label": t("videoStop") }, html: U.icon("stop") });
    var seek = h("input", {
      class: "vp__seek",
      attrs: { type: "range", min: "0", max: "100", step: "0.1", value: "0", "aria-label": t("videoSeek") }
    });
    var time = h("span", { class: "vp__time", text: "0:00 / 0:00", attrs: { "aria-hidden": "true" } });
    var rateIdx = 0;
    var rateBtn = h("button", { class: "vp__rate", attrs: { type: "button", "aria-label": t("videoRate", { rate: "1x" }) }, text: "1x" });
    var ccBtn = h("button", {
      class: "icon-btn vp__cc",
      attrs: { type: "button", "aria-pressed": "false", "aria-label": t(track ? "videoCaptionsShow" : "videoCaptionsNone") },
      html: U.icon("cc")
    });
    if (!track) ccBtn.disabled = true;
    var fsBtn = h("button", { class: "icon-btn", attrs: { type: "button", "aria-label": t("videoFullscreen") }, html: U.icon("expand") });

    var transcriptId = U.uid("vtranscript");
    var transcript = data.transcript
      ? h("div", { class: "vp__transcript", attrs: { id: transcriptId }, hidden: true }, U.prose(data.transcript))
      : null;
    var transcriptBtn = transcript
      ? h("button", {
          class: "btn btn--ghost vp__transcript-btn",
          attrs: { type: "button", "aria-expanded": "false", "aria-controls": transcriptId },
          text: t("videoTranscriptShow")
        })
      : null;

    // `"aspect": "9/16"` — the client's navigation video is a vertical
    // recording (2026-09-22). Without this it would sit in a 16:9 box between
    // two wide navy bands.
    var stage = h("div", { class: "vp__stage" }, video);
    if (data.aspect) stage.style.aspectRatio = String(data.aspect).replace("/", " / ");
    // ML02 screen 3 (storyboard v2): "Video image is frozen when finished. On
    // top, this text on a blue CruCo text box appears on top of the frozen
    // video." A finished <video> keeps showing its last frame, so the box only
    // has to be laid over it.
    var endBox = data.endText ? endTextBox(data.endText) : null;
    if (endBox) { endBox.hidden = true; stage.appendChild(endBox); }
    var bar = h("div", { class: "vp__bar" }, playBtn, stopBtn, seek, time, rateBtn, ccBtn, fsBtn);
    var portrait = (function () {
      var m = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(String(data.aspect || ""));
      return !!m && Number(m[1]) < Number(m[2]);
    })();
    var player = h("div", { class: "vp" + (portrait ? " vp--portrait" : ""), dataset: { state: "idle" }, attrs: { role: "group", "aria-label": title || t("videoLabel") } },
      stage, bar, transcriptBtn, transcript);

    function setPlaying(on) {
      player.dataset.state = on ? "playing" : "paused";
      playBtn.innerHTML = U.icon(on ? "pause" : "play");
      playBtn.setAttribute("aria-label", t(on ? "videoPause" : "videoPlay"));
    }

    function updateTime() {
      var d = isFinite(video.duration) ? video.duration : 0;
      var c = video.currentTime || 0;
      time.textContent = U.formatClock(c) + " / " + U.formatClock(d);
      if (d) {
        seek.value = String((c / d) * 100);
        seek.setAttribute("aria-valuetext", U.formatClock(c) + " / " + U.formatClock(d));
      }
    }

    function play() {
      var p = video.play();
      if (p && p.catch) p.catch(function () { /* autoplay blocked: learner presses play */ });
    }

    playBtn.addEventListener("click", function () { if (video.paused) play(); else video.pause(); });
    stopBtn.addEventListener("click", function () {
      video.pause();
      video.currentTime = 0;
      updateTime();
    });
    seek.addEventListener("input", function () {
      if (isFinite(video.duration)) video.currentTime = (seek.value / 100) * video.duration;
    });
    rateBtn.addEventListener("click", function () {
      rateIdx = (rateIdx + 1) % RATES.length;
      video.playbackRate = RATES[rateIdx];
      rateBtn.textContent = rateLabel(RATES[rateIdx]);
      rateBtn.setAttribute("aria-label", t("videoRate", { rate: rateLabel(RATES[rateIdx]) }));
    });
    ccBtn.addEventListener("click", function () {
      if (!video.textTracks || !video.textTracks.length) return;
      var tt = video.textTracks[0];
      var on = tt.mode !== "showing";
      tt.mode = on ? "showing" : "hidden";
      ccBtn.setAttribute("aria-pressed", String(on));
      ccBtn.setAttribute("aria-label", t(on ? "videoCaptionsHide" : "videoCaptionsShow"));
    });
    fsBtn.addEventListener("click", function () {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
      } else if (player.requestFullscreen) {
        player.requestFullscreen().catch(function () { /* blocked in some iframes */ });
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();               // iOS Safari
      }
    });
    document.addEventListener("fullscreenchange", function () {
      var on = document.fullscreenElement === player;
      fsBtn.innerHTML = U.icon(on ? "collapse" : "expand");
      fsBtn.setAttribute("aria-label", t(on ? "videoExitFullscreen" : "videoFullscreen"));
    });
    if (transcriptBtn) {
      transcriptBtn.addEventListener("click", function () {
        var open = transcript.hidden;
        transcript.hidden = !open;
        transcriptBtn.setAttribute("aria-expanded", String(open));
        transcriptBtn.textContent = t(open ? "videoTranscriptHide" : "videoTranscriptShow");
      });
    }

    video.addEventListener("play", function () { setPlaying(true); });
    video.addEventListener("pause", function () { setPlaying(false); });
    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateTime);
    video.addEventListener("ended", function () {
      setPlaying(false);
      if (endBox) endBox.hidden = false;
      // Storyboard: "Automatically transitions to next slide when ending."
      if (data.autoAdvance && CruCo.player && !editorOn()) CruCo.player.next();
    });
    video.addEventListener("error", function () {
      U.warn("Video could not be loaded, showing placeholder:", data.src);
      if (player.parentNode) player.parentNode.replaceChild(videoPlaceholder(block, path), player);
    });

    if (endBox) video.addEventListener("play", function () { endBox.hidden = true; });

    video.src = source.url;

    // "Transition to founder video": start when the screen narration ends.
    if (data.startAfterAudio) {
      CruCo.media.onScreenAudioEnded(function () { play(); });
    }

    if (CruCo.renderer) {
      CruCo.renderer.onCleanup(function () { try { video.pause(); } catch (e) { /* ignore */ } });
    }

    // `"autoplay": true` — the navigation video starts on its own (client
    // 2026-09-25). The learner reached this screen by pressing Siguiente, so
    // the browser already counts an interaction and lets it play with sound;
    // if it does not, tryPlay starts it at the first tap and the controls are
    // there anyway.
    if (data.autoplay && !editorOn()) {
      setTimeout(function () { tryPlay(video); }, 250);
    }
    return player;
  }

  CruCo.components.video = function (block, ctx) {
    var path = ctx && ctx.path;
    var data = CruCo.resolveMedia(path, block);
    var source = U.formatVideoSource(data.src);

    // `"animation": true` — a short silent clip that plays by itself with the
    // narration, like an illustration that moves (ML03 screen 3, the roles
    // carousel the client sent on 2026-09-22). No controls: there is nothing
    // to operate, and the VO is the one telling the story.
    if (data.animation && source.kind === "file") {
      var clip = h("video", {
        class: "video-anim" + (data.size ? " video-anim--" + data.size : ""),
        attrs: {
          src: source.url, preload: "auto", playsinline: true,
          muted: true, autoplay: true, "aria-hidden": "true", tabindex: "-1"
        }
      });
      clip.muted = true;                       // property, or autoplay is blocked
      clip.defaultMuted = true;
      tryPlay(clip);                           // and again on the first tap
      var figure = h("figure", { class: "figure figure--anim" }, clip,
        data.alt ? h("figcaption", { class: "visually-hidden", text: U.plain(data.alt) }) : null);
      return editable(figure, "video", path, block);
    }
    if (source.kind === "none") {
      // hideWhenEmpty: the slot only exists for the author (editor mode)
      // until a file is set — used where the client will supply the video.
      if (data.hideWhenEmpty && !editorOn()) return null;
      return videoPlaceholder(block, path);
    }

    var title = U.plain(data.title || "");
    if (source.kind === "iframe") {
      return editable(h("div", { class: "video" },
        h("iframe", {
          attrs: {
            src: source.url,
            title: t("videoFrameTitle", { title: title }),
            allow: "autoplay; fullscreen; picture-in-picture; encrypted-media",
            allowfullscreen: true,
            loading: "lazy",
            referrerpolicy: "strict-origin-when-cross-origin"
          }
        })), "video", path, block);
    }
    return editable(createVideoPlayer(data, source, block, path), "video", path, block);
  };

  // ---- Audio player (VO) ----------------------------------------------------------
  function createAudioPlayer(opts, path) {
    opts = CruCo.resolveMedia(path, opts || {});
    if (!opts.src) {
      if (editorOn()) {
        return CruCo.editor.decorate(h("div", { class: "audio audio--empty" },
          h("span", { class: "audio__error", text: t("audioUnavailable") })), { kind: "audio", path: path, data: opts });
      }
      if (isDebug() && opts.transcript) {
        return h("div", { class: "dev-marker" }, h("strong", { text: "VO" }), U.prose(opts.transcript));
      }
      return null;
    }

    var transcriptId = U.uid("transcript");
    var audio = h("audio", { attrs: { preload: "metadata" } });
    var playBtn = h("button", { class: "icon-btn audio__play", attrs: { type: "button", "aria-label": t("audioPlay") }, html: U.icon("play") });
    var seek = h("input", {
      class: "audio__seek",
      attrs: { type: "range", min: "0", max: "100", step: "0.1", value: "0", "aria-label": t("audioSeek") }
    });
    var time = h("span", { class: "audio__time", text: "0:00 / 0:00", attrs: { "aria-hidden": "true" } });
    var rateIdx = 0;
    var rateBtn = h("button", { class: "audio__rate", attrs: { type: "button", "aria-label": t("audioRate", { rate: "1x" }) }, text: "1x" });
    var transcript = opts.transcript
      ? h("div", { class: "audio__transcript", attrs: { id: transcriptId }, hidden: true }, U.prose(opts.transcript))
      : null;
    var transcriptBtn = transcript
      ? h("button", {
          class: "btn btn--ghost audio__transcript-btn",
          attrs: { type: "button", "aria-expanded": "false", "aria-controls": transcriptId }
        },
          // Client V2 2026-09-15: on a phone only the icon is shown (the label
          // is hidden visually but still names the button for screen readers).
          U.iconEl("transcript"),
          h("span", { class: "audio__transcript-label", text: t("audioTranscriptShow") }))
      : null;
    var errorMsg = h("span", { class: "audio__error", text: t("audioUnavailable"), hidden: true });

    var root = h("div", { class: "audio", attrs: { role: "group", "aria-label": t("audioLabel") }, dataset: { state: "idle" } },
      h("div", { class: "audio__bar" }, playBtn, seek, time, rateBtn, transcriptBtn),
      errorMsg,
      transcript,
      audio
    );

    function setPlaying(on) {
      root.dataset.state = on ? "playing" : "paused";
      playBtn.innerHTML = U.icon(on ? "pause" : "play");
      playBtn.setAttribute("aria-label", t(on ? "audioPause" : "audioPlay"));
    }

    function updateTime() {
      var d = isFinite(audio.duration) ? audio.duration : 0;
      var c = audio.currentTime || 0;
      time.textContent = U.formatClock(c) + " / " + U.formatClock(d);
      if (d) {
        seek.value = String((c / d) * 100);
        seek.setAttribute("aria-valuetext", U.formatClock(c) + " / " + U.formatClock(d));
      }
    }

    playBtn.addEventListener("click", function () {
      if (audio.paused) { var p = audio.play(); if (p && p.catch) p.catch(function () { /* blocked */ }); }
      else audio.pause();
    });
    seek.addEventListener("input", function () {
      if (isFinite(audio.duration)) audio.currentTime = (seek.value / 100) * audio.duration;
    });
    rateBtn.addEventListener("click", function () {
      rateIdx = (rateIdx + 1) % RATES.length;
      audio.playbackRate = RATES[rateIdx];
      rateBtn.textContent = rateLabel(RATES[rateIdx]);
      rateBtn.setAttribute("aria-label", t("audioRate", { rate: rateLabel(RATES[rateIdx]) }));
    });
    if (transcriptBtn) {
      transcriptBtn.addEventListener("click", function () {
        var open = transcript.hidden;
        transcript.hidden = !open;
        transcriptBtn.setAttribute("aria-expanded", String(open));
        transcriptBtn.querySelector(".audio__transcript-label").textContent =
          t(open ? "audioTranscriptHide" : "audioTranscriptShow");
      });
    }

    audio.addEventListener("play", function () { setPlaying(true); });
    audio.addEventListener("pause", function () { setPlaying(false); });
    audio.addEventListener("ended", function () { setPlaying(false); media.fireAudioEnded(); });
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateTime);
    audio.addEventListener("error", function () {
      U.warn("Audio file unavailable:", opts.src);
      root.dataset.state = "error";
      [playBtn, seek, rateBtn].forEach(function (n) { n.disabled = true; });
      errorMsg.hidden = false;
      media.fireAudioEnded();                 // reveals anything waiting for the VO
      if (!transcript && !editorOn()) root.hidden = true;
    });

    audio.src = U.resolveAsset(opts.src);
    if (!media.screenAudio) media.screenAudio = audio;   // drives timed reveals

    if (CruCo.renderer) {
      CruCo.renderer.onCleanup(function () { try { audio.pause(); } catch (e) { /* ignore */ } });
    }

    var autoplay = opts.autoplay != null ? opts.autoplay : (CruCo.config && CruCo.config.AUDIO_AUTOPLAY);
    if (autoplay && !editorOn()) {
      setTimeout(function () { tryPlay(audio); }, 300);
    }
    return editable(root, "audio", path, opts);
  }

  CruCo.components.audio = function (block, ctx) {
    return createAudioPlayer(block, ctx && ctx.path);
  };

  // ---- Sound effects (storyboard: "When correct: cheering noise") ---------
  var sfxCache = {};

  function sfxElement(name) {
    if (Object.prototype.hasOwnProperty.call(sfxCache, name)) return sfxCache[name];
    var cfg = (CruCo.config && CruCo.config.SFX) || {};
    var list = [].concat(cfg[name] || []);
    if (!list.length) { sfxCache[name] = null; return null; }
    var el = document.createElement("audio");
    el.preload = "auto";
    el.dataset.sfx = "true";            // exempt from media.stopAll()
    list.forEach(function (src) {
      el.appendChild(h("source", { attrs: { src: U.resolveAsset(src) } }));
    });
    el.volume = typeof cfg.volume === "number" ? cfg.volume : 0.6;
    sfxCache[name] = el;
    return el;
  }

  /** Starts the narration; if the browser blocks it, retries on the learner's
      first interaction so the VO still opens the screen (client 2026-09-15). */
  function tryPlay(audio) {
    var p;
    try { p = audio.play(); } catch (e) { p = null; }
    if (!p || !p.catch) return;
    p.catch(function () {
      var events = ["pointerdown", "keydown", "touchstart"];
      var retry = function () {
        events.forEach(function (ev) { document.removeEventListener(ev, retry, true); });
        if (audio.isConnected && audio.paused && !audio.currentTime) {
          try { audio.play(); } catch (e) { /* give up quietly */ }
        }
      };
      events.forEach(function (ev) { document.addEventListener(ev, retry, true); });
      if (CruCo.renderer) {
        CruCo.renderer.onCleanup(function () {
          events.forEach(function (ev) { document.removeEventListener(ev, retry, true); });
        });
      }
    });
  }

  // ---- Screen audio hooks (timed reveals, "start after VO") ---------------
  var audioEndedHandlers = [];

  var media = {
    createImage: createImage,
    imagePlaceholder: imagePlaceholder,
    createAudioPlayer: createAudioPlayer,
    screenAudio: null,

    /** Registered per screen; cleared by the renderer on screen change. */
    onScreenAudioEnded: function (fn) { audioEndedHandlers.push(fn); },
    fireAudioEnded: function () {
      audioEndedHandlers.splice(0).forEach(function (fn) {
        try { fn(); } catch (e) { U.warn("audio-ended handler failed", e); }
      });
    },
    resetScreenAudio: function () {
      audioEndedHandlers.length = 0;
      media.screenAudio = null;
    },

    /** Client 2026-09-15: leaving a screen cuts any audio or video playing.
        Called before the leave animation, so the sound stops with the click. */
    stopAll: function (root) {
      var scope = root || document;
      var nodes = scope.querySelectorAll("audio, video");
      Array.prototype.forEach.call(nodes, function (el) {
        if (el.dataset && el.dataset.sfx === "true") return;   // short cues may finish
        try {
          el.pause();
          el.currentTime = 0;
        } catch (e) { /* ignore */ }
      });
    },

    playSfx: function (name) {
      var el = sfxElement(name);
      if (!el) return;
      try {
        el.currentTime = 0;
        var p = el.play();
        if (p && p.catch) p.catch(function () { /* blocked before first interaction */ });
      } catch (e) { /* ignore */ }
    }
  };

  CruCo.media = media;
})(window.CruCo = window.CruCo || {});
