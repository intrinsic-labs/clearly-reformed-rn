/**
 * Layout / mode: column pagination (--page-w, exact page-multiple content
 * width), offset -> scroll position, and relayout while holding a position.
 *
 * Browser-side (WKWebView / Android WebView) JS as a plain string -- one chunk of
 * the Reader runtime's single script scope; see runtime/index.ts for ordering.
 * ES5-style on purpose; do not modernise.
 */
export const LAYOUT = `  /* ---------- layout / mode ---------- */
  function recomputePages() {
    if (!paged) {
      state.pageCount = 1;
      state.page = 0;
      content.style.width = '';
      return;
    }
    pageStep = window.innerWidth;
    document.documentElement.style.setProperty('--page-w', pageStep + 'px');
    // Measure the natural column extent, then force the content box to an exact
    // page multiple: WebKit drops trailing padding in horizontal overflow, which
    // otherwise leaves the last snap position short and the final page shifted.
    content.style.width = '';
    var natural = Math.max(content.scrollWidth, root.scrollWidth);
    state.pageCount = Math.max(1, Math.ceil((natural - 8) / pageStep));
    content.style.width = state.pageCount * pageStep + 'px';
  }
  /**
   * A page's content occupies document-x [p*pageStep + hpad, (p+1)*pageStep - hpad]
   * (the column padding leaves hpad of margin on both sides), which sits entirely
   * inside [p*pageStep, (p+1)*pageStep) -- so flooring the RAW (un-padded) absolute
   * left against pageStep always lands on the right page, with a full hpad of
   * sub-pixel/rounding slack on both sides. Subtracting hpad first (the previous
   * approach) throws away exactly that slack on the left side, so a rect starting
   * near a column's left edge -- the common case for a wrapped line, see
   * goToHighlight -- could floor to the page before it on real devices.
   */
  function pageForRect(rect) {
    var absLeft = rect.left + root.scrollLeft;
    return Math.max(0, Math.min(state.pageCount - 1, Math.floor(absLeft / pageStep)));
  }
  function goToOffset(offset) {
    if (offset == null || offset <= 0) {
      if (paged) root.scrollLeft = 0; else root.scrollTop = 0;
      return;
    }
    var rect = offsetRect(Math.min(offset, Math.max(0, state.totalChars - 1)));
    if (!rect) return;
    if (paged) {
      root.scrollLeft = pageForRect(rect) * pageStep;
    } else {
      var vpadTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vpad-top')) || 80;
      root.scrollTop = Math.max(0, rect.top + root.scrollTop - vpadTop - 4);
    }
  }
  function relayout(keepOffset) {
    requestAnimationFrame(function () {
      recomputePages();
      if (keepOffset != null) goToOffset(keepOffset);
      report();
      post('layout', { totalChars: state.totalChars, pageCount: state.pageCount });
    });
  }`;
