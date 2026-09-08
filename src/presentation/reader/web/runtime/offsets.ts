/**
 * Character-offset mapping over #body text: the coordinate system reading
 * positions, selections and highlights all persist in.
 *
 * Browser-side (WKWebView / Android WebView) JS as a plain string -- one chunk of
 * the Reader runtime's single script scope; see runtime/index.ts for ordering.
 * ES5-style on purpose; do not modernise.
 */
export const OFFSETS = `  /* ---------- character-offset mapping over #body text ---------- */
  function walker() {
    return document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
  }
  function computeTotalChars() {
    var w = walker(); var n; var total = 0;
    while ((n = w.nextNode())) total += n.data.length;
    return total;
  }
  function offsetToPoint(offset) {
    var w = walker(); var n; var seen = 0;
    while ((n = w.nextNode())) {
      if (seen + n.data.length >= offset) return { node: n, offset: Math.max(0, offset - seen) };
      seen += n.data.length;
    }
    return n ? { node: n, offset: n.data.length } : null;
  }
  function pointToOffset(node, nodeOffset) {
    var w = walker(); var n; var seen = 0;
    while ((n = w.nextNode())) {
      if (n === node) return seen + nodeOffset;
      seen += n.data.length;
    }
    return null;
  }
  function bodyText() {
    var w = walker(); var n; var s = '';
    while ((n = w.nextNode())) s += n.data;
    return s;
  }
  function offsetRect(offset) {
    var point = offsetToPoint(offset);
    if (!point) return null;
    // offsetToPoint resolves a boundary offset to the END of the preceding text
    // node (right for range ends). For the character AT the offset that gives a
    // collapsed probe with no rect — and a highlight's charOffset is exactly such
    // a boundary once its mark has split the node — so step to the next node.
    if (point.offset >= point.node.data.length) {
      var w = walker(); var n; var found = false;
      while ((n = w.nextNode())) {
        if (found) { point = { node: n, offset: 0 }; break; }
        if (n === point.node) found = true;
      }
    }
    var range = document.createRange();
    try {
      range.setStart(point.node, point.offset);
      range.setEnd(point.node, Math.min(point.node.data.length, point.offset + 1));
    } catch (e) { return null; }
    var rects = range.getClientRects();
    return rects.length ? rects[0] : range.getBoundingClientRect();
  }
  function caretOffsetAt(x, y) {
    var range = document.caretRangeFromPoint ? document.caretRangeFromPoint(x, y) : null;
    if (!range) return null;
    var node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE || !body.contains(node)) return null;
    return pointToOffset(node, range.startOffset);
  }
  function firstVisibleOffset() {
    var hpad = 30;
    var top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vpad-top')) || 80;
    // Probe a few points down the leading edge until we hit article text.
    for (var dy = 4; dy <= 260; dy += 32) {
      var offset = caretOffsetAt(hpad + 2, Math.min(window.innerHeight - 10, top + dy));
      if (offset != null) return offset;
    }
    return null;
  }`;
