import { useFonts } from 'expo-font';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_400Regular_Italic,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';

/**
 * Loads the app's typefaces:
 *  - Flecha (display serif) + Flecha Text (body serif), bundled from assets/fonts.
 *  - IBM Plex Sans (UI), via @expo-google-fonts.
 *
 * The registered family names here must match the `Fonts` keys in constants/theme.ts.
 * Returns [loaded, error] from expo-font.
 */
export function useAppFonts() {
  return useFonts({
    'Flecha-Regular': require('@/assets/fonts/FlechaM-Regular.otf'),
    'Flecha-Bold': require('@/assets/fonts/FlechaM-Bold.otf'),
    'FlechaText-Regular': require('@/assets/fonts/FlechaS-Regular.otf'),
    IBMPlexSans_400Regular,
    IBMPlexSans_400Regular_Italic,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
  });
}
