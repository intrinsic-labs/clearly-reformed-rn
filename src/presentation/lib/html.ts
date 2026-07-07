/**
 * Minimal HTML → block parser for the interim native reading view.
 *
 * This is deliberately small and lossy: it extracts block structure (paragraphs,
 * headings, blockquotes, images, lists) and reduces inline markup to plain text.
 * The forthcoming WebView Reader renders the source HTML faithfully (links, emphasis,
 * pull-quotes); until then this keeps the body readable natively.
 */

export type ReaderBlock =
  | { readonly kind: 'heading'; readonly level: 2 | 3 | 4; readonly text: string }
  | { readonly kind: 'paragraph'; readonly text: string }
  | { readonly kind: 'quote'; readonly text: string }
  | { readonly kind: 'image'; readonly src: string }
  | { readonly kind: 'list'; readonly ordered: boolean; readonly items: readonly string[] };

const ENTITIES: Record<string, string> = {
  '&#8217;': '’',
  '&#8216;': '‘',
  '&#8220;': '“',
  '&#8221;': '”',
  '&#8211;': '–',
  '&#8212;': '—',
  '&#8230;': '…',
  '&#038;': '&',
  '&amp;': '&',
  '&nbsp;': ' ',
  '&quot;': '"',
  '&lt;': '<',
  '&gt;': '>',
  '&hellip;': '…',
  '&mdash;': '—',
  '&ndash;': '–',
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&#39;': '’',
  '&#039;': '’',
  '&#x27;': '’',
};

function decode(text: string): string {
  return text.replace(/&#?\w+;/g, (m) => ENTITIES[m] ?? m);
}

/** Strip tags (replacing with a space so words don't fuse), decode entities, collapse whitespace. */
function plain(html: string): string {
  return decode(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

const BLOCK_RE = /<(figure|h[1-6]|blockquote|ul|ol|p)\b[^>]*>([\s\S]*?)<\/\1>/gi;
const IMG_SRC_RE = /<img[^>]*\bsrc=["']([^"']+)["']/i;
const LI_RE = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;

/** Parse `content.rendered` HTML into an ordered list of renderable blocks. */
export function htmlToBlocks(html: string): ReaderBlock[] {
  const blocks: ReaderBlock[] = [];
  if (!html) return blocks;

  let match: RegExpExecArray | null;
  BLOCK_RE.lastIndex = 0;
  while ((match = BLOCK_RE.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const inner = match[2];

    if (tag === 'figure') {
      const src = IMG_SRC_RE.exec(inner)?.[1];
      if (src) blocks.push({ kind: 'image', src });
    } else if (tag[0] === 'h') {
      const level = Math.min(4, Math.max(2, Number(tag[1]))) as 2 | 3 | 4;
      const text = plain(inner);
      if (text) blocks.push({ kind: 'heading', level, text });
    } else if (tag === 'blockquote') {
      const text = plain(inner);
      if (text) blocks.push({ kind: 'quote', text });
    } else if (tag === 'ul' || tag === 'ol') {
      const items: string[] = [];
      let li: RegExpExecArray | null;
      LI_RE.lastIndex = 0;
      while ((li = LI_RE.exec(inner)) !== null) {
        const text = plain(li[1]);
        if (text) items.push(text);
      }
      if (items.length) blocks.push({ kind: 'list', ordered: tag === 'ol', items });
    } else {
      const text = plain(inner);
      if (text) blocks.push({ kind: 'paragraph', text });
    }
  }

  return blocks;
}

/** Rough reading time in minutes (~200 wpm), floored at 1. */
export function readingTimeMinutes(blocks: readonly ReaderBlock[]): number {
  const words = blocks.reduce((n, block) => {
    if (block.kind === 'image') return n;
    const text = block.kind === 'list' ? block.items.join(' ') : block.text;
    return n + text.split(/\s+/).filter(Boolean).length;
  }, 0);
  return Math.max(1, Math.round(words / 200));
}
