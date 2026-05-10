import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tema } from '../../src/lib/tema';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { api, ApiError } from '../../src/lib/api';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Evento = {
  id: string;
  tipo: string;
  occurredAt: string;
  source: string;
  areaId: number | null;
  tarefaId: number | null;
  payload: Record<string, unknown>;
};

type RespostaTrilha = { eventos: Evento[]; proximoCursor: string | null };

const TIPO_ICONE: Record<string, keyof typeof Ionicons.glyphMap> = {
  task_status_changed: 'checkmark-circle-outline',
  daily_note_submitted: 'mic-outline',
  voice_note_transcribed: 'mic-outline',
  suggestion_presented: 'bulb-outline',
  suggestion_accepted: 'checkmark-done-outline',
  suggestion_rejected: 'close-circle-outline',
  weekly_plan_generated: 'calendar-outline',
  stressor_reported: 'alert-circle-outline',
  memory_fact_edited: 'create-outline',
  memory_fact_deleted: 'trash-outline',
};

const TIPO_LABEL: Record<string, string> = {
  task_status_changed: 'Marcou tarefa',
  daily_note_submitted: 'Relato do dia',
  voice_note_transcribed: 'Áudio transcrito',
  suggestion_presented: 'IA sugeriu',
  suggestion_accepted: 'Aceitou sugestão',
  suggestion_rejected: 'Recusou sugestão',
  weekly_plan_generated: 'Plano semanal',
  stressor_reported: 'Estressor',
  memory_fact_edited: 'Fato editado',
  memory_fact_deleted: 'Fato apagado',
};

const TIPO_COR: Record<string, string> = {
  task_status_changed: tema.acento,
  daily_note_submitted: tema.acento,
  suggestion_presented: tema.alerta,
  suggestion_accepted: tema.sucesso,
  suggestion_rejected: tema.textoFraco,
  weekly_plan_generated: tema.acento,
  memory_fact_edited: tema.alerta,
  memory_fact_deleted: tema.perigo,
  stressor_reported: tema.perigo,
  voice_note_transcribed: tema.acento,
};

const STATUS_LABEL: Record<string, string> = {
  concluido: 'concluído',
  parcial: 'parcial',
  nao_feito: 'não feito',
};

function rotuloDia(iso: string): string {
  const d = parseISO(iso);
  if (isToday(d)) return 'HOJE';
  if (isYesterday(d)) return 'ONTEM';
  return format(d, "EEEE, d 'de' MMM", { locale: ptBR }).toUpperCase();
}

function descricaoEvento(e: Evento): string {
  const p = e.payload;
  switch (e.tipo) {
    case 'task_status_changed': {
      const antes = p.statusAntes ? STATUS_LABEL[String(p.statusAntes)] ?? p.statusAntes : '—';
      const depois = p.statusDepois
        ? STATUS_LABEL[String(p.statusDepois)] ?? p.statusDepois
        : 'apagada';
      return `${antes} → ${depois}`;
    }
    case 'daily_note_submitted': {
      const relato = String(p.relato ?? '');
      return relato.length > 120 ? relato.slice(0, 120) + '…' : relato;
    }
    case 'suggestion_presented':
    case 'suggestion_accepted':
    case 'suggestion_rejected':
      return String(p.descricao ?? '');
    case 'weekly_plan_generated':
      return String(p.intencaoSemana ?? 'Plano gerado.');
    case 'memory_fact_edited':
      return 'Fato atualizado.';
    case 'memory_fact_deleted':
      return 'Fato removido.';
    default:
      return '';
  }
}

function agruparPorDia(eventos: Evento[]): { dia: string; eventos: Evento[] }[] {
  const grupos: Record<string, Evento[]> = {};
  for (const e of eventos) {
    const dia = e.occurredAt.slice(0, 10);
    (grupos[dia] ||= []).push(e);
  }
  return Object.entries(grupos)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([dia, evs]) => ({ dia, eventos: evs }));
}

