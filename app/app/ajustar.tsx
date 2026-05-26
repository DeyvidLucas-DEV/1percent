import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AudioModule,
  RecordingPresets,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { tema } from '../src/lib/tema';
import { PageHeader } from '../src/components/ui/PageHeader';
import { OrbVoz, type EstadoOrb } from '../src/components/ui/OrbVoz';
import { api, ApiError } from '../src/lib/api';
import { carregarDashboard } from '../src/domain/agregados';
import { inserirEvento } from '../src/db/queries/trailEvents';
import { criarTarefa, inativarTarefa, listarTarefasAtivas } from '../src/db/queries/tarefas';
import { listarTodasAreas } from '../src/db/queries/areas';
import { getUser } from '../src/db/queries/users';
import { validarSugestaoTarefaIA, type SugestaoTarefaIA } from '../src/domain/sugestoes';
import { reagendarTudo } from '../src/lib/agendarNotificacoesTarefas';
import { paletaArea } from '../src/domain/areasPaleta';
import type { Intensidade } from '../src/domain/intensidade';

type CriarTarefaPayload = {
  areaSlug: string;
  nome: string;
  frequencia: 'diaria' | 'semanal' | 'mensal';
  alvoCount: number;
  pesoSugerido: 1 | 2 | 3;
  horarioSugerido: string | null;
};

type PausarTarefaPayload = { tarefaId: number; nome: string; motivo: string };

type Recomendacao = {
  id: string;
  tipo:
    | 'plano_minimo'
    | 'mudar_horario'
    | 'reduzir_carga'
    | 'priorizar_area'
    | 'acao_reparadora'
    | 'conversa_dificil'
    | 'pausar_tarefa';
  descricao: string;
  exigeConfirmacao: true;
  criarTarefa: CriarTarefaPayload | null;
  pausarTarefa: PausarTarefaPayload | null;
};

type FatoCandidato = {
  categoria: string;
  chave: string;
  valor: string;
  confianca: 'baixa' | 'media' | 'alta';
  deveConfirmarComUsuario: boolean;
};

type EventoClassificado = {
  tipo: 'stressor_reported' | 'routine_pattern' | 'area_neglected' | 'preference_signal';
  areaSlug: string | null;
  descricao: string;
  confianca: 'baixa' | 'media' | 'alta';
};

type EpisodioLembrado = {
  id: string;
  occurredAt: string;
  titulo: string;
  resumo: string;
  similaridade: number;
};

type Tom =
  | 'tranquilo' | 'neutro' | 'tenso' | 'sobrecarregado' | 'abatido' | 'irritado' | 'exausto';

type LeituraEmocional = {
  tom: Tom;
  intensidade: 'baixa' | 'media' | 'alta';
  score: number;
  sinalAlerta: boolean;
};

type ImpactoArea = { areaSlug: string; efeito: string };

type Cuidado = { titulo: string; descricao: string };

type RespostaDailyNote = {
  eventId: string;
  extracao: {
    eventosClassificados: EventoClassificado[];
    fatosCandidatos: FatoCandidato[];
    episodio: { titulo: string; resumo: string; tags: string[]; areaSlugs: string[]; importanceScore: number } | null;
    recomendacoesImediatas: Recomendacao[];
    leituraEmocional: LeituraEmocional;
    impactoAreas: ImpactoArea[];
  };
  recomendacoes: Recomendacao[];
  cuidado: Cuidado | null;
  episodiosLembrados?: EpisodioLembrado[];
  episodioPersistidoId?: string | null;
  episodioErroPersistencia?: string | null;
};

const AREA_NOME_LABEL: Record<string, string> = {
  espiritual: 'Espiritual',
  saude_fisica: 'Saúde Física',
  familia: 'Família',
  trabalho: 'Trabalho',
  saude_emocional: 'Saúde Emocional',
  financas: 'Finanças',
  ministerio: 'Ministério',
  amizades: 'Amizades',
  crescimento: 'Crescimento',
  sabedoria: 'Sabedoria',
};

