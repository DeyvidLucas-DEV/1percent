import { Ionicons } from '@expo/vector-icons';

export type TabIconName = 'ring' | 'grid' | 'chart' | 'gear';

const MAP: Record<TabIconName, keyof typeof Ionicons.glyphMap> = {
  ring: 'radio-button-on-outline',
  grid: 'grid-outline',
  chart: 'analytics-outline',
  gear: 'settings-outline',
};

type Props = { name: TabIconName; color: string; size?: number };

export function TabIcon({ name, color, size = 24 }: Props) {
  return <Ionicons name={MAP[name]} size={size} color={color} />;
}
