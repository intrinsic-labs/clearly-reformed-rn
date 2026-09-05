/**
 * Clearly Reformed — design tokens.
 *
 * Revised 2026-09 from the Chris Sullivan Figma pass (see the "Mobile App UI Call"
 * notes in the vault): the app chrome runs on **white**, not cream — cream survives
 * only as a sparing section tint. Headlines are **Flecha Regular** at larger sizes
 * rather than Flecha Bold (bold's thick/thin contrast hurts legibility; size does
 * the work instead). **Gold means "tappable"** — it is reserved for actions like
 * "See all" and is no longer sprinkled on kickers, glyphs, or tab states.
 *
 * Styling approach (per SPEC §10): React Native StyleSheet + this typed theme.
 * No third-party styling engine. Light-first; the Reader carries its own night mode.
 */

import { Platform } from 'react-native';

export const Colors = {
  /** App background. */
  background: '#FFFFFF',
  /** Outer canvas / behind-sheet tone (modal scrims, edges). */
  canvas: '#F5F3EE',
  /** Raised neutral surface — menus, pills, icon buttons, search field. */
  surface: '#F3F1EC',
  /** Card background. */
  card: '#FFFFFF',
  /** The brand cream — used sparingly as a section tint, never as the page. */
  cream: '#F1EBDD',

  /** Primary ink. */
  ink: '#1C1A17',
  /** Softer ink for secondary headings / strong labels. */
  inkSoft: '#4E4840',
  /** Serif body copy. */
  bodyText: '#5C554B',
  /** Muted meta / captions / type labels. */
  textMuted: '#8A8378',

  /** Gold/ochre accent — actions only. */
  gold: '#BC871A',
  /** Deeper gold (pressed / on light surfaces). */
  goldDeep: '#A8761A',
  /** Brightest gold (player accents, progress). */
  goldBright: '#C8941F',

  /** Dark sage-green — mini-player, video/"Explainer" surfaces. */
  green: '#2E3A33',
  /** Darker green for the dark sections (Explainer Series band). */
  greenDeep: '#1F2A24',
  /** Text/label on green surfaces. */
  onGreen: '#F4EFE2',
  /** Muted text on green surfaces. */
  onGreenMuted: '#A9B3A6',

  /** Hairlines / dividers. */
  border: '#E8E5DF',
  /** Softer hairline (inside cards, progress tracks). */
  borderSoft: '#EFEDE8',
  /** Chrome border (bars, sheets). */
  borderChrome: '#E3E0D9',

  /** "Booklet" badge. */
  badgeBg: '#E4E7DD',
  badgeText: '#2E3A33',

  white: '#FFFFFF',
  black: '#1C1A17',
} as const;

export type ColorToken = keyof typeof Colors;

/**
 * Reader surface palette — the immersive reading view. The default is now the
 * "White" theme (see reader/prefs.ts); this token set backs the media detail screen
 * and any chrome that sits on the reading surface.
 */
export const Reader = {
  /** Reading background. */
  bg: '#FFFFFF',
  /** Body + heading ink. */
  fg: '#1C1A17',
  /** Byline / caption / secondary. */
  sub: '#8A8378',
  /** Hairline divider. */
  hair: '#ECE9E2',
  /** Gold accent (drop cap, rules, quote bar). */
  accent: Colors.gold,
} as const;

/**
 * Font family keys — must match the names registered in use-app-fonts.ts.
 * Flecha = editorial display serif; FlechaText = its text-optimized cut (body serif);
 * IBM Plex Sans = UI / labels / meta.
 */
export const Fonts = {
  /** Flecha, headings and display. */
  serif: 'Flecha-Regular',
  /**
   * Flecha Bold — kept registered for the note editor's bold runs, but no longer
   * used for headings (see the file header).
   */
  serifBold: 'Flecha-Bold',
  /** Flecha Text — long-form serif body (Reader, blurbs). */
  serifText: 'FlechaText-Regular',
  /**
   * Serif italic. We only license three Flecha cuts (Regular, Bold, Text Regular)
   * and neither iOS nor Android synthesises an oblique for a custom family — a
   * `fontStyle: 'italic'` on Flecha silently renders upright. Until a `FlechaS-Italic`
   * is licensed and bundled, italic runs borrow the platform's old-style serif,
   * which sits close enough to Flecha in colour to read as emphasis rather than a
   * bug. Swap this one token when the real cut arrives.
   */
  serifItalic: Platform.select({ ios: 'Georgia', default: 'serif' }) as string,
  /** IBM Plex Sans — UI. */
  sans: 'IBMPlexSans_400Regular',
  sansMedium: 'IBMPlexSans_500Medium',
  sansSemiBold: 'IBMPlexSans_600SemiBold',
  sansItalic: 'IBMPlexSans_400Regular_Italic',
} as const;

/**
 * Typographic scale. Each entry is a ready-to-spread TextStyle fragment
 * (fontFamily + size + line height + tracking). Color is applied at the call site.
 *
 * Headings are Flecha Regular throughout; legibility comes from size, not weight.
 */
export const Type = {
  /** Large screen / section titles — "Library", "Latest", "Explainer Series". */
  display: { fontFamily: Fonts.serif, fontSize: 30, lineHeight: 34, letterSpacing: 0 },
  /** Section hero — Home section titles ("Explainer Series"). */
  title1: { fontFamily: Fonts.serif, fontSize: 26, lineHeight: 30, letterSpacing: 0 },
  /** Feature card headline. */
  title2: { fontFamily: Fonts.serif, fontSize: 22, lineHeight: 26 },
  /** List / row item title. */
  title3: { fontFamily: Fonts.serif, fontSize: 18, lineHeight: 22 },
  /** Compact card title. */
  cardTitle: { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 21 },
  /** Serif body / blurbs. */
  body: { fontFamily: Fonts.serifText, fontSize: 15, lineHeight: 22.5 },
  /** Eyebrow — uppercase, tracked, ink ("FEATURED"). */
  eyebrow: { fontFamily: Fonts.sansSemiBold, fontSize: 11.5, lineHeight: 14, letterSpacing: 1.6, textTransform: 'uppercase' },
  /**
   * Content-type label — plain sentence case ("Podcast", "Lecture"). Replaces the
   * old uppercase-tracked kicker + brand glyph pairing, which read as clutter.
   */
  kicker: { fontFamily: Fonts.sans, fontSize: 12.5, lineHeight: 16, letterSpacing: 0 },
  /** Standard UI label. */
  label: { fontFamily: Fonts.sansMedium, fontSize: 12.5, lineHeight: 16 },
  /** Meta / caption. */
  meta: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 16 },
  /** Tab bar label. */
  tab: { fontFamily: Fonts.sansMedium, fontSize: 10, lineHeight: 12 },
} as const;

/** Spacing scale (px). */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
} as const;

/** Corner radii (px). */
export const Radius = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 16,
  xxl: 20,
  pill: 999,
} as const;
