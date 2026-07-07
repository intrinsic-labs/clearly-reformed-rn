#!/usr/bin/env node
/**
 * Regenerates src/presentation/reader/fonts-base64.ts — the reading typefaces
 * embedded into the Reader WebView as base64 @font-face payloads (a WebView can't
 * reach expo-font's registered families, and file:// subresources are unreliable
 * across platforms).
 *
 * Run after changing any reader font:  node scripts/generate-reader-fonts.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const fonts = [
  { name: 'FLECHA_BOLD_OTF', file: 'assets/fonts/FlechaM-Bold.otf' },
  { name: 'FLECHA_TEXT_OTF', file: 'assets/fonts/FlechaS-Regular.otf' },
  {
    name: 'PLEX_SANS_TTF',
    file: 'node_modules/@expo-google-fonts/ibm-plex-sans/400Regular/IBMPlexSans_400Regular.ttf',
  },
];

const parts = [
  '/**',
  ' * GENERATED FILE — do not edit by hand.',
  ' * Base64 reading typefaces for the Reader WebView.',
  ' * Regenerate with: node scripts/generate-reader-fonts.js',
  ' */',
  '',
];

for (const font of fonts) {
  const data = fs.readFileSync(path.join(root, font.file)).toString('base64');
  parts.push(`export const ${font.name} =`);
  parts.push(`  '${data}';`);
  parts.push('');
}

const out = path.join(root, 'src/presentation/reader/fonts-base64.ts');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, parts.join('\n'));
console.log(`Wrote ${out}`);