const TIPO_REC_LABEL: Record<Recomendacao['tipo'], string> = {
  plano_minimo: 'Plano mínimo',
  mudar_horario: 'Mudar horário',
  reduzir_carga: 'Reduzir carga',
  priorizar_area: 'Priorizar área',
  acao_reparadora: 'Ação reparadora',
  conversa_dificil: 'Conversa difícil',
  pausar_tarefa: 'Pausar tarefa',
};

const FREQ_LABEL: Record<'diaria' | 'semanal' | 'mensal', string> = {
  diaria: 'diária', semanal: 'semanal', mensal: 'mensal',
};

const TIPO_EVT_LABEL: Record<EventoClassificado['tipo'], string> = {
  stressor_reported: 'Estressor',
  routine_pattern: 'Padrão de rotina',
  area_neglected: 'Área negligenciada',
  preference_signal: 'Sinal de preferência',
};

const CATEGORIA_LABEL: Record<string, string> = {
  rotina: 'Rotina',
  familia: 'Família', trabalho: 'Trabalho', financas: 'Finanças',
  espiritual: 'Espiritual', saude_fisica: 'Saúde física',
  saude_emocional: 'Saúde emocional', amizades: 'Amizades',
  crescimento: 'Crescimento', sabedoria: 'Sabedoria',
};

