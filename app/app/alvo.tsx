import { useCallback, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useFocusEffect, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tema } from '../src/lib/tema';
import { AlvoDeVida } from '../src/components/AlvoDeVida';
import { PageHeader } from '../src/components/ui/PageHeader';
import { carregarDashboard, type DashboardData } from '../src/domain/agregados';
import { corPorPercentual } from '../src/domain/cores';

export default function Alvo() {
  const { width } = useWindowDimensions();
  const [data, setData] = useState<DashboardData | null>(null);
  const tamanho = Math.min(width - 32, 340);

  useFocusEffect(useCallback(() => {
    (async () => setData(await carregarDashboard()))();
  }, []));

  if (!data) return <SafeAreaView style={styles.bg} edges={['top']} />;

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <SafeAreaView style={styles.bg} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container}>
          <PageHeader kicker="visão geral · 7 dias" title="Alvo de Vida" />

          <View style={styles.pizzaWrap}>
            <AlvoDeVida fatias={data.porArea} tamanho={tamanho} totalPct={data.percentualGeral} />
          </View>

          <View style={styles.legenda}>
            {data.porArea.map(f => (
              <View key={f.area.id} style={styles.legItem}>
                <View style={[styles.bola, { backgroundColor: f.area.cor_base }]} />
                <Text style={styles.legNome} numberOfLines={1}>
                  {f.area.nome}
                </Text>
                <Text style={[styles.legPct, { color: corPorPercentual(f.percentual7d) }]}>
                  {f.percentual7d}%
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.dica}>
            Anel cheio = 100% naquela área. Cor da fatia = desempenho. Borda externa = identidade.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { paddingBottom: 30 },
  pizzaWrap: { alignItems: 'center', marginTop: 12, marginBottom: 16 },
  legenda: {
    marginHorizontal: 16,
    backgroundColor: tema.bgCard,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
    paddingVertical: 8,
    paddingHorizontal: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  bola: { width: 10, height: 10, borderRadius: 2 },
  legNome: { color: tema.texto, fontSize: 12, flex: 1 },
  legPct: { fontSize: 12, fontWeight: '700' },
  dica: {
    color: tema.textoFraco,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 18,
  },
});
