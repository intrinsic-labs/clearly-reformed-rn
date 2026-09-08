import type { ReaderWebPrefs } from '@/presentation/reader/web/types';

/**
 * Shared scope for the Reader runtime: DOM element refs, the mode flags seeded
 * from the initial prefs, the page stride, the reader state, and `post()` -- the
 * one way the page talks to RN. Every later chunk closes over these.
 *
 * Browser-side (WKWebView / Android WebView) JS as a plain string -- one chunk of
 * the Reader runtime's single script scope; see runtime/index.ts for ordering.
 * ES5-style on purpose; do not modernise.
 */
export function scopeScript(initial: Pick<ReaderWebPrefs, 'paged' | 'curlShade'>): string {
  return `  var root = document.getElementById('root');
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
  // lastOffset: the most recently reported reading position — the anchor a
  // viewport resize restores to once the initial target has been consumed.
  var state = { totalChars: 0, pageCount: 1, page: 0, ready: false, lastOffset: 0 };

  function post(type, payload) {
    var msg = Object.assign({ type: type }, payload || {});
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }`;
}
