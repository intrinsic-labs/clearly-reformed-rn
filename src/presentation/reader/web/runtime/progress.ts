/**
 * Progress reporting: fraction + first-visible character offset, posted to RN
 * (throttled per frame in scroll mode, debounced in paged mode).
 *
 * Browser-side (WKWebView / Android WebView) JS as a plain string -- one chunk of
 * the Reader runtime's single script scope; see runtime/index.ts for ordering.
 * ES5-style on purpose; do not modernise.
 */
export const PROGRESS = `  /* ---------- progress reporting ---------- */
  var reportTimer = null;
  var reportFrame = null;
  function scheduleReport() {
    if (!paged && window.requestAnimationFrame) {
      if (reportFrame) return;
      reportFrame = requestAnimationFrame(function () { reportFrame = null; report(); });
      return;
    }
    if (reportTimer) return;
    reportTimer = setTimeout(function () { reportTimer = null; report(); }, 350);
  }
  function report() {
    if (!state.ready) return;
    var fraction = 0; var charOffset = null;
    if (paged) {
      state.page = Math.min(state.pageCount - 1, Math.max(0, Math.round(root.scrollLeft / pageStep)));
      fraction = state.pageCount > 1 ? (state.page + 1) / state.pageCount : 1;
      charOffset = firstVisibleOffset();
    } else {
      var max = root.scrollHeight - root.clientHeight;
      fraction = max > 0 ? Math.min(1, Math.max(0, root.scrollTop / max)) : 1;
      charOffset = firstVisibleOffset();
    }
    if (charOffset == null) charOffset = Math.round(fraction * state.totalChars);
    state.lastOffset = charOffset;
    post('progress', { fraction: fraction, charOffset: charOffset, page: state.page + 1, pageCount: state.pageCount });
  }
  root.addEventListener('scroll', scheduleReport, { passive: true });`;
