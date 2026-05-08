import { useEffect, useState, useCallback } from 'react';
import { ScrollView, Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { tema } from '../src/lib/tema';
import { AlvoDeVida } from '../src/components/AlvoDeVida';
import { carregarDashboard, type DashboardData } from '../src/domain/agregados';
import { corPorPercentual, rotuloPorPercentual } from '../src/domain/cores';

export default function Alvo() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [data, setData] = useState<DashboardData | null>(null);
  const tamanho = Math.min(width - 32, 360);

  useFocusEffect(useCallback(() => {
    (async () => setData(await carregarDashboard()))();
  }, []));

  if (!data) return <View style={styles.bg} />;

  const cor = corPorPercentual(data.percentualGeral);

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.container}>
      <View style={styles.topo}>
        <Text style={styles.label}>ALVO DE VIDA · 7 DIAS</Text>
        <Text style={[styles.pct, { color: cor }]}>{data.percentualGeral}%</Text>
        <Text style={styles.estado}>{rotuloPorPercentual(data.percentualGeral)}</Text>
      </View>

      <AlvoDeVida fatias={data.porArea} tamanho={tamanho} />

      <Text style={styles.dica}>
        Anel cheio = 100% naquela área. Cor da fatia = desempenho. Borda = identidade da área.
      </Text>
      <View style={{ height: tema.espacamento.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { padding: tema.espacamento.lg, alignItems: 'center' },
  topo: { alignItems: 'center', marginBottom: tema.espacamento.lg },
  label: { color: tema.textoFraco, fontSize: 11, letterSpacing: 2 },
  pct: { fontSize: 56, fontWeight: '800', marginVertical: 4 },
  estado: { color: tema.texto, fontSize: tema.fonte.subtitulo, fontWeight: '600' },
  dica: {
    color: tema.textoFraco,
    fontSize: tema.fonte.pequeno,
    textAlign: 'center',
    marginTop: tema.espacamento.lg,
    paddingHorizontal: tema.espacamento.md,
  },
});
