import { FLECHA_BOLD_OTF, FLECHA_TEXT_OTF, PLEX_SANS_TTF } from '@/presentation/reader/fonts-base64';

/**
 * Builds the self-contained HTML document the Reader WebView renders (SPEC §8):
 * our own markup + CSS (typography via custom properties), embedded fonts, and a
 * JS runtime that provides
 *
 *  - vertical scroll or CSS-multicolumn horizontal pagination (Slide/Curl),
 *    with finger-tracking page drags and snap animation;
 *  - reading position as a character offset into the article text (survives any
 *    typography/layout change);
 *  - text-quote selection capture (quote + prefix/suffix + offset) and highlight
 *    painting/removal for the Notebook;
 *  - progress/page reporting, link/tap/highlight-tap events over the RN bridge.
 *
 * The document is built once per article; theme/typography/mode changes are pushed
 * through `window.__reader.applyPrefs` so the WebView never reloads.
 */

export interface ReaderHeaderInfo {
  readonly eyebrow: string;
  readonly title: string;
  readonly byline: string;
  readonly scripture: string | null;
}

export interface ReaderInsets {
  readonly top: number;
  readonly bottom: number;
}

/** Everything applyPrefs pushes into the page. Mirrors the RN-side prefs + palette. */
export interface ReaderWebPrefs {
  readonly bg: string;
  readonly fg: string;
  readonly sub: string;
  readonly hair: string;
  readonly bodyFont: 'FlechaText' | 'PlexSans';
  readonly fontSizePx: number;
  readonly lineHeight: number;
  readonly paged: boolean;
  readonly curlShade: boolean;
}

