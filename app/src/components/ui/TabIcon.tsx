import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type TabIconName = 'ring' | 'grid' | 'chart' | 'gear';

type Props = { name: TabIconName; color: string; size?: number };

export function TabIcon({ name, color, size = 22 }: Props) {
  if (name === 'ring') {
    return (
      <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
        <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={1.8} />
        <Circle cx="11" cy="11" r="3" stroke={color} strokeWidth={1.8} />
      </Svg>
    );
  }
  if (name === 'grid') {
    return (
      <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
        <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.8} />
        <Rect x="12" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.8} />
        <Rect x="3" y="12" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.8} />
        <Rect x="12" y="12" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.8} />
      </Svg>
    );
  }
  if (name === 'chart') {
    return (
      <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
        <Path
          d="M3 17 L8 11 L12 14 L19 5"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M14 5 H19 V10"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Circle cx="11" cy="11" r="3" stroke={color} strokeWidth={1.8} />
      <Path
        d="M11 2 V4 M11 18 V20 M2 11 H4 M18 11 H20 M4.6 4.6 L6 6 M16 16 L17.4 17.4 M4.6 17.4 L6 16 M16 6 L17.4 4.6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
