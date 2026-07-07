import { View } from 'react-native';

import type { SavedItem } from '@/application/ports/saved-repository';
import { BookmarkIcon } from '@/presentation/components/icons';
import { NotebookCardShell } from '@/presentation/components/notebook/card-shell';
import { SourceRow } from '@/presentation/components/notebook/source-row';
import { relativeDate } from '@/presentation/lib/format';
import { Colors } from '@/presentation/theme';

/** A bookmarked piece of content, under the Notebook's "Saved" chip. */
export function SavedCard({
  item,
  onOpen,
  onLongPress,
}: {
  item: SavedItem;
  onOpen: () => void;
  onLongPress?: () => void;
}) {
  return (
    <NotebookCardShell
      icon={<BookmarkIcon size={13} color={Colors.goldDeep} filled />}
      label="Saved"
      when={relativeDate(item.savedAt)}
      onPress={onOpen}
      onLongPress={onLongPress}>
      <View style={{ marginTop: 13 }}>
        <SourceRow resource={item.resource} onPress={onOpen} />
      </View>
    </NotebookCardShell>
  );
}
