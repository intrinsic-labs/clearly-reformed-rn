import type { ReaderTheme } from '@/presentation/reader/prefs';

/**
 * Reading-surface palettes from the Reader mockup — the reading view runs its own
 * four themes independent of the app chrome (which stays light).
 */
export interface ReaderPalette {
  /** Page background. */
  readonly bg: string;
  /** Body ink. */
  readonly fg: string;
  /** Bylines / secondary. */
  readonly sub: string;
  /** Hairlines. */
  readonly hair: string;
  /** Translucent chrome bar background. */
  readonly barBg: string;
  /** Progress track. */
  readonly track: string;
  /** Settings sheet surface colors. */
  readonly sheet: {
    readonly bg: string;
    readonly track: string;
    readonly active: string;
    readonly fg: string;
    readonly sub: string;
    readonly idle: string;
    readonly activeShadow: boolean;
  };
}

export const READER_PALETTES: Record<ReaderTheme, ReaderPalette> = {
  paper: {
    bg: '#F4EFE3',
    fg: '#2A2419',
    sub: '#857A67',
    hair: '#E1D8C5',
    barBg: 'rgba(244,239,227,0.92)',
    track: '#E1D8C5',
    sheet: lightSheet(),
  },
  white: {
    bg: '#FFFFFF',
    fg: '#1C1A17',
    sub: '#8A8275',
    hair: '#ECE7DC',
    barBg: 'rgba(255,255,255,0.92)',
    track: '#ECE7DC',
    sheet: lightSheet(),
  },
  sepia: {
    bg: '#EBE0CB',
    fg: '#473B22',
    sub: '#8E7C53',
    hair: '#D8C9A8',
    barBg: 'rgba(235,224,203,0.92)',
    track: '#D8C9A8',
    sheet: lightSheet(),
  },
  night: {
    bg: '#191D1A',
    fg: '#C8C6BC',
    sub: '#828A80',
    hair: '#2C322D',
    barBg: 'rgba(25,29,26,0.92)',
    track: '#2C322D',
    sheet: {
      bg: '#232824',
      track: '#2B312B',
      active: '#3C443C',
      fg: '#DAD8CE',
      sub: '#8E968C',
      idle: '#9AA197',
      activeShadow: false,
    },
  },
};

function lightSheet(): ReaderPalette['sheet'] {
  return {
    bg: '#FBF7EC',
    track: '#EFE9DA',
    active: '#FFFFFF',
    fg: '#2A2419',
    sub: '#8E836F',
    idle: '#857A67',
    activeShadow: true,
  };
}

/** Swatch ring/label accents from the mockup. */
export const THEME_ACCENT_ACTIVE = '#C8941F';
export const THEME_LABEL_ACTIVE_LIGHT = '#A8761A';
export const THEME_LABEL_ACTIVE_NIGHT = '#E0A93A';
