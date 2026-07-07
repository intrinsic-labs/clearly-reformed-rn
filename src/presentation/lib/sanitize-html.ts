/**
 * Lightweight allowlist sanitizer for WordPress `content.rendered` before it enters
 * the Reader WebView (SPEC §2). Regex-based because React Native has no DOM parser;
 * the strategy is destructive-by-default:
 *
 *  1. Remove script/style/iframe/form/object/embed subtrees entirely.
 *  2. Remove HTML comments.
 *  3. For every remaining tag: drop it unless allowlisted, and if allowlisted
 *     rebuild it keeping only safe attributes (href/src/alt, with URL scheme checks).
 */

const STRIP_SUBTREE_RE = /<(script|style|iframe|form|object|embed|svg|noscript)\b[\s\S]*?<\/\1\s*>/gi;
const COMMENT_RE = /<!--[\s\S]*?-->/g;

const ALLOWED_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'ul',
  'ol',
  'li',
  'figure',
  'figcaption',
  'img',
  'em',
  'i',
  'strong',
  'b',
  'a',
  'br',
  'hr',
  'span',
  'sup',
  'sub',
  'cite',
  'code',
  'pre',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
]);

const TAG_RE = /<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
const HREF_RE = /\bhref\s*=\s*("([^"]*)"|'([^']*)')/i;
const SRC_RE = /\bsrc\s*=\s*("([^"]*)"|'([^']*)')/i;
const ALT_RE = /\balt\s*=\s*("([^"]*)"|'([^']*)')/i;

function safeUrl(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

export function sanitizeArticleHtml(html: string): string {
  if (!html) return '';

  let out = html.replace(STRIP_SUBTREE_RE, '').replace(COMMENT_RE, '');
  // Orphaned/self-closing dangerous tags that had no closing pair.
  out = out.replace(/<(script|style|iframe|form|object|embed|link|meta)\b[^>]*>/gi, '');

  out = out.replace(TAG_RE, (match, rawName: string, rawAttrs: string) => {
    const name = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return '';

    const closing = match.startsWith('</');
    if (closing) return `</${name}>`;

    if (name === 'a') {
      const href = safeUrl(HREF_RE.exec(rawAttrs)?.[2] ?? HREF_RE.exec(rawAttrs)?.[3]);
      return href ? `<a href="${escapeAttr(href)}">` : '<a>';
    }
    if (name === 'img') {
      const src = safeUrl(SRC_RE.exec(rawAttrs)?.[2] ?? SRC_RE.exec(rawAttrs)?.[3]);
      if (!src) return '';
      const alt = ALT_RE.exec(rawAttrs)?.[2] ?? ALT_RE.exec(rawAttrs)?.[3] ?? '';
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}">`;
    }
    return `<${name}>`;
  });

  return out.trim();
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Plain text of sanitized HTML (word counts, FTS, reading time). */
export function htmlToPlainText(html: string): string {
  return html
    .replace(STRIP_SUBTREE_RE, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[#\w]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
