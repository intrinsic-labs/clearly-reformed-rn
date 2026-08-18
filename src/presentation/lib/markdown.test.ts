import { describe, expect, it } from '@jest/globals';

import { markdownToPlainText, parseInline, parseMarkdown } from '@/presentation/lib/markdown';

describe('parseInline', () => {
  it('reads bold, italic and inline code', () => {
    expect(parseInline('a **b** c *d* e `f`')).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'strong', children: [{ kind: 'text', text: 'b' }] },
      { kind: 'text', text: ' c ' },
      { kind: 'em', children: [{ kind: 'text', text: 'd' }] },
      { kind: 'text', text: ' e ' },
      { kind: 'code', text: 'f' },
    ]);
  });

  it('nests emphasis', () => {
    expect(parseInline('**bold *and* more**')).toEqual([
      {
        kind: 'strong',
        children: [
          { kind: 'text', text: 'bold ' },
          { kind: 'em', children: [{ kind: 'text', text: 'and' }] },
          { kind: 'text', text: ' more' },
        ],
      },
    ]);
  });

  it('leaves arithmetic and unmatched markers literal', () => {
    expect(parseInline('3 * 4 * 5')).toEqual([{ kind: 'text', text: '3 * 4 * 5' }]);
    expect(parseInline('half **typed')).toEqual([{ kind: 'text', text: 'half **typed' }]);
    expect(parseInline('a `tick')).toEqual([{ kind: 'text', text: 'a `tick' }]);
  });

  it('honours escapes', () => {
    expect(parseInline('a \\*star\\* b')).toEqual([{ kind: 'text', text: 'a *star* b' }]);
  });
});

describe('parseMarkdown', () => {
  it('reads headings, lists, quotes and rules', () => {
    const blocks = parseMarkdown('# Title\n\n- one\n- two\n\n1. first\n\n> quoted\n\n---\n\nplain');
    expect(blocks.map((b) => b.kind)).toEqual([
      'heading',
      'bullet',
      'bullet',
      'ordered',
      'quote',
      'rule',
      'paragraph',
    ]);
    expect(blocks[0]).toMatchObject({ level: 1 });
  });

  it('keeps single line breaks inside a paragraph', () => {
    const blocks = parseMarkdown('one\ntwo\n\nthree');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ kind: 'paragraph', children: [{ kind: 'text', text: 'one\ntwo' }] });
  });

  it('caps headings at three levels', () => {
    expect(parseMarkdown('#### deep')[0]).toMatchObject({ kind: 'paragraph' });
  });
});

describe('markdownToPlainText', () => {
  it('flattens markup for previews', () => {
    expect(markdownToPlainText('## Heading\n\nSome **bold** and *italic*.\n\n- point')).toBe(
      'Heading\nSome bold and italic.\npoint',
    );
  });
});
