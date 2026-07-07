import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { NoteEntry } from '@/domain/notebook';
import { NotebookIcon } from '@/presentation/components/icons';
import { NotebookCardShell } from '@/presentation/components/notebook/card-shell';
import { relativeDate } from '@/presentation/lib/format';
import { Colors, Fonts, Radius } from '@/presentation/theme';
import Svg, { Line, Path } from 'react-native-svg';

export function NoteCard({
  entry,
  onPress,
  onOpenSource,
  onLongPress,
}: {
  entry: NoteEntry;
  onPress: () => void;
  onOpenSource: () => void;
  onLongPress: () => void;
}) {
  return (
    <NotebookCardShell
      icon={<NotebookIcon size={13} color="#8A6A12" />}
      label="Note"
      when={relativeDate(entry.createdAt)}
      tinted
      onPress={onPress}
      onLongPress={onLongPress}>
      {entry.title ? <Text style={styles.title}>{entry.title}</Text> : null}
      <Text style={styles.body} numberOfLines={6}>
        {entry.body}
      </Text>

      {entry.tags.length > 0 ? (
        <View style={styles.tagsRow}>
          {entry.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagLabel}>#{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {entry.resource ? (
        <Pressable style={styles.linkedRow} onPress={onOpenSource}>
          {entry.resource.thumbnailUrl ? (
            <Image source={{ uri: entry.resource.thumbnailUrl }} style={styles.linkedThumb} contentFit="cover" />
          ) : (
            <View style={[styles.linkedThumb, { backgroundColor: Colors.borderSoft }]} />
          )}
          <View style={styles.linkedText}>
            <Text style={styles.linkedTitle} numberOfLines={1}>
              {entry.resource.title}
            </Text>
            <Text style={styles.linkedMeta}>Linked {entry.resource.type}</Text>
          </View>
          <LinkGlyph />
        </Pressable>
      ) : null}
    </NotebookCardShell>
  );
}

function LinkGlyph() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path d="M9 17H7A5 5 0 0 1 7 7h2" stroke="#A8761A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 7h2a5 5 0 0 1 0 10h-2" stroke="#A8761A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={8} y1={12} x2={16} y2={12} stroke="#A8761A" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.serifBold,
    fontSize: 17,
    lineHeight: 20.5,
    color: Colors.ink,
    marginTop: 12,
  },
  body: {
    fontFamily: Fonts.serifText,
    fontSize: 14.5,
    lineHeight: 22,
    color: '#5F5642',
    marginTop: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 14,
  },
  tag: {
    backgroundColor: '#F1E7D0',
    borderWidth: 1,
    borderColor: '#E6D9BB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.bodyText,
  },
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: 14,
  },
  linkedThumb: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm - 1,
  },
  linkedText: {
    flex: 1,
    minWidth: 0,
  },
  linkedTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 12.5,
    lineHeight: 15,
    color: Colors.ink,
  },
  linkedMeta: {
    fontFamily: Fonts.sans,
    fontSize: 10.5,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
