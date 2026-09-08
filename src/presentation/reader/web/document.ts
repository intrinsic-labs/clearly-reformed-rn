import { FONT_FACES } from '@/presentation/reader/web/font-faces';
import { headerMarkup } from '@/presentation/reader/web/header';
import { runtimeScript } from '@/presentation/reader/web/runtime';
import { readerStyles } from '@/presentation/reader/web/styles';
import type {
  ReaderHeaderInfo,
  ReaderInsets,
  ReaderVideoInfo,
  ReaderWebPrefs,
} from '@/presentation/reader/web/types';
import { videoMarkup } from '@/presentation/reader/web/video';

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
 *
 * This file only assembles: markup in header.ts / video.ts, CSS in styles.ts and
 * font-faces.ts, the browser runtime in runtime/. The output is pinned byte for
 * byte by reader-html.test.ts.
 */
export function buildReaderHtml(
  bodyHtml: string,
  header: ReaderHeaderInfo,
  insets: ReaderInsets,
  initial: ReaderWebPrefs,
  documentBaseUrl: string,
  video?: ReaderVideoInfo | null,
): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
${FONT_FACES}

${readerStyles(initial, insets)}
</style>
</head>
<body>
<div id="root" class="${initial.paged ? 'paged' : 'scroll'}">
  <div id="content">
    ${headerMarkup(header)}
    ${videoMarkup(video, documentBaseUrl)}
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
${runtimeScript(initial)}
</script>
</body>
</html>`;
}
