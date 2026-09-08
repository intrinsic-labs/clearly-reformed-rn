/**
 * Highlights: wrapping ranges in <mark>, re-anchoring persisted quotes
 * (exact, then whitespace-insensitive), and removal.
 *
 * Browser-side (WKWebView / Android WebView) JS as a plain string -- one chunk of
 * the Reader runtime's single script scope; see runtime/index.ts for ordering.
 * ES5-style on purpose; do not modernise.
 */
export const HIGHLIGHTS = `  /* ---------- highlights ---------- */
  function wrapRange(range, id) {
    var marks = [];
    var w = walker(); var n; var nodes = [];
    while ((n = w.nextNode())) {
      if (range.intersectsNode(n)) nodes.push(n);
    }
    nodes.forEach(function (node) {
      var start = node === range.startContainer ? range.startOffset : 0;
      var end = node === range.endContainer ? range.endOffset : node.data.length;
      if (end <= start) return;
      var target = node;
      if (start > 0) target = target.splitText(start);
      if (end - start < target.data.length) target.splitText(end - start);
      var mark = document.createElement('mark');
      mark.className = 'hl';
      mark.dataset.id = id;
      target.parentNode.insertBefore(mark, target);
      mark.appendChild(target);
      marks.push(mark);
    });
    return marks.length > 0;
  }
  function applyHighlightToSelection(id) {
    // Wrapping splits text nodes and inserts inline elements, which can nudge the
    // column flow — re-measure afterwards while holding the reader's place. This
    // matters most for the case the marks span a page break.
    var offset = firstVisibleOffset();
    if (paged) {
      var range = pagedSelRange();
      if (!range) return;
      wrapRange(range, id);
      clearPagedSel(true);
    } else {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      wrapRange(sel.getRangeAt(0), id);
      sel.removeAllRanges();
    }
    post('selection-clear');
    relayout(offset);
  }
  /** Text with every whitespace character removed, plus a map back to its indices. */
  function squeeze(text) {
    var out = ''; var map = [];
    for (var i = 0; i < text.length; i += 1) {
      if (/\s/.test(text[i])) continue;
      out += text[i];
      map.push(i);
    }
    return { text: out, map: map };
  }

  /**
   * Re-anchor by whitespace-insensitive match. Selection.toString() inserts line
   * breaks at block boundaries that the text-node walk doesn't have, so a quote
   * spanning two paragraphs (which is what a selection dragged across a page break
   * usually is) never matches literally.
   */
  function looseMatch(full, quote, near) {
    var f = squeeze(full);
    var q = squeeze(quote);
    if (q.text.length < 2) return null;
    var best = -1;
    var at = f.text.indexOf(q.text);
    while (at !== -1) {
      if (best === -1 || (near != null && Math.abs(f.map[at] - near) < Math.abs(f.map[best] - near))) best = at;
      if (near == null) break;
      at = f.text.indexOf(q.text, at + 1);
    }
    if (best === -1) return null;
    return { start: f.map[best], end: f.map[best + q.text.length - 1] + 1 };
  }

  function paintHighlight(h) {
    if (document.querySelector('mark[data-id="' + h.id + '"]')) return;
    var full = bodyText();
    var quote = h.quote;
    if (!quote) return;
    var candidates = [];
    var idx = full.indexOf(quote);
    while (idx !== -1) { candidates.push(idx); idx = full.indexOf(quote, idx + 1); }

    var start = null; var end = null;
    if (candidates.length > 0) {
      start = candidates[0];
      if (candidates.length > 1) {
        var score = -1;
        candidates.forEach(function (c) {
          var s = 0;
          if (h.prefix && full.slice(Math.max(0, c - h.prefix.length), c) === h.prefix) s += 2;
          if (h.suffix && full.slice(c + quote.length, c + quote.length + h.suffix.length) === h.suffix) s += 2;
          if (h.charOffset != null) s += 1 / (1 + Math.abs(c - h.charOffset));
          if (s > score) { score = s; start = c; }
        });
      }
      end = start + quote.length;
    } else {
      var loose = looseMatch(full, quote, h.charOffset);
      if (!loose) return;
      start = loose.start;
      end = loose.end;
    }

    var startPoint = offsetToPoint(start);
    var endPoint = offsetToPoint(end);
    if (!startPoint || !endPoint) return;
    var range = document.createRange();
    try {
      range.setStart(startPoint.node, startPoint.offset);
      range.setEnd(endPoint.node, endPoint.offset);
    } catch (e) { return; }
    wrapRange(range, h.id);
  }
  function removeHighlight(id) {
    var marks = document.querySelectorAll('mark[data-id="' + id + '"]');
    marks.forEach(function (mark) {
      var parent = mark.parentNode;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
    });
  }`;
