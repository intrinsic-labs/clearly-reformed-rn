import { FLECHA_DISPLAY_OTF, FLECHA_TEXT_OTF, PLEX_SANS_TTF } from '@/presentation/reader/fonts-base64';

/**
 * The reading typefaces embedded as data: URLs so the document is self-contained
 * (no file:// asset plumbing across platforms). 'Flecha' is the display cut for
 * titles/heads; 'FlechaText' and 'PlexSans' are the two body options.
 */
export const FONT_FACES = `@font-face { font-family:'Flecha'; font-weight:400; src:url(data:font/otf;base64,${FLECHA_DISPLAY_OTF}) format('opentype'); }
@font-face { font-family:'FlechaText'; font-weight:400; src:url(data:font/otf;base64,${FLECHA_TEXT_OTF}) format('opentype'); }
@font-face { font-family:'PlexSans'; font-weight:400; src:url(data:font/ttf;base64,${PLEX_SANS_TTF}) format('truetype'); }`;
