import { useCallback, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useFocusEffect, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, addMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { tema } from '../../src/lib/tema';
import { BigRing } from '../../src/components/ui/BigRing';
import { StatCard } from '../../src/components/ui/StatCard';
import { TaskRow } from '../../src/components/ui/TaskRow';
import { buscarAreaPorId, pausarArea, reativarArea } from '../../src/db/queries/areas';
import { alertaPausa } from '../../src/domain/alertasPausa';
import {
  listarExecucoesDoDia,
  type TarefaComExecucao,
} from '../../src/db/queries/tarefas';
import { hojeIso } from '../../src/lib/datas';
import { carregarDashboard, type ResumoArea } from '../../src/domain/agregados';
import type { Area } from '../../src/db/types';

const FREQ_LABEL = { diaria: 'diária', semanal: 'semanal', mensal: 'mensal' } as const;

function freqTexto(t: TarefaComExecucao): string {
  if (t.frequencia === 'diaria') return 'diária';
  const unidade = t.frequencia === 'semanal' ? 'semana' : 'mês';
  return t.alvo_count > 1 ? `${t.alvo_count}x/${unidade}` : `1x/${unidade}`;
}

export default function DetalheArea() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const areaId = Number(id);
  const [area, setArea] = useState<Area | null>(null);
  const [resumo, setResumo] = useState<ResumoArea | null>(null);
  const [tarefas, setTarefas] = useState<TarefaComExecucao[]>([]);
  const [refresh, setRefresh] = useState(false);

  const carregar = useCallback(async () => {
    if (!Number.isFinite(areaId)) return;
    const [a, dash, t] = await Promise.all([
      buscarAreaPorId(areaId),
      carregarDashboard(),
      listarExecucoesDoDia(hojeIso()),
    ]);
    setArea(a);
    setResumo(dash.porArea.find(p => p.area.id === areaId) ?? null);
    setTarefas(t.filter(x => x.area_id === areaId));
  }, [areaId]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  // Pausada: paused_until existe E ainda não venceu. listarAreas usa o mesmo
  // critério, então a UI bate com o que o cálculo de dashboard considera.
  const pausada =
    !!area?.paused_until && area.paused_until > hojeIso();

  function tentarPausar() {
    if (!area) return;
    Alert.alert(
      `Pausar ${area.nome}?`,
      alertaPausa(area.slug),
      [
        { text: 'Não, manter', style: 'cancel' },
        {
          text: 'Mesmo assim, pausar',
          style: 'destructive',
          onPress: () => confirmarPausa(),
        },
      ]
    );
  }

  function confirmarPausa() {
    if (!area) return;
    Alert.alert(
      'Confirmação final',
      `Última chance. Pausar ${area.nome} por 6 meses significa que ela não vai contar no seu Alvo de Vida nesse período. Confirma?`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Pausar',
          style: 'destructive',
          onPress: async () => {
            const ate = format(addMonths(new Date(), 6), 'yyyy-MM-dd');
            await pausarArea(area.id, ate, 'Pausada no detalhe da área');
            await carregar();
          },
        },
      ]
    );
  }

  function reativar() {
    if (!area) return;
    Alert.alert(
      `Reativar ${area.nome}?`,
      'A área volta a contar no seu Alvo de Vida e nas métricas do dia.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reativar',
          onPress: async () => {
            await reativarArea(area.id);
            await carregar();
          },
        },
      ]
    );
  }

  if (!area || !resumo) {
    return <SafeAreaView style={styles.bg} edges={['top']} />;
  }

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
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
          <View style={styles.cabecalho}>
            <View style={[styles.faixa, { backgroundColor: area.cor_base }]} />
            <Text style={styles.kicker}>
              ÁREA {area.obrigatoria ? 'OBRIGATÓRIA' : 'OPCIONAL'}
              {pausada && area.paused_until ? ` · PAUSADA ATÉ ${format(parseISO(area.paused_until), "d 'de' MMM", { locale: ptBR })}` : ''}
            </Text>
            <Text style={styles.titulo}>{area.nome}</Text>
          </View>

          <View style={styles.anelWrap}>
            <BigRing pct={resumo.percentualHoje} size={196} />
          </View>

          <View style={styles.statsRow}>
            <StatCard label="7d %" value={`${resumo.percentual7d}%`} sub="média" />
            <StatCard label="Tarefas" value={resumo.tarefas.length} sub={resumo.tarefas.length === 1 ? 'ativa' : 'ativas'} />
            <StatCard
              label="Peso"
              value={`${(area.peso_global * 100).toFixed(0)}%`}
              sub="no geral"
            />
          </View>

          <View style={styles.secaoRow}>
            <Text style={styles.secao}>TAREFAS</Text>
            <Pressable onPress={() => router.push(`/tarefa/novo?area=${areaId}`)}>
              <Text style={styles.adicionar}>+ Nova</Text>
            </Pressable>
          </View>
          <View style={styles.lista}>
            {tarefas.length === 0 && (
              <View style={{ padding: 24 }}>
                <Text style={{ color: tema.textoFraco, fontSize: 14 }}>
                  Nenhuma tarefa ativa nessa área.
                </Text>
              </View>
            )}
            {tarefas.map((t, i) => (
              <TaskRow
                key={t.id}
                status={t.status}
                title={t.nome}
                time={t.horario ?? undefined}
                weight={t.peso}
                isLast={i === tarefas.length - 1}
                onPress={() => router.push(`/tarefa/${t.id}`)}
              />
            ))}
          </View>

          {tarefas.length > 0 && (
            <Text style={styles.legenda}>
              Frequência por tarefa: {tarefas.map(t => freqTexto(t)).join(', ')}.
            </Text>
          )}

          {!area.obrigatoria && (
            <View style={styles.acaoWrap}>
              {pausada ? (
                <Pressable style={styles.btnReativar} onPress={reativar}>
                  <Text style={styles.btnReativarTxt}>Reativar área</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.btnPausar} onPress={tentarPausar}>
                  <Text style={styles.btnPausarTxt}>Pausar área (6 meses)</Text>
                </Pressable>
              )}
              <Text style={styles.acaoNota}>
                {pausada
                  ? 'Áreas pausadas voltam automaticamente após o prazo.'
                  : 'Pausar exige duas confirmações. Você pode reativar a qualquer momento.'}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { paddingBottom: 30 },
  cabecalho: { paddingHorizontal: 24, paddingTop: 4 },
  faixa: { width: 6, height: 28, borderRadius: 3, marginBottom: 10 },
  kicker: {
    color: tema.textoFraco,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  titulo: {
    color: tema.texto,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 4,
    lineHeight: 30,
  },
  anelWrap: { alignItems: 'center', marginTop: 20, marginBottom: 14 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 22,
  },
  secaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  secao: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: tema.textoFraco,
  },
  adicionar: { color: tema.acento, fontSize: 14, fontWeight: '600' },
  lista: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: tema.bgCard,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
    overflow: 'hidden',
  },
  legenda: {
    paddingHorizontal: 24,
    color: tema.textoFraco,
    fontSize: 12,
    lineHeight: 18,
  },
  acaoWrap: {
    marginHorizontal: 16,
    marginTop: 22,
  },
  btnPausar: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tema.bordaForte,
  },
  btnPausarTxt: {
    color: tema.alerta,
    fontSize: 15,
    fontWeight: '700',
  },
  btnReativar: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: tema.acento,
  },
  btnReativarTxt: {
    color: tema.acentoTexto,
    fontSize: 15,
    fontWeight: '700',
  },
  acaoNota: {
    color: tema.textoFraco,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
  },
});
