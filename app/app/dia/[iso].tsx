import { useCallback, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tema } from '../../src/lib/tema';
import { BigRing } from '../../src/components/ui/BigRing';
import { TaskRow } from '../../src/components/ui/TaskRow';
import { listarAreas } from '../../src/db/queries/areas';
import {
  listarTarefasAtivas,
  execucoesDoDia,
  marcarExecucao,
  removerExecucao,
} from '../../src/db/queries/tarefas';
import { getDb } from '../../src/db/schema';
import { percentualArea, percentualGeral } from '../../src/domain/percentual';
import { hojeIso } from '../../src/lib/datas';
import type { Area, Tarefa, Execucao, Reflexao, StatusExecucao } from '../../src/db/types';

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function dataPorExtenso(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`;
}

function statusVisual(s?: StatusExecucao): 'open' | 'done' | 'half' | 'fail' {
  if (s === 'concluido') return 'done';
  if (s === 'parcial') return 'half';
  if (s === 'nao_feito') return 'fail';
  return 'open';
}

const STATUS_CICLO: (StatusExecucao | null)[] = [null, 'concluido', 'parcial', 'nao_feito'];

function diasDesde(iso: string): number {
  const d = new Date(iso + 'T12:00:00');
  const hoje = new Date(hojeIso() + 'T12:00:00');
  return Math.round((hoje.getTime() - d.getTime()) / 86_400_000);
}

export default function DetalheDia() {
  const { iso } = useLocalSearchParams<{ iso: string }>();
  const data = iso ?? hojeIso();
  const editavel = diasDesde(data) <= 1; // hoje e ontem

  const [areas, setAreas] = useState<Area[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [execucoes, setExecucoes] = useState<Execucao[]>([]);
  const [reflexao, setReflexao] = useState<Reflexao | null>(null);
  const [refresh, setRefresh] = useState(false);

  const carregar = useCallback(async () => {
    const [a, t, e] = await Promise.all([
      listarAreas(false),
      listarTarefasAtivas(),
      execucoesDoDia(data),
    ]);
    const db = await getDb();
    const r = await db.getFirstAsync<Reflexao>(
      `SELECT * FROM reflexoes_diarias WHERE data = ?`,
      [data]
    );
    setAreas(a);
    setTarefas(t);
    setExecucoes(e);
    setReflexao(r ?? null);
  }, [data]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  // calcula % do dia (mesma lógica do dashboard pra "hoje", aplicada à data)
  const corDaArea = new Map<number, string>();
  for (const a of areas) corDaArea.set(a.id, a.cor_base);

  const porArea = areas.map(area => {
    const tarefasArea = tarefas.filter(t => t.area_id === area.id);
    const execArea = execucoes.filter(e => tarefasArea.some(t => t.id === e.tarefa_id));
    return {
      areaId: area.id,
      pesoGlobal: area.peso_global,
      percentual: percentualArea(tarefasArea, execArea, 1),
    };
  });
  const pct = percentualGeral(porArea);

  // mapeia status por tarefa
  const statusPorTarefa = new Map<number, StatusExecucao>();
  for (const e of execucoes) statusPorTarefa.set(e.tarefa_id, e.status);

  // ordena: com horário primeiro, sem horário no fim
  const tarefasOrdenadas = [...tarefas].sort((a, b) => {
    if (a.horario && b.horario) return a.horario.localeCompare(b.horario);
    if (a.horario) return -1;
    if (b.horario) return 1;
    return 0;
  });

  async function ciclar(tarefaId: number) {
    if (!editavel) return;
    const cur = statusPorTarefa.get(tarefaId) ?? null;
    const idx = STATUS_CICLO.indexOf(cur);
    const proximo = STATUS_CICLO[(idx + 1) % STATUS_CICLO.length];
    if (proximo === null) {
      await removerExecucao(tarefaId, data);
    } else {
      await marcarExecucao(tarefaId, proximo, data);
    }
    await carregar();
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
          <View style={styles.header}>
            <Text style={styles.kicker}>{dataPorExtenso(data).toUpperCase()}</Text>
            <Text style={styles.titulo}>Detalhe do dia</Text>
          </View>

          <View style={styles.anelWrap}>
            <BigRing pct={pct} size={196} />
          </View>

          {!editavel && (
            <Text style={styles.aviso}>
              Edição retroativa só é permitida pra hoje e ontem.
            </Text>
          )}

          <Text style={styles.secao}>TAREFAS</Text>
          <View style={styles.lista}>
            {tarefasOrdenadas.map((t, i) => (
              <TaskRow
                key={t.id}
                status={statusVisual(statusPorTarefa.get(t.id))}
                title={t.nome}
                time={t.horario ?? undefined}
                areaColor={corDaArea.get(t.area_id)}
                weight={t.peso}
                isLast={i === tarefasOrdenadas.length - 1}
                onPress={editavel ? () => ciclar(t.id) : undefined}
              />
            ))}
          </View>

          {reflexao && reflexao.resposta && (
            <>
              <Text style={styles.secao}>REFLEXÃO</Text>
              <View style={styles.cardReflexao}>
                <Text style={styles.pergunta}>{reflexao.pergunta}</Text>
                <Text style={styles.resposta}>{reflexao.resposta}</Text>
              </View>
            </>
          )}

          {editavel && (
            <Text style={styles.dica}>
              Toque na tarefa pra ciclar status: vazio → ✓ → ◐ → ✗ → vazio.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { paddingBottom: 30 },
  header: { paddingHorizontal: 24, paddingTop: 8 },
  kicker: { color: tema.textoFraco, fontSize: 11, fontWeight: '600', letterSpacing: 1.2 },
  titulo: { color: tema.texto, fontSize: 28, fontWeight: '800', letterSpacing: -0.4, marginTop: 4 },
  anelWrap: { alignItems: 'center', marginVertical: 22 },
  aviso: {
    color: tema.alerta,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  secao: {
    paddingHorizontal: 24,
    marginTop: 6,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: tema.textoFraco,
  },
  lista: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: tema.bgCard,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
    overflow: 'hidden',
  },
  cardReflexao: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: tema.bgCard,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
    padding: 16,
  },
  pergunta: { color: tema.texto, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  resposta: { color: tema.textoFraco, fontSize: 13, lineHeight: 20 },
  dica: { color: tema.textoFraco, fontSize: 12, paddingHorizontal: 24, marginTop: 8 },
});
