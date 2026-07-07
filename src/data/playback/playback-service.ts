import TrackPlayer, { Event } from '@javascriptcommon/react-native-track-player';

/**
 * Headless playback service — handles remote-control events (lock screen, control
 * center, CarPlay/Android Auto, headphones) while the JS UI may not be mounted.
 * Registered from the app entry point before the root component.
 */
export async function playbackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => TrackPlayer.seekTo(position));
  TrackPlayer.addEventListener(Event.RemoteJumpForward, ({ interval }) => TrackPlayer.seekBy(interval ?? 30));
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, ({ interval }) => TrackPlayer.seekBy(-(interval ?? 15)));
  TrackPlayer.addEventListener(Event.RemoteDuck, ({ paused }) => {
    if (paused) TrackPlayer.pause();
  });
}
