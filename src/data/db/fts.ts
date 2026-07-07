/**
 * Build a safe FTS5 MATCH expression from raw user input: each term is quoted so
 * query syntax (AND/OR/NEAR/^/*) can't leak in, and the final term prefix-matches
 * so search-as-you-type feels immediate.
 */
export function ftsQuery(term: string): string {
  const words = term
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `"${word.replace(/"/g, '')}"`);
  if (words.length === 0) return '""';
  words[words.length - 1] += '*';
  return words.join(' ');
}
