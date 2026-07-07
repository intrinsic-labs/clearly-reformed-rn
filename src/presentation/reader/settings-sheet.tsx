import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { CloseIcon } from '@/presentation/components/icons';
import {
  FONT_SIZES_PX,
  setReaderPrefs,
  useReaderPrefs,
  type ReaderFont,
  type ReaderMode,
  type ReaderTheme,
} from '@/presentation/reader/prefs';
import {
  READER_PALETTES,
  THEME_ACCENT_ACTIVE,
  THEME_LABEL_ACTIVE_LIGHT,
  THEME_LABEL_ACTIVE_NIGHT,
} from '@/presentation/reader/themes';
import { Fonts } from '@/presentation/theme';

const THEMES: readonly { key: ReaderTheme; name: string }[] = [
  { key: 'paper', name: 'Paper' },
  { key: 'white', name: 'White' },
  { key: 'sepia', name: 'Sepia' },
  { key: 'night', name: 'Night' },
];

const FONT_OPTIONS: readonly { key: ReaderFont; label: string; family: string }[] = [
  { key: 'serif', label: 'Flecha', family: Fonts.serifBold },
  { key: 'sans', label: 'Plex Sans', family: Fonts.sansSemiBold },
];

const MODES: readonly { key: ReaderMode; label: string }[] = [
  { key: 'curl', label: 'Curl' },
  { key: 'slide', label: 'Slide' },
  { key: 'scroll', label: 'Scroll' },
];

/**
 * The Reader's "Aa" sheet (Background / Typeface / Text size / Line spacing /
 * Page turn), themed to the active reading palette. Writes straight to the prefs
 * store; the Reader screen reacts and restyles the WebView in place.
 */
