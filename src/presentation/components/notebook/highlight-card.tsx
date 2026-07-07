import { StyleSheet, Text, View } from 'react-native';

import type { HighlightEntry } from '@/domain/notebook';
import { ContentTypeIcon } from '@/presentation/components/content-icons';
import { NotebookIcon } from '@/presentation/components/icons';
import { cardShellStyles, NotebookCardShell } from '@/presentation/components/notebook/card-shell';
import { SourceRow } from '@/presentation/components/notebook/source-row';
import { relativeDate } from '@/presentation/lib/format';
import { Colors, Fonts, Spacing } from '@/presentation/theme';

export function HighlightCard({
  entry,
  onOpenSource,
  onLongPress,
}: {
  entry: HighlightEntry;
  onOpenSource: () => void;
  onLongPress?: () => void;
}) {
  return (
    <NotebookCardShell
      icon={<ContentTypeIcon type={entry.resource.type} size={13} />}
      label="Highlight"
      when={relativeDate(entry.createdAt)}
      onPress={onOpenSource}
      onLongPress={onLongPress}>
      <Text style={styles.quote}>
        “<Text style={styles.quoteWash}>{entry.quote}</Text>”
      </Text>

      {entry.note ? (
        <View style={styles.noteBox}>
          <NotebookIcon size={13} color={Colors.textMuted} />
          <Text style={styles.noteText}>{entry.note}</Text>
        </View>
      ) : null}

      <View style={cardShellStyles.divider} />
      <SourceRow resource={entry.resource} onPress={onOpenSource} />
    </NotebookCardShell>
  );
}

const styles = StyleSheet.create({
  quote: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    lineHeight: 25.5,
    color: '#2A2419',
    marginTop: 13,
  },
  quoteWash: {
    backgroundColor: 'rgba(200,148,31,0.22)',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: '#FBF6EA',
    borderWidth: 1,
    borderColor: '#EDE3CC',
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginTop: Spacing.lg - 2,
  },
  noteText: {
    flex: 1,
    fontFamily: Fonts.serifText,
    fontSize: 13.5,
    lineHeight: 19.5,
    color: Colors.bodyText,
  },
});
