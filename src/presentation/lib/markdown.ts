/**
 * A deliberately small Markdown subset for the Notebook.
 *
 * Notes are the user's own writing, not arbitrary web content, so this covers the
 * handful of things the editor toolbar can produce (and that people type by hand)
 * rather than pulling in a full CommonMark engine:
 *
 *   headings   `# `, `## `, `### `
 *   emphasis   `**bold**` / `__bold__`, `*italic*` / `_italic_`
 *   code       `` `inline` ``
 *   lists      `- ` / `* ` bullets, `1. ` ordered
 *   quote      `> `
 *   rule       `---`
 *
 * Anything else stays literal text — a half-typed `*` must never eat the rest of a
 * note. Pure string → tree; rendering lives in `components/markdown-view.tsx`.
 */

export type MarkdownInline =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'strong'; readonly children: readonly MarkdownInline[] }
  | { readonly kind: 'em'; readonly children: readonly MarkdownInline[] }
  | { readonly kind: 'code'; readonly text: string };

export type MarkdownBlock =
  | { readonly kind: 'heading'; readonly level: 1 | 2 | 3; readonly children: readonly MarkdownInline[] }
  | { readonly kind: 'paragraph'; readonly children: readonly MarkdownInline[] }
  | { readonly kind: 'bullet'; readonly children: readonly MarkdownInline[] }
  | { readonly kind: 'ordered'; readonly marker: string; readonly children: readonly MarkdownInline[] }
  | { readonly kind: 'quote'; readonly children: readonly MarkdownInline[] }
  | { readonly kind: 'rule' };

const HEADING = /^(#{1,3})\s+(.*)$/;
const BULLET = /^[-*+]\s+(.*)$/;
const ORDERED = /^(\d{1,3})[.)]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const RULE = /^(?:-{3,}|\*{3,}|_{3,})$/;

/** Parse a note body into renderable blocks. */
export function parseMarkdown(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  // Consecutive plain lines join into one paragraph, keeping their line breaks —
  // in a note, pressing Return means "new line", not "new paragraph".
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ kind: 'paragraph', children: parseInline(paragraph.join('\n')) });
    paragraph = [];
  };

  for (const rawLine of source.split('\n')) {
    const line = rawLine.replace(/\s+$/, '');
    const trimmed = line.trim();

    if (trimmed === '') {
      flushParagraph();
      continue;
    }
    if (RULE.test(trimmed)) {
      flushParagraph();
      blocks.push({ kind: 'rule' });
      continue;
    }

    const heading = HEADING.exec(trimmed);
    if (heading) {
      flushParagraph();
      blocks.push({
        kind: 'heading',
        level: heading[1].length as 1 | 2 | 3,
        children: parseInline(heading[2]),
      });
      continue;
    }

    const quote = QUOTE.exec(trimmed);
    if (quote) {
      flushParagraph();
      blocks.push({ kind: 'quote', children: parseInline(quote[1]) });
      continue;
    }

    const bullet = BULLET.exec(trimmed);
    if (bullet) {
      flushParagraph();
      blocks.push({ kind: 'bullet', children: parseInline(bullet[1]) });
      continue;
    }

    const ordered = ORDERED.exec(trimmed);
    if (ordered) {
      flushParagraph();
      blocks.push({ kind: 'ordered', marker: `${ordered[1]}.`, children: parseInline(ordered[2]) });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks;
}

/**
 * Strip the markup so a body can be shown as flat text (card previews, search
 * snippets). Structure markers become spaces; emphasis markers simply vanish.
 */
export function markdownToPlainText(source: string): string {
  return parseMarkdown(source)
    .map((block) => (block.kind === 'rule' ? '' : inlineToPlainText(block.children)))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function inlineToPlainText(nodes: readonly MarkdownInline[]): string {
  return nodes
    .map((node) => {
      switch (node.kind) {
        case 'text':
          return node.text;
        case 'code':
          return node.text;
        default:
          return inlineToPlainText(node.children);
      }
    })
    .join('');
}

/** Emphasis / code spans within a single block's text. */
export function parseInline(source: string): MarkdownInline[] {
  const out: MarkdownInline[] = [];
  let buffer = '';
  let i = 0;

  const flush = () => {
    if (buffer) {
      out.push({ kind: 'text', text: buffer });
      buffer = '';
    }
  };

  while (i < source.length) {
    const ch = source[i];

    // Escapes let a note contain a literal asterisk.
    if (ch === '\\' && i + 1 < source.length && '*_`\\'.includes(source[i + 1])) {
      buffer += source[i + 1];
      i += 2;
      continue;
    }

    if (ch === '`') {
      const end = source.indexOf('`', i + 1);
      if (end > i + 1) {
        flush();
        out.push({ kind: 'code', text: source.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    if (ch === '*' || ch === '_') {
      const doubled = source[i + 1] === ch;
      const marker = doubled ? ch + ch : ch;
      const contentStart = i + marker.length;
      const end = findClosing(source, contentStart, marker);
      if (end !== -1) {
        flush();
        const children = parseInline(source.slice(contentStart, end));
        out.push(doubled ? { kind: 'strong', children } : { kind: 'em', children });
        i = end + marker.length;
        continue;
      }
    }

    buffer += ch;
    i += 1;
  }

  flush();
  return out;
}

/**
 * Index of the closing `marker` for a span opened at `from`, or -1.
 *
 * Flanking rules keep prose safe: the span may not open on whitespace or close
 * after it, so `3 * 4 * 5` and a lone `_` stay literal.
 */
function findClosing(source: string, from: number, marker: string): number {
  if (from >= source.length || /\s/.test(source[from])) return -1;

  for (let i = from; i < source.length; i += 1) {
    if (source[i] === '\\') {
      i += 1;
      continue;
    }
    if (!source.startsWith(marker, i)) continue;
    // A single-char marker must not be part of a longer run (`**` inside `*`).
    if (marker.length === 1 && source[i + 1] === marker) continue;
    if (i === from) continue;
    if (/\s/.test(source[i - 1])) continue;
    return i;
  }
  return -1;
}