export default function Trilha() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const carregarPagina = useCallback(
    async (cursorAtual: string | null, append: boolean) => {
      try {
        const qs = cursorAtual
          ? `?cursor=${encodeURIComponent(cursorAtual)}&limit=50`
          : '?limit=50';
        const r = await api.get<RespostaTrilha>(`/trail${qs}`);
        setEventos((prev) => (append ? [...prev, ...r.eventos] : r.eventos));
        setCursor(r.proximoCursor);
      } catch (e) {
        if (e instanceof ApiError) {
          Alert.alert('Erro', `status ${e.status}`);
        } else {
          Alert.alert('Sem conexão', 'Tente quando estiver online.');
        }
      }
    },
    []
  );

  useEffect(() => {
    (async () => {
      await carregarPagina(null, false);
      setCarregando(false);
    })();
  }, [carregarPagina]);

  const grupos = agruparPorDia(eventos);

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <SafeAreaView style={styles.bg} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refresh}
              tintColor={tema.texto}
              onRefresh={async () => {
                setRefresh(true);
                await carregarPagina(null, false);
                setRefresh(false);
              }}
            />
          }
          onScroll={(ev) => {
            const { layoutMeasurement, contentOffset, contentSize } = ev.nativeEvent;
            const distanciaFundo =
              contentSize.height - (contentOffset.y + layoutMeasurement.height);
            if (distanciaFundo < 200 && cursor && !carregandoMais) {
              setCarregandoMais(true);
              carregarPagina(cursor, true).finally(() => setCarregandoMais(false));
            }
          }}
          scrollEventThrottle={200}
        >
          <PageHeader kicker="SUA TRILHA" title="O que aconteceu" />
          <Text style={styles.sub}>
            Linha do tempo das suas ações e do que a IA viu. Mais recente em cima.
          </Text>

          {carregando ? (
            <ActivityIndicator color={tema.texto} style={{ marginTop: 60 }} />
          ) : eventos.length === 0 ? (
            <View style={styles.vazio}>
              <Text style={styles.vazioTxt}>
                Trilha vazia. Marque uma tarefa, conte um dia, ou aceite uma sugestão.
              </Text>
            </View>
          ) : (
            grupos.map((g) => (
              <View key={g.dia} style={styles.bloco}>
                <Text style={styles.kicker}>{rotuloDia(g.dia)}</Text>
                {g.eventos.map((e, i) => {
                  const cor = TIPO_COR[e.tipo] ?? tema.textoFraco;
                  const icone = TIPO_ICONE[e.tipo] ?? 'ellipse-outline';
                  const desc = descricaoEvento(e);
                  return (
                    <View
                      key={e.id}
                      style={[styles.evento, i === g.eventos.length - 1 && { borderBottomWidth: 0 }]}
                    >
                      <View style={[styles.iconeWrap, { backgroundColor: tema.bgInput }]}>
                        <Ionicons name={icone} size={18} color={cor} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={styles.linhaTopo}>
                          <Text style={styles.tipoLabel}>{TIPO_LABEL[e.tipo] ?? e.tipo}</Text>
                          <Text style={styles.hora}>
                            {format(parseISO(e.occurredAt), 'HH:mm')}
                          </Text>
                        </View>
                        {desc ? (
                          <Text style={styles.descricao} numberOfLines={3}>
                            {desc}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}

          {carregandoMais && (
            <ActivityIndicator
              color={tema.textoFraco}
              style={{ marginTop: 16 }}
              size="small"
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { paddingBottom: 100 },
  sub: {
    paddingHorizontal: 24,
    color: tema.textoFraco,
    fontSize: 14,
    lineHeight: 20,
    marginTop: -4,
    marginBottom: 8,
  },
  vazio: { paddingHorizontal: 24, paddingTop: 60, alignItems: 'center' },
  vazioTxt: {
    color: tema.textoFraco,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bloco: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: tema.bgCard,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
  },
  kicker: {
    fontSize: 11,
    fontFamily: tema.fontFamily.textBold,
    letterSpacing: 1.2,
    color: tema.textoFraco,
    paddingTop: 8,
    paddingBottom: 6,
  },
  evento: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tema.borda,
  },
  iconeWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tipoLabel: {
    color: tema.texto,
    fontSize: 13,
    fontFamily: tema.fontFamily.textBold,
  },
  hora: {
    color: tema.textoFraco,
    fontSize: 11,
    fontFamily: tema.fontFamily.text,
  },
  descricao: {
    color: tema.textoFraco,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
});
