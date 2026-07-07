import type { SavedItem } from '@/application/ports/saved-repository';
import type { NotebookEntry } from '@/domain/notebook';
import { formatTime } from '@/presentation/lib/format';

/**
 * Render the whole notebook as shareable Markdown (project vision: the personal
 * layer is "searchable, taggable, exportable"). Plain text on purpose — it pastes
 * cleanly into Obsidian/Notes/email.
 */
export function buildNotebookMarkdown(entries: readonly NotebookEntry[], saved: readonly SavedItem[]): string {
  const highlights = entries.filter((e) => e.kind === 'highlight');
  const clips = entries.filter((e) => e.kind === 'clip');
  const notes = entries.filter((e) => e.kind === 'note');

  const parts: string[] = ['# My Clearly Reformed Notebook', ''];

  if (highlights.length > 0) {
    parts.push('## Highlights', '');
    for (const h of highlights) {
      parts.push(`> ${h.quote}`, `— *${h.resource.title}* (${h.resource.link})`);
      if (h.note) parts.push(`  - Note: ${h.note}`);
      parts.push('');
    }
  }

  if (clips.length > 0) {
    parts.push('## Clips', '');
    for (const c of clips) {
      const range = c.endSec != null ? `${formatTime(c.startSec)}–${formatTime(c.endSec)}` : formatTime(c.startSec);
      parts.push(`- ${range} in *${c.resource.title}* (${c.resource.link})${c.caption ? ` — “${c.caption}”` : ''}`);
    }
    parts.push('');
  }

  if (notes.length > 0) {
    parts.push('## Notes', '');
    for (const n of notes) {
      parts.push(`### ${n.title ?? 'Untitled'}`);
      if (n.tags.length > 0) parts.push(n.tags.map((t) => `#${t}`).join(' '));
      parts.push('', n.body, '');
      if (n.resource) parts.push(`Linked: *${n.resource.title}* (${n.resource.link})`, '');
    }
  }

  if (saved.length > 0) {
    parts.push('## Saved', '');
    for (const s of saved) {
      parts.push(`- *${s.resource.title}* (${s.resource.link})`);
    }
    parts.push('');
  }

  return parts.join('\n').trim();
}
