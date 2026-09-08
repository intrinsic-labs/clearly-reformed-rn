import { escapeHtml } from '@/presentation/reader/web/escape-html';
import type { ReaderHeaderInfo } from '@/presentation/reader/web/types';

/** The article masthead: eyebrow, title, optional byline/scripture, hairline rule. */
export function headerMarkup(header: ReaderHeaderInfo): string {
  return `
    <header id="head">
      <div class="eyebrow">${escapeHtml(header.eyebrow)}</div>
      <h1 class="title">${escapeHtml(header.title)}</h1>
      ${header.byline ? `<div class="byline">${escapeHtml(header.byline)}</div>` : ''}
      ${header.scripture ? `<div class="scripture">${escapeHtml(header.scripture)}</div>` : ''}
      <div class="rule"></div>
    </header>`;
}
