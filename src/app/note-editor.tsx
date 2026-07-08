import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, ChevronLeftIcon, CloseIcon, PencilIcon, TagIcon } from '@/presentation/components/icons';
import { useNotebook, useNotebookMutations } from '@/presentation/hooks/queries/use-notebook';
import { useAnimatedKeyboardBottomInset } from '@/presentation/hooks/use-keyboard-bottom-inset';
import { Colors, Fonts, Radius, Spacing } from '@/presentation/theme';

/**
 * The note screen — pushed onto the stack, with two modes: a clean reading view
 * (long notes are their own little reading surface) and an edit mode toggled from
 * the header. Edits save on Done and on back — nothing is lost silently.
 *
 * Routed by params:
 *  - no params            → new standalone note (opens in edit mode)
 *  - noteId (+fields)     → existing note (opens reading)
 *  - highlightId (+note)  → annotation on a highlight
 *
 * Tags are managed from the tag button in the header: a sheet listing every tag
 * you've used before (tap to toggle) plus a field for new ones.
 */
export default function NoteEditorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    noteId?: string;
    highlightId?: string;
    title?: string;
    body?: string;
    tags?: string;
    note?: string;
  }>();

  const forHighlight = Boolean(params.highlightId);
  const [noteId, setNoteId] = useState(params.noteId);
  const [title, setTitle] = useState(params.title ?? '');
  const [body, setBody] = useState(forHighlight ? (params.note ?? '') : (params.body ?? ''));
  const [tags, setTags] = useState<string[]>(() =>
    (params.tags ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  );
  const [tagsOpen, setTagsOpen] = useState(false);
  const [editing, setEditing] = useState(() => (forHighlight ? !(params.note ?? '').trim() : !params.noteId));

  const bodyRef = useRef<TextInput>(null);
  useEffect(() => {
    if (editing) {
      // Focus after the input mounts (toggling from reading mode).
      const timer = setTimeout(() => bodyRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
  }, [editing]);

  const { addNote, updateNote, setHighlightNote } = useNotebookMutations();
  const canSave = body.trim().length > 0 || forHighlight;

  const onTagsChange = (nextTags: string[]) => {
    setTags(nextTags);
    if (!forHighlight && noteId) {
      updateNote.mutate({ id: noteId, title: title.trim() || null, body: body.trim(), tags: nextTags });
    }
  };

  const persist = () => {
    if (!canSave) return;
    if (forHighlight) {
      setHighlightNote.mutate({ id: params.highlightId!, note: body.trim() || null });
    } else if (noteId) {
      updateNote.mutate({ id: noteId, title: title.trim() || null, body: body.trim(), tags });
    } else {
      addNote.mutate(
        { resource: null, title: title.trim() || null, body: body.trim(), tags },
        { onSuccess: (entry) => setNoteId(entry.id) },
      );
    }
  };

  const onToggleMode = () => {
    if (editing) {
      persist();
      setEditing(false);
    } else {
      setEditing(true);
    }
  };

  const onBack = () => {
    if (editing) persist();
    router.back();
  };

  const heading = forHighlight ? 'Note on highlight' : 'Note';

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.headerSlot}>
          <Pressable onPress={onBack} hitSlop={8} style={styles.headerIconButton} accessibilityLabel="Back to notebook">
            <ChevronLeftIcon size={24} color={Colors.inkSoft} />
          </Pressable>
        </View>
        <Text style={styles.heading}>{heading}</Text>
        <View style={[styles.headerSlot, styles.headerActions]}>
          {!forHighlight ? (
            <Pressable
              onPress={() => setTagsOpen(true)}
              hitSlop={8}
              style={styles.headerIconButton}
              accessibilityLabel="Edit tags">
              <TagIcon size={18} color={tags.length > 0 ? Colors.goldDeep : Colors.textMuted} filled={tags.length > 0} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={onToggleMode}
            disabled={editing && !canSave}
            hitSlop={8}
            style={[styles.headerIconButton, editing && !canSave && styles.saveDisabled]}
            accessibilityLabel={editing ? 'Done editing note' : 'Edit note'}>
            {editing ? (
              <CheckIcon size={21} color={editing && !canSave ? Colors.textMuted : Colors.goldDeep} />
            ) : (
              <PencilIcon size={19} color={Colors.goldDeep} />
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        {editing ? (
          <>
            {!forHighlight ? (
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Title"
                placeholderTextColor={Colors.textMuted}
                returnKeyType="next"
              />
            ) : null}
            <TextInput
              ref={bodyRef}
              style={styles.bodyInput}
              value={body}
              onChangeText={setBody}
              placeholder={forHighlight ? 'Add your thoughts on this highlight…' : 'Write your note…'}
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          </>
        ) : (
          <Pressable onPress={() => setEditing(true)}>
            {!forHighlight && title ? <Text style={styles.readTitle}>{title}</Text> : null}
            {tags.length > 0 ? (
              <View style={styles.readTagsRow}>
                {tags.map((tag) => (
                  <View key={tag} style={styles.readTag}>
                    <Text style={styles.readTagLabel}>#{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <Text style={styles.readBody}>{body}</Text>
          </Pressable>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>

      {!forHighlight ? (
        <TagsSheet visible={tagsOpen} onClose={() => setTagsOpen(false)} tags={tags} onChange={onTagsChange} />
      ) : null}
    </View>
  );
}

/**
 * Tag picker sheet: every tag used across the notebook as toggle pills, plus a
 * field for brand-new ones. Selection applies immediately; close when done.
 */
function TagsSheet({
  visible,
  onClose,
  tags,
  onChange,
}: {
  visible: boolean;
  onClose: () => void;
  tags: readonly string[];
  onChange: (tags: string[]) => void;
}) {
  const insets = useSafeAreaInsets();
  const keyboardBottomInset = useAnimatedKeyboardBottomInset();
  const notes = useNotebook('notes');
  const knownTags = useMemo(() => {
    const all = new Set<string>();
    for (const entry of notes.data ?? []) {
      if (entry.kind === 'note') entry.tags.forEach((tag) => all.add(tag));
    }
    tags.forEach((tag) => all.add(tag));
    return [...all].sort();
  }, [notes.data, tags]);

  const [newTag, setNewTag] = useState('');

  // Lazy state (not a ref) so the interpolations can be read during render.
  const [slide] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(slide, { toValue: visible ? 1 : 0, duration: 260, useNativeDriver: false }).start();
  }, [visible, slide]);
  const [sheetHeight, setSheetHeight] = useState(0);
  const offscreen = sheetHeight > 0 ? sheetHeight + 60 : 900;
  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [offscreen, 0] });
  const keyboardTranslateY = Animated.multiply(keyboardBottomInset, -1);
  const sheetTranslateY = Animated.add(translateY, keyboardTranslateY);
  const scrimOpacity = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const keyboardBridgeBottom = Animated.multiply(keyboardBottomInset, -1);
  const keyboardBridgeHeight = Animated.add(keyboardBottomInset, 12);

  const toggle = (tag: string) => {
    onChange(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]);
  };

  const commitNew = () => {
    const tag = newTag.trim().replace(/^#/, '').toLowerCase();
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setNewTag('');
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[styles.scrim, { opacity: scrimOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close tags" />
      </Animated.View>
      <Animated.View
        onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + 22, transform: [{ translateY: sheetTranslateY }] },
        ]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.keyboardSheetBridge, { bottom: keyboardBridgeBottom, height: keyboardBridgeHeight }]}
        />
        <View style={styles.sheetTitleRow}>
          <Text style={styles.sheetTitle}>Tags</Text>
          <Pressable style={styles.sheetClose} onPress={onClose} hitSlop={6}>
            <CloseIcon size={13} color={Colors.inkSoft} />
          </Pressable>
        </View>

        {knownTags.length > 0 ? (
          <View style={styles.pillsWrap}>
            {knownTags.map((tag) => {
              const on = tags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  style={[styles.pill, on ? styles.pillOn : null]}
                  onPress={() => toggle(tag)}
                  accessibilityState={{ selected: on }}>
                  <Text style={[styles.pillLabel, on ? styles.pillLabelOn : null]}>#{tag}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={styles.sheetHint}>No tags yet — add your first below.</Text>
        )}

        <View style={styles.newTagRow}>
          <TextInput
            style={styles.newTagInput}
            value={newTag}
            onChangeText={setNewTag}
            onSubmitEditing={commitNew}
            placeholder="New tag"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            blurOnSubmit={false}
          />
          <Pressable
            style={[styles.addButton, !newTag.trim() && styles.addButtonDisabled]}
            onPress={commitNew}
            disabled={!newTag.trim()}>
            <Text style={styles.addButtonLabel}>Add</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerSlot: {
    width: 86,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heading: {
    flex: 1,
    fontFamily: Fonts.serifBold,
    fontSize: 17,
    color: Colors.ink,
    textAlign: 'center',
  },
  headerActions: {
    justifyContent: 'flex-end',
    gap: 18,
  },
  headerIconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDisabled: {
    opacity: 0.4,
  },
  form: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  titleInput: {
    fontFamily: Fonts.serifBold,
    fontSize: 24,
    lineHeight: 29,
    color: Colors.ink,
    paddingTop: 16,
    paddingBottom: 10,
  },
  bodyInput: {
    fontFamily: Fonts.serifText,
    fontSize: 17,
    lineHeight: 27,
    color: Colors.inkSoft,
    minHeight: 220,
    paddingTop: 4,
  },
  readTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 24,
    lineHeight: 29,
    color: Colors.ink,
    paddingTop: 18,
  },
  readTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingTop: 12,
  },
  readTag: {
    backgroundColor: '#F1E7D0',
    borderWidth: 1,
    borderColor: '#E6D9BB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  readTagLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11.5,
    color: Colors.bodyText,
  },
  readBody: {
    fontFamily: Fonts.serifText,
    fontSize: 17,
    lineHeight: 27,
    color: '#4A4232',
    paddingTop: 16,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,18,12,0.34)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    shadowColor: '#14120C',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -12 },
  },
  keyboardSheetBridge: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  sheetTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 19,
    color: Colors.ink,
  },
  sheetClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderChrome,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHint: {
    fontFamily: Fonts.serifText,
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  pill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderChrome,
  },
  pillOn: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  pillLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: Colors.inkSoft,
  },
  pillLabelOn: {
    color: Colors.background,
  },
  newTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  newTagInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderChrome,
    borderRadius: Radius.md,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    color: Colors.ink,
  },
  addButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.green,
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.onGreen,
  },
});
