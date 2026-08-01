import { describe, expect, it } from '@jest/globals';

import { activeMarkdownActions, applyMarkdownAction } from '@/presentation/lib/markdown-edit';

const at = (start: number, end = start) => ({ start, end });

describe('applyMarkdownAction — emphasis', () => {
  it('wraps a selection', () => {
    expect(applyMarkdownAction('hello world', at(6, 11), 'bold')).toEqual({
      text: 'hello **world**',
      selection: { start: 8, end: 13 },
    });
  });

  it('unwraps when the selection is already flanked', () => {
    expect(applyMarkdownAction('hello **world**', at(8, 13), 'bold')).toEqual({
      text: 'hello world',
      selection: { start: 6, end: 11 },
    });
  });

  it('unwraps when the markers are inside the selection', () => {
    expect(applyMarkdownAction('hello *world*', at(6, 13), 'italic')).toEqual({
      text: 'hello world',
      selection: { start: 6, end: 11 },
    });
  });

  it('opens an empty pair at the caret', () => {
    expect(applyMarkdownAction('ab', at(1), 'italic')).toEqual({
      text: 'a**b',
      selection: { start: 2, end: 2 },
    });
  });

  it('collapses an empty pair the caret sits inside', () => {
    expect(applyMarkdownAction('a**b', at(2), 'italic')).toEqual({
      text: 'ab',
      selection: { start: 1, end: 1 },
    });
  });

  it('does not mistake bold markers for italic ones', () => {
    expect(applyMarkdownAction('**word**', at(2, 6), 'italic')).toEqual({
      text: '***word***',
      selection: { start: 3, end: 7 },
    });
  });
});

describe('applyMarkdownAction — line blocks', () => {
  it('adds a heading marker to the caret line', () => {
    expect(applyMarkdownAction('one\ntwo', at(5), 'h2')).toEqual({
      text: 'one\n## two',
      selection: { start: 8, end: 8 },
    });
  });

  it('removes the marker when the line already has exactly it', () => {
    expect(applyMarkdownAction('## two', at(4), 'h2')).toEqual({
      text: 'two',
      selection: { start: 1, end: 1 },
    });
  });

  it('replaces one block marker with another', () => {
    expect(applyMarkdownAction('# two', at(3), 'bullet').text).toBe('- two');
    expect(applyMarkdownAction('- two', at(3), 'quote').text).toBe('> two');
  });

  it('applies across every selected line', () => {
    expect(applyMarkdownAction('one\ntwo\nthree', at(1, 9), 'bullet').text).toBe('- one\n- two\n- three');
  });
});

describe('activeMarkdownActions', () => {
  it('reports the styles under the selection', () => {
    expect(activeMarkdownActions('## a **b**', { start: 7, end: 8 })).toEqual(['bold', 'h2']);
    expect(activeMarkdownActions('plain', { start: 0, end: 5 })).toEqual([]);
  });
});
