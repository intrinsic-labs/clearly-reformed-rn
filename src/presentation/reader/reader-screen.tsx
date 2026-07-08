import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ResourceDetail } from '@/domain/resource-detail';
import { toResourceRef } from '@/domain/resource-ref';
import { CONTENT_TYPE_LABEL } from '@/presentation/components/content-icons';
import { BookmarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@/presentation/components/icons';
import { useHighlightsFor, useNotebookMutations } from '@/presentation/hooks/queries/use-notebook';
import { useInvalidateProgress, useResourceProgress } from '@/presentation/hooks/queries/use-progress';
import { useIsSaved, useToggleSaved } from '@/presentation/hooks/queries/use-saved';
import { htmlToPlainText, sanitizeArticleHtml } from '@/presentation/lib/sanitize-html';
import { shortDate } from '@/presentation/lib/format';
import { useReaderPrefs, FONT_SIZES_PX, LINE_HEIGHTS } from '@/presentation/reader/prefs';
import { READER_PALETTES } from '@/presentation/reader/themes';
import type { ReaderWebPrefs } from '@/presentation/reader/reader-html';
import {
  ReaderWebView,
  type ReaderProgressEvent,
  type ReaderSelection,
  type ReaderWebViewHandle,
} from '@/presentation/reader/reader-webview';
import { ReaderSettingsSheet } from '@/presentation/reader/settings-sheet';
import { useUseCases } from '@/presentation/providers/use-cases-context';
import { Colors, Fonts } from '@/presentation/theme';

/**
 * The Reader (SPEC §8): immersive, book-like reading over the WebView layout
 * engine. Owns the chrome (top/bottom bars, settings sheet, selection actions),
 * reading-position persistence, and highlight capture into the Notebook.
 * `highlightId` opens the article scrolled to that highlight (Notebook tap-through).
 */
export function ReaderScreen({ detail, highlightId }: { detail: ResourceDetail; highlightId?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const prefs = useReaderPrefs();
  const palette = READER_PALETTES[prefs.theme];
  const resource = useMemo(() => toResourceRef(detail), [detail]);

  const webPrefs: ReaderWebPrefs = useMemo(
    () => ({
      bg: palette.bg,
      fg: palette.fg,
      sub: palette.sub,
      hair: palette.hair,
      bodyFont: prefs.font === 'serif' ? 'FlechaText' : 'PlexSans',
      fontSizePx: FONT_SIZES_PX[prefs.sizeIndex],
      lineHeight: LINE_HEIGHTS[prefs.lineIndex],
      paged: prefs.mode !== 'scroll',
      curlShade: prefs.mode === 'curl',
    }),
    [palette, prefs],
  );

  const bodyHtml = useMemo(() => sanitizeArticleHtml(detail.bodyHtml), [detail.bodyHtml]);
  const totalMinutes = useMemo(() => {
    const words = htmlToPlainText(bodyHtml).split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }, [bodyHtml]);

  const header = useMemo(
    () => ({
      eyebrow: CONTENT_TYPE_LABEL[detail.type],
      title: detail.title,
      byline: [detail.people[0], shortDate(detail.displayDate), `${totalMinutes} min read`]
        .filter(Boolean)
        .join('  ·  '),
      scripture: detail.scriptureRef,
    }),
    [detail, totalMinutes],
  );

  /* ----- position restore + persistence ----- */
  const { progress: progressUseCases } = useUseCases();
  const invalidateProgress = useInvalidateProgress();
  const storedProgress = useResourceProgress(resource.key);
  const latest = useRef<{ charOffset: number; totalChars: number } | null>(null);
  const lastSavedAt = useRef(0);

  const persist = useCallback(
    (force = false) => {
      const snapshot = latest.current;
      if (!snapshot || snapshot.totalChars <= 0) return;
      const now = Date.now();
      if (!force && now - lastSavedAt.current < 2000) return;
      lastSavedAt.current = now;
      progressUseCases.save({
        resource,
        kind: 'read',
        position: snapshot.charOffset,
        length: snapshot.totalChars,
      });
    },
    [progressUseCases, resource],
  );

  useEffect(
    () => () => {
      persist(true);
      invalidateProgress();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /* ----- webview state ----- */
  const webViewRef = useRef<ReaderWebViewHandle>(null);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selection, setSelection] = useState<ReaderSelection | null>(null);
  const [tappedHighlight, setTappedHighlight] = useState<string | null>(null);
  const [view, setView] = useState({ fraction: 0, page: 1, pageCount: 1 });

  const highlights = useHighlightsFor(resource.key);
  const { addHighlight, remove: removeEntry } = useNotebookMutations();

  // Push style changes into the live document.
  const firstPrefs = useRef(true);
  useEffect(() => {
    if (firstPrefs.current) {
      firstPrefs.current = false;
      return;
    }
    webViewRef.current?.applyPrefs(webPrefs);
  }, [webPrefs]);

  // Late-arriving or newly-synced highlights (paint is idempotent).
  useEffect(() => {
    if (highlights.data && highlights.data.length > 0) {
      webViewRef.current?.paintHighlights(highlights.data);
    }
  }, [highlights.data]);

  const onProgress = useCallback(
    (event: ReaderProgressEvent) => {
      setView({ fraction: event.fraction, page: event.page, pageCount: event.pageCount });
      latest.current = { charOffset: event.charOffset, totalChars: latest.current?.totalChars ?? 0 };
      persist();
    },
    [persist],
  );

  const onHighlightPress = () => {
    if (!selection) return;
    addHighlight.mutate(
      {
        resource,
        quote: selection.text,
        prefix: selection.prefix,
        suffix: selection.suffix,
        charOffset: selection.charOffset,
        note: null,
      },
      {
        onSuccess: (entry) => webViewRef.current?.applyHighlightToSelection(entry.id),
      },
    );
    setSelection(null);
  };

  const onRemoveHighlight = () => {
    if (!tappedHighlight) return;
    removeEntry.mutate({ kind: 'highlight', id: tappedHighlight });
    webViewRef.current?.removeHighlight(tappedHighlight);
    setTappedHighlight(null);
  };

  const isSaved = useIsSaved(resource.key).data ?? false;
  const toggleSaved = useToggleSaved();

  /* ----- chrome animation ----- */
  const chromeOn = chromeVisible && !settingsOpen;
  // Lazy state (not a ref) so the interpolations can be read during render.
  const [chromeAnim] = useState(() => new Animated.Value(1));
  useEffect(() => {
    Animated.timing(chromeAnim, { toValue: chromeOn ? 1 : 0, duration: 240, useNativeDriver: true }).start();
  }, [chromeOn, chromeAnim]);
  const topTranslate = chromeAnim.interpolate({ inputRange: [0, 1], outputRange: [-120, 0] });
  const bottomTranslate = chromeAnim.interpolate({ inputRange: [0, 1], outputRange: [140, 0] });

  const minutesLeft = Math.max(0, Math.ceil(totalMinutes * (1 - view.fraction)));
  const paged = prefs.mode !== 'scroll';
  // A targeted highlight wins over the stored reading position; the char-offset
  // anchor survives any typography settings because layout is derived from it.
  const targetHighlight = highlightId ? highlights.data?.find((h) => h.id === highlightId) : undefined;
  const initialCharOffset =
    targetHighlight?.charOffset ??
    (storedProgress.data && storedProgress.data.kind === 'read' && !storedProgress.data.completed
      ? storedProgress.data.position
      : 0);

  // Hold rendering one frame set until the stored position is known — the offset
  // is delivered at document-ready and can't be re-sent later without a jump.
  if (storedProgress.isLoading || highlights.isLoading) {
    return <View style={[styles.screen, { backgroundColor: palette.bg }]} />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.bg }]}>
      <StatusBar style={prefs.theme === 'night' ? 'light' : 'dark'} />

      <ReaderWebView
        ref={webViewRef}
        bodyHtml={bodyHtml}
        header={header}
        insets={{ top: insets.top, bottom: insets.bottom }}
        initialPrefs={webPrefs}
        initialCharOffset={initialCharOffset}
        initialHighlights={highlights.data ?? []}
        targetHighlightId={highlightId}
        onProgress={onProgress}
        onLayout={(info) => {
          latest.current = { charOffset: latest.current?.charOffset ?? 0, totalChars: info.totalChars };
          setView((v) => ({ ...v, pageCount: info.pageCount }));
        }}
        onTap={() => setChromeVisible((v) => !v)}
        onLink={(href) => Linking.openURL(href).catch(() => {})}
        onSelection={(sel) => {
          setSelection(sel);
          if (sel) setTappedHighlight(null);
        }}
        onHighlightTap={(id) => {
          setTappedHighlight((current) => (current === id ? null : id));
          setSelection(null);
        }}
      />

      {/* Top bar (its bottom edge is the live reading-progress bar) */}
      <Animated.View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top,
            backgroundColor: palette.barBg,
            transform: [{ translateY: topTranslate }],
          },
        ]}>
        <Pressable style={styles.barButton} onPress={() => router.back()} hitSlop={8} accessibilityLabel="Back">
          <ChevronLeftIcon size={22} color={palette.fg} />
        </Pressable>
        <Text style={[styles.barLabel, { color: palette.sub }]}>{CONTENT_TYPE_LABEL[detail.type]}s</Text>
        <View style={styles.barGroup}>
          <Pressable style={styles.barButton} onPress={() => setSettingsOpen(true)} hitSlop={6} accessibilityLabel="Text settings">
            <Text style={[styles.aaGlyph, { color: palette.fg }]}>Aa</Text>
          </Pressable>
          <Pressable
            style={styles.barButton}
            onPress={() => toggleSaved.mutate(resource)}
            hitSlop={6}
            accessibilityLabel={isSaved ? 'Remove from saved' : 'Save'}>
            <BookmarkIcon size={19} color={isSaved ? Colors.gold : palette.fg} filled={isSaved} />
          </Pressable>
        </View>
        <View style={[styles.headerTrack, { backgroundColor: palette.track }]}>
          <View style={[styles.progressFill, { width: `${view.fraction * 100}%` }]} />
        </View>
      </Animated.View>

      {/* Bottom bar */}
      <Animated.View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + 6,
            backgroundColor: palette.barBg,
            borderTopColor: palette.hair,
            transform: [{ translateY: bottomTranslate }],
          },
        ]}>
        {paged ? (
          <View style={styles.pagedRow}>
            <Pressable style={styles.pageButton} onPress={() => webViewRef.current?.goPage(-1)} hitSlop={6} accessibilityLabel="Previous page">
              <ChevronLeftIcon size={20} color={palette.fg} />
            </Pressable>
            <Text style={[styles.bottomLabel, { color: palette.sub }]}>
              Page {view.page} of {view.pageCount}
            </Text>
            <Pressable style={styles.pageButton} onPress={() => webViewRef.current?.goPage(1)} hitSlop={6} accessibilityLabel="Next page">
              <ChevronRightIcon size={20} color={palette.fg} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.scrollRow}>
            <Text style={[styles.bottomLabel, { color: palette.sub }]}>{Math.round(view.fraction * 100)}% read</Text>
            <Text style={[styles.bottomLabel, { color: palette.sub }]}>{minutesLeft} min left</Text>
          </View>
        )}
      </Animated.View>

      {/* Selection / highlight actions */}
      {selection ? (
        <View style={[styles.actionPill, { bottom: insets.bottom + 92 }]}>
          <Pressable style={styles.actionButton} onPress={onHighlightPress}>
            <Text style={styles.actionButtonLabel}>Highlight</Text>
          </Pressable>
          <View style={styles.actionDivider} />
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              webViewRef.current?.clearSelection();
              setSelection(null);
            }}>
            <Text style={styles.actionButtonLabelMuted}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}
      {tappedHighlight ? (
        <View style={[styles.actionPill, { bottom: insets.bottom + 92 }]}>
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              const entry = highlights.data?.find((h) => h.id === tappedHighlight);
              router.push({
                pathname: '/note-editor',
                params: { highlightId: tappedHighlight, note: entry?.note ?? '' },
              });
              setTappedHighlight(null);
            }}>
            <Text style={styles.actionButtonLabel}>
              {highlights.data?.find((h) => h.id === tappedHighlight)?.note ? 'Edit note' : 'Add note'}
            </Text>
          </Pressable>
          <View style={styles.actionDivider} />
          <Pressable style={styles.actionButton} onPress={onRemoveHighlight}>
            <Text style={styles.actionButtonLabel}>Remove</Text>
          </Pressable>
          <View style={styles.actionDivider} />
          <Pressable style={styles.actionButton} onPress={() => setTappedHighlight(null)}>
            <Text style={styles.actionButtonLabelMuted}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}

      <ReaderSettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  headerTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2.5,
  },
  barButton: {
    width: 40,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  aaGlyph: {
    fontFamily: Fonts.serifBold,
    fontSize: 19,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingTop: 6,
    paddingHorizontal: 22,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.goldBright,
  },
  scrollRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 4,
  },
  pagedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  pageButton: {
    width: 40,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11.5,
    letterSpacing: 0.3,
    fontVariant: ['tabular-nums'],
  },
  actionPill: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.green,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
    shadowColor: '#14120C',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  actionButtonLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.onGreen,
  },
  actionButtonLabelMuted: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.onGreenMuted,
  },
  actionDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(241,235,221,0.2)',
  },
});
