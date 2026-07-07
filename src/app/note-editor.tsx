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

import { CloseIcon } from '@/presentation/components/icons';
import { useNotebookMutations } from '@/presentation/hooks/queries/use-notebook';
import { Colors, Fonts, Radius, Spacing } from '@/presentation/theme';

/**
 * Note editor — a full screen pushed onto the stack (writing isn't a quick,
 * throwaway act). Three uses, routed by params:
 *  - no params            → new standalone note
 *  - noteId (+fields)     → edit an existing note
 *  - highlightId (+note)  → attach/edit the annotation on a highlight
 *
 * Tags live as pills directly under the title: type in the inline field and
 * commit with comma/space/return; tap a pill to remove it.
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
  const [tags, setTags] = useState<string[]>(() =>
    (params.tags ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  );
  const [tagInput, setTagInput] = useState('');

  const { addNote, updateNote, setHighlightNote } = useNotebookMutations();
  const canSave = body.trim().length > 0 || (forHighlight && (params.note ?? '').length > 0);

  const commitTag = (raw: string) => {
    const tag = raw.trim().replace(/^#/, '').toLowerCase();
    if (tag && !tags.includes(tag)) setTags((current) => [...current, tag]);
    setTagInput('');
  };

  const onTagChange = (text: string) => {
    if (/[,\s]$/.test(text)) {
      commitTag(text);
    } else {
      setTagInput(text);
    }
  };

  const onSave = () => {
    const finalTags = tagInput.trim() ? [...tags, tagInput.trim().replace(/^#/, '').toLowerCase()] : tags;
    if (forHighlight) {
      setHighlightNote.mutate({ id: params.highlightId!, note: body.trim() || null });
    } else if (params.noteId) {
      updateNote.mutate({ id: params.noteId, title: title.trim() || null, body: body.trim(), tags: finalTags });
    } else {
      addNote.mutate({ resource: null, title: title.trim() || null, body: body.trim(), tags: finalTags });
    }
    router.back();
  };

  const heading = forHighlight ? 'Note on highlight' : params.noteId ? 'Edit note' : 'New note';

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
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
          <>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor={Colors.textMuted}
              returnKeyType="next"
            />
            <View style={styles.tagsRow}>
              {tags.map((tag) => (
                <Pressable
                  key={tag}
                  style={styles.tagPill}
                  onPress={() => setTags((current) => current.filter((t) => t !== tag))}
                  accessibilityLabel={`Remove tag ${tag}`}>
                  <Text style={styles.tagLabel}>#{tag}</Text>
                  <CloseIcon size={9} color={Colors.textMuted} weight={2.4} />
                </Pressable>
              ))}
              <TextInput
                style={styles.tagInput}
                value={tagInput}
                onChangeText={onTagChange}
                onSubmitEditing={() => commitTag(tagInput)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace' && tagInput === '' && tags.length > 0) {
                    setTags((current) => current.slice(0, -1));
                  }
                }}
                placeholder={tags.length === 0 ? 'Add tags' : 'Add another'}
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={false}
              />
            </View>
          </>
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
        <View style={{ height: 60 }} />
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
    paddingTop: 16,
    paddingBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
    marginBottom: 12,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1E7D0',
    borderWidth: 1,
    borderColor: '#E6D9BB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  tagLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11.5,
    color: Colors.bodyText,
  },
  tagInput: {
    minWidth: 90,
    flexGrow: 1,
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.inkSoft,
    paddingVertical: 5,
  },
  bodyInput: {
    fontFamily: Fonts.serifText,
    fontSize: 16.5,
    lineHeight: 25,
    color: Colors.inkSoft,
    minHeight: 220,
    paddingTop: 4,
  },
});
