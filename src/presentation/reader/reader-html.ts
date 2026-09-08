/**
 * Public entry point for the Reader WebView document. The implementation lives in
 * `./web/` (document assembler, styles, markup, and the browser runtime split by
 * concern); this module keeps the import path callers already use.
 */
export { buildReaderHtml } from '@/presentation/reader/web/document';
export type {
  ReaderHeaderInfo,
  ReaderInsets,
  ReaderVideoInfo,
  ReaderWebPrefs,
} from '@/presentation/reader/web/types';
