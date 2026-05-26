import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { tema } from '../../lib/tema';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  areas: 'grid-outline',
  insights: 'stats-chart-outline',
  config: 'person-outline',
};

const ORDEM = ['index', 'areas', 'insights', 'config'] as const;

export function TabBarPill({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();

  function navTab(name: string) {
    const idx = state.routes.findIndex(r => r.name === name);
    if (idx === -1) return;
    const route = state.routes[idx]!;
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) navigation.navigate(route.name as never);
  }

  function rotaAtiva(): string {
    return state.routes[state.index]?.name ?? 'index';
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        {ORDEM.slice(0, 2).map(nome => {
          const ativa = rotaAtiva() === nome;
          return (
            <Pressable
              key={nome}
              onPress={() => navTab(nome)}
              style={({ pressed }) => [styles.tab, pressed && { opacity: 0.6 }]}
            >
              <Ionicons
                name={TAB_ICONS[nome]!}
                size={22}
                color={ativa ? tema.bg : 'rgba(232,226,210,0.55)'}
              />
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => router.push('/reflexao')}
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="add" size={24} color={tema.ink} />
        </Pressable>
        {ORDEM.slice(2).map(nome => {
          const ativa = rotaAtiva() === nome;
          return (
            <Pressable
              key={nome}
              onPress={() => navTab(nome)}
              style={({ pressed }) => [styles.tab, pressed && { opacity: 0.6 }]}
            >
              <Ionicons
                name={TAB_ICONS[nome]!}
                size={22}
                color={ativa ? tema.bg : 'rgba(232,226,210,0.55)'}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 28,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tema.ink,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  tab: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: tema.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -22,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
