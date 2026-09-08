/**
 * Paged-mode gestures: finger-tracking page drag, snap animation, curl-lite
 * edge shade, and programmatic page turns.
 *
 * Browser-side (WKWebView / Android WebView) JS as a plain string -- one chunk of
 * the Reader runtime's single script scope; see runtime/index.ts for ordering.
 * ES5-style on purpose; do not modernise.
 */
export const PAGE_GESTURES = `  /* ---------- paged-mode gestures (finger-tracking slide + snap) ---------- */
  var drag = null;
  var snapAnim = null;
  function animateScrollLeft(target, ms) {
    if (snapAnim) cancelAnimationFrame(snapAnim);
    var from = root.scrollLeft; var start = null;
    function step(ts) {
      if (start == null) start = ts;
      var t = Math.min(1, (ts - start) / ms);
      var eased = 1 - Math.pow(1 - t, 3);
      root.scrollLeft = from + (target - from) * eased;
      if (curlShade) updateShade();
      if (t < 1) snapAnim = requestAnimationFrame(step);
      else { snapAnim = null; hideShade(); report(); }
    }
    snapAnim = requestAnimationFrame(step);
  }
  function updateShade() {
    var within = root.scrollLeft % pageStep;
    if (within < 2 || within > pageStep - 2) { hideShade(); return; }
    var edge = pageStep - within;
    shade.style.opacity = String(Math.min(0.9, within / pageStep * 1.6));
    shade.style.left = (edge - 21) + 'px';
  }
  function hideShade() { shade.style.opacity = '0'; }

  root.addEventListener('touchstart', function (e) {
    if (!paged || e.touches.length !== 1) return;
    if (snapAnim) { cancelAnimationFrame(snapAnim); snapAnim = null; }
    drag = { x: e.touches[0].clientX, y: e.touches[0].clientY, left: root.scrollLeft, t: Date.now(), active: false };
    // The same touch may instead become a word selection (see the paged-mode
    // selection section): a stationary hold wins over a page drag.
    armLongPress(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  root.addEventListener('touchmove', function (e) {
    if (!paged) return;
    var t = e.touches[0];
    if (lp && (Math.abs(t.clientX - lp.x) > LP_SLOP || Math.abs(t.clientY - lp.y) > LP_SLOP)) cancelLongPress();
    if (lpExtend) {
      // Press-drag after the long-press: grow the selection, never turn pages.
      e.preventDefault();
      extendPagedSelTo(t.clientX, t.clientY);
      updateEdgeDwell(t.clientX);
      return;
    }
    if (!drag) return;
    if (pagedSel) { drag = null; return; }
    var dx = t.clientX - drag.x;
    var dy = t.clientY - drag.y;
    if (!drag.active) {
      if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      drag.active = true;
    }
    e.preventDefault();
    root.scrollLeft = Math.max(0, Math.min((state.pageCount - 1) * pageStep, drag.left - dx));
    if (curlShade) updateShade();
  }, { passive: false });

  root.addEventListener('touchend', function (e) {
    if (!paged) return;
    cancelLongPress();
    if (lpExtend) {
      lpExtend = null;
      cancelEdgeTurn();
      armClickSuppression();
      return;
    }
    if (!drag) return;
    var wasActive = drag.active;
    var dx = (e.changedTouches[0] ? e.changedTouches[0].clientX : drag.x) - drag.x;
    var dt = Date.now() - drag.t;
    drag = null;
    if (!wasActive) return;
    var current = root.scrollLeft / pageStep;
    var target;
    var fast = dt < 260 && Math.abs(dx) > 32;
    if (fast || Math.abs(dx) > pageStep * 0.28) {
      target = dx < 0 ? Math.ceil(current) : Math.floor(current);
    } else {
      target = Math.round(current);
    }
    target = Math.max(0, Math.min(state.pageCount - 1, target));
    animateScrollLeft(target * pageStep, 240);
  }, { passive: true });

  function goPage(delta) {
    // A deliberate turn overrides any pending dwell-driven one. The selection,
    // if any, is painted in content coordinates and simply rides along.
    cancelEdgeTurn();
    var target = Math.max(0, Math.min(state.pageCount - 1, state.page + delta));
    animateScrollLeft(target * pageStep, 240);
  }`;
