import { Feather, Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors, Fonts } from '@/presentation/theme';

/**
 * UI icons. Professionally-drawn sets via @expo/vector-icons (Feather for line
 * icons, Ionicons for filled states, MaterialCommunityIcons for the numbered
 * skip glyphs). Two exceptions stay as bundled SVG paths: the brand LogoMark and
 * the Notebook glyph (traced from the design's own icon assets — see
 * content-icons.tsx for the other brand content glyphs).
 *
 * `weight` is accepted for backwards compatibility but ignored by font icons.
 */

export type IconProps = {
  size?: number;
  color?: string;
  /** Stroke width — only honored by the custom SVG icons. */
  weight?: number;
};

const DEFAULT_SIZE = 23;

/** Home — house outline. */
export function HomeIcon({ size = DEFAULT_SIZE, color = Colors.ink }: IconProps) {
  return <Feather name="home" size={size} color={color} />;
}

/** Library — 2×2 grid. */
export function LibraryIcon({ size = DEFAULT_SIZE, color = Colors.ink }: IconProps) {
  return <Feather name="grid" size={size} color={color} />;
}

/** Search — magnifier. */
export function SearchIcon({ size = DEFAULT_SIZE, color = Colors.ink }: IconProps) {
  return <Feather name="search" size={size} color={color} />;
}

/** Notebook — closed book with spine. */
export function NotebookIcon({ size = DEFAULT_SIZE, color = Colors.ink }: IconProps) {
  return <Feather name="book" size={size} color={color} />;
}

/** Clearly Reformed brand mark (gold). 32×32 source artwork. */
export function LogoMark({ size = 30, color = '#CD8A11' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="M17.0452 0.0334977C7.40148 -0.583289 -0.583287 7.40152 0.0334975 17.0453C0.543939 25.0179 6.98219 31.4562 14.9548 31.9667C24.5985 32.5834 32.5833 24.5986 31.9665 14.9549C31.4561 6.98223 25.0178 0.543942 17.0452 0.0334977ZM20.5575 9.34911C21.8579 8.96628 23.1158 8.41633 24.3038 7.69624C23.4014 9.182 22.7634 10.7832 22.3896 12.433C18.9047 9.76232 16.6137 5.61193 16.4679 0.923737C20.2719 1.04223 23.7265 2.57053 26.3213 5.01033C24.4679 6.75131 22.2863 7.93627 19.9772 8.56521C20.1625 8.83259 20.354 9.09389 20.5575 9.34911ZM16.4527 22.0008V16.4558H21.9977C22.019 17.1638 22.0858 17.8687 22.1982 18.5675C20.8006 19.5762 19.5761 20.8037 18.5674 22.2014C17.8686 22.089 17.1606 22.0221 16.4527 22.0008ZM9.7957 18.5675C9.90812 17.8687 9.97496 17.1607 9.99623 16.4528H15.5412V21.9978C14.8333 22.0191 14.1284 22.0829 13.4296 22.1983C12.4208 20.8007 11.1933 19.5732 9.7957 18.5645V18.5675ZM15.5412 9.99628V15.5413H9.99623C9.97496 14.8333 9.90812 14.1284 9.7957 13.4296C11.1933 12.4209 12.4178 11.1934 13.4265 9.79575C14.1284 9.90817 14.8333 9.97501 15.5412 9.99628ZM22.1982 13.4266C22.0858 14.1254 22.019 14.8333 21.9977 15.5413H16.4527V9.99324C17.1606 9.97197 17.8655 9.90817 18.5644 9.79271C19.5731 11.1904 20.8006 12.4179 22.1982 13.4266ZM14.5173 8.06996C15.1645 6.87892 15.6658 5.59977 15.997 4.25378C16.4102 5.94007 17.0908 7.52305 17.9932 8.95412C13.6422 9.53141 9.0908 8.21884 5.6757 5.01033C8.27045 2.57357 11.722 1.04223 15.5291 0.923737C15.4501 3.46684 14.7452 5.85196 13.5541 7.93019C13.8732 7.98792 14.1952 8.03654 14.5203 8.073L14.5173 8.06996ZM8.60771 12.19C8.87812 12.0077 9.13942 11.8132 9.39768 11.6096C9.01181 10.2515 8.44364 8.93285 7.69317 7.6932C9.17892 8.5956 10.7801 9.23061 12.4299 9.60737C9.75924 13.0954 5.60886 15.3863 0.923733 15.5291C1.04223 11.7251 2.57052 8.27049 5.01031 5.67573C6.79382 7.57167 7.997 9.82005 8.61075 12.19H8.60771ZM4.25376 15.997C5.94308 15.5838 7.52606 14.9032 8.95712 14.0008C9.5344 18.3518 8.2188 22.9063 5.01031 26.3214C2.57052 23.7266 1.03919 20.269 0.923733 16.4619C3.52759 16.5409 5.96739 17.2883 8.08207 18.531C8.14284 18.212 8.19145 17.8869 8.23095 17.5618C6.99738 16.8721 5.66355 16.3404 4.2568 15.997H4.25376ZM11.4577 22.6419C10.1512 23.0248 8.8842 23.5777 7.69317 24.3009C8.59555 22.8151 9.23361 21.2139 9.60732 19.5641C13.0953 22.2348 15.3832 26.3852 15.5291 31.0734C11.725 30.9549 8.27045 29.4236 5.6757 26.9868C7.53517 25.2397 9.72886 24.0517 12.0502 23.4258C11.8618 23.1585 11.6673 22.8972 11.4607 22.6419H11.4577ZM17.4858 23.9059C16.8325 25.1 16.3281 26.3882 15.997 27.7433C15.5837 26.057 14.9032 24.4741 14.0008 23.043C18.3517 22.4657 22.9031 23.7783 26.3182 26.9898C23.7235 29.4296 20.2719 30.961 16.4649 31.0764C16.5439 28.5242 17.2548 26.13 18.4519 24.0457C18.1299 23.991 17.8078 23.9424 17.4827 23.9089L17.4858 23.9059ZM23.3893 19.8163C23.1188 19.9925 22.8515 20.1778 22.5932 20.3723C22.9791 21.7365 23.5473 23.0612 24.3008 24.3039C22.815 23.4015 21.2138 22.7665 19.564 22.3897C22.2347 18.9048 26.3851 16.6138 31.0702 16.468C30.9517 20.272 29.4234 23.7266 26.9836 26.3214C25.2031 24.4254 24.003 22.1831 23.3862 19.8163H23.3893ZM27.7402 15.997C26.0508 16.4103 24.4679 17.0908 23.0368 17.9932C22.4595 13.6423 23.7751 9.08781 26.9836 5.67269C29.4234 8.26745 30.9547 11.7251 31.0702 15.5322C28.4694 15.4532 26.0326 14.7088 23.921 13.4691C23.8541 13.7851 23.7964 14.1041 23.7508 14.4262C24.9874 15.119 26.3273 15.6537 27.7402 15.997Z"
        fill={color}
      />
    </Svg>
  );
}