export function buildReaderHtml(bodyHtml: string, header: ReaderHeaderInfo, insets: ReaderInsets, initial: ReaderWebPrefs): string {
  const headerHtml = `
    <header id="head">
      <div class="eyebrow">${escapeHtml(header.eyebrow)}</div>
      <h1 class="title">${escapeHtml(header.title)}</h1>
      ${header.byline ? `<div class="byline">${escapeHtml(header.byline)}</div>` : ''}
      ${header.scripture ? `<div class="scripture">${escapeHtml(header.scripture)}</div>` : ''}
      <div class="rule"></div>
    </header>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
@font-face { font-family:'Flecha'; font-weight:700; src:url(data:font/otf;base64,${FLECHA_BOLD_OTF}) format('opentype'); }
@font-face { font-family:'FlechaText'; font-weight:400; src:url(data:font/otf;base64,${FLECHA_TEXT_OTF}) format('opentype'); }
@font-face { font-family:'PlexSans'; font-weight:400; src:url(data:font/ttf;base64,${PLEX_SANS_TTF}) format('truetype'); }

:root {
  --bg: ${initial.bg};
  --fg: ${initial.fg};
  --sub: ${initial.sub};
  --hair: ${initial.hair};
  --accent: #BC871A;
  --body-font: '${initial.bodyFont}';
  --fsize: ${initial.fontSizePx}px;
  --lheight: ${initial.lineHeight};
  --hpad: 30px;
  --vpad-top: ${Math.round(insets.top + 36)}px;
  --vpad-bottom: ${Math.round(insets.bottom + 44)}px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: var(--bg); overscroll-behavior: none; }
body { -webkit-text-size-adjust: 100%; -webkit-tap-highlight-color: transparent; }
::-webkit-scrollbar { display: none; }

#root { position: fixed; inset: 0; }
#content {
  padding: var(--vpad-top) var(--hpad) var(--vpad-bottom);
  color: var(--fg);
  font-family: var(--body-font), serif;
  font-size: var(--fsize);
  line-height: var(--lheight);
  -webkit-font-smoothing: antialiased;
  -webkit-user-select: none;
  user-select: none;
}
#body { -webkit-user-select: text; user-select: text; }

/* --- scroll mode --- */
#root.scroll { overflow-y: auto; -webkit-overflow-scrolling: touch; }

/* --- paged mode (CSS multicolumn: one column per page, gap jumps the padding) --- */
#root.paged { overflow: hidden; }
#root.paged #content {
  height: 100vh;
  column-width: calc(100vw - 2 * var(--hpad));
  column-gap: calc(2 * var(--hpad));
  column-fill: auto;
}

/* --- article typography --- */
#head .eyebrow { font-family:'PlexSans',sans-serif; font-size:.61em; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--accent); }
#head .title { font-family:'Flecha',serif; font-weight:700; font-size:1.78em; line-height:1.12; margin-top:.5em; letter-spacing:.004em; color:var(--fg); }
#head .byline { font-family:'PlexSans',sans-serif; font-size:.62em; letter-spacing:.05em; color:var(--sub); margin-top:1.1em; text-transform:uppercase; font-weight:500; }
#head .scripture { font-family:'Flecha',serif; font-size:.86em; color:var(--accent); margin-top:.7em; }
#head .rule { height:1px; background:var(--hair); margin:1.4em 0 1.5em; }

#body p { margin: 0 0 1.1em; }
#body > p:first-of-type::first-letter {
  float:left; font-family:'Flecha',serif; font-weight:700;
  font-size:3.3em; line-height:.78; padding:.05em .12em 0 0; color:var(--accent);
}
#body h1, #body h2, #body h3, #body h4, #body h5, #body h6 {
  font-family:'Flecha',serif; font-weight:700; line-height:1.2; margin:1.6em 0 .6em; color:var(--fg);
}
#body h1, #body h2 { font-size:1.18em; }
#body h3, #body h4, #body h5, #body h6 { font-size:1.06em; }
#body blockquote {
  margin:1.5em 0; padding:.1em 0 .1em 1em; border-left:3px solid var(--accent);
  font-family:'Flecha',serif; font-size:1.24em; line-height:1.34;
}
#body ul, #body ol { margin:0 0 1.1em; padding-left:1.4em; }
#body li { margin-bottom:.35em; }
#body img { max-width:100%; height:auto; border-radius:10px; margin:.4em 0; }
#body figure { margin:1.2em 0; }
#body figcaption { font-family:'PlexSans',sans-serif; font-size:.68em; color:var(--sub); margin-top:.5em; }
#body a { color:var(--accent); text-decoration:none; border-bottom:1px solid rgba(188,135,26,.4); }
#body hr { border:none; height:1px; background:var(--hair); margin:1.6em 0; }
#body pre, #body code { font-size:.85em; white-space:pre-wrap; }
#body table { border-collapse:collapse; font-size:.85em; margin:1.2em 0; }
#body th, #body td { border:1px solid var(--hair); padding:.4em .6em; text-align:left; }

mark.hl {
  background: rgba(200,148,31,.22);
  box-shadow: 0 1px 0 rgba(188,135,26,.55);
  color: inherit;
  padding: 0 .04em;
  border-radius: 1px;
}

#turnShade {
  position: fixed; top: 0; bottom: 0; width: 42px; pointer-events: none; opacity: 0;
  background: linear-gradient(90deg, rgba(20,16,8,.28), rgba(20,16,8,0));
}
.end-spacer { height: 40px; }
</style>
</head>
<body>
<div id="root" class="${initial.paged ? 'paged' : 'scroll'}">
  <div id="content">
    ${headerHtml}
    <div id="body">${bodyHtml}</div>
    <div class="end-spacer"></div>
  </div>
</div>
<div id="turnShade"></div>
<script>
(function () {
  'use strict';
  var root = document.getElementById('root');
  var content = document.getElementById('content');
  var body = document.getElementById('body');
  var shade = document.getElementById('turnShade');

  var paged = ${initial.paged};
  var curlShade = ${initial.curlShade};
  var pageStep = window.innerWidth;
  var state = { totalChars: 0, pageCount: 1, page: 0, ready: false };

  function post(type, payload) {
    var msg = Object.assign({ type: type }, payload || {});
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }

  /* ---------- character-offset mapping over #body text ---------- */
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
  }

  /* ---------- progress reporting ---------- */
  var reportTimer = null;
  var reportFrame = null;
  function scheduleReport() {
    if (!paged && window.requestAnimationFrame) {
      if (reportFrame) return;
      reportFrame = requestAnimationFrame(function () { reportFrame = null; report(); });
      return;
    }
    if (reportTimer) return;
    reportTimer = setTimeout(function () { reportTimer = null; report(); }, 350);
  }
  function report() {
    if (!state.ready) return;
    var fraction = 0; var charOffset = null;
    if (paged) {
      state.page = Math.min(state.pageCount - 1, Math.max(0, Math.round(root.scrollLeft / pageStep)));
      fraction = state.pageCount > 1 ? (state.page + 1) / state.pageCount : 1;
      charOffset = firstVisibleOffset();
    } else {
      var max = root.scrollHeight - root.clientHeight;
      fraction = max > 0 ? Math.min(1, Math.max(0, root.scrollTop / max)) : 1;
      charOffset = firstVisibleOffset();
    }
    if (charOffset == null) charOffset = Math.round(fraction * state.totalChars);
    post('progress', { fraction: fraction, charOffset: charOffset, page: state.page + 1, pageCount: state.pageCount });
  }
  root.addEventListener('scroll', scheduleReport, { passive: true });

  /* ---------- layout / mode ---------- */
  function recomputePages() {
    if (!paged) {
      state.pageCount = 1;
      state.page = 0;
      content.style.width = '';
      return;
    }
    pageStep = window.innerWidth;
    // Measure the natural column extent, then force the content box to an exact
    // page multiple: WebKit drops trailing padding in horizontal overflow, which
    // otherwise leaves the last snap position short and the final page shifted.
    content.style.width = '';
    var natural = Math.max(content.scrollWidth, root.scrollWidth);
    state.pageCount = Math.max(1, Math.ceil((natural - 8) / pageStep));
    content.style.width = state.pageCount * pageStep + 'px';
  }
  function goToOffset(offset) {
    if (offset == null || offset <= 0) {
      if (paged) root.scrollLeft = 0; else root.scrollTop = 0;
      return;
    }
    var rect = offsetRect(Math.min(offset, Math.max(0, state.totalChars - 1)));
    if (!rect) return;
    if (paged) {
      var absLeft = rect.left + root.scrollLeft;
      var page = Math.max(0, Math.round((absLeft - 30) / pageStep));
      root.scrollLeft = Math.min(page, state.pageCount - 1) * pageStep;
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
  }

  /* ---------- initial target (restore position / jump to a highlight) ----------
     Kept until the reader is touched, and re-applied when late layout shifts land
     (font decode, image loads) so the target can't drift back to the top. */
  var initialTarget = null;
  function goToHighlight(id) {
    var mark = document.querySelector('mark[data-id="' + id + '"]');
    if (!mark) return false;
    var rect = mark.getBoundingClientRect();
    if (paged) {
      var absLeft = rect.left + root.scrollLeft;
      var page = Math.max(0, Math.floor((absLeft - 30) / pageStep));
      root.scrollLeft = Math.min(page, state.pageCount - 1) * pageStep;
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

  /* ---------- paged-mode gestures (finger-tracking slide + snap) ---------- */
  var drag = null;
  var snapAnim = null;
  function animateScrollLeft(target, ms) {
    if (snapAnim) cancelAnimationFrame(snapAnim);
    var from = root.scrollLeft; var start = null;
    function step(ts) {
      if (start == null) start = ts;
      var t = Math.min(1, (ts - start) / ms);
      var eased = 1 - Math.pow(1 - t, 3);
      root.scrollLeft = from + (target - from) * eased;
      if (curlShade) updateShade();
      if (t < 1) snapAnim = requestAnimationFrame(step);
      else { snapAnim = null; hideShade(); report(); }
    }
    snapAnim = requestAnimationFrame(step);
  }
  function updateShade() {
    var within = root.scrollLeft % pageStep;
    if (within < 2 || within > pageStep - 2) { hideShade(); return; }
    var edge = pageStep - within;
    shade.style.opacity = String(Math.min(0.9, within / pageStep * 1.6));
    shade.style.left = (edge - 21) + 'px';
  }
  function hideShade() { shade.style.opacity = '0'; }

  root.addEventListener('touchstart', function (e) {
    if (!paged || e.touches.length !== 1) return;
    if (snapAnim) { cancelAnimationFrame(snapAnim); snapAnim = null; }
    drag = { x: e.touches[0].clientX, y: e.touches[0].clientY, left: root.scrollLeft, t: Date.now(), active: false };
  }, { passive: true });

  root.addEventListener('touchmove', function (e) {
    if (!paged || !drag) return;
    var sel = window.getSelection();
    if (sel && !sel.isCollapsed) { drag = null; return; }
    var dx = e.touches[0].clientX - drag.x;
    var dy = e.touches[0].clientY - drag.y;
    if (!drag.active) {
      if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      drag.active = true;
    }
    e.preventDefault();
    root.scrollLeft = Math.max(0, Math.min((state.pageCount - 1) * pageStep, drag.left - dx));
    if (curlShade) updateShade();
  }, { passive: false });

  root.addEventListener('touchend', function (e) {
    if (!paged || !drag) return;
    var wasActive = drag.active;
    var dx = (e.changedTouches[0] ? e.changedTouches[0].clientX : drag.x) - drag.x;
    var dt = Date.now() - drag.t;
    drag = null;
    if (!wasActive) return;
    var current = root.scrollLeft / pageStep;
    var target;
    var fast = dt < 260 && Math.abs(dx) > 32;
    if (fast || Math.abs(dx) > pageStep * 0.28) {
      target = dx < 0 ? Math.ceil(current) : Math.floor(current);
    } else {
      target = Math.round(current);
    }
    target = Math.max(0, Math.min(state.pageCount - 1, target));
    animateScrollLeft(target * pageStep, 240);
  }, { passive: true });

  function goPage(delta) {
    var target = Math.max(0, Math.min(state.pageCount - 1, state.page + delta));
    animateScrollLeft(target * pageStep, 240);
  }

  /* ---------- taps, links, highlight taps ---------- */
  document.addEventListener('click', function (e) {
    var sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    var el = e.target;
    while (el && el !== document.body) {
      if (el.tagName === 'A') {
        e.preventDefault();
        if (el.getAttribute('href')) post('link', { href: el.getAttribute('href') });
        return;
      }
      if (el.tagName === 'MARK' && el.dataset.id) {
        e.preventDefault();
        post('hl-tap', { id: el.dataset.id });
        return;
      }
      el = el.parentElement;
    }
    if (paged) {
      var x = e.clientX;
      if (x < window.innerWidth * 0.18) { goPage(-1); return; }
      if (x > window.innerWidth * 0.82) { goPage(1); return; }
    }
    post('tap');
  });

  /* ---------- selection capture ---------- */
  var selTimer = null;
  document.addEventListener('selectionchange', function () {
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
  });

  /* ---------- highlights ---------- */
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
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    wrapRange(sel.getRangeAt(0), id);
    sel.removeAllRanges();
    post('selection-clear');
  }
  function paintHighlight(h) {
    if (document.querySelector('mark[data-id="' + h.id + '"]')) return;
    var full = bodyText();
    var quote = h.quote;
    if (!quote) return;
    var candidates = [];
    var idx = full.indexOf(quote);
    while (idx !== -1) { candidates.push(idx); idx = full.indexOf(quote, idx + 1); }
    if (candidates.length === 0) return;
    var best = candidates[0];
    if (candidates.length > 1) {
      var score = -1;
      candidates.forEach(function (c) {
        var s = 0;
        if (h.prefix && full.slice(Math.max(0, c - h.prefix.length), c) === h.prefix) s += 2;
        if (h.suffix && full.slice(c + quote.length, c + quote.length + h.suffix.length) === h.suffix) s += 2;
        if (h.charOffset != null) s += 1 / (1 + Math.abs(c - h.charOffset));
        if (s > score) { score = s; best = c; }
      });
    }
    var startPoint = offsetToPoint(best);
    var endPoint = offsetToPoint(best + quote.length);
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
  }

  /* ---------- RN-facing API ---------- */
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

  post('ready');
})();
</script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