function formatarDuracao(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Ajustar() {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [editandoTexto, setEditandoTexto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const [resp, setResp] = useState<RespostaDailyNote | null>(null);
  const [statusRec, setStatusRec] = useState<Record<string, 'pendente' | 'aceita' | 'recusada'>>({});
  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recState = useAudioRecorderState(audioRecorder, 100);
  // Amplitude 0-1 do mic, atualizada a partir do metering. Vai pro OrbVoz como
  // SharedValue pra animação rodar no UI thread.
  const amplitude = useSharedValue(0);
  // Flag pra ignorar onPressOut acidental antes da gravação realmente começar
  const gravacaoIniciada = useRef(false);
  const [contexto, setContexto] = useState<{
    percentualGeral7d: number;
    areasFortes: string[];
    areasNegligenciadas: string[];
    intensidade: Intensidade;
    cargaSemanal: number;
    horarioTrabalho: { inicio: string; fim: string } | null;
    tarefasAtivas: Array<{
      id: number;
      areaSlug: string;
      nome: string;
      frequencia: 'diaria' | 'semanal' | 'mensal';
      alvoCount: number;
      peso: 1 | 2 | 3;
      horario: string | null;
    }>;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [d, tarefas, todasAreas, user] = await Promise.all([
        carregarDashboard(),
        listarTarefasAtivas(),
        listarTodasAreas(),
        getUser(),
      ]);
      if (!alive) return;
      const ordenadas = [...d.porArea].sort((a, b) => a.percentual7d - b.percentual7d);
      const slugPorId = new Map(todasAreas.map((a) => [a.id, a.slug]));
      const cargaSemanal = tarefas.reduce((s, t) => {
        if (t.frequencia === 'diaria') return s + t.peso * 7;
        if (t.frequencia === 'semanal') return s + t.peso * t.alvo_count;
        return s + (t.peso * t.alvo_count) / 4;
      }, 0);
      setContexto({
        percentualGeral7d: d.percentualGeral,
        areasFortes: ordenadas.slice(-3).map((a) => a.area.slug).reverse(),
        areasNegligenciadas: ordenadas.slice(0, 3).map((a) => a.area.slug),
        intensidade: d.intensidade,
        cargaSemanal: Math.round(cargaSemanal),
        horarioTrabalho:
          user?.horario_trabalho_inicio && user?.horario_trabalho_fim
            ? { inicio: user.horario_trabalho_inicio, fim: user.horario_trabalho_fim }
            : null,
        tarefasAtivas: tarefas
          .filter((t) => t.ativa === 1)
          .map((t) => ({
            id: t.id,
            areaSlug: slugPorId.get(t.area_id) ?? 'rotina',
            nome: t.nome,
            frequencia: t.frequencia,
            alvoCount: t.alvo_count,
            peso: t.peso,
            horario: t.horario,
          })),
      });
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Mapeia metering (-160..0 dB) pra amplitude 0-1 com smoothing.
  // Faixa útil pra fala humana: -50 dB (sussurro) a -10 dB (volume alto).
  useEffect(() => {
    if (!recState.isRecording) {
      amplitude.value = withTiming(0, { duration: 200 });
      return;
    }
    const m = recState.metering ?? -160;
    const normalizado = Math.max(0, Math.min(1, (m + 55) / 45));
    amplitude.value = withTiming(normalizado, { duration: 90 });
  }, [recState.metering, recState.isRecording, amplitude]);

  const iniciarGravacao = useCallback(async () => {
    if (recState.isRecording || transcrevendo || enviando) return;
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Microfone bloqueado', 'Vai em Ajustes do iPhone > 1% > Microfone pra liberar.');
        return;
      }
      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      gravacaoIniciada.current = true;
    } catch (e) {
      Alert.alert('Falha', String(e));
    }
  }, [audioRecorder, recState.isRecording, transcrevendo, enviando]);

  const pararGravacao = useCallback(async () => {
    if (!gravacaoIniciada.current) return;
    gravacaoIniciada.current = false;
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) {
        Alert.alert('Sem áudio', 'Nada foi gravado. Mantenha pressionado por mais tempo.');
        return;
      }
      setTranscrevendo(true);
      const form = new FormData();
      // @ts-expect-error — FormData do RN aceita objeto descritor
      form.append('audio', { uri, name: 'relato.m4a', type: 'audio/m4a' });
      const r = await api.upload<{ texto: string; duracaoSegundos: number }>(
        '/ai/transcribe',
        form
      );
      setTexto((atual) => (atual.trim() ? atual.trim() + ' ' + r.texto : r.texto));
    } catch (e) {
      if (e instanceof ApiError) Alert.alert('Erro', `status ${e.status}`);
      else Alert.alert('Falha', String(e));
    } finally {
      setTranscrevendo(false);
    }
  }, [audioRecorder]);

  const enviar = useCallback(async () => {
    const t = texto.trim();
    if (t.length < 20) {
      Alert.alert('Texto curto', 'Fale pelo menos algumas frases honestas.');
      return;
    }
    setEnviando(true);
    try {
      const r = await api.post<RespostaDailyNote>('/ai/daily-note', {
        relato: t,
        dataLocal: format(new Date(), 'yyyy-MM-dd'),
        contextoDados: contexto ?? undefined,
      });
      setResp(r);
      const inicial: Record<string, 'pendente'> = {};
      for (const rec of r.recomendacoes) inicial[rec.id] = 'pendente';
      setStatusRec(inicial);
    } catch (e) {
      if (e instanceof ApiError) {
        const p = (e.payload ?? {}) as Record<string, unknown>;
        if (e.status === 429 && p.error === 'rate_limited') {
          const reset = new Date(String(p.resetEm)).toLocaleTimeString('pt-BR', {
            hour: '2-digit', minute: '2-digit',
          });
          Alert.alert('Limite atingido', `Você usou o máximo desta ${p.bucket}. Volta às ${reset}.`);
        } else if (e.status === 502) {
          Alert.alert('Falha na IA', 'Tente reformular o relato ou tente novamente em instantes.');
        } else {
          Alert.alert('Erro', `Algo deu errado (status ${e.status}).`);
        }
      } else {
        Alert.alert('Sem conexão', 'O checklist continua. A análise espera.');
      }
    } finally {
      setEnviando(false);
    }
  }, [texto, contexto]);

  const aceitarRec = useCallback(
    async (rec: Recomendacao) => {
      let tarefaCriadaId: number | null = null;
      let tarefaPausadaId: number | null = null;
      let motivoRecusa: string | null = null;
      if (rec.pausarTarefa) {
        try {
          await inativarTarefa(rec.pausarTarefa.tarefaId);
          tarefaPausadaId = rec.pausarTarefa.tarefaId;
        } catch {}
      }
      if (rec.criarTarefa) {
        const sugestao: SugestaoTarefaIA = {
          areaSlug: rec.criarTarefa.areaSlug,
          nome: rec.criarTarefa.nome,
          frequencia: rec.criarTarefa.frequencia,
          alvoCount: rec.criarTarefa.alvoCount,
          pesoSugerido: rec.criarTarefa.pesoSugerido,
          horarioSugerido: rec.criarTarefa.horarioSugerido,
          justificativa: rec.descricao,
        };
        const [todasAreas, tarefasExistentes] = await Promise.all([
          listarTodasAreas(),
          listarTarefasAtivas(),
        ]);
        const validacao = validarSugestaoTarefaIA(sugestao, {
          areasDisponiveis: todasAreas.map((a) => ({ id: a.id, slug: a.slug })),
          tarefasExistentes: tarefasExistentes as any,
        });
        if (validacao.valida) {
          const t = validacao.tarefaNormalizada;
          tarefaCriadaId = await criarTarefa({
            areaId: t.areaId,
            nome: t.nome,
            peso: t.peso,
            frequencia: t.frequencia,
            alvoCount: t.alvoCount,
            horario: t.horario,
          });
        } else {
          motivoRecusa = validacao.motivoRecusa;
        }
      }
      if (tarefaCriadaId !== null || tarefaPausadaId !== null) {
        try { await reagendarTudo(); } catch {}
      }
      await inserirEvento({
        tipo: 'suggestion_accepted',
        source: 'app',
        payload: {
          recomendacaoId: rec.id, tipo: rec.tipo, descricao: rec.descricao,
          fonteEventId: resp?.eventId, tarefaCriadaId, tarefaPausadaId,
          tarefaRecusadaPor: motivoRecusa,
        },
      });
      setStatusRec((s) => ({ ...s, [rec.id]: 'aceita' }));
      if (motivoRecusa) {
        Alert.alert('Sugestão aceita, tarefa não criada',
          `Não consegui criar tarefa automática (${motivoRecusa}). A intenção ficou registrada.`);
      }
    },
    [resp]
  );

  const recusarRec = useCallback(
    async (rec: Recomendacao) => {
      await inserirEvento({
        tipo: 'suggestion_rejected',
        source: 'app',
        payload: {
          recomendacaoId: rec.id, tipo: rec.tipo,
          descricao: rec.descricao, fonteEventId: resp?.eventId,
        },
      });
      setStatusRec((s) => ({ ...s, [rec.id]: 'recusada' }));
    },
    [resp]
  );

  function recomecar() {
    setResp(null);
    setTexto('');
    setStatusRec({});
    setEditandoTexto(false);
  }

  // Estado visual do orb baseado no que tá rolando
  const estadoOrb: EstadoOrb = recState.isRecording
    ? 'gravando'
    : transcrevendo || enviando
    ? 'processando'
    : 'idle';

  const labelOrb = recState.isRecording
    ? `Gravando ${formatarDuracao(recState.durationMillis)}`
    : transcrevendo
    ? 'Transcrevendo…'
    : enviando
    ? 'Analisando…'
    : texto.trim().length > 0
    ? 'Segure pra gravar mais'
    : 'Segure pra falar';

  const subLabelOrb = recState.isRecording
    ? 'Solte pra parar'
    : transcrevendo
    ? null
    : enviando
    ? null
    : texto.trim().length > 0
    ? null
    : 'Conte como foi seu dia, peça um plano, corrija uma rotina.';

  const ocupado = recState.isRecording || transcrevendo || enviando;

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <SafeAreaView style={styles.bg} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <PageHeader kicker="AJUSTAR ROTA" title="Fala a verdade" />

          {!resp && (
            <>
              <View style={styles.orbWrap}>
                <Pressable
                  onPressIn={iniciarGravacao}
                  onPressOut={pararGravacao}
                  disabled={transcrevendo || enviando}
                  style={({ pressed }) => [styles.orbPress, pressed && { transform: [{ scale: 0.97 }] }]}
                  hitSlop={20}
                  delayLongPress={9999}
                >
                  <OrbVoz size={170} estado={estadoOrb} amplitude={amplitude} />
                </Pressable>
                <Text style={styles.convite}>{labelOrb}</Text>
                {subLabelOrb && <Text style={styles.subConvite}>{subLabelOrb}</Text>}
              </View>

              {texto.trim().length > 0 && !recState.isRecording && (
                <View style={styles.relatoBloco}>
                  <View style={styles.relatoCabecalho}>
                    <Text style={styles.kicker}>O QUE VOCÊ FALOU</Text>
                    <Pressable
                      onPress={() => setEditandoTexto((v) => !v)}
                      hitSlop={8}
                      style={({ pressed }) => [styles.btnIcone, pressed && { opacity: 0.55 }]}
                    >
                      <Ionicons
                        name={editandoTexto ? 'checkmark' : 'create-outline'}
                        size={16}
                        color={tema.weak}
                      />
                    </Pressable>
                  </View>
                  {editandoTexto ? (
                    <TextInput
                      style={styles.textarea}
                      multiline
                      value={texto}
                      onChangeText={setTexto}
                      autoFocus
                      textAlignVertical="top"
                      editable={!ocupado}
                    />
                  ) : (
                    <Text style={styles.relatoTxt}>{texto}</Text>
                  )}
                  <Pressable
                    style={[styles.botao, (ocupado || texto.trim().length < 20) && { opacity: 0.5 }]}
                    onPress={enviar}
                    disabled={ocupado || texto.trim().length < 20}
                  >
                    {enviando ? (
                      <ActivityIndicator color={tema.acentoTexto} />
                    ) : (
                      <Text style={styles.botaoTxt}>Enviar</Text>
                    )}
                  </Pressable>
                </View>
              )}

              <Text style={styles.aviso}>A IA não cria nem altera tarefa sem sua confirmação.</Text>
            </>
          )}

          {resp && (
            <>
              {resp.episodioErroPersistencia && (
                <View style={[styles.bloco, { borderColor: tema.perigo, borderWidth: 1 }]}>
                  <Text style={styles.kicker}>FALHA AO SALVAR EPISÓDIO</Text>
                  <Text selectable style={{ color: tema.perigo, fontSize: 12, lineHeight: 17 }}>
                    {resp.episodioErroPersistencia}
                  </Text>
                </View>
              )}

              {resp.extracao.eventosClassificados.length > 0 && (
                <View style={styles.bloco}>
                  <Text style={styles.kicker}>LEITURA DIRETA</Text>
                  {resp.extracao.eventosClassificados.map((e, i) => (
                    <View key={i} style={styles.evento}>
                      <View style={styles.eventoCabecalho}>
                        <Text style={styles.eventoTipo}>{TIPO_EVT_LABEL[e.tipo].toUpperCase()}</Text>
                        <View style={styles.confiancaPill}>
                          <Text style={styles.confiancaPillTxt}>{e.confianca}</Text>
                        </View>
                      </View>
                      <Text style={styles.eventoDesc}>{e.descricao}</Text>
                    </View>
                  ))}
                </View>
              )}

              {resp.extracao.impactoAreas.length > 0 && (
                <View style={styles.bloco}>
                  <Text style={styles.kicker}>O QUE ISSO AFETA</Text>
                  {resp.extracao.impactoAreas.map((ia, i) => {
                    const paleta = paletaArea(ia.areaSlug);
                    const nome = AREA_NOME_LABEL[ia.areaSlug] ?? ia.areaSlug;
                    return (
                      <View key={i} style={styles.impactoLinha}>
                        <View style={[styles.impactoBarra, { backgroundColor: paleta.ink }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.impactoArea}>{nome.toUpperCase()}</Text>
                          <Text style={styles.impactoEfeito}>{ia.efeito}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {resp.episodiosLembrados && resp.episodiosLembrados.length > 0 && (
                <View style={styles.bloco}>
                  <Text style={styles.kicker}>EU LEMBREI DISSO</Text>
                  <Text style={styles.notaFato}>
                    Já passou algo parecido. Quanto mais episódios similares, mais o padrão se confirma.
                  </Text>
                  {resp.episodiosLembrados.map((ep) => (
                    <View key={ep.id} style={styles.lembrancaCard}>
                      <View style={styles.eventoCabecalho}>
                        <Text style={styles.lembrancaData}>
                          {format(parseISO(ep.occurredAt), "d 'de' MMM", { locale: ptBR })}
                        </Text>
                        <View style={styles.confiancaPill}>
                          <Text style={styles.confiancaPillTxt}>
                            {Math.round(ep.similaridade * 100)}% similar
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.lembrancaTitulo}>{ep.titulo}</Text>
                      <Text style={styles.lembrancaResumo}>{ep.resumo}</Text>
                    </View>
                  ))}
                </View>
              )}

              {resp.extracao.fatosCandidatos.length > 0 && (
                <View style={styles.bloco}>
                  <Text style={styles.kicker}>FATOS APRENDIDOS</Text>
                  {resp.extracao.fatosCandidatos.map((f, i) => (
                    <View key={i} style={styles.fato}>
                      <View style={styles.eventoCabecalho}>
                        <Text style={styles.fatoCategoria}>
                          {(CATEGORIA_LABEL[f.categoria] ?? f.categoria).toUpperCase()}
                        </Text>
                        <View style={styles.confiancaPill}>
                          <Text style={styles.confiancaPillTxt}>{f.confianca}</Text>
                        </View>
                      </View>
                      <Text style={styles.fatoValor}>{f.valor}</Text>
                    </View>
                  ))}
                </View>
              )}

              {resp.extracao.episodio && (
                <View style={styles.bloco}>
                  <Text style={styles.kicker}>EPISÓDIO</Text>
                  <Text style={styles.episodioTitulo}>{resp.extracao.episodio.titulo}</Text>
                  <Text style={styles.episodioResumo}>{resp.extracao.episodio.resumo}</Text>
                </View>
              )}

              {resp.cuidado && (
                <View style={styles.cuidadoBloco}>
                  <Text style={styles.cuidadoTitulo}>{resp.cuidado.titulo}</Text>
                  <Text style={styles.cuidadoDescricao}>{resp.cuidado.descricao}</Text>
                </View>
              )}

              {!resp.cuidado && resp.recomendacoes.length > 0 && (
                <View style={styles.bloco}>
                  <Text style={styles.kicker}>AJUSTES SUGERIDOS</Text>
                  {resp.recomendacoes.map((rec) => {
                    const status = statusRec[rec.id] ?? 'pendente';
                    const t = rec.criarTarefa;
                    return (
                      <View key={rec.id} style={styles.recCard}>
                        <Text style={styles.recTipo}>{TIPO_REC_LABEL[rec.tipo]}</Text>
                        <Text style={styles.recDesc}>{rec.descricao}</Text>

                        {rec.pausarTarefa && (
                          <View style={[styles.tarefaPrev, styles.tarefaPrevPausar]}>
                            <Text style={styles.tarefaPrevKicker}>VAI PAUSAR</Text>
                            <Text style={styles.tarefaPrevNome}>{rec.pausarTarefa.nome}</Text>
                            <Text style={styles.tarefaPrevMeta}>{rec.pausarTarefa.motivo}</Text>
                          </View>
                        )}

                        {t && (
                          <View style={styles.tarefaPrev}>
                            <Text style={styles.tarefaPrevKicker}>VAI VIRAR TAREFA</Text>
                            <Text style={styles.tarefaPrevNome}>{t.nome}</Text>
                            <Text style={styles.tarefaPrevMeta}>
                              {(CATEGORIA_LABEL[t.areaSlug] ?? t.areaSlug)} ·{' '}
                              {FREQ_LABEL[t.frequencia]}
                              {t.alvoCount > 1 && t.frequencia !== 'diaria'
                                ? ` ${t.alvoCount}x`
                                : ''}
                              {t.horarioSugerido ? ` · ${t.horarioSugerido}` : ''}
                            </Text>
                          </View>
                        )}

                        {status === 'pendente' && (
                          <View style={styles.recBtns}>
                            <Pressable
                              style={[styles.btnSec, styles.btnRecusar]}
                              onPress={() => recusarRec(rec)}
                            >
                              <Text style={styles.btnRecusarTxt}>Recusar</Text>
                            </Pressable>
                            <Pressable
                              style={[styles.btnSec, styles.btnAceitar]}
                              onPress={() => aceitarRec(rec)}
                            >
                              <Text style={styles.btnAceitarTxt}>
                                {t && rec.pausarTarefa
                                  ? 'Aceitar (substituir tarefa)'
                                  : t
                                  ? 'Aceitar e criar tarefa'
                                  : rec.pausarTarefa
                                  ? 'Aceitar e pausar'
                                  : 'Aceitar'}
                              </Text>
                            </Pressable>
                          </View>
                        )}
                        {status === 'aceita' && (
                          <Text style={styles.tagAceita}>
                            {t && rec.pausarTarefa
                              ? 'Aceito. Tarefa substituída.'
                              : t
                              ? 'Aceito. Tarefa criada.'
                              : rec.pausarTarefa
                              ? 'Aceito. Tarefa pausada.'
                              : 'Aceito.'}
                          </Text>
                        )}
                        {status === 'recusada' && <Text style={styles.tagRecusada}>Recusado.</Text>}
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={styles.rodapeBtns}>
                <Pressable style={[styles.btnSec, styles.btnRecusar]} onPress={recomecar}>
                  <Text style={styles.btnRecusarTxt}>Falar de novo</Text>
                </Pressable>
                <Pressable style={[styles.btnSec, styles.btnAceitar]} onPress={() => router.back()}>
                  <Text style={styles.btnAceitarTxt}>Voltar</Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { paddingBottom: 80 },
  orbWrap: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
    gap: 12,
    paddingHorizontal: 24,
  },
  orbPress: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  convite: {
    marginTop: 8,
    fontSize: 20,
    fontFamily: tema.fontFamily.display,
    color: tema.ink,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subConvite: {
    fontSize: 13,
    color: tema.textoFraco,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 20,
  },
  relatoBloco: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: tema.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
  },
  relatoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  btnIcone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatoTxt: {
    color: tema.texto,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  textarea: {
    minHeight: 120,
    color: tema.texto,
    fontSize: 15,
    lineHeight: 22,
    backgroundColor: tema.bgInput,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  botao: {
    backgroundColor: tema.acento,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botaoTxt: {
    color: tema.acentoTexto,
    fontFamily: tema.fontFamily.textBold,
    fontSize: 15,
  },
  aviso: {
    paddingHorizontal: 24,
    marginTop: 20,
    fontSize: 12,
    color: tema.textoFraco,
    textAlign: 'center',
  },
  bloco: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: tema.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
  },
  kicker: {
    fontSize: 11,
    fontFamily: tema.fontFamily.textBold,
    letterSpacing: 1.2,
    color: tema.textoFraco,
    marginBottom: 10,
  },
  evento: { marginBottom: 12 },
  eventoCabecalho: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4,
  },
  eventoTipo: {
    color: tema.textoFraco, fontSize: 11,
    fontFamily: tema.fontFamily.textBold, letterSpacing: 1.0,
  },
  fatoCategoria: {
    color: tema.textoFraco, fontSize: 11,
    fontFamily: tema.fontFamily.textBold, letterSpacing: 1.0,
  },
  confiancaPill: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999,
    backgroundColor: tema.bgInput,
    borderWidth: StyleSheet.hairlineWidth, borderColor: tema.borda,
  },
  confiancaPillTxt: {
    color: tema.textoFraco, fontSize: 10,
    fontFamily: tema.fontFamily.textSemi, letterSpacing: 0.4,
  },
  eventoDesc: { color: tema.texto, fontSize: 14, lineHeight: 19 },
  fato: {
    backgroundColor: tema.bg, padding: 12, borderRadius: 10, marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth, borderColor: tema.borda,
  },
  fatoValor: { color: tema.texto, fontSize: 14, lineHeight: 20, marginTop: 2 },
  notaFato: {
    color: tema.textoFraco, fontSize: 11, marginTop: 4,
    marginBottom: 8, fontStyle: 'italic',
  },
  episodioTitulo: {
    color: tema.texto, fontSize: 15,
    fontFamily: tema.fontFamily.textBold, marginBottom: 4,
  },
  episodioResumo: { color: tema.texto, fontSize: 14, lineHeight: 20 },
  lembrancaCard: {
    backgroundColor: tema.bgInput, padding: 12, borderRadius: 12, marginTop: 10,
    borderLeftWidth: 3, borderLeftColor: tema.acento,
  },
  lembrancaData: {
    color: tema.textoFraco, fontSize: 11,
    fontFamily: tema.fontFamily.textBold, letterSpacing: 1,
    textTransform: 'uppercase',
  },
  lembrancaTitulo: {
    color: tema.texto, fontSize: 14,
    fontFamily: tema.fontFamily.textBold, marginTop: 6, marginBottom: 3,
  },
  lembrancaResumo: { color: tema.textoFraco, fontSize: 13, lineHeight: 18 },
  recCard: {
    backgroundColor: tema.bg, padding: 12, borderRadius: 12, marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth, borderColor: tema.borda,
  },
  recTipo: {
    color: tema.textoFraco, fontSize: 11,
    fontFamily: tema.fontFamily.textBold, letterSpacing: 0.6, marginBottom: 4,
  },
  recDesc: { color: tema.texto, fontSize: 14, lineHeight: 20, marginBottom: 10 },
  tarefaPrev: {
    backgroundColor: tema.bgCard, borderRadius: 10, padding: 10, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: tema.acento,
  },
  tarefaPrevPausar: { borderLeftColor: tema.alerta },
  tarefaPrevKicker: {
    color: tema.textoFraco, fontSize: 10,
    fontFamily: tema.fontFamily.textBold, letterSpacing: 0.8, marginBottom: 3,
  },
  tarefaPrevNome: {
    color: tema.texto, fontSize: 14,
    fontFamily: tema.fontFamily.textSemi,
  },
  tarefaPrevMeta: { color: tema.textoFraco, fontSize: 12, marginTop: 2 },
  recBtns: { flexDirection: 'row', gap: 8 },
  btnSec: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  btnAceitar: { backgroundColor: tema.acento },
  btnRecusar: { borderWidth: 1, borderColor: tema.bordaForte },
  btnAceitarTxt: {
    color: tema.acentoTexto, fontFamily: tema.fontFamily.textBold, fontSize: 14,
  },
  btnRecusarTxt: {
    color: tema.texto, fontFamily: tema.fontFamily.textSemi, fontSize: 14,
  },
  tagAceita: { color: tema.sucesso, fontSize: 12, fontFamily: tema.fontFamily.textBold },
  tagRecusada: { color: tema.textoFraco, fontSize: 12 },
  impactoLinha: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8,
  },
  impactoBarra: { width: 4, minHeight: 32, borderRadius: 2, marginTop: 2 },
  impactoArea: {
    color: tema.textoFraco, fontSize: 11,
    fontFamily: tema.fontFamily.textBold, letterSpacing: 0.8, marginBottom: 2,
  },
  impactoEfeito: { color: tema.texto, fontSize: 13, lineHeight: 18 },
  cuidadoBloco: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: tema.bgSoft, borderRadius: 16, padding: 18,
    borderWidth: StyleSheet.hairlineWidth, borderColor: tema.borda,
  },
  cuidadoTitulo: {
    color: tema.texto, fontSize: 17,
    fontFamily: tema.fontFamily.textBold, marginBottom: 8,
  },
  cuidadoDescricao: { color: tema.texto, fontSize: 14, lineHeight: 21 },
  rodapeBtns: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 24,
  },
});
