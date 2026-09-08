/**
 * Selection capture in scroll mode, where WebKit selection is kept.
 *
 * Browser-side (WKWebView / Android WebView) JS as a plain string -- one chunk of
 * the Reader runtime's single script scope; see runtime/index.ts for ordering.
 * ES5-style on purpose; do not modernise.
 */
export const SCROLL_SELECTION = `  /* ---------- selection capture (scroll mode — WebKit selection) ---------- */
  var selTimer = null;
  document.addEventListener('selectionchange', function () {
    // Paged selection is app-owned and posts explicitly; WebKit selection only
    // exists in scroll mode.
    if (paged) return;
    if (selTimer) clearTimeout(selTimer);
    selTimer = setTimeout(function () {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) { post('selection-clear'); return; }
      var range = sel.getRangeAt(0);
      if (!body.contains(range.startContainer) || !body.contains(range.endContainer)) { post('selection-clear'); return; }
      var text = sel.toString();
      if (!text || !text.trim()) { post('selection-clear'); return; }
      var startOffset = range.startContainer.nodeType === Node.TEXT_NODE
        ? pointToOffset(range.startContainer, range.startOffset) : null;
      var full = bodyText();
      var prefix = null; var suffix = null;
      if (startOffset != null) {
        prefix = full.slice(Math.max(0, startOffset - 32), startOffset);
        suffix = full.slice(startOffset + text.length, startOffset + text.length + 32);
      }
      post('selection', { text: text, prefix: prefix, suffix: suffix, charOffset: startOffset });
    }, 260);
  });`;
