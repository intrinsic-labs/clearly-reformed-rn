import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  NewClip,
  NewHighlight,
  NewNote,
  NotebookFilter,
} from '@/application/ports/notebook-repository';
import type { NotebookEntryKind } from '@/domain/notebook';
import { useUseCases } from '@/presentation/providers/use-cases-context';

/**
 * SQLite is the queryable source; TanStack Query makes it reactive (SPEC §3):
 * every mutation invalidates the 'notebook' scope so lists and counts refresh.
 */

export function useNotebook(filter: NotebookFilter) {
  const { notebook } = useUseCases();
  return useQuery({
    queryKey: ['notebook', 'list', filter],
    queryFn: () => notebook.list(filter),
  });
}

/** FTS search across quotes, captions, notes, and titles. */
export function useNotebookSearch(term: string) {
  const { notebook } = useUseCases();
  return useQuery({
    queryKey: ['notebook', 'find', term],
    queryFn: () => notebook.search(term),
    enabled: term.trim().length >= 2,
  });
}

export function useNotebookCounts() {
  const { notebook } = useUseCases();
  return useQuery({
    queryKey: ['notebook', 'counts'],
    queryFn: () => notebook.counts(),
  });
}

/** Live highlights for one resource — the Reader paints these over the body. */
export function useHighlightsFor(resourceKey: string | undefined) {
  const { notebook } = useUseCases();
  return useQuery({
    queryKey: ['notebook', 'highlights', resourceKey],
    queryFn: () => notebook.highlightsFor(resourceKey!),
    enabled: Boolean(resourceKey),
  });
}

export function useNotebookMutations() {
  const { notebook } = useUseCases();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notebook'] });

  const addHighlight = useMutation({
    mutationFn: (input: NewHighlight) => notebook.addHighlight(input),
    onSuccess: invalidate,
  });
  const addClip = useMutation({
    mutationFn: (input: NewClip) => notebook.addClip(input),
    onSuccess: invalidate,
  });
  const addNote = useMutation({
    mutationFn: (input: NewNote) => notebook.addNote(input),
    onSuccess: invalidate,
  });
  const setHighlightNote = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string | null }) => notebook.setHighlightNote(id, note),
    onSuccess: invalidate,
  });
  const updateNote = useMutation({
    mutationFn: ({
      id,
      ...changes
    }: {
      id: string;
      title: string | null;
      body: string;
      tags: readonly string[];
    }) => notebook.updateNote(id, changes),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: ({ kind, id }: { kind: NotebookEntryKind; id: string }) => notebook.remove(kind, id),
    onSuccess: invalidate,
  });

  return { addHighlight, addClip, addNote, setHighlightNote, updateNote, remove };
}
