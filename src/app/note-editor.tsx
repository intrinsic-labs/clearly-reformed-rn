import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNotebookMutations } from '@/presentation/hooks/queries/use-notebook';
import { Colors, Fonts, Radius, Spacing } from '@/presentation/theme';

/**
 * Note editor modal. Three uses, routed by params:
 *  - no params            → new standalone note
 *  - noteId (+fields)     → edit an existing note
 *  - highlightId (+note)  → attach/edit the annotation on a highlight
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
  const [title, setTitle] = useState(params.title ?? '');
  const [body, setBody] = useState(forHighlight ? (params.note ?? '') : (params.body ?? ''));
  const [tags, setTags] = useState(params.tags ?? '');

  const { addNote, updateNote, setHighlightNote } = useNotebookMutations();
  const canSave = body.trim().length > 0 || (forHighlight && (params.note ?? '').length > 0);

  const onSave = () => {
    const parsedTags = tags
      .split(/[,\s]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (forHighlight) {
      setHighlightNote.mutate({ id: params.highlightId!, note: body.trim() || null });
    } else if (params.noteId) {
      updateNote.mutate({ id: params.noteId, title: title.trim() || null, body: body.trim(), tags: parsedTags });
    } else {
      addNote.mutate({ resource: null, title: title.trim() || null, body: body.trim(), tags: parsedTags });
    }
    router.back();
  };

  const heading = forHighlight ? 'Note on highlight' : params.noteId ? 'Edit note' : 'New note';

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.heading}>{heading}</Text>
        <Pressable onPress={onSave} disabled={!canSave} hitSlop={8}>
          <Text style={[styles.save, !canSave && styles.saveDisabled]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
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
          style={styles.bodyInput}
          value={body}
          onChangeText={setBody}
          placeholder={forHighlight ? 'Add your thoughts on this highlight…' : 'Write your note…'}
          placeholderTextColor={Colors.textMuted}
          multiline
          autoFocus
          textAlignVertical="top"
        />
        {!forHighlight ? (
          <TextInput
            style={styles.tagsInput}
            value={tags}
            onChangeText={setTags}
            placeholder="Tags (comma separated) — e.g. ecclesiology, prayer"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
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
  heading: {
    fontFamily: Fonts.serifBold,
    fontSize: 17,
    color: Colors.ink,
  },
  cancel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.textMuted,
  },
  save: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.goldDeep,
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
    fontSize: 22,
    color: Colors.ink,
    paddingVertical: 16,
  },
  bodyInput: {
    fontFamily: Fonts.serifText,
    fontSize: 16.5,
    lineHeight: 25,
    color: Colors.inkSoft,
    minHeight: 220,
    paddingTop: 8,
  },
  tagsInput: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    color: Colors.bodyText,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderChrome,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 18,
    marginBottom: 30,
  },
});