export function ReaderSettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const prefs = useReaderPrefs();
  const palette = READER_PALETTES[prefs.theme];
  const sheet = palette.sheet;
  const night = prefs.theme === 'night';

  // Lazy state (not a ref) so the interpolations can be read during render.
  const [slide] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(slide, { toValue: visible ? 1 : 0, duration: 280, useNativeDriver: true }).start();
  }, [visible, slide]);

  // Slide by the sheet's real height (measured) — a fixed offset leaves the top
  // of a taller sheet stranded on screen when closed.
  const [sheetHeight, setSheetHeight] = useState(0);
  const offscreen = sheetHeight > 0 ? sheetHeight + 60 : 900;
  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [offscreen, 0] });
  const scrimOpacity = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const segment = (selected: boolean) => ({
    backgroundColor: selected ? sheet.active : 'transparent',
    ...(selected && sheet.activeShadow
      ? { shadowColor: '#282216', shadowOpacity: 0.16, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }
      : null),
  });
  const segmentText = (selected: boolean) => ({ color: selected ? sheet.fg : sheet.idle });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[styles.scrim, { opacity: scrimOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close text settings" />
      </Animated.View>

      <Animated.View
        onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
        style={[
          styles.sheet,
          { backgroundColor: sheet.bg, paddingBottom: insets.bottom + 22, transform: [{ translateY }] },
        ]}>
        <View style={[styles.grabber, { backgroundColor: night ? '#39403A' : '#E1D8C5' }]} />
        <View style={styles.titleRow}>
          <Text style={[styles.sheetTitle, { color: sheet.fg }]}>Text</Text>
          <Pressable style={[styles.closeButton, { backgroundColor: sheet.track }]} onPress={onClose} hitSlop={6}>
            <CloseIcon size={13} color={sheet.sub} />
          </Pressable>
        </View>

        {/* Background */}
        <Text style={[styles.sectionLabel, { color: sheet.sub }]}>Background</Text>
        <View style={styles.swatchRow}>
          {THEMES.map(({ key, name }) => {
            const on = key === prefs.theme;
            const swatchPalette = READER_PALETTES[key];
            return (
              <Pressable key={key} style={styles.swatchItem} onPress={() => setReaderPrefs({ theme: key })}>
                <View
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: swatchPalette.bg,
                      borderColor: on ? THEME_ACCENT_ACTIVE : swatchPalette.hair,
                      borderWidth: on ? 1.5 : 1,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.swatchLabel,
                    { color: on ? (night ? THEME_LABEL_ACTIVE_NIGHT : THEME_LABEL_ACTIVE_LIGHT) : sheet.sub },
                  ]}>
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Typeface */}
        <Text style={[styles.sectionLabel, { color: sheet.sub }]}>Typeface</Text>
        <View style={[styles.segmentTrack, { backgroundColor: sheet.track }]}>
          {FONT_OPTIONS.map(({ key, label, family }) => (
            <Pressable
              key={key}
              style={[styles.segmentItem, segment(prefs.font === key)]}
              onPress={() => setReaderPrefs({ font: key })}>
              <Text style={[styles.fontLabel, { fontFamily: family }, segmentText(prefs.font === key)]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Text size */}
        <Text style={[styles.sectionLabel, { color: sheet.sub }]}>Text size</Text>
        <View style={[styles.sizeTrack, { backgroundColor: sheet.track }]}>
          <Pressable
            style={styles.sizeButton}
            onPress={() => setReaderPrefs({ sizeIndex: Math.max(0, prefs.sizeIndex - 1) })}
            hitSlop={6}
            accessibilityLabel="Smaller text">
            <Text style={[styles.sizeGlyphSmall, { color: sheet.fg }]}>A</Text>
          </Pressable>
          <View style={styles.dotsRow}>
            {FONT_SIZES_PX.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: index <= prefs.sizeIndex ? THEME_ACCENT_ACTIVE : night ? '#3C443C' : '#D8CFBC' },
                ]}
              />
            ))}
          </View>
          <Pressable
            style={styles.sizeButton}
            onPress={() => setReaderPrefs({ sizeIndex: Math.min(FONT_SIZES_PX.length - 1, prefs.sizeIndex + 1) })}
            hitSlop={6}
            accessibilityLabel="Larger text">
            <Text style={[styles.sizeGlyphLarge, { color: sheet.fg }]}>A</Text>
          </Pressable>
        </View>

        {/* Line spacing */}
        <Text style={[styles.sectionLabel, { color: sheet.sub }]}>Line spacing</Text>
        <View style={[styles.segmentTrack, { backgroundColor: sheet.track }]}>
          {[0, 1, 2].map((index) => {
            const on = prefs.lineIndex === index;
            const gap = index === 0 ? 5 : index === 1 ? 7 : 9;
            return (
              <Pressable
                key={index}
                style={[styles.segmentItem, segment(on)]}
                onPress={() => setReaderPrefs({ lineIndex: index })}
                accessibilityLabel={`Line spacing ${index + 1}`}>
                <LineSpacingGlyph gap={gap} color={on ? sheet.fg : sheet.idle} />
              </Pressable>
            );
          })}
        </View>

        {/* Page turn */}
        <Text style={[styles.sectionLabel, { color: sheet.sub }]}>Page turn</Text>
        <View style={[styles.segmentTrack, { backgroundColor: sheet.track }]}>
          {MODES.map(({ key, label }) => (
            <Pressable
              key={key}
              style={[styles.segmentItem, segment(prefs.mode === key)]}
              onPress={() => setReaderPrefs({ mode: key })}>
              <Text style={[styles.modeLabel, segmentText(prefs.mode === key)]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

function LineSpacingGlyph({ gap, color }: { gap: number; color: string }) {
  const height = gap * 2 + 4;
  return (
    <Svg width={20} height={height} viewBox={`0 0 20 ${height}`} fill="none">
      <Path d={`M2 2h16M2 ${2 + gap}h16M2 ${2 + gap * 2}h16`} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: '#14120C',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -12 },
  },
  grabber: {
    width: 38,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 14,
  },
  sheetTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 19,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  swatchItem: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
  },
  swatch: {
    width: '100%',
    height: 46,
    borderRadius: 12,
  },
  swatchLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
  },
  segmentTrack: {
    flexDirection: 'row',
    borderRadius: 11,
    padding: 4,
    marginBottom: 18,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  fontLabel: {
    fontSize: 15,
  },
  modeLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
  },
  sizeTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 11,
    marginBottom: 18,
    overflow: 'hidden',
  },
  sizeButton: {
    width: 58,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeGlyphSmall: {
    fontFamily: Fonts.serifBold,
    fontSize: 16,
  },
  sizeGlyphLarge: {
    fontFamily: Fonts.serifBold,
    fontSize: 24,
  },
  dotsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