/** Back chevron (reader top bar). */
export function ChevronLeftIcon({ size = 22, color = Colors.ink }: IconProps) {
  return <Feather name="chevron-left" size={size} color={color} />;
}

/** Down chevron (dismiss the Now Playing sheet). */
export function ChevronDownIcon({ size = 20, color = Colors.ink }: IconProps) {
  return <Feather name="chevron-down" size={size} color={color} />;
}

/** Right chevron (row affordance). */
export function ChevronRightIcon({ size = 17, color = Colors.ink }: IconProps) {
  return <Feather name="chevron-right" size={size} color={color} />;
}

/**
 * Numbered skip icons: a Feather rotate arrow with the seconds set in the app's
 * own sans — lighter than the stock chunky-numeral glyphs.
 */
function SkipIcon({ size = 20, color = Colors.ink, seconds, back }: IconProps & { seconds: number; back: boolean }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name={back ? 'rotate-ccw' : 'rotate-cw'} size={size} color={color} style={{ position: 'absolute' }} />
      <Text
        allowFontScaling={false}
        style={{ fontFamily: Fonts.sansSemiBold, fontSize: size * 0.34, color, marginTop: size * 0.12 }}>
        {seconds}
      </Text>
    </View>
  );
}

/** Skip forward 30s. */
export function SkipForwardIcon({ size = 20, color = Colors.ink }: IconProps) {
  return <SkipIcon size={size} color={color} seconds={30} back={false} />;
}

/** Skip back 15s. */
export function SkipBackIcon({ size = 20, color = Colors.ink }: IconProps) {
  return <SkipIcon size={size} color={color} seconds={15} back />;
}

/** Heart — outline or filled (save/like). */
export function HeartIcon({ size = 20, color = Colors.ink, filled = false }: IconProps & { filled?: boolean }) {
  return <Ionicons name={filled ? 'heart' : 'heart-outline'} size={size} color={color} />;
}

/** Crescent moon (sleep timer). */
export function MoonIcon({ size = 22, color = Colors.ink }: IconProps) {
  return <Feather name="moon" size={size} color={color} />;
}

/** Share nodes. */
export function ShareIcon({ size = 21, color = Colors.ink }: IconProps) {
  return <Feather name="share-2" size={size} color={color} />;
}

/** Download arrow into tray. */
export function DownloadIcon({ size = 21, color = Colors.ink }: IconProps) {
  return <Feather name="download" size={size} color={color} />;
}

/** Transcript lines. */
export function TranscriptIcon({ size = 21, color = Colors.ink }: IconProps) {
  return <Feather name="align-left" size={size} color={color} />;
}

/** Overflow dots. */
export function DotsIcon({ size = 19, color = Colors.ink }: IconProps) {
  return <Feather name="more-horizontal" size={size} color={color} />;
}

/** Bookmark flag (reader top bar save). */
export function BookmarkIcon({ size = 19, color = Colors.ink, filled = false }: IconProps & { filled?: boolean }) {
  return <Ionicons name={filled ? 'bookmark' : 'bookmark-outline'} size={size} color={color} />;
}

/** X close. */
export function CloseIcon({ size = 14, color = Colors.ink }: IconProps) {
  return <Feather name="x" size={size} color={color} />;
}

/** Pencil (new note). */
export function PencilIcon({ size = 20, color = Colors.ink }: IconProps) {
  return <Feather name="edit-3" size={size} color={color} />;
}

/** Plus (FAB). */
export function PlusIcon({ size = 24, color = Colors.ink }: IconProps) {
  return <Feather name="plus" size={size} color={color} />;
}

/** Tag (note editor). */
export function TagIcon({ size = 19, color = Colors.ink }: IconProps) {
  return <Feather name="tag" size={size} color={color} />;
}

/** Settings gear. */
export function GearIcon({ size = 19, color = Colors.ink }: IconProps) {
  return <Ionicons name="settings-outline" size={size} color={color} />;
}

/** Filled play triangle (mini-player / hero). */
export function PlayIcon({ size = 16, color = Colors.ink }: IconProps) {
  return <Ionicons name="play" size={size} color={color} />;
}

/** Filled pause bars. */
export function PauseIcon({ size = 14, color = Colors.ink }: IconProps) {
  return <Ionicons name="pause" size={size} color={color} />;
}
