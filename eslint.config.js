// Flat ESLint config: Expo defaults + clean-architecture boundary enforcement.
// The `boundaries` rules encode the dependency rule — source dependencies point
// only inward: app → presentation → application → domain, with data implementing
// application ports. See each layer's README.
const expoConfig = require('eslint-config-expo/flat');
const boundaries = require('eslint-plugin-boundaries');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', 'ios/*', 'android/*', '.expo/*', 'node_modules/*', 'scripts/*', 'design/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
      'boundaries/include': ['src/**/*'],
      // Each file belongs to exactly one architectural layer. mode:'file' matches
      // the full file path against the pattern (the default 'folder' mode wouldn't
      // classify individual files here, leaving rules silently inert).
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**/*', mode: 'file' },
        { type: 'composition', pattern: 'src/composition/**/*', mode: 'file' },
        { type: 'presentation', pattern: 'src/presentation/**/*', mode: 'file' },
        { type: 'data', pattern: 'src/data/**/*', mode: 'file' },
        { type: 'application', pattern: 'src/application/**/*', mode: 'file' },
        { type: 'domain', pattern: 'src/domain/**/*', mode: 'file' },
      ],
    },
    rules: {
      // The dependency rule: who may import whom (inward only; self-imports allowed).
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'domain', allow: ['domain'] },
            { from: 'application', allow: ['domain', 'application'] },
            { from: 'data', allow: ['domain', 'application', 'data'] },
            { from: 'presentation', allow: ['domain', 'application', 'presentation'] },
            // The composition root wires concretes — it may see every layer.
            { from: 'composition', allow: ['domain', 'application', 'data', 'composition'] },
            { from: 'app', allow: ['domain', 'application', 'data', 'presentation', 'composition', 'app'] },
          ],
        },
      ],
      // Keep the inner layers framework-agnostic: no UI/platform/network deps.
      'boundaries/external': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: ['domain', 'application'],
              disallow: [
                'react',
                'react-*',
                'react-native',
                'react-native-*',
                'expo',
                'expo-*',
                '@expo/*',
                '@tanstack/*',
                '@react-navigation/*',
                '@gorhom/*',
              ],
              message: 'Domain/application must stay framework-agnostic (no UI, network, or platform deps).',
            },
          ],
        },
      ],
    },
  },
];
