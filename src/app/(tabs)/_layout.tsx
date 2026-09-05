import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { StyleSheet, View } from 'react-native';

import { AccessoryMiniPlayer, FloatingMiniPlayer } from '@/presentation/components/chrome/bottom-chrome';
import { supportsTabBarAccessory } from '@/presentation/lib/platform';
import { useNowPlaying } from '@/presentation/playback/use-now-playing';
import { Colors, Fonts } from '@/presentation/theme';

const { Trigger } = NativeTabs;
const { Icon, Label } = Trigger;

/**
 * The tab bar is native on each platform — Liquid Glass on iOS 26 (with Search as
 * the system's separated search tab) and Material on Android — so the app feels
 * like it belongs wherever it is installed. Selection is filled-vs-outline, in ink:
 * gold is reserved for actions. The mini-player rides in the tab-bar accessory on
 * iOS 26 and floats above the bar elsewhere.
 *
 * The accessory is only mounted while something is playing: iOS draws its glass
 * capsule for any mounted accessory, even one whose content renders nothing.
 */
export default function TabsLayout() {
  const { playable } = useNowPlaying();
  return (
    <View style={styles.root}>
      <NativeTabs
        tintColor={Colors.ink}
        iconColor={{ default: Colors.inkSoft, selected: Colors.ink }}
        labelStyle={{ fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.ink }}
        backgroundColor={Colors.background}
        indicatorColor={Colors.surface}
        rippleColor={Colors.surface}
        minimizeBehavior="onScrollDown">
        {playable && supportsTabBarAccessory() ? (
          <NativeTabs.BottomAccessory>
            <AccessoryMiniPlayer />
          </NativeTabs.BottomAccessory>
        ) : null}

        <Trigger name="index">
          <Icon sf={{ default: 'house', selected: 'house.fill' }} md={{ default: 'home', selected: 'home' }} />
          <Label>Home</Label>
        </Trigger>
        <Trigger name="library">
          <Icon
            sf={{ default: 'books.vertical', selected: 'books.vertical.fill' }}
            md={{ default: 'library_books', selected: 'library_books' }}
          />
          <Label>Library</Label>
        </Trigger>
        <Trigger name="notebook">
          <Icon sf={{ default: 'book.closed', selected: 'book.closed.fill' }} md={{ default: 'book', selected: 'book' }} />
          <Label>Notebook</Label>
        </Trigger>
        <Trigger name="search" role="search">
          <Icon sf="magnifyingglass" md="search" />
          <Label>Search</Label>
        </Trigger>
      </NativeTabs>

      <FloatingMiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
