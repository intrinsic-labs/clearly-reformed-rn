import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { Colors } from '@/presentation/theme';

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
export function ChevronLeftIcon({ size = 22, color = Colors.ink, weight = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 5l-7 7 7 7" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Down chevron (dismiss the Now Playing sheet). */
export function ChevronDownIcon({ size = 20, color = Colors.ink, weight = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Skip-forward (30s) curved arrow. */
export function SkipForwardIcon({ size = 20, color = Colors.ink, weight = 1.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M13 5l5 4-5 4" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 9h-8a5 5 0 0 0 0 10h5" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Heart — outline or filled (save/like). */
export function HeartIcon({ size = 20, color = Colors.ink, weight = 1.7, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <Path
        d="M12 21s-7.5-4.6-10-9.3C.4 8.4 1.7 4.5 5.3 4.5c2.1 0 3.4 1.3 4.7 3 1.3-1.7 2.6-3 4.7-3 3.6 0 4.9 3.9 3.3 7.2C19.5 16.4 12 21 12 21z"
        stroke={filled ? undefined : color}
        strokeWidth={filled ? undefined : weight}
      />
    </Svg>
  );
}

/** Crescent moon (sleep timer). */
export function MoonIcon({ size = 22, color = Colors.ink, weight = 1.6 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5z"
        stroke={color}
        strokeWidth={weight}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Share nodes. */
export function ShareIcon({ size = 21, color = Colors.ink, weight = 1.6 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={18} cy={5} r={2.6} stroke={color} strokeWidth={weight} />
      <Circle cx={6} cy={12} r={2.6} stroke={color} strokeWidth={weight} />
      <Circle cx={18} cy={19} r={2.6} stroke={color} strokeWidth={weight} />
      <Path d="M8.3 10.7l7.4-4.3M8.3 13.3l7.4 4.3" stroke={color} strokeWidth={weight} strokeLinecap="round" />
    </Svg>
  );
}

/** Download arrow into tray. */
export function DownloadIcon({ size = 21, color = Colors.ink, weight = 1.6 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v12" stroke={color} strokeWidth={weight} strokeLinecap="round" />
      <Path d="M8 11l4 4 4-4" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 18.5h14" stroke={color} strokeWidth={weight} strokeLinecap="round" />
    </Svg>
  );
}

/** Transcript lines. */
export function TranscriptIcon({ size = 21, color = Colors.ink, weight = 1.6 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 5h16M4 10h16M4 15h10M4 20h7" stroke={color} strokeWidth={weight} strokeLinecap="round" />
    </Svg>
  );
}

/** Overflow dots. */
export function DotsIcon({ size = 19, color = Colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx={5} cy={12} r={1.7} />
      <Circle cx={12} cy={12} r={1.7} />
      <Circle cx={19} cy={12} r={1.7} />
    </Svg>
  );
}

/** Bookmark flag (reader top bar save). */
export function BookmarkIcon({ size = 19, color = Colors.ink, weight = 1.7, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <Path
        d="M6 4h12v17l-6-4-6 4z"
        stroke={filled ? undefined : color}
        strokeWidth={filled ? undefined : weight}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** X close. */
export function CloseIcon({ size = 14, color = Colors.ink, weight = 2.2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={weight} strokeLinecap="round" />
    </Svg>
  );
}

/** Pencil (new note). */
export function PencilIcon({ size = 20, color = Colors.ink, weight = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20h9" stroke={color} strokeWidth={weight} strokeLinecap="round" />
      <Path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"
        stroke={color}
        strokeWidth={weight}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Plus (FAB). */
export function PlusIcon({ size = 24, color = Colors.ink, weight = 2.2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1={12} y1={5} x2={12} y2={19} stroke={color} strokeWidth={weight} strokeLinecap="round" />
      <Line x1={5} y1={12} x2={19} y2={12} stroke={color} strokeWidth={weight} strokeLinecap="round" />
    </Svg>
  );
}

/** Right chevron (row affordance). */
export function ChevronRightIcon({ size = 17, color = Colors.ink, weight = 1.9 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />
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
