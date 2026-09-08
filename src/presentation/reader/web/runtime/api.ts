/**
 * RN-facing API (window.__reader), late image-load relayout, and the ready
 * handshake.
 *
 * Browser-side (WKWebView / Android WebView) JS as a plain string -- one chunk of
 * the Reader runtime's single script scope; see runtime/index.ts for ordering.
 * ES5-style on purpose; do not modernise.
 */
export const API = `  /* ---------- RN-facing API ---------- */
  window.__reader = {
    init: function (payload) {
      state.totalChars = computeTotalChars();
      (payload.highlights || []).forEach(paintHighlight);
      recomputePages();
      state.ready = true;
      initialTarget = { highlightId: payload.targetHighlightId || null, charOffset: payload.charOffset || 0 };
      applyInitialTarget();
      relayout(null);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(reapplyTargetAfterShift);
      }
    },
    applyPrefs: function (prefs) {
      // Offsets would survive the relayout, but a settings change mid-selection
      // is a mode/typography shift — start clean rather than repaint stale UI.
      clearPagedSel();
      var offset = firstVisibleOffset();
      var cs = document.documentElement.style;
      cs.setProperty('--bg', prefs.bg);
      cs.setProperty('--fg', prefs.fg);
      cs.setProperty('--sub', prefs.sub);
      cs.setProperty('--hair', prefs.hair);
      cs.setProperty('--body-font', "'" + prefs.bodyFont + "'");
      cs.setProperty('--fsize', prefs.fontSizePx + 'px');
      cs.setProperty('--lheight', String(prefs.lineHeight));
      paged = prefs.paged;
      curlShade = prefs.curlShade;
      root.className = paged ? 'paged' : 'scroll';
      if (!paged) root.scrollLeft = 0;
      relayout(offset);
    },
    applyHighlightToSelection: applyHighlightToSelection,
    paintHighlight: paintHighlight,
    removeHighlight: removeHighlight,
    clearSelection: function () {
      clearPagedSel(true);
      var sel = window.getSelection();
      if (sel) sel.removeAllRanges();
      post('selection-clear');
    },
    goPage: goPage,
  };

  /* Images resize the flow as they load — recompute, keeping position (or the
     still-pending initial target, which wins until the user touches). */
  Array.prototype.forEach.call(document.images, function (img) {
    if (img.complete) return;
    img.addEventListener('load', function () {
      if (initialTarget) {
        reapplyTargetAfterShift();
      } else {
        relayout(firstVisibleOffset());
      }
    });
  });

  post('ready');`;
