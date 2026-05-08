import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tema } from '../../src/lib/tema';
import { useAppStore } from '../../src/store/appStore';
import { carregarDashboard, type DashboardData } from '../../src/domain/agregados';
import { INTENSIDADE_ROTULO } from '../../src/domain/intensidade';
import { mensagemCobranca, FAIXA_LABEL } from '../../src/domain/mediocridade';
import { BigRing } from '../../src/components/ui/BigRing';
import { StatCard } from '../../src/components/ui/StatCard';
import { TaskRow } from '../../src/components/ui/TaskRow';
import { CobrancaBanner } from '../../src/components/ui/CobrancaBanner';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { hojeIso } from '../../src/lib/datas';
import { listarTarefasAtivas, listarExecucoesDoDia, type TarefaComExecucao } from '../../src/db/queries/tarefas';

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function dataFormatada(): string {
  const d = new Date();
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`;
}

export default function Hoje() {
  const router = useRouter();
  const inicializado = useAppStore(s => s.inicializado);
  const onboarded = useAppStore(s => s.onboarded);
  const [data, setData] = useState<DashboardData | null>(null);
  const [tarefas, setTarefas] = useState<TarefaComExecucao[]>([]);
  const [refresh, setRefresh] = useState(false);

  const carregar = useCallback(async () => {
    if (!onboarded) return;
    const d = await carregarDashboard();
    setData(d);
    const t = await listarExecucoesDoDia(hojeIso());
    setTarefas(t);
  }, [onboarded]);

  useEffect(() => { if (inicializado && onboarded) carregar(); }, [inicializado, onboarded, carregar]);
  useFocusEffect(useCallback(() => { if (inicializado && onboarded) carregar(); }, [inicializado, onboarded, carregar]));

  // Trava de reativação após 2+ dias pulados (só se ainda não fez nada hoje)
  useEffect(() => {
    if (data && data.diasPulados >= 2 && data.execucoesHoje === 0) {
      router.replace('/reativacao');
    }
  }, [data]);

  if (!inicializado || !onboarded || !data) {
    return <View style={styles.bg} />;
  }

  const ritmoDelta = data.percentualHoje - data.percentualGeral;
  const ritmoStr = `${ritmoDelta >= 0 ? '+' : ''}${ritmoDelta}%`;

  const mostrarBanner = data.mediocridade.faixa !== 'limpo';

  // Mapeia áreas por id pra tirar a cor de cada tarefa
  const corDaArea = new Map<number, string>();
  for (const a of data.porArea) corDaArea.set(a.area.id, a.area.cor_base);

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
        <PageHeader kicker={dataFormatada()} title="Hoje" />

        <View style={styles.anelWrap}>
          <BigRing pct={data.percentualHoje} />
        </View>

        <View style={styles.statsRow}>
          <StatCard label="7d %" value={`${data.percentualGeral}%`} sub="média" />
          <StatCard label="Streak" value={data.streak} sub={data.streak === 1 ? 'dia' : 'dias'} />
          <StatCard label="Ritmo" value={ritmoStr} sub="vs 7d" />
        </View>

        {mostrarBanner && (
          <CobrancaBanner
            titulo={FAIXA_LABEL[data.mediocridade.faixa]}
            mensagem={mensagemCobranca(data.mediocridade.faixa, 7 * 4)}
          />
        )}

        <Text style={styles.secao}>PRÓXIMAS</Text>
        <View style={styles.lista}>
          {tarefas.length === 0 && (
            <View style={{ padding: 24 }}>
              <Text style={{ color: tema.textoFraco, fontSize: 14 }}>Sem tarefas pra hoje.</Text>
            </View>
          )}
          {tarefas.map((t, i) => (
            <TaskRow
              key={t.id}
              status={t.status}
              title={t.nome}
              areaColor={corDaArea.get(t.area_id)}
              weight={t.peso}
              isLast={i === tarefas.length - 1}
              onPress={() => router.push('/checklist')}
            />
          ))}
        </View>

        <Pressable style={styles.botaoReflexao} onPress={() => router.push('/reflexao')}>
          <Text style={styles.botaoReflexaoTxt}>Reflexão de hoje</Text>
        </Pressable>

        <Pressable style={styles.botaoSec} onPress={() => router.push('/checklist')}>
          <Text style={styles.botaoSecTxt}>Checklist completo</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { paddingBottom: 30 },
  anelWrap: { alignItems: 'center', marginTop: 22, marginBottom: 22 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 22,
  },
  secao: {
    paddingHorizontal: 24,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: tema.textoFraco,
  },
  lista: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: tema.bgCard,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
    overflow: 'hidden',
  },
  botaoReflexao: {
    marginHorizontal: 20,
    backgroundColor: tema.bgInput,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  botaoReflexaoTxt: {
    color: tema.texto,
    fontSize: 15,
    fontWeight: '600',
  },
  botaoSec: {
    marginHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoSecTxt: {
    color: tema.textoFraco,
    fontSize: 14,
    fontWeight: '500',
  },
});
