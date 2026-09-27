/* =========================================================================
   courseConfig.js — global course settings (single source of truth)
   -------------------------------------------------------------------------
   Read by the player AND by 04-Build/build.py.
   Edit only the values between the <config> markers. Keep JSON syntax
   (double quotes, no trailing commas). // comments are allowed.
   ========================================================================= */
window.CruCo = window.CruCo || {};

CruCo.config = /*<config>*/ {
  // ---- Identity ------------------------------------------------------------
  "COURSE_ID": "cruco-sommelier-profesional",
  "COURSE_TITLE": "Sommelier Profesional Método CruCo",
  // Bump whenever an already-published storyboard is re-injected with changes.
  "CONTENT_VERSION": "1.0.0",

  // ---- Content ----------------------------------------------------------------
  // Storyboard data files (in content/), in course order. Appending a
  // storyboard = add its file here; its screens follow the previous ones.
  // The approved table of contents, whole (client 2026-09-23). The menu is
  // built from it: produced lessons are links, the rest are listed as pending.
  "COURSE_MAP": "mapa-del-curso.js",

  "STORYBOARDS": [
    "storyboard-ml01-bienvenida.js",
    "storyboard-ml01-rol-del-sommelier.js",
    "storyboard-ml02-areas-de-accion.js",
    "storyboard-ml03-valor-estrategico.js"
  ],
  // Media replacements exported from the editor. Leave empty until the file
  // exists; the build sets it on its own when content/overrides.js is there.
  "OVERRIDES": "",

  // ---- Completion (non-graded) ----------------------------------------------
  // A screen counts as "done" when visited AND all its knowledge checks are
  // completed. Course is complete when done/total >= COMPLETION_THRESHOLD
  // and, if REQUIRE_ALL_TESTS, every knowledge check is completed.
  "COMPLETION_THRESHOLD": 0.85,
  "REQUIRE_ALL_TESTS": true,
  // "attempted": a check is completed once answered (retry is optional).
  // "correct":   a check is completed only when answered correctly.
  // Owner decision 2026-09-15: learners do NOT need the right answer to move on.
  "TEST_COMPLETION_RULE": "attempted",

  // ---- SCORM ------------------------------------------------------------------
  "SCORM": {
    "VERSION": "auto",             // "auto" | "1.2" | "2004"
    "SCORE_MODE": "progress",      // "progress": score.raw = % progress | "none"
    "EXIT_MODE": "suspend",        // cmi.core.exit on unload: "suspend" | ""
    "COMMIT_DEBOUNCE_MS": 800,
    "MOCK_PERSIST": true,          // no LMS: keep mock data in localStorage
    "MOCK_LOG": true               // no LMS: log every API call to the console
  },

  // ---- Navigation -------------------------------------------------------------
  // "sequential": a screen opens when every previous screen is done (visited
  // + checks answered) — matches the course tutorial ("sigue el orden
  // establecido", "cada lección completada te permitirá avanzar").
  "NAVIGATION_MODE": "sequential",
  "RESUME": "prompt",              // "prompt" | "auto" | "never"
  "SIDEBAR_DEFAULT": "open",       // desktop default: "open" | "closed"

  // Client 2026-09-21, so every screen behaves the same: "Siguiente" is never
  // live the instant a screen opens. It waits this long on a screen with
  // nothing to wait for; where there is a check, it waits for the answer, and
  // where the content still appears, it waits for the content.
  "NAV_MIN_MS": 3000,

  // ---- Storyline-style stage --------------------------------------------------
  // Each screen is a fixed 16:9 slide scaled to the window (like Storyline's
  // stage). Narrow or short windows (phones, split screens, strong browser
  // zoom) fall back to the responsive layout so text stays readable.
  "SLIDE": {
    "ENABLED": true,
    // 16:9 design size. Smaller than Storyline's 1280x720 so that a common
    // 1366px laptop with the menu open still gets the slide instead of
    // falling back to the responsive layout.
    "WIDTH": 1120,
    "HEIGHT": 630,
    "MIN_VIEWPORT_W": 900,         // below this width: responsive layout
    "MIN_VIEWPORT_H": 520,
    "MIN_SCALE": 0.78,             // below this zoom-out: responsive layout
    "MAX_SCALE": 1.5
  },
  // Slide change + staggered entrance of each block (Storyline timeline feel).
  "TRANSITIONS": true,

  // ---- Media ------------------------------------------------------------------
  // Prefix for local asset paths written as "assets/...". The prototype lives
  // one folder below 10-Web/, hence "../". The build overrides it to "".
  "ASSET_BASE": "../",
  // Storyboard: "VO starts with the new screen".
  "AUDIO_AUTOPLAY": true,
  // Storyboard: "When correct: cheering noise". Placeholder chime generated
  // for CruCo — replace both files to use a real recording.
  "SFX": {
    "correct": ["assets/audio/sfx/correcto.m4a", "assets/audio/sfx/correcto.wav"],
    "volume": 0.5
  },
  // Safety net: remove English instruction notes written as -like this-.
  "STRIP_INSTRUCTION_NOTES": true,

  // ---- Ayuda: support contact (empty fields are not shown) --------------------
  "SUPPORT": {
    "whatsapp": "+507 6830 9129",
    "email": "info@crucowine.com",
    "location": "Ciudad de Panamá, Panamá",
    "phone": "",
    "hours": "",
    "url": ""
  },

  // ---- Descargas: course-wide files (storyboard downloads are added too) -----
  // { "title": "...", "file": "assets/downloads/x.pdf", "description": "...", "size": "1,2 MB" }
  "DOWNLOADS": [],

  // ---- Development ----------------------------------------------------------
  "DEBUG": false,                  // or add ?debug=1 to the URL
  // Author mode (edit buttons on every image/video/audio): ?edit=1 in the
  // prototype, or build.py --editor for a review package. The LMS build
  // always ships with EDITOR false and ALLOW_URL_FLAGS false.
  "EDITOR": false,
  "ALLOW_URL_FLAGS": true          // ?debug=1, ?demo=1, ?edit=1, ?screen=ID
} /*</config>*/;
