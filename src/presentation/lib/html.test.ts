import { describe, expect, it } from '@jest/globals';

import { htmlToBlocks, readingTimeMinutes } from '@/presentation/lib/html';

describe('htmlToBlocks', () => {
  it('parses paragraphs, headings, quotes, lists, and images in order', () => {
    const html = `
      <p>First &#8220;paragraph&#8221; here.</p>
      <h2>A heading</h2>
      <blockquote><p>Quoted words.</p></blockquote>
      <ul><li>One</li><li>Two</li></ul>
      <figure><img src="https://x.org/pic.jpg" alt=""></figure>
    `;
    const blocks = htmlToBlocks(html);
    expect(blocks.map((b) => b.kind)).toEqual(['paragraph', 'heading', 'quote', 'list', 'image']);
    expect(blocks[0]).toMatchObject({ text: 'First “paragraph” here.' });
    expect(blocks[3]).toMatchObject({ ordered: false, items: ['One', 'Two'] });
    expect(blocks[4]).toMatchObject({ src: 'https://x.org/pic.jpg' });
  });

  it('reduces inline markup to plain text without fusing words', () => {
    const blocks = htmlToBlocks('<p>God is <em>gracious</em>and<strong>good</strong>.</p>');
    expect(blocks[0]).toMatchObject({ text: 'God is gracious and good .' });
  });

  it('returns empty for empty input', () => {
    expect(htmlToBlocks('')).toEqual([]);
  });
});

describe('readingTimeMinutes', () => {
  it('floors at one minute', () => {
    expect(readingTimeMinutes(htmlToBlocks('<p>Short.</p>'))).toBe(1);
  });

  it('estimates ~200wpm', () => {
    const words = Array.from({ length: 600 }, (_, i) => `word${i}`).join(' ');
    expect(readingTimeMinutes(htmlToBlocks(`<p>${words}</p>`))).toBe(3);
  });
});
