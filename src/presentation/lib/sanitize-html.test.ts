import { describe, expect, it } from '@jest/globals';

import { htmlToPlainText, sanitizeArticleHtml } from '@/presentation/lib/sanitize-html';

describe('sanitizeArticleHtml', () => {
  it('removes script/style/iframe subtrees entirely', () => {
    const html = '<p>Before</p><script>alert(1)</script><style>p{}</style><iframe src="x"></iframe><p>After</p>';
    const out = sanitizeArticleHtml(html);
    expect(out).toBe('<p>Before</p><p>After</p>');
  });

  it('drops disallowed tags but keeps their text', () => {
    const out = sanitizeArticleHtml('<div class="wrap"><p>Hello <marquee>world</marquee></p></div>');
    expect(out).toBe('<p>Hello world</p>');
  });

  it('strips event handlers and style attributes from allowed tags', () => {
    const out = sanitizeArticleHtml('<p onclick="steal()" style="color:red">Text</p>');
    expect(out).toBe('<p>Text</p>');
  });

  it('keeps https hrefs and drops javascript: urls', () => {
    expect(sanitizeArticleHtml('<a href="https://clearlyreformed.org">Link</a>')).toBe(
      '<a href="https://clearlyreformed.org">Link</a>',
    );
    expect(sanitizeArticleHtml('<a href="javascript:alert(1)">Link</a>')).toBe('<a>Link</a>');
  });

  it('keeps img src+alt only for http(s) sources', () => {
    expect(sanitizeArticleHtml('<img src="https://x.org/a.jpg" alt="A" width="100" onload="x()">')).toBe(
      '<img src="https://x.org/a.jpg" alt="A">',
    );
    expect(sanitizeArticleHtml('<img src="data:image/png;base64,AAAA">')).toBe('');
  });

  it('removes html comments', () => {
    expect(sanitizeArticleHtml('<p>a</p><!-- secret --><p>b</p>')).toBe('<p>a</p><p>b</p>');
  });
});

describe('htmlToPlainText', () => {
  it('collapses markup and entities to searchable text', () => {
    expect(htmlToPlainText('<p>God&nbsp;is <em>sovereign</em>.</p>')).toBe('God is sovereign .');
  });
});
