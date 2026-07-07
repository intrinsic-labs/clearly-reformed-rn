/**
 * Custom entry point: react-native-track-player's playback service must be
 * registered before the app component, so this wraps the default expo-router entry.
 * `require` (not `import`) keeps the registration ahead of the router's side effects
 * (static imports would hoist above it).
 */
import TrackPlayer from '@javascriptcommon/react-native-track-player';

import { playbackService } from './src/data/playback/playback-service';

TrackPlayer.registerPlaybackService(() => playbackService);

require('expo-router/entry');
