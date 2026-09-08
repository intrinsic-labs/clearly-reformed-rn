/**
 * Dragging the painted selection handles (the .pad touch targets).
 *
 * Browser-side (WKWebView / Android WebView) JS as a plain string -- one chunk of
 * the Reader runtime's single script scope; see runtime/index.ts for ordering.
 * ES5-style on purpose; do not modernise.
 */
export const SELECTION_HANDLES = `  /* ---------- dragging the handles ----------
     A drag on a pad moves that edge of the selection: the far edge is pinned at
     drag start, the near edge follows the finger (kept at the line the finger
     grabbed, via the initial offset between finger and text line). Holding at a
     screen edge turns the page under the drag. */
  var padDrag = null; // { isStart, pin, dy }
  function movingEdgeRect(isStart) {
    var range = pagedSelRange();
    if (!range) return null;
    var rects = selectionRects(range);
    if (rects.length === 0) return null;
    return isStart ? rects[0] : rects[rects.length - 1];
  }
  function bindPad(pad, isStart) {
    pad.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1 || !pagedSel) return;
      var rect = movingEdgeRect(isStart);
      padDrag = {
        isStart: isStart,
        pin: isStart ? pagedSel.end : pagedSel.start,
        dy: rect ? e.touches[0].clientY - (rect.top + rect.height / 2) : 0,
      };
      // Ours alone: no page-drag arming, no long-press arming.
      e.preventDefault();
      e.stopPropagation();
    }, { passive: false });
    pad.addEventListener('touchmove', function (e) {
      if (!padDrag) return;
      e.preventDefault();
      e.stopPropagation();
      var t = e.touches[0];
      var offset = caretOffsetAt(
        Math.max(1, Math.min(window.innerWidth - 1, t.clientX)),
        Math.max(1, Math.min(window.innerHeight - 1, t.clientY - padDrag.dy)),
      );
      if (offset != null && offset !== padDrag.pin) {
        setPagedSel(Math.min(padDrag.pin, offset), Math.max(padDrag.pin, offset));
      }
      updateEdgeDwell(t.clientX);
    }, { passive: false });
    function endDrag(e) {
      if (!padDrag) return;
      e.stopPropagation();
      padDrag = null;
      cancelEdgeTurn();
      armClickSuppression();
    }
    pad.addEventListener('touchend', endDrag);
    pad.addEventListener('touchcancel', endDrag);
  }
  bindPad(selPadStart, true);
  bindPad(selPadEnd, false);`;
