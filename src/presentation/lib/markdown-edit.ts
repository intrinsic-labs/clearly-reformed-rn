/**
 * The editing half of the Notebook's Markdown support: what each toolbar button
 * does to `(text, selection)`.
 *
 * Pure on purpose — the note editor just hands over its current value and
 * selection and renders whatever comes back, so every rule here is unit-testable
 * without a keyboard in the loop.
 */

export interface TextSelection {
  readonly start: number;
  readonly end: number;
}

export interface MarkdownEditResult {
  readonly text: string;
  readonly selection: TextSelection;
}

export type MarkdownAction = 'h1' | 'h2' | 'h3' | 'bold' | 'italic' | 'bullet' | 'quote';

const WRAP_MARKER: Partial<Record<MarkdownAction, string>> = {
  bold: '**',
  italic: '*',
};

const LINE_PREFIX: Partial<Record<MarkdownAction, string>> = {
  h1: '# ',
  h2: '## ',
  h3: '### ',
  bullet: '- ',
  quote: '> ',
};

/** Any leading block marker, so applying one style replaces another. */
const ANY_LINE_PREFIX = /^(#{1,6}\s+|[-*+]\s+|>\s?)/;

export function applyMarkdownAction(
  text: string,
  selection: TextSelection,
  action: MarkdownAction,
): MarkdownEditResult {
  const marker = WRAP_MARKER[action];
  if (marker) return toggleWrap(text, clamp(text, selection), marker);

  const prefix = LINE_PREFIX[action];
  if (prefix) return toggleLinePrefix(text, clamp(text, selection), prefix);

  return { text, selection };
}

function clamp(text: string, selection: TextSelection): TextSelection {
  const start = Math.max(0, Math.min(text.length, selection.start));
  const end = Math.max(start, Math.min(text.length, selection.end));
  return { start, end };
}

/* ---------------------------------------------------------------- inline wrap */

function toggleWrap(text: string, selection: TextSelection, marker: string): MarkdownEditResult {
  const { start, end } = selection;
  const width = marker.length;

  // Caret sitting between an empty pair — collapse it back down.
  if (start === end && surroundedBy(text, start, end, marker)) {
    return {
      text: text.slice(0, start - width) + text.slice(end + width),
      selection: { start: start - width, end: start - width },
    };
  }

  // Nothing selected: open a pair and park the caret inside it.
  if (start === end) {
    return {
      text: text.slice(0, start) + marker + marker + text.slice(start),
      selection: { start: start + width, end: start + width },
    };
  }

  if (surroundedBy(text, start, end, marker)) {
    return {
      text: text.slice(0, start - width) + text.slice(start, end) + text.slice(end + width),
      selection: { start: start - width, end: end - width },
    };
  }

  const selected = text.slice(start, end);
  if (isWrappedValue(selected, marker)) {
    const inner = selected.slice(width, selected.length - width);
    return {
      text: text.slice(0, start) + inner + text.slice(end),
      selection: { start, end: end - width * 2 },
    };
  }

  return {
    text: text.slice(0, start) + marker + selected + marker + text.slice(end),
    selection: { start: start + width, end: end + width },
  };
}

/** Is the selection immediately flanked by `marker` (and not by a longer run)? */
function surroundedBy(text: string, start: number, end: number, marker: string): boolean {
  const width = marker.length;
  if (start < width || end + width > text.length) return false;
  if (text.slice(start - width, start) !== marker || text.slice(end, end + width) !== marker) return false;
  // `*` must not match half of a `**` pair.
  if (width === 1 && (text[start - 2] === marker || text[end + 1] === marker)) return false;
  return true;
}

function isWrappedValue(value: string, marker: string): boolean {
  const width = marker.length;
  if (value.length <= width * 2) return false;
  if (!value.startsWith(marker) || !value.endsWith(marker)) return false;
  if (width === 1 && (value[1] === marker || value[value.length - 2] === marker)) return false;
  return true;
}

/* ----------------------------------------------------------------- line block */

function toggleLinePrefix(text: string, selection: TextSelection, prefix: string): MarkdownEditResult {
  const firstLineStart = text.lastIndexOf('\n', Math.max(0, selection.start - 1)) + 1;
  const lineEndIndex = text.indexOf('\n', selection.end);
  const lastLineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;

  const region = text.slice(firstLineStart, lastLineEnd);
  const lines = region.split('\n');
  // Toggle off only when every line already carries exactly this marker.
  const alreadyApplied = lines.every((line) => ANY_LINE_PREFIX.exec(line)?.[0] === prefix);

  const next = lines
    .map((line) => {
      const stripped = line.replace(ANY_LINE_PREFIX, '');
      return alreadyApplied ? stripped : prefix + stripped;
    })
    .join('\n');

  const delta = next.length - region.length;
  const firstLineDelta = next.split('\n')[0].length - lines[0].length;

  return {
    text: text.slice(0, firstLineStart) + next + text.slice(lastLineEnd),
    selection: {
      start: Math.max(firstLineStart, selection.start + firstLineDelta),
      end: Math.max(firstLineStart, selection.end + delta),
    },
  };
}

/**
 * Which styles the current selection is already sitting in — drives the toolbar's
 * active states so the buttons read as toggles rather than one-way stamps.
 */
export function activeMarkdownActions(text: string, selection: TextSelection): MarkdownAction[] {
  const { start, end } = clamp(text, selection);
  const active: MarkdownAction[] = [];

  for (const [action, marker] of Object.entries(WRAP_MARKER) as [MarkdownAction, string][]) {
    if (surroundedBy(text, start, end, marker) || isWrappedValue(text.slice(start, end), marker)) {
      active.push(action);
    }
  }

  const lineStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  const lineEndIndex = text.indexOf('\n', start);
  const line = text.slice(lineStart, lineEndIndex === -1 ? text.length : lineEndIndex);
  const linePrefix = ANY_LINE_PREFIX.exec(line)?.[0];
  if (linePrefix) {
    for (const [action, prefix] of Object.entries(LINE_PREFIX) as [MarkdownAction, string][]) {
      if (linePrefix === prefix) active.push(action);
    }
  }

  return active;
}
