/**
 * Taps: link follow, highlight tap, edge-zone page turns, chrome toggle -- with
 * the click suppression the selection gestures rely on.
 *
 * Browser-side (WKWebView / Android WebView) JS as a plain string -- one chunk of
 * the Reader runtime's single script scope; see runtime/index.ts for ordering.
 * ES5-style on purpose; do not modernise.
 */
export const TAPS = `  /* ---------- taps, links, highlight taps ---------- */
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
  });`;
