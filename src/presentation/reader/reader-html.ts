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

export interface ReaderVideoInfo {
  readonly youtubeId: string;
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

export function buildReaderHtml(
  bodyHtml: string,
  header: ReaderHeaderInfo,
  insets: ReaderInsets,
  initial: ReaderWebPrefs,
  documentBaseUrl: string,
  video?: ReaderVideoInfo | null,
): string {
  const headerHtml = `
    <header id="head">
      <div class="eyebrow">${escapeHtml(header.eyebrow)}</div>
      <h1 class="title">${escapeHtml(header.title)}</h1>
      ${header.byline ? `<div class="byline">${escapeHtml(header.byline)}</div>` : ''}
      ${header.scripture ? `<div class="scripture">${escapeHtml(header.scripture)}</div>` : ''}
      <div class="rule"></div>
    </header>`;
  const embedOrigin = originFromUrl(documentBaseUrl);
  const videoHtml = video
    ? `
    <figure class="reader-video">
      <iframe
        src="https://www.youtube.com/embed/${encodeURIComponent(video.youtubeId)}?playsinline=1&rel=0&origin=${encodeURIComponent(embedOrigin)}"
        title="Video player"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="origin-when-cross-origin"
        allowfullscreen>
      </iframe>
    </figure>`
    : '';

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
/* Paged mode owns selection outright (see the JS): WebKit's selection geometry
   is computed from the unfragmented flow, so every native behaviour lands a
   page off for text past a column break. Disabling it here is what makes the
   app's own long-press/handles/pill the single, deterministic path. */
#root.paged #body { -webkit-user-select: none; user-select: none; }

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

.reader-video {
  width: 100%;
  aspect-ratio: 16 / 9;
  margin: 0 0 1.5em;
  border-radius: 10px;
  overflow: hidden;
  background: #000;
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
}
.reader-video iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

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

/* Fallback selection painting for column-split paragraphs (see the JS below):
   the boxes live inside #root at content coordinates so they ride page turns.
   The two .pad elements are invisible touch targets over the painted handles —
   the only interactive part of the overlay — so the fallback selection can be
   adjusted by dragging, like the native grabbers it stands in for. */
#selOverlay { position: absolute; top: 0; left: 0; width: 0; height: 0; pointer-events: none; }
#selOverlay .quad { position: absolute; background: rgba(200,148,31,.28); border-radius: 2px; }
#selOverlay .knob { position: absolute; width: 10px; height: 10px; border-radius: 50%; background: var(--accent); }
#selOverlay .stem { position: absolute; width: 2px; background: var(--accent); }
#selOverlay .pad { position: absolute; width: 44px; pointer-events: auto; display: none; }

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
    ${videoHtml}
    <div id="body">${bodyHtml}</div>
    <div class="end-spacer"></div>
  </div>
  <div id="selOverlay">
    <div id="selQuads"></div>
    <div class="pad" id="selPadStart"></div>
    <div class="pad" id="selPadEnd"></div>
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
  var selOverlay = document.getElementById('selOverlay');
  var selQuads = document.getElementById('selQuads');
  var selPadStart = document.getElementById('selPadStart');
  var selPadEnd = document.getElementById('selPadEnd');

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
    // The same touch may instead become a word selection (see the paged-mode
    // selection section): a stationary hold wins over a page drag.
    armLongPress(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  root.addEventListener('touchmove', function (e) {
    if (!paged) return;
    var t = e.touches[0];
    if (lp && (Math.abs(t.clientX - lp.x) > LP_SLOP || Math.abs(t.clientY - lp.y) > LP_SLOP)) cancelLongPress();
    if (lpExtend) {
      // Press-drag after the long-press: grow the selection, never turn pages.
      e.preventDefault();
      extendPagedSelTo(t.clientX, t.clientY);
      updateEdgeDwell(t.clientX);
      return;
    }
    if (!drag) return;
    if (pagedSel) { drag = null; return; }
    var dx = t.clientX - drag.x;
    var dy = t.clientY - drag.y;
    if (!drag.active) {
      if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      drag.active = true;
    }
    e.preventDefault();
    root.scrollLeft = Math.max(0, Math.min((state.pageCount - 1) * pageStep, drag.left - dx));
    if (curlShade) updateShade();
  }, { passive: false });

  root.addEventListener('touchend', function (e) {
    if (!paged) return;
    cancelLongPress();
    if (lpExtend) {
      lpExtend = null;
      cancelEdgeTurn();
      armClickSuppression();
      return;
    }
    if (!drag) return;
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
    // A deliberate turn overrides any pending dwell-driven one. The selection,
    // if any, is painted in content coordinates and simply rides along.
    cancelEdgeTurn();
    var target = Math.max(0, Math.min(state.pageCount - 1, state.page + delta));
    animateScrollLeft(target * pageStep, 240);
  }

  /* ---------- taps, links, highlight taps ---------- */
  document.addEventListener('click', function (e) {
    // The tap that ends a selection gesture, or lands while one is showing,
    // must not page-turn, follow links, or toggle chrome.
    if (Date.now() < suppressClickUntil) return;
    if (pagedSel) {
      clearPagedSel();
      return;
    }
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

  /* ---------- paged-mode selection (fully app-owned) ----------
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
      else return /\s/.test(text[i]) ? null : { start: i, end: i + 1 };
    }
    var start = i;
    var end = i + 1;
    while (start > 0 && WORD_CHAR.test(text[start - 1])) start -= 1;
    while (end < text.length && WORD_CHAR.test(text[end])) end += 1;
    return { start: start, end: end };
  }

  /* ---------- dwell-at-the-edge page turning (during any selection drag) ----------
     #root.paged is overflow:hidden, so nothing auto-scrolls while a drag sits at
     the screen edge — hold the finger there and the page turns under the drag. */
  var EDGE_DWELL_MS = 480;
  var edgeTimer = null;
  var edgeDir = 0;
  function cancelEdgeTurn() {
    if (edgeTimer) { clearTimeout(edgeTimer); edgeTimer = null; }
    edgeDir = 0;
  }
  function updateEdgeDwell(x) {
    var dir = x > window.innerWidth - 36 ? 1 : x < 36 ? -1 : 0;
    if (dir === edgeDir) return;
    cancelEdgeTurn();
    edgeDir = dir;
    if (dir === 0) return;
    edgeTimer = setTimeout(function () {
      edgeTimer = null;
      var target = Math.max(0, Math.min(state.pageCount - 1, currentPage() + dir));
      if (target === currentPage()) return;
      // Instant, not animated: an animation would fight the live drag. The
      // overlay lives in content coordinates, so it rides along untouched.
      root.scrollLeft = target * pageStep;
      state.page = target;
      report();
      edgeDir = 0;
    }, EDGE_DWELL_MS);
  }

  /* ---------- long-press: select a word, keep dragging to extend ---------- */
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
  }

  /* ---------- selection painting (paged mode) ----------
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
  }

  /* ---------- dragging the handles ----------
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
  bindPad(selPadEnd, false);

  /* ---------- selection capture (scroll mode — WebKit selection) ---------- */
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

function originFromUrl(url: string): string {
  const match = /^[a-z][a-z0-9+.-]*:\/\/[^/]+/i.exec(url);
  return match?.[0] ?? 'https://control.kdy.org';
}
