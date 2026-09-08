/**
 * Paged-mode selection model (fully app-owned): a pair of character offsets,
 * set/post/clear, and the word-bounds helper long-press uses.
 *
 * Browser-side (WKWebView / Android WebView) JS as a plain string -- one chunk of
 * the Reader runtime's single script scope; see runtime/index.ts for ordering.
 * ES5-style on purpose; do not modernise.
 */
export const PAGED_SELECTION = `  /* ---------- paged-mode selection (fully app-owned) ----------
     In paged mode WebKit selection is disabled outright (user-select:none in
     the CSS): its geometry is computed from the unfragmented flow, so every
     native behaviour — paint, grabbers, menus, press-drag extension — lands a
     page off for any text past a column break, and sharing control with it
     produced timing-dependent bugs. Instead the page owns the whole lifecycle:
     long-press selects a word, press-drag or the gold handles extend it,
     holding at a screen edge turns the page under the drag, and the RN pill is
     the only menu. Scroll mode keeps WebKit selection (unfragmented, so it's
     correct there) with the same gold theming — the two modes feel identical.

     The selection is a pair of character offsets into #body text — the same
     coordinate system highlights and reading positions already persist in, so
     it survives page turns and relayouts by construction. */
  var pagedSel = null; // { start, end } char offsets, end exclusive
  var selPostTimer = null;
  var suppressClickUntil = 0;

  function currentPage() {
    return Math.min(state.pageCount - 1, Math.max(0, Math.round(root.scrollLeft / pageStep)));
  }
  /** The tap that ends a selection gesture must not page-turn or toggle chrome. */
  function armClickSuppression() {
    suppressClickUntil = Date.now() + 500;
  }
  function pagedSelRange() {
    if (!pagedSel) return null;
    var a = offsetToPoint(pagedSel.start);
    var b = offsetToPoint(pagedSel.end);
    if (!a || !b) return null;
    var range = document.createRange();
    try {
      range.setStart(a.node, a.offset);
      range.setEnd(b.node, b.offset);
    } catch (e) { return null; }
    return range;
  }
  function setPagedSel(start, end) {
    start = Math.max(0, start);
    end = Math.min(state.totalChars, end);
    if (end - start < 1) return;
    pagedSel = { start: start, end: end };
    paintPagedSel();
    if (selPostTimer) clearTimeout(selPostTimer);
    selPostTimer = setTimeout(postPagedSel, 200);
  }
  function postPagedSel() {
    selPostTimer = null;
    if (!pagedSel) return;
    var full = bodyText();
    var text = full.slice(pagedSel.start, pagedSel.end);
    if (!text.trim()) return;
    post('selection', {
      text: text,
      prefix: full.slice(Math.max(0, pagedSel.start - 32), pagedSel.start),
      suffix: full.slice(pagedSel.end, pagedSel.end + 32),
      charOffset: pagedSel.start,
    });
  }
  function clearPagedSel(silent) {
    if (selPostTimer) { clearTimeout(selPostTimer); selPostTimer = null; }
    cancelEdgeTurn();
    var had = pagedSel;
    pagedSel = null;
    clearSelectionOverlay();
    if (had && !silent) post('selection-clear');
  }

  /* Word under a text offset, for long-press. Letters/digits/apostrophes bind;
     anything else selects just itself (matching the platform's feel closely
     enough without a dictionary). */
  var WORD_CHAR = /[A-Za-z0-9À-ɏ’']/;
  function wordBoundsAt(text, offset) {
    var i = Math.max(0, Math.min(text.length - 1, offset));
    if (text.length === 0) return null;
    if (!WORD_CHAR.test(text[i])) {
      if (i > 0 && WORD_CHAR.test(text[i - 1])) i -= 1;
      else if (i + 1 < text.length && WORD_CHAR.test(text[i + 1])) i += 1;
      else return /\\s/.test(text[i]) ? null : { start: i, end: i + 1 };
    }
    var start = i;
    var end = i + 1;
    while (start > 0 && WORD_CHAR.test(text[start - 1])) start -= 1;
    while (end < text.length && WORD_CHAR.test(text[end])) end += 1;
    return { start: start, end: end };
  }`;
