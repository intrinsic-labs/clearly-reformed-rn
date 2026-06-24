/**
 * Clearly Reformed — design tokens.
 *
 * Extracted from the Claude Design mockups (design/clearly-reformed-app-mockup-2026).
 * The brand is a literary theological journal: cream paper, dark sage-green and
 * gold/ochre accents, an old-style serif (Flecha) paired with IBM Plex Sans for UI.
 *
 * Styling approach (per SPEC §10): React Native StyleSheet + this typed theme.
 * No third-party styling engine. Light-first; the Reader carries its own night mode.
 */

export const Colors = {
  /** App "paper" background. */
  background: '#F1EBDD',
  /** Outer canvas / behind-paper tone (e.g. modal scrims, edges). */
  canvas: '#E6E1D4',
  /** Raised neutral surface — search field, tab bar, icon buttons. */
  surface: '#FBF7EC',
  /** Card background. */
  card: '#FFFFFF',

  /** Primary ink. */
  ink: '#221C13',
  /** Softer ink for secondary headings / strong labels. */
  inkSoft: '#5C5343',
  /** Serif body copy. */
  bodyText: '#6E6453',
  /** Muted meta / captions / eyebrows. */
  textMuted: '#9A8F7C',

  /** Gold/ochre accent. */
  gold: '#BC871A',
  /** Deeper gold (eyebrows, active marks). */
  goldDeep: '#A8761A',
  /** Brightest gold (player accents, progress). */
  goldBright: '#C8941F',

  /** Dark sage-green — bottom chrome, mini-player, dark surfaces. */
  green: '#2E3A33',
  /** Text/label on green surfaces. */
  onGreen: '#F4EFE2',
  /** Muted text on green surfaces. */
  onGreenMuted: '#A9B3A6',

  /** Hairlines / dividers. */
  border: '#E7DFCC',
  /** Softer hairline (inside cards, progress tracks). */
  borderSoft: '#ECE4D2',
  /** Tab bar / chrome top border. */
  borderChrome: '#E4DCC9',

  /** "Booklet" badge. */
  badgeBg: '#E4E7DD',
  badgeText: '#2E3A33',

  white: '#FFFFFF',
  black: '#221C13',
} as const;

export type ColorToken = keyof typeof Colors;

/**
 * Font family keys — must match the names registered in use-app-fonts.ts.
 * Flecha = editorial display serif; FlechaText = its text-optimized cut (body serif);
 * IBM Plex Sans = UI / labels / meta.
 */
export const Fonts = {
  /** Flecha, headings and display. */
  serif: 'Flecha-Regular',
  serifBold: 'Flecha-Bold',
  /** Flecha Text — long-form serif body (Reader, blurbs). */
  serifText: 'FlechaText-Regular',
  /** IBM Plex Sans — UI. */
  sans: 'IBMPlexSans_400Regular',
  sansMedium: 'IBMPlexSans_500Medium',
  sansSemiBold: 'IBMPlexSans_600SemiBold',
  sansItalic: 'IBMPlexSans_400Regular_Italic',
} as const;

/**
 * Typographic scale. Each entry is a ready-to-spread TextStyle fragment
 * (fontFamily + size + line height + tracking). Color is applied at the call site.
 */
export const Type = {
  /** Large screen titles — "Notebook", "Library". */
  display: { fontFamily: Fonts.serifBold, fontSize: 28, lineHeight: 32, letterSpacing: 0.1 },
  /** Section hero — "For your week ahead". */
  title1: { fontFamily: Fonts.serifBold, fontSize: 25, lineHeight: 28, letterSpacing: 0.1 },
  /** Feature card headline. */
  title2: { fontFamily: Fonts.serifBold, fontSize: 21, lineHeight: 24 },
  /** List / row item title. */
  title3: { fontFamily: Fonts.serifBold, fontSize: 16.5, lineHeight: 19.5 },
  /** Compact card title. */
  cardTitle: { fontFamily: Fonts.serifBold, fontSize: 15.5, lineHeight: 18.5 },
  /** Serif body / blurbs. */
  body: { fontFamily: Fonts.serifText, fontSize: 14.5, lineHeight: 21.75 },
  /** Eyebrow — uppercase, tracked (dates, "Featured"). */
  eyebrow: { fontFamily: Fonts.sansSemiBold, fontSize: 11, lineHeight: 14, letterSpacing: 1.76, textTransform: 'uppercase' },
  /** Type badge / kicker — uppercase, tracked, smaller. */
  kicker: { fontFamily: Fonts.sansSemiBold, fontSize: 10, lineHeight: 12, letterSpacing: 1.3, textTransform: 'uppercase' },
  /** Standard UI label. */
  label: { fontFamily: Fonts.sansMedium, fontSize: 12, lineHeight: 16 },
  /** Meta / caption. */
  meta: { fontFamily: Fonts.sans, fontSize: 11.5, lineHeight: 15 },
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
