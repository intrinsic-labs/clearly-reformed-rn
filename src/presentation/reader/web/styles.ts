import type { ReaderInsets, ReaderWebPrefs } from '@/presentation/reader/web/types';

/**
 * The Reader stylesheet (minus the @font-face block, see font-faces.ts).
 *
 * Theme/typography live in custom properties on :root, seeded here from the
 * initial prefs and safe-area insets and updated later by `applyPrefs` in the
 * runtime -- so the document never reloads for a settings change. Layout mode is
 * the `paged` / `scroll` class on #root.
 */
export function readerStyles(initial: ReaderWebPrefs, insets: ReaderInsets): string {
  return `:root {
  --bg: ${initial.bg};
  --fg: ${initial.fg};
  --sub: ${initial.sub};
  --hair: ${initial.hair};
  --accent: #BC871A;
  --body-font: '${initial.bodyFont}';
  --fsize: ${initial.fontSizePx}px;
  --lheight: ${initial.lineHeight};
  --hpad: 30px;
  --vpad-top: ${Math.round(insets.top + 58)}px; /* clears the 46px top bar */
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
/* The column stride must equal the JS page step exactly. 100vw is fractional on
   Android (e.g. 1080px / 2.625 = 411.43) while window.innerWidth is 411; forcing the
   content box to pageCount * innerWidth then makes multicol re-fit the columns and
   every page drifts a little further than the last. --page-w is set from JS. */
#root.paged #content {
  height: 100vh;
  column-width: calc(var(--page-w, 100vw) - 2 * var(--hpad));
  column-gap: calc(2 * var(--hpad));
  column-fill: auto;
}

/* --- article typography --- */
#head .eyebrow { font-family:'PlexSans',sans-serif; font-size:.61em; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--accent); }
#head .title { font-family:'Flecha',serif; font-weight:400; font-size:1.95em; line-height:1.12; margin-top:.5em; letter-spacing:.004em; color:var(--fg); }
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
  float:left; font-family:'Flecha',serif; font-weight:400;
  font-size:3.3em; line-height:.78; padding:.05em .12em 0 0; color:var(--accent);
}
#body h1, #body h2, #body h3, #body h4, #body h5, #body h6 {
  font-family:'Flecha',serif; font-weight:400; line-height:1.2; margin:1.6em 0 .6em; color:var(--fg);
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
.end-spacer { height: 40px; }`;
}
