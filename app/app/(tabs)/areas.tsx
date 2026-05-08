import { useCallback, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { tema } from '../../src/lib/tema';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { AreaCard } from '../../src/components/ui/AreaCard';
import { useAppStore } from '../../src/store/appStore';
import { carregarDashboard, type DashboardData } from '../../src/domain/agregados';

export default function Areas() {
  const router = useRouter();
  const onboarded = useAppStore(s => s.onboarded);
  const [data, setData] = useState<DashboardData | null>(null);
  const [refresh, setRefresh] = useState(false);

  const carregar = useCallback(async () => {
    if (!onboarded) return;
    const d = await carregarDashboard();
    setData(d);
  }, [onboarded]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  if (!data) return <SafeAreaView style={styles.bg} edges={['top']} />;

  return (
    <SafeAreaView style={styles.bg} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refresh}
            onRefresh={async () => { setRefresh(true); await carregar(); setRefresh(false); }}
            tintColor={tema.texto}
          />
        }
      >
        <PageHeader kicker="suas dimensões" title="Áreas" />

        <Pressable style={({ pressed }) => [styles.alvoCard, pressed && { opacity: 0.7 }]} onPress={() => router.push('/alvo')}>
          <Svg width={36} height={36} viewBox="0 0 36 36">
            <Circle cx={18} cy={18} r={16} fill="none" stroke={tema.borda} strokeWidth={1} />
            {Array.from({ length: 10 }).map((_, i) => {
              const a = ((i * 36 - 90) * Math.PI) / 180;
              return (
                <Line
                  key={i}
                  x1={18}
                  y1={18}
                  x2={18 + Math.cos(a) * 16}
                  y2={18 + Math.sin(a) * 16}
                  stroke={tema.borda}
                  strokeWidth={0.5}
                />
              );
            })}
            <Circle cx={18} cy={18} r={2} fill={tema.acento} />
          </Svg>
          <View style={{ flex: 1 }}>
            <Text style={styles.alvoTitulo}>Alvo de Vida</Text>
            <Text style={styles.alvoSub}>Visão geral em 10 fatias</Text>
          </View>
          <Svg width={8} height={14} viewBox="0 0 8 14">
            <Path
              d="M1 1 L7 7 L1 13"
              fill="none"
              stroke={tema.textoFraco}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>

        <View style={styles.lista}>
          {data.porArea.map(p => (
            <AreaCard
              key={p.area.id}
              nome={p.area.nome}
              corBase={p.area.cor_base}
              pctDia={p.percentualHoje}
              pct7d={p.percentual7d}
              pausada={!!p.area.paused_until && p.area.paused_until > new Date().toISOString().slice(0, 10)}
              onPress={() => router.push(`/area/${p.area.id}`)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { paddingBottom: 30 },
  alvoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: tema.bgCard,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
  },
  alvoTitulo: { color: tema.texto, fontSize: 15, fontWeight: '600' },
  alvoSub: { color: tema.textoFraco, fontSize: 12, marginTop: 2 },
  lista: { paddingHorizontal: 16, gap: 8 },
});
