import { useCallback, useEffect, useState } from 'react';
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
import { tema } from '../../src/lib/tema';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { api, ApiError } from '../../src/lib/api';
import { carregarDashboard } from '../../src/domain/agregados';
import { inserirEvento } from '../../src/db/queries/trailEvents';
import { criarTarefa } from '../../src/db/queries/tarefas';
import { listarTodasAreas } from '../../src/db/queries/areas';
import { listarTarefasAtivas } from '../../src/db/queries/tarefas';
import { validarSugestaoTarefaIA, type SugestaoTarefaIA } from '../../src/domain/sugestoes';
import { reagendarTudo } from '../../src/lib/agendarNotificacoesTarefas';

type CriarTarefaPayload = {
  areaSlug: string;
  nome: string;
  frequencia: 'diaria' | 'semanal' | 'mensal';
  alvoCount: number;
  pesoSugerido: 1 | 2 | 3;
  horarioSugerido: string | null;
};

type Recomendacao = {
  id: string;
  tipo:
    | 'plano_minimo'
    | 'mudar_horario'
    | 'reduzir_carga'
    | 'priorizar_area'
    | 'acao_reparadora'
    | 'conversa_dificil';
  descricao: string;
  exigeConfirmacao: true;
  criarTarefa: CriarTarefaPayload | null;
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

type RespostaDailyNote = {
  eventId: string;
  extracao: {
    eventosClassificados: EventoClassificado[];
    fatosCandidatos: FatoCandidato[];
    episodio: { titulo: string; resumo: string; tags: string[]; areaSlugs: string[]; importanceScore: number } | null;
    recomendacoesImediatas: Recomendacao[];
  };
  recomendacoes: Recomendacao[];
};

const TIPO_REC_LABEL: Record<Recomendacao['tipo'], string> = {
  plano_minimo: 'Plano mínimo',
  mudar_horario: 'Mudar horário',
  reduzir_carga: 'Reduzir carga',
  priorizar_area: 'Priorizar área',
  acao_reparadora: 'Ação reparadora',
  conversa_dificil: 'Conversa difícil',
};

const FREQ_LABEL: Record<'diaria' | 'semanal' | 'mensal', string> = {
  diaria: 'diária',
  semanal: 'semanal',
  mensal: 'mensal',
};

const TIPO_EVT_LABEL: Record<EventoClassificado['tipo'], string> = {
  stressor_reported: 'Estressor',
  routine_pattern: 'Padrão de rotina',
  area_neglected: 'Área negligenciada',
  preference_signal: 'Sinal de preferência',
};

const CATEGORIA_LABEL: Record<string, string> = {
  rotina: 'Rotina',
  familia: 'Família',
  trabalho: 'Trabalho',
  financas: 'Finanças',
  espiritual: 'Espiritual',
  saude_fisica: 'Saúde física',
  saude_emocional: 'Saúde emocional',
  amizades: 'Amizades',
  crescimento: 'Crescimento',
  sabedoria: 'Sabedoria',
};

export default function ContarOdia() {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resp, setResp] = useState<RespostaDailyNote | null>(null);
  const [statusRec, setStatusRec] = useState<Record<string, 'pendente' | 'aceita' | 'recusada'>>({});
  const [contexto, setContexto] = useState<{
    percentualGeral7d: number;
    areasNegligenciadas: string[];
    areasFortes: string[];
  } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const d = await carregarDashboard();
      if (!alive) return;
      const ordenadas = [...d.porArea].sort((a, b) => a.percentual7d - b.percentual7d);
      setContexto({
        percentualGeral7d: d.percentualGeral,
        areasNegligenciadas: ordenadas.slice(0, 3).map((a) => a.area.slug),
        areasFortes: ordenadas.slice(-3).map((a) => a.area.slug).reverse(),
      });
    })();
    return () => {
      alive = false;
    };
  }, []);

  const enviar = useCallback(async () => {
    const t = texto.trim();
    if (t.length < 20) {
      Alert.alert('Texto curto', 'Escreva pelo menos algumas frases honestas.');
      return;
    }
    setEnviando(true);
    try {
      const r = await api.post<RespostaDailyNote>('/ai/daily-note', {
        relato: t,
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
            hour: '2-digit',
            minute: '2-digit',
          });
          Alert.alert('Limite atingido', `Você usou o máximo desta ${p.bucket}. Volta às ${reset}.`);
        } else if (e.status === 502) {
          Alert.alert('Falha na IA', 'Tente reformular o relato ou tente novamente em instantes.');
        } else {
          Alert.alert('Erro', `Algo deu errado (status ${e.status}).`);
        }
      } else {
        Alert.alert('Sem conexão', 'O checklist continua. A análise da rota espera.');
      }
    } finally {
      setEnviando(false);
    }
  }, [texto, contexto]);

  const aceitarRec = useCallback(
    async (rec: Recomendacao) => {
      let tarefaCriadaId: number | null = null;
      let motivoRecusa: string | null = null;

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
          try {
            await reagendarTudo();
          } catch {}
        } else {
          motivoRecusa = validacao.motivoRecusa;
          // Falha na validação não bloqueia o aceite — só não cria tarefa.
          // O usuário ainda pode querer registrar que aceitou a ideia.
        }
      }

      await inserirEvento({
        tipo: 'suggestion_accepted',
        source: 'app',
        payload: {
          recomendacaoId: rec.id,
          tipo: rec.tipo,
          descricao: rec.descricao,
          fonteEventId: resp?.eventId,
          tarefaCriadaId,
          tarefaRecusadaPor: motivoRecusa,
        },
      });
      setStatusRec((s) => ({ ...s, [rec.id]: 'aceita' }));

      if (motivoRecusa) {
        Alert.alert(
          'Sugestão aceita, tarefa não criada',
          `Não consegui criar tarefa automática (${motivoRecusa}). A intenção ficou registrada.`
        );
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
          recomendacaoId: rec.id,
          tipo: rec.tipo,
          descricao: rec.descricao,
          fonteEventId: resp?.eventId,
        },
      });
      setStatusRec((s) => ({ ...s, [rec.id]: 'recusada' }));
    },
    [resp]
  );

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <SafeAreaView style={styles.bg} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <PageHeader kicker="AJUSTAR — DIÁRIO" title="Como foi seu dia" />
          <Text style={styles.sub}>
            Conte sem floreio. O que tentou, o que falhou, o que travou.
          </Text>

          {!resp && (
            <>
              <View style={styles.bloco}>
                <TextInput
                  style={styles.textarea}
                  multiline
                  placeholder="Ex: Cheguei tarde de novo, quando coloquei treino à noite eu desisti. Domingo funcionou. Família bem, mas tô deixando finanças pra depois há semanas..."
                  placeholderTextColor={tema.textoFraco}
                  value={texto}
                  onChangeText={setTexto}
                  textAlignVertical="top"
                  editable={!enviando}
                />
                <Text style={styles.contador}>{texto.trim().length} caracteres</Text>
              </View>

              <Pressable
                style={[styles.botao, enviando && { opacity: 0.6 }]}
                onPress={enviar}
                disabled={enviando}
              >
                {enviando ? (
                  <ActivityIndicator color="#F5F1E5" />
                ) : (
                  <Text style={styles.botaoTxt}>Enviar</Text>
                )}
              </Pressable>
              <Text style={styles.aviso}>
                A IA não cria nem altera tarefa sem confirmação.
              </Text>
            </>
          )}

          {resp && (
            <>
              {resp.extracao.eventosClassificados.length > 0 && (
                <View style={styles.bloco}>
                  <Text style={styles.kicker}>LEITURA DIRETA</Text>
                  {resp.extracao.eventosClassificados.map((e, i) => (
                    <View key={i} style={styles.evento}>
                      <View style={styles.eventoCabecalho}>
                        <Text style={styles.eventoTipo}>
                          {TIPO_EVT_LABEL[e.tipo].toUpperCase()}
                        </Text>
                        <View style={styles.confiancaPill}>
                          <Text style={styles.confiancaPillTxt}>{e.confianca}</Text>
                        </View>
                      </View>
                      <Text style={styles.eventoDesc}>{e.descricao}</Text>
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
                  <Text style={styles.notaFato}>
                    Você pode editar ou apagar em "O que o 1% aprendeu".
                  </Text>
                </View>
              )}

              {resp.extracao.episodio && (
                <View style={styles.bloco}>
                  <Text style={styles.kicker}>EPISÓDIO</Text>
                  <Text style={styles.episodioTitulo}>{resp.extracao.episodio.titulo}</Text>
                  <Text style={styles.episodioResumo}>{resp.extracao.episodio.resumo}</Text>
                </View>
              )}

              {resp.recomendacoes.length > 0 && (
                <View style={styles.bloco}>
                  <Text style={styles.kicker}>AJUSTES SUGERIDOS</Text>
                  {resp.recomendacoes.map((rec) => {
                    const status = statusRec[rec.id] ?? 'pendente';
                    const t = rec.criarTarefa;
                    return (
                      <View key={rec.id} style={styles.recCard}>
                        <Text style={styles.recTipo}>{TIPO_REC_LABEL[rec.tipo]}</Text>
                        <Text style={styles.recDesc}>{rec.descricao}</Text>

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
                                {t ? 'Aceitar e criar tarefa' : 'Aceitar'}
                              </Text>
                            </Pressable>
                          </View>
                        )}
                        {status === 'aceita' && (
                          <Text style={styles.tagAceita}>
                            {t ? 'Aceito. Tarefa criada.' : 'Aceito.'}
                          </Text>
                        )}
                        {status === 'recusada' && (
                          <Text style={styles.tagRecusada}>Recusado.</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              <Pressable style={styles.botaoVoltar} onPress={() => router.back()}>
                <Text style={styles.botaoVoltarTxt}>Voltar</Text>
              </Pressable>
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
  sub: {
    paddingHorizontal: 24,
    color: tema.textoFraco,
    fontSize: 14,
    lineHeight: 20,
    marginTop: -4,
    marginBottom: 8,
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
  textarea: {
    minHeight: 200,
    color: tema.texto,
    fontSize: 16,
    lineHeight: 22,
    backgroundColor: tema.bgInput,
    borderRadius: 12,
    padding: 12,
  },
  contador: {
    fontSize: 11,
    color: tema.textoFraco,
    marginTop: 6,
    textAlign: 'right',
  },
  botao: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: tema.acento,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  botaoTxt: {
    color: '#F5F1E5',
    fontFamily: tema.fontFamily.textBold,
    fontSize: 16,
  },
  aviso: {
    paddingHorizontal: 24,
    marginTop: 10,
    fontSize: 12,
    color: tema.textoFraco,
    textAlign: 'center',
  },
  evento: { marginBottom: 12 },
  eventoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eventoTipo: {
    color: tema.textoFraco,
    fontSize: 11,
    fontFamily: tema.fontFamily.textBold,
    letterSpacing: 1.0,
  },
  fatoCategoria: {
    color: tema.textoFraco,
    fontSize: 11,
    fontFamily: tema.fontFamily.textBold,
    letterSpacing: 1.0,
  },
  confiancaPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: tema.bgInput,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
  },
  confiancaPillTxt: {
    color: tema.textoFraco,
    fontSize: 10,
    fontFamily: tema.fontFamily.textSemi,
    letterSpacing: 0.4,
  },
  eventoDesc: { color: tema.texto, fontSize: 14, lineHeight: 19 },
  fato: {
    backgroundColor: tema.bg,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
  },
  fatoValor: { color: tema.texto, fontSize: 14, lineHeight: 20, marginTop: 2 },
  notaFato: {
    color: tema.textoFraco,
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  episodioTitulo: {
    color: tema.texto,
    fontSize: 15,
    fontFamily: tema.fontFamily.textBold,
    marginBottom: 4,
  },
  episodioResumo: { color: tema.texto, fontSize: 14, lineHeight: 20 },
  recCard: {
    backgroundColor: tema.bg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
  },
  recTipo: {
    color: tema.textoFraco,
    fontSize: 11,
    fontFamily: tema.fontFamily.textBold,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  recDesc: { color: tema.texto, fontSize: 14, lineHeight: 20, marginBottom: 10 },
  tarefaPrev: {
    backgroundColor: tema.bgCard,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: tema.acento,
  },
  tarefaPrevKicker: {
    color: tema.textoFraco,
    fontSize: 10,
    fontFamily: tema.fontFamily.textBold,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  tarefaPrevNome: {
    color: tema.texto,
    fontSize: 14,
    fontFamily: tema.fontFamily.textSemi,
  },
  tarefaPrevMeta: {
    color: tema.textoFraco,
    fontSize: 12,
    marginTop: 2,
  },
  recBtns: { flexDirection: 'row', gap: 8 },
  btnSec: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  btnAceitar: { backgroundColor: tema.acento },
  btnRecusar: { borderWidth: 1, borderColor: tema.bordaForte },
  btnAceitarTxt: { color: '#F5F1E5', fontFamily: tema.fontFamily.textBold, fontSize: 14 },
  btnRecusarTxt: { color: tema.texto, fontFamily: tema.fontFamily.textSemi, fontSize: 14 },
  tagAceita: { color: tema.sucesso, fontSize: 12, fontFamily: tema.fontFamily.textBold },
  tagRecusada: { color: tema.textoFraco, fontSize: 12 },
  botaoVoltar: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botaoVoltarTxt: {
    color: tema.acento,
    fontSize: 14,
    fontFamily: tema.fontFamily.textSemi,
  },
});
