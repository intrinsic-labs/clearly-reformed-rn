/**
 * Selection painting (paged mode): tint quads plus handle markers drawn from
 * Range client rects in content coordinates.
 *
 * Browser-side (WKWebView / Android WebView) JS as a plain string -- one chunk of
 * the Reader runtime's single script scope; see runtime/index.ts for ordering.
 * ES5-style on purpose; do not modernise.
 */
export const SELECTION_PAINT = `  /* ---------- selection painting (paged mode) ----------
     Tint quads plus handle-shaped markers at either end, drawn from Range
     client rects (which, unlike WebKit's own selection paint, are
     fragment-correct) in content coordinates so they ride page turns. */
  function clearSelectionOverlay() {
    if (selQuads.firstChild) selQuads.innerHTML = '';
    selPadStart.style.display = 'none';
    selPadEnd.style.display = 'none';
  }
  /** Rects of a range worth painting (zero-area ones dropped). */
  function selectionRects(range) {
    var rects = [];
    var all = range.getClientRects();
    for (var i = 0; i < all.length; i += 1) {
      if (all[i].width > 0.5 && all[i].height > 0.5) rects.push(all[i]);
    }
    return rects;
  }
  function placePad(pad, x, lineTop, lineHeight) {
    pad.style.display = 'block';
    pad.style.left = (x - 22) + 'px';
    pad.style.top = (lineTop - 16) + 'px';
    pad.style.height = (lineHeight + 32) + 'px';
  }
  function paintPagedSel() {
    var range = pagedSelRange();
    var rects = range ? selectionRects(range) : [];
    if (rects.length === 0) {
      clearSelectionOverlay();
      return;
    }
    var sx = root.scrollLeft;
    var sy = root.scrollTop;
    var html = '';
    for (var j = 0; j < rects.length; j += 1) {
      var r = rects[j];
      html += '<div class="quad" style="left:' + (r.left + sx) + 'px;top:' + (r.top + sy) +
        'px;width:' + r.width + 'px;height:' + r.height + 'px"></div>';
    }
    var first = rects[0];
    var last = rects[rects.length - 1];
    html += '<div class="stem" style="left:' + (first.left + sx - 1) + 'px;top:' + (first.top + sy) +
      'px;height:' + first.height + 'px"></div>';
    html += '<div class="knob" style="left:' + (first.left + sx - 5.5) + 'px;top:' + (first.top + sy - 10) + 'px"></div>';
    html += '<div class="stem" style="left:' + (last.right + sx - 1) + 'px;top:' + (last.top + sy) +
      'px;height:' + last.height + 'px"></div>';
    html += '<div class="knob" style="left:' + (last.right + sx - 5.5) + 'px;top:' + (last.top + sy + last.height) + 'px"></div>';
    selQuads.innerHTML = html;
    placePad(selPadStart, first.left + sx, first.top + sy, first.height);
    placePad(selPadEnd, last.right + sx, last.top + sy, last.height);
  }`;
