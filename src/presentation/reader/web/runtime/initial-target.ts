/**
 * Initial target (restore position / jump to a highlight), kept until the
 * reader is touched and re-applied after late layout shifts and viewport resizes.
 *
 * Browser-side (WKWebView / Android WebView) JS as a plain string -- one chunk of
 * the Reader runtime's single script scope; see runtime/index.ts for ordering.
 * ES5-style on purpose; do not modernise.
 */
export const INITIAL_TARGET = `  /* ---------- initial target (restore position / jump to a highlight) ----------
     Kept until the reader is touched, and re-applied when late layout shifts land
     (font decode, image loads) so the target can't drift back to the top. */
  var initialTarget = null;
  function goToHighlight(id) {
    var mark = document.querySelector('mark[data-id="' + id + '"]');
    if (!mark) return false;
    // getBoundingClientRect() unions every line of a wrapped highlight. A highlight
    // rarely starts flush at the column's left edge (it usually opens mid-line),
    // but its second and later lines wrap to the FULL column width and so DO start
    // flush at that edge -- pulling the union's left back to whichever column hosts
    // the flush-left line, independent of the page the highlight actually starts
    // on. The first fragment (getClientRects()[0]) is the highlight's true opening
    // position; its top is identical to the union's either way, so use it for both
    // branches. (Reproduced live on Android: a multi-line highlight's union-left
    // consistently measured near the column padding of a later page, landing the
    // reader exactly one page early.)
    var rects = mark.getClientRects();
    var rect = rects.length ? rects[0] : mark.getBoundingClientRect();
    if (paged) {
      root.scrollLeft = pageForRect(rect) * pageStep;
    } else {
      var vpadTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vpad-top')) || 80;
      root.scrollTop = Math.max(0, rect.top + root.scrollTop - vpadTop - 12);
    }
    return true;
  }
  function applyInitialTarget() {
    if (!initialTarget) return;
    if (initialTarget.highlightId && goToHighlight(initialTarget.highlightId)) return;
    if (initialTarget.charOffset) goToOffset(initialTarget.charOffset);
  }
  function reapplyTargetAfterShift() {
    requestAnimationFrame(function () {
      recomputePages();
      applyInitialTarget();
      report();
    });
  }
  document.addEventListener('touchstart', function () { initialTarget = null; }, { passive: true, capture: true });

  /* The viewport can change size after init: on Android the native stack screen
     reports its final frame from its own layout pass (react-native-screens'
     Screen.onLayout -> updateShadowNodeScreenSize), so the WebView is laid out
     once provisionally and again at the real size — after RN has already sent
     init. A different height re-fills the columns, a different width changes
     every line; either way the scroll position set for the old geometry now
     points somewhere else (or past the end, if page count shrank). Treat it like
     any other late layout shift: re-apply the pending target, or hold the last
     reported reading position. */
  window.addEventListener('resize', function () {
    if (!state.ready) return; // init lays out from scratch anyway
    if (initialTarget) reapplyTargetAfterShift();
    else relayout(state.lastOffset);
  });`;
