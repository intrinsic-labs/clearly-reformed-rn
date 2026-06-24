import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';

export type IconProps = {
  size?: number;
  color?: string;
  /** Stroke width for outline icons. */
  weight?: number;
};

const DEFAULT_SIZE = 23;

/** Home — house outline. */
export function HomeIcon({ size = DEFAULT_SIZE, color = Colors.ink, weight = 1.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 11l9-7 9 7" stroke={color} strokeWidth={weight} strokeLinejoin="round" strokeLinecap="round" />
      <Path d="M5.5 9.5V20h13V9.5" stroke={color} strokeWidth={weight} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

/** Library — 2×2 grid. */
export function LibraryIcon({ size = DEFAULT_SIZE, color = Colors.ink, weight = 1.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3.5} y={3.5} width={7} height={7} rx={1.4} stroke={color} strokeWidth={weight} />
      <Rect x={13.5} y={3.5} width={7} height={7} rx={1.4} stroke={color} strokeWidth={weight} />
      <Rect x={3.5} y={13.5} width={7} height={7} rx={1.4} stroke={color} strokeWidth={weight} />
      <Rect x={13.5} y={13.5} width={7} height={7} rx={1.4} stroke={color} strokeWidth={weight} />
    </Svg>
  );
}

/** Search — magnifier. */
export function SearchIcon({ size = DEFAULT_SIZE, color = Colors.ink, weight = 1.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={weight} />
      <Line x1={21} y1={21} x2={16.5} y2={16.5} stroke={color} strokeWidth={weight} strokeLinecap="round" />
    </Svg>
  );
}

/** Notebook — journal with bookmark and ruled lines. */
export function NotebookIcon({ size = DEFAULT_SIZE, color = Colors.ink, weight = 1.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3.5h11.5a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6"
        stroke={color}
        strokeWidth={weight}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Path d="M6 3.5A2.5 2.5 0 0 0 6 20.5" stroke={color} strokeWidth={weight} strokeLinecap="round" />
      <Path d="M14 3.5v6l-2-1.6-2 1.6v-6" stroke={color} strokeWidth={weight} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

/** Filled play triangle (mini-player / hero). */
export function PlayIcon({ size = 16, color = Colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 18">
      <Path d="M2 1l12.5 8L2 17z" fill={color} />
    </Svg>
  );
}

/** Filled pause bars. */
export function PauseIcon({ size = 14, color = Colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 15">
      <Rect x={1} y={0} width={4} height={15} rx={1} fill={color} />
      <Rect x={9} y={0} width={4} height={15} rx={1} fill={color} />
    </Svg>
  );
}

/** Skip-back (15s) curved arrow. */
export function SkipBackIcon({ size = 20, color = Colors.ink, weight = 1.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 5L6 9l5 4" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 9h8a5 5 0 0 1 0 10H9" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
