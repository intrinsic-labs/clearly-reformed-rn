/**
 * Long-press: select a word, keep dragging to extend.
 *
 * Browser-side (WKWebView / Android WebView) JS as a plain string -- one chunk of
 * the Reader runtime's single script scope; see runtime/index.ts for ordering.
 * ES5-style on purpose; do not modernise.
 */
export const LONG_PRESS = `  /* ---------- long-press: select a word, keep dragging to extend ---------- */
  var LP_MS = 420;
  var LP_SLOP = 10;
  var lp = null;       // pending long-press { x, y, timer }
  var lpExtend = null; // active press-drag extension { wordStart, wordEnd }

  function armLongPress(x, y) {
    cancelLongPress();
    lp = {
      x: x,
      y: y,
      timer: setTimeout(function () {
        lp = null;
        if (drag && drag.active) return; // already a page drag
        drag = null;                     // the hold is a selection, not a page turn
        var offset = caretOffsetAt(x, y);
        if (offset == null) return;
        var bounds = wordBoundsAt(bodyText(), offset);
        if (!bounds) return;
        lpExtend = { wordStart: bounds.start, wordEnd: bounds.end };
        armClickSuppression();
        setPagedSel(bounds.start, bounds.end);
      }, LP_MS),
    };
  }
  function cancelLongPress() {
    if (lp) { clearTimeout(lp.timer); lp = null; }
  }
  function extendPagedSelTo(x, y) {
    if (!lpExtend) return;
    var offset = caretOffsetAt(
      Math.max(1, Math.min(window.innerWidth - 1, x)),
      Math.max(1, Math.min(window.innerHeight - 1, y)),
    );
    if (offset == null) return;
    setPagedSel(Math.min(lpExtend.wordStart, offset), Math.max(lpExtend.wordEnd, offset + 1));
  }`;
