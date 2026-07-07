import type {
  NewClip,
  NewHighlight,
  NewNote,
  NotebookCounts,
  NotebookFilter,
  NotebookRepository,
} from '@/application/ports/notebook-repository';
import type {
  ClipEntry,
  HighlightEntry,
  NotebookEntry,
  NotebookEntryKind,
  NoteEntry,
} from '@/domain/notebook';

export interface NotebookUseCases {
  list(filter: NotebookFilter): Promise<readonly NotebookEntry[]>;
  counts(): Promise<NotebookCounts>;
  search(term: string): Promise<readonly NotebookEntry[]>;
  addHighlight(input: NewHighlight): Promise<HighlightEntry>;
  addClip(input: NewClip): Promise<ClipEntry>;
  addNote(input: NewNote): Promise<NoteEntry>;
  setHighlightNote(id: string, note: string | null): Promise<void>;
  updateNote(id: string, changes: { title: string | null; body: string; tags: readonly string[] }): Promise<void>;
  remove(kind: NotebookEntryKind, id: string): Promise<void>;
  highlightsFor(resourceKey: string): Promise<readonly HighlightEntry[]>;
}

/**
 * The Notebook's application service — thin orchestration over the repository port
 * plus the input hygiene that shouldn't live in UI code.
 */
export function makeNotebookUseCases(repository: NotebookRepository): NotebookUseCases {
  return {
    list: (filter) => repository.list(filter),
    counts: () => repository.counts(),
    search: (term) => (term.trim() ? repository.search(term.trim()) : Promise.resolve([])),

    addHighlight: (input) => repository.addHighlight({ ...input, quote: input.quote.trim() }),
    addClip: (input) => repository.addClip(input),
    addNote: (input) =>
      repository.addNote({
        ...input,
        title: input.title?.trim() || null,
        body: input.body.trim(),
        tags: normalizeTags(input.tags),
      }),

    setHighlightNote: (id, note) => repository.setHighlightNote(id, note?.trim() || null),
    updateNote: (id, changes) =>
      repository.updateNote(id, {
        title: changes.title?.trim() || null,
        body: changes.body.trim(),
        tags: normalizeTags(changes.tags),
      }),
    remove: (kind, id) => repository.remove(kind, id),
    highlightsFor: (resourceKey) => repository.highlightsFor(resourceKey),
  };
}

/** Lowercase, strip leading '#', drop empties and duplicates. */
function normalizeTags(tags: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  for (const raw of tags) {
    const tag = raw.trim().replace(/^#/, '').toLowerCase();
    if (tag) seen.add(tag);
  }
  return [...seen];
}
