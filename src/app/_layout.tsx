import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createContainer } from '@/composition/container';
import { AppProviders } from '@/presentation/providers/app-providers';
import { useAppFonts } from '@/presentation/hooks/use-app-fonts';
import { PlaybackBootstrap } from '@/presentation/playback/playback-bootstrap';
import { Colors, Fonts } from '@/presentation/theme';

SplashScreen.preventAutoHideAsync();

// Composition root: wire concrete implementations once at app startup.
const container = createContainer();

/** Light-first navigation theme keyed to the cream palette (no white flash on transitions). */
const AppTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.gold,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.ink,
    border: Colors.border,
    notification: Colors.gold,
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: { fontFamily: Fonts.sans, fontWeight: '400' as const },
    medium: { fontFamily: Fonts.sansMedium, fontWeight: '500' as const },
    bold: { fontFamily: Fonts.sansSemiBold, fontWeight: '600' as const },
    heavy: { fontFamily: Fonts.serifBold, fontWeight: '700' as const },
  },
};

export default function RootLayout() {
  const [loaded, error] = useAppFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProviders useCases={container.useCases}>
          <ThemeProvider value={AppTheme}>
            <StatusBar style="dark" />
            <PlaybackBootstrap />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="resource/[type]/[slug]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="player" options={{ presentation: 'modal', contentStyle: { backgroundColor: '#1E2620' } }} />
              <Stack.Screen name="note-editor" options={{ presentation: 'modal' }} />
              <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
            </Stack>
          </ThemeProvider>
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
