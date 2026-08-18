import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  EnrichedMarkdownTextInput,
  type EnrichedMarkdownTextInputInstance,
  type StyleState,
} from 'react-native-enriched-markdown';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, ChevronLeftIcon, CloseIcon, PencilIcon, TagIcon } from '@/presentation/components/icons';
import { FormatToolbar, type FormatAction } from '@/presentation/components/notebook/format-toolbar';
import { useNotebook, useNotebookMutations } from '@/presentation/hooks/queries/use-notebook';
import { useAnimatedKeyboardBottomInset } from '@/presentation/hooks/use-keyboard-bottom-inset';
import { Colors, Fonts, Radius, Spacing } from '@/presentation/theme';

/**
 * The note screen — pushed onto the stack. One surface, like a system notes app:
 * the note IS the live rich-text editor (`EnrichedMarkdownTextInput`, a native
 * text view), so what you read and what you edit are the same pixels — "viewing"
 * is just the keyboard being closed. Tap anywhere in the text and the caret
 * lands there; tap Bold and the words go bold in place — the user never sees
 * markup. Markdown exists only as the storage format, read via `defaultValue`
 * and written back from `onChangeMarkdown`, so existing notes and the
 * FTS/preview pipeline are untouched. Edits autosave on a debounce while typing
 * and save again on Done and on back — nothing is lost silently.
 *
 * Routed by params:
 *  - no params            → new standalone note (opens with the keyboard up)
 *  - noteId (+fields)     → existing note (opens with the keyboard closed)
 *  - highlightId (+note)  → annotation on a highlight
 *
 * Tags are managed from the tag button in the header: a sheet listing every tag
 * you've used before (tap to toggle) plus a field for new ones.
 *
 * Keyboard handling: the body is a single flexing field rather than a growing
 * input inside a ScrollView, so the caret is kept in view by the platform text
 * view itself. The formatting bar sits at the bottom of the editor layout: iOS
 * (where the keyboard overlays rather than resizes) shrinks the editor by the
 * live keyboard inset, which carries the bar up with it; Android's window
 * already resizes (adjustResize).
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
  // "Editing" is simply whether the body has the keyboard — the note is always
  // the same live editor; focus/blur below keep this in sync.
  const [editing, setEditing] = useState(false);

  const bodyRef = useRef<EnrichedMarkdownTextInputInstance>(null);
  // Brand-new (or still-empty highlight) notes open straight into the keyboard.
  const openKeyboardOnMount = useRef(forHighlight ? !(params.note ?? '').trim() : !params.noteId);
  useEffect(() => {
    if (openKeyboardOnMount.current) {
      const timer = setTimeout(() => bodyRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
  }, []);

  /* ----- live formatting ----- */
  // The native input owns text, caret and styling; the toolbar just calls its
  // toggles and lights up from the style state it reports at the caret.
  const [styleState, setStyleState] = useState<StyleState | null>(null);

  const onFormat = (action: FormatAction) => {
    const input = bodyRef.current;
    if (!input) return;
    switch (action) {
      case 'h1':
      case 'h2':
      case 'h3':
        input.toggleHeading(Number(action[1]) as 1 | 2 | 3);
        break;
      case 'bold':
        input.toggleBold();
        break;
      case 'italic':
        input.toggleItalic();
        break;
      case 'bullet':
        input.toggleUnorderedList();
        break;
      case 'ordered':
        input.toggleOrderedList();
        break;
    }
  };

  const toolbar = (
    <FormatToolbar state={styleState} onAction={onFormat} onDismissKeyboard={() => Keyboard.dismiss()} />
  );

  const { addNote, updateNote, setHighlightNote } = useNotebookMutations();
  const canSave = body.trim().length > 0 || forHighlight;

  // iOS floats the keyboard over the layout, so the editor has to give back the
  // space itself; Android's window is already resized (adjustResize).
  const keyboardOverlays = Platform.OS === 'ios';
  const keyboardBottomInset = useAnimatedKeyboardBottomInset();
  // The toolbar's own bottom padding: the safe-area inset while the keyboard is
  // closed, easing to zero as the keyboard (taller than the inset) slides under it.
  const toolbarPad = keyboardBottomInset.interpolate({
    inputRange: [0, Math.max(1, insets.bottom)],
    outputRange: [insets.bottom, 0],
    extrapolate: 'clamp',
  });

  const onTagsChange = (nextTags: string[]) => {
    setTags(nextTags);
    if (!forHighlight && noteId) {
      updateNote.mutate({ id: noteId, title: title.trim() || null, body: body.trim(), tags: nextTags });
    }
  };

  // Autosave can fire while the first insert is still in flight; without this
  // guard a second tick would create a duplicate note instead of updating.
  const creating = useRef(false);
  const persist = () => {
    if (!canSave) return;
    if (forHighlight) {
      setHighlightNote.mutate({ id: params.highlightId!, note: body.trim() || null });
    } else if (noteId) {
      updateNote.mutate({ id: noteId, title: title.trim() || null, body: body.trim(), tags });
    } else if (!creating.current) {
      creating.current = true;
      addNote.mutate(
        { resource: null, title: title.trim() || null, body: body.trim(), tags },
        {
          onSuccess: (entry) => setNoteId(entry.id),
          onSettled: () => {
            creating.current = false;
          },
        },
      );
    }
  };

  // Debounced autosave: Done/back still save immediately, this just caps what
  // a crash or swipe-away can lose to about a second of typing.
  const persistRef = useRef(persist);
  useEffect(() => {
    persistRef.current = persist;
  });
  useEffect(() => {
    if (!canSave) return;
    const timer = setTimeout(() => persistRef.current(), 1000);
    return () => clearTimeout(timer);
  }, [canSave, title, body, tags]);

  const onToggleMode = () => {
    if (editing) {
      persist();
      bodyRef.current?.blur();
    } else {
      bodyRef.current?.focus();
    }
  };

  const onBack = () => {
    persist();
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

      <Animated.View style={[styles.content, keyboardOverlays ? { marginBottom: keyboardBottomInset } : null]}>
        <View style={styles.editor}>
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
          {!forHighlight && tags.length > 0 ? (
            <Pressable style={styles.tagsRow} onPress={() => setTagsOpen(true)} accessibilityLabel="Edit tags">
              {tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagLabel}>#{tag}</Text>
                </View>
              ))}
            </Pressable>
          ) : null}
          <EnrichedMarkdownTextInput
            ref={bodyRef}
            style={styles.bodyInput}
            markdownStyle={editorMarkdownStyle}
            defaultValue={body}
            onChangeMarkdown={setBody}
            onChangeState={setStyleState}
            onFocus={() => setEditing(true)}
            onBlur={() => setEditing(false)}
            placeholder={forHighlight ? 'Add your thoughts on this highlight…' : 'Write your note…'}
            placeholderTextColor={Colors.textMuted}
            cursorColor={Colors.goldDeep}
            selectionColor={Colors.gold}
            scrollEnabled
            multiline
          />
        </View>
        {editing ? (
          /* Above the keyboard while it's up; clear of the home indicator when not. */
          <Animated.View style={[styles.toolbarHolder, { paddingBottom: toolbarPad }]}>{toolbar}</Animated.View>
        ) : null}
      </Animated.View>

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
  // The keyboard offset above also applies while the sheet is "offscreen", so with
  // the keyboard up its hidden position pokes into view behind the keys — fade it
  // out entirely once the slide has (mostly) landed.
  const sheetOpacity = slide.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] });
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
          {
            paddingBottom: insets.bottom + 22,
            opacity: sheetOpacity,
            transform: [{ translateY: sheetTranslateY }],
          },
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

/** Styling for the editor's styled runs (headings, bold, lists). */
const editorMarkdownStyle = {
  strong: { color: Colors.ink },
  h1: { fontSize: 23, fontWeight: '600' },
  h2: { fontSize: 19.5, fontWeight: '600' },
  h3: { fontSize: 17, fontWeight: '600' },
  list: { itemSpacing: 6 },
};

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
  content: {
    flex: 1,
  },
  editor: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  titleInput: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 22,
    lineHeight: 28,
    color: Colors.ink,
    paddingTop: 16,
    paddingBottom: 10,
  },
  bodyInput: {
    // Flexing (rather than growing inside a ScrollView) is what keeps the caret
    // clear of the keyboard: the native text view scrolls itself.
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 25,
    color: Colors.inkSoft,
    paddingTop: 4,
  },
  toolbarHolder: {
    backgroundColor: Colors.surface,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingBottom: 10,
  },
  tag: {
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
