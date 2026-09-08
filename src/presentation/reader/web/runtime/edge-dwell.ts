/**
 * Dwell-at-the-edge page turning during any selection drag.
 *
 * Browser-side (WKWebView / Android WebView) JS as a plain string -- one chunk of
 * the Reader runtime's single script scope; see runtime/index.ts for ordering.
 * ES5-style on purpose; do not modernise.
 */
export const EDGE_DWELL = `  /* ---------- dwell-at-the-edge page turning (during any selection drag) ----------
     #root.paged is overflow:hidden, so nothing auto-scrolls while a drag sits at
     the screen edge — hold the finger there and the page turns under the drag. */
  var EDGE_DWELL_MS = 480;
  var edgeTimer = null;
  var edgeDir = 0;
  function cancelEdgeTurn() {
    if (edgeTimer) { clearTimeout(edgeTimer); edgeTimer = null; }
    edgeDir = 0;
  }
  function updateEdgeDwell(x) {
    var dir = x > window.innerWidth - 36 ? 1 : x < 36 ? -1 : 0;
    if (dir === edgeDir) return;
    cancelEdgeTurn();
    edgeDir = dir;
    if (dir === 0) return;
    edgeTimer = setTimeout(function () {
      edgeTimer = null;
      var target = Math.max(0, Math.min(state.pageCount - 1, currentPage() + dir));
      if (target === currentPage()) return;
      // Instant, not animated: an animation would fight the live drag. The
      // overlay lives in content coordinates, so it rides along untouched.
      root.scrollLeft = target * pageStep;
      state.page = target;
      report();
      edgeDir = 0;
    }, EDGE_DWELL_MS);
  }`;
