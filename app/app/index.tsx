import { useEffect, useState, useCallback } from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { tema } from '../src/lib/tema';
import { Botao } from '../src/components/Botao';
import { useAppStore } from '../src/store/appStore';
import { carregarDashboard, type DashboardData } from '../src/domain/agregados';
import { corPorPercentual, rotuloPorPercentual } from '../src/domain/cores';
import { INTENSIDADE_ROTULO, INTENSIDADE_COR } from '../src/domain/intensidade';
import { mensagemCobranca, FAIXA_LABEL } from '../src/domain/mediocridade';
import { proximoMilestone } from '../src/domain/streak';

export default function Home() {
  const router = useRouter();
  const inicializado = useAppStore(s => s.inicializado);
  const onboarded = useAppStore(s => s.onboarded);
  const [data, setData] = useState<DashboardData | null>(null);
  const [refresh, setRefresh] = useState(false);

  const carregar = useCallback(async () => {
    if (!onboarded) return;
    const d = await carregarDashboard();
    setData(d);
  }, [onboarded]);

  useEffect(() => {
    if (inicializado && onboarded) carregar();
  }, [inicializado, onboarded, carregar]);

  useFocusEffect(
    useCallback(() => {
      if (inicializado && onboarded) carregar();
    }, [inicializado, onboarded, carregar])
  );

  // Trava de reativação após 2+ dias pulados — libera assim que houver execução hoje
  useEffect(() => {
    if (data && data.diasPulados >= 2 && data.execucoesHoje === 0) {
      router.replace('/reativacao');
    }
  }, [data]);

  if (!inicializado || !onboarded || !data) {
    return <View style={styles.bg} />;
  }

  const corHoje = corPorPercentual(data.percentualHoje);
  const corGeral = corPorPercentual(data.percentualGeral);

  return (
    <ScrollView
      style={styles.bg}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refresh}
          onRefresh={async () => { setRefresh(true); await carregar(); setRefresh(false); }}
          tintColor={tema.texto}
        />
      }
    >
      {/* Cabeçalho — % do dia */}
      <View style={[styles.heroBox, { borderColor: corHoje }]}>
        <Text style={styles.heroLabel}>HOJE</Text>
        <Text style={[styles.heroPct, { color: corHoje }]}>{data.percentualHoje}%</Text>
        <Text style={styles.heroEstado}>{rotuloPorPercentual(data.percentualHoje)}</Text>
      </View>

      {/* Linha de stats */}
      <View style={styles.statsRow}>
        <Stat rotulo="Streak" valor={`${data.streak}d`} sub={proximoMilestone(data.streak) ? `→ ${proximoMilestone(data.streak)}d` : 'lendário'} />
        <Stat rotulo="Geral 7d" valor={`${data.percentualGeral}%`} corValor={corGeral} />
        <Stat rotulo="Ritmo" valor={INTENSIDADE_ROTULO[data.intensidade]} corValor={INTENSIDADE_COR[data.intensidade]} />
      </View>

      {/* Cobrança / mediocridade */}
      {data.mediocridade.faixa !== 'limpo' && (
        <View style={[styles.banner, data.mediocridade.faixa === 'cobranca_forte' && { backgroundColor: '#3a1a1a' }]}>
          <Text style={styles.bannerTag}>{FAIXA_LABEL[data.mediocridade.faixa].toUpperCase()}</Text>
          <Text style={styles.bannerTxt}>
            {mensagemCobranca(data.mediocridade.faixa, 7 * 4)}
          </Text>
        </View>
      )}

      {/* Áreas */}
      <Text style={styles.secao}>Áreas</Text>
      {data.porArea.map(p => (
        <Pressable
          key={p.area.id}
          style={[styles.areaCard, { borderLeftColor: p.area.cor_base }]}
          onPress={() => router.push('/checklist')}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.areaNome}>{p.area.nome}</Text>
            <Text style={styles.areaSub}>
              {p.tarefas.length} tarefas · {p.percentual7d}% nos últimos 7d
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: corPorPercentual(p.percentualHoje) }]}>
            <Text style={styles.pillTxt}>{p.percentualHoje}%</Text>
          </View>
        </Pressable>
      ))}

      <View style={{ height: tema.espacamento.lg }} />
      <Botao titulo="Checklist do dia" onPress={() => router.push('/checklist')} />
      <View style={{ height: tema.espacamento.sm }} />
      <Botao titulo="Alvo de Vida" variante="secundario" onPress={() => router.push('/alvo')} />
      <View style={{ height: tema.espacamento.sm }} />
      <Botao titulo="Reflexão de hoje" variante="secundario" onPress={() => router.push('/reflexao')} />
      <View style={{ height: tema.espacamento.xl }} />
    </ScrollView>
  );
}

function Stat({ rotulo, valor, sub, corValor }: { rotulo: string; valor: string; sub?: string; corValor?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statRotulo}>{rotulo}</Text>
      <Text style={[styles.statValor, corValor && { color: corValor }]}>{valor}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { padding: tema.espacamento.lg },
  heroBox: {
    borderWidth: 2,
    borderRadius: tema.raio,
    padding: tema.espacamento.lg,
    alignItems: 'center',
    marginBottom: tema.espacamento.md,
  },
  heroLabel: { color: tema.textoFraco, fontSize: 12, letterSpacing: 2 },
  heroPct: { fontSize: 64, fontWeight: '800', marginVertical: 4 },
  heroEstado: { color: tema.texto, fontSize: tema.fonte.subtitulo, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: tema.espacamento.sm, marginBottom: tema.espacamento.md },
  stat: {
    flex: 1, backgroundColor: tema.bgCard, borderRadius: tema.raio,
    padding: tema.espacamento.md, alignItems: 'center',
  },
  statRotulo: { color: tema.textoFraco, fontSize: 11, letterSpacing: 1 },
  statValor: { color: tema.texto, fontSize: tema.fonte.subtitulo, fontWeight: '700', marginTop: 4 },
  statSub: { color: tema.textoFraco, fontSize: 11, marginTop: 2 },
  banner: {
    backgroundColor: '#2a1f0a',
    borderRadius: tema.raio,
    padding: tema.espacamento.md,
    marginBottom: tema.espacamento.md,
  },
  bannerTag: { color: tema.alerta, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  bannerTxt: { color: tema.texto, fontSize: tema.fonte.corpo },
  secao: {
    color: tema.textoFraco, fontSize: tema.fonte.pequeno,
    letterSpacing: 1, textTransform: 'uppercase',
    marginBottom: tema.espacamento.sm,
  },
  areaCard: {
    backgroundColor: tema.bgCard,
    borderLeftWidth: 4,
    borderRadius: tema.raio,
    padding: tema.espacamento.md,
    marginBottom: tema.espacamento.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  areaNome: { color: tema.texto, fontSize: tema.fonte.corpo, fontWeight: '600' },
  areaSub: { color: tema.textoFraco, fontSize: tema.fonte.pequeno, marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillTxt: { color: '#fff', fontSize: tema.fonte.pequeno, fontWeight: '700' },
});
