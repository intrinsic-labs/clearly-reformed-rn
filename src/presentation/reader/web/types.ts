/** Inputs to the Reader WebView document builder. */

export interface ReaderHeaderInfo {
  readonly eyebrow: string;
  readonly title: string;
  readonly byline: string;
  readonly scripture: string | null;
}

export interface ReaderVideoInfo {
  readonly youtubeId: string;
}

export interface ReaderInsets {
  readonly top: number;
  readonly bottom: number;
}

/** Everything applyPrefs pushes into the page. Mirrors the RN-side prefs + palette. */
export interface ReaderWebPrefs {
  readonly bg: string;
  readonly fg: string;
  readonly sub: string;
  readonly hair: string;
  readonly bodyFont: 'FlechaText' | 'PlexSans';
  readonly fontSizePx: number;
  readonly lineHeight: number;
  readonly paged: boolean;
  readonly curlShade: boolean;
}
