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
import {
  criarTarefa,
  inativarTarefa,
  atualizarTarefa,
  buscarTarefaPorId,
  listarTarefasAtivas,
} from '../../src/db/queries/tarefas';
import { listarTodasAreas } from '../../src/db/queries/areas';
import { getUser } from '../../src/db/queries/users';
import { validarSugestaoTarefaIA, type SugestaoTarefaIA } from '../../src/domain/sugestoes';
import { reagendarTudo } from '../../src/lib/agendarNotificacoesTarefas';
import type { Intensidade } from '../../src/domain/intensidade';

type CriarTarefaPayload = {
  areaSlug: string;
  nome: string;
  frequencia: 'diaria' | 'semanal' | 'mensal';
  alvoCount: number;
  pesoSugerido: 1 | 2 | 3;
  horarioSugerido: string | null;
};
type PausarTarefaPayload = {
  tarefaId: number;
  nome: string;
  motivo: string;
};
type MudarTarefaPayload = {
  tarefaId: number;
  nome: string;
  novoHorario: string | null;
  novoAlvoCount: number | null;
  motivo: string;
};

type Ajuste = {
  id: string;
  tipo:
    | 'pausar_tarefa'
    | 'criar_tarefa'
    | 'mudar_horario'
    | 'reduzir_frequencia'
    | 'aumentar_frequencia'
    | 'priorizar_area'
    | 'plano_minimo';
  descricao: string;
  pausarTarefa: PausarTarefaPayload | null;
  criarTarefa: CriarTarefaPayload | null;
  mudarTarefa: MudarTarefaPayload | null;
  justificativa: string;
};

type RespostaPlanoSemanal = {
  eventId: string;
  plano: {
    resumo7d: string;
    leituraDosDados: {
      intensidade: Intensidade;
      areasFortes: string[];
      areasNegligenciadas: string[];
      tarefasMaisFalhadas: string[];
      diasMaisFracos: string[];
    };
    causaProvavel: string;
    intencaoSemana: string;
    ajustes: Ajuste[];
    inegociaveisDaSemana: string[];
    mensagemFinal: string;
  };
};

const TIPO_LABEL: Record<Ajuste['tipo'], string> = {
  pausar_tarefa: 'Pausar tarefa',
  criar_tarefa: 'Criar tarefa',
  mudar_horario: 'Mudar horário',
  reduzir_frequencia: 'Reduzir frequência',
  aumentar_frequencia: 'Aumentar frequência',
  priorizar_area: 'Priorizar área',
  plano_minimo: 'Plano mínimo',
};

const FREQ_LABEL: Record<'diaria' | 'semanal' | 'mensal', string> = {
  diaria: 'diária',
  semanal: 'semanal',
  mensal: 'mensal',
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

const INTENSIDADE_LABEL: Record<Intensidade, string> = {
  leve: 'leve',
  moderada: 'moderada',
  intensa: 'intensa',
  desorganizada: 'desorganizada',
};

export default function PlanoSemanal() {
  const router = useRouter();
  const [intencao, setIntencao] = useState('');
  const [carregandoCtx, setCarregandoCtx] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [plano, setPlano] = useState<RespostaPlanoSemanal | null>(null);
  const [statusAjuste, setStatusAjuste] = useState<
    Record<string, 'pendente' | 'aceito' | 'recusado'>
  >({});
  const [contexto, setContexto] = useState<any>(null);

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
      setCarregandoCtx(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const gerar = useCallback(async () => {
    if (!contexto) return;
    setGerando(true);
    try {
      const r = await api.post<RespostaPlanoSemanal>('/ai/weekly-plan', {
        intencaoDeclarada: intencao.trim() || undefined,
        contextoDados: contexto,
      });
      setPlano(r);
      const inicial: Record<string, 'pendente'> = {};
      for (const a of r.plano.ajustes) inicial[a.id] = 'pendente';
      setStatusAjuste(inicial);
    } catch (e) {
      if (e instanceof ApiError) {
        const p = (e.payload ?? {}) as Record<string, unknown>;
        if (e.status === 429 && p.error === 'rate_limited') {
          const reset = new Date(String(p.resetEm)).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          });
          Alert.alert('Limite atingido', `Volta às ${reset}.`);
        } else if (e.status === 502) {
          Alert.alert('Falha na IA', 'Tente em instantes.');
        } else {
          Alert.alert('Erro', `status ${e.status}`);
        }
      } else {
        Alert.alert('Sem conexão', 'O checklist continua. O plano espera.');
      }
    } finally {
      setGerando(false);
    }
  }, [contexto, intencao]);

  const aceitarAjuste = useCallback(
    async (a: Ajuste) => {
      let acoes = 0;

      // 1. Pausar
      if (a.pausarTarefa) {
        try {
          await inativarTarefa(a.pausarTarefa.tarefaId);
          acoes++;
        } catch {}
      }

      // 2. Mudar (precisa buscar tarefa pra preservar campos)
      if (a.mudarTarefa) {
        try {
          const existente = await buscarTarefaPorId(a.mudarTarefa.tarefaId);
          if (existente) {
            await atualizarTarefa(existente.id, {
              nome: existente.nome,
              peso: existente.peso,
              frequencia: existente.frequencia,
              alvoCount: a.mudarTarefa.novoAlvoCount ?? existente.alvo_count,
              horario:
                a.mudarTarefa.novoHorario !== null
                  ? a.mudarTarefa.novoHorario
                  : existente.horario,
            });
            acoes++;
          }
        } catch {}
      }

      // 3. Criar (validando)
      if (a.criarTarefa) {
        try {
          const sugestao: SugestaoTarefaIA = {
            areaSlug: a.criarTarefa.areaSlug,
            nome: a.criarTarefa.nome,
            frequencia: a.criarTarefa.frequencia,
            alvoCount: a.criarTarefa.alvoCount,
            pesoSugerido: a.criarTarefa.pesoSugerido,
            horarioSugerido: a.criarTarefa.horarioSugerido,
            justificativa: a.justificativa,
          };
          const [todasAreas, tarefasExistentes] = await Promise.all([
            listarTodasAreas(),
            listarTarefasAtivas(),
          ]);
          const validacao = validarSugestaoTarefaIA(sugestao, {
            areasDisponiveis: todasAreas.map((x) => ({ id: x.id, slug: x.slug })),
            tarefasExistentes: tarefasExistentes as any,
          });
          if (validacao.valida) {
            const t = validacao.tarefaNormalizada;
            await criarTarefa({
              areaId: t.areaId,
              nome: t.nome,
              peso: t.peso,
              frequencia: t.frequencia,
              alvoCount: t.alvoCount,
              horario: t.horario,
            });
            acoes++;
          }
        } catch {}
      }

      if (acoes > 0) {
        try {
          await reagendarTudo();
        } catch {}
      }

      await inserirEvento({
        tipo: 'suggestion_accepted',
        source: 'app',
        payload: {
          recomendacaoId: a.id,
          tipo: a.tipo,
          descricao: a.descricao,
          fonteEventId: plano?.eventId,
          origem: 'weekly_plan',
          acoes,
        },
      });
      setStatusAjuste((s) => ({ ...s, [a.id]: 'aceito' }));
    },
    [plano]
  );

  const recusarAjuste = useCallback(
    async (a: Ajuste) => {
      await inserirEvento({
        tipo: 'suggestion_rejected',
        source: 'app',
        payload: {
          recomendacaoId: a.id,
          tipo: a.tipo,
          descricao: a.descricao,
          fonteEventId: plano?.eventId,
          origem: 'weekly_plan',
        },
      });
      setStatusAjuste((s) => ({ ...s, [a.id]: 'recusado' }));
    },
    [plano]
  );

  if (carregandoCtx) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <SafeAreaView style={styles.bg} edges={['top']}>
          <ActivityIndicator color={tema.texto} style={{ marginTop: 60 }} />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <SafeAreaView style={styles.bg} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <PageHeader kicker="AJUSTAR — PLANO" title="Plano da semana" />
          <Text style={styles.sub}>
            Cruza dados de 7 dias, fatos aprendidos e o que você aceitou/recusou. Propõe a próxima semana.
          </Text>

          {!plano && (
            <>
              <View style={styles.bloco}>
                <Text style={styles.kicker}>INTENÇÃO (OPCIONAL)</Text>
                <Text style={styles.dica}>
                  O que você quer priorizar? Se deixar em branco, a IA decide pelos dados.
                </Text>
                <TextInput
                  style={styles.textarea}
                  multiline
                  placeholder="Ex: Reconectar com a família. Treino entra em manutenção."
                  placeholderTextColor={tema.textoFraco}
                  value={intencao}
                  onChangeText={setIntencao}
                  textAlignVertical="top"
                  editable={!gerando}
                />
              </View>

              <Pressable
                style={[styles.botao, gerando && { opacity: 0.6 }]}
                onPress={gerar}
                disabled={gerando}
              >
                {gerando ? (
                  <ActivityIndicator color="#F5F1E5" />
                ) : (
                  <Text style={styles.botaoTxt}>Gerar plano</Text>
                )}
              </Pressable>
              <Text style={styles.aviso}>
                Cada ajuste exige sua confirmação. Nada vira tarefa sem você aceitar.
              </Text>
            </>
          )}

          {plano && (
            <>
              <View style={styles.bloco}>
                <Text style={styles.kicker}>RESUMO 7 DIAS</Text>
                <Text style={styles.paragrafo}>{plano.plano.resumo7d}</Text>
              </View>

              <View style={styles.bloco}>
                <Text style={styles.kicker}>LEITURA</Text>
                <View style={styles.tagsLinha}>
                  <View style={styles.tag}>
                    <Text style={styles.tagTxt}>
                      intensidade {INTENSIDADE_LABEL[plano.plano.leituraDosDados.intensidade]}
                    </Text>
                  </View>
                </View>
                {plano.plano.leituraDosDados.areasNegligenciadas.length > 0 && (
                  <Text style={styles.linha}>
                    <Text style={styles.linhaKicker}>Áreas negligenciadas: </Text>
                    {plano.plano.leituraDosDados.areasNegligenciadas
                      .map((s) => CATEGORIA_LABEL[s] ?? s)
                      .join(', ')}
                  </Text>
                )}
                {plano.plano.leituraDosDados.areasFortes.length > 0 && (
                  <Text style={styles.linha}>
                    <Text style={styles.linhaKicker}>Áreas fortes: </Text>
                    {plano.plano.leituraDosDados.areasFortes
                      .map((s) => CATEGORIA_LABEL[s] ?? s)
                      .join(', ')}
                  </Text>
                )}
                {plano.plano.leituraDosDados.tarefasMaisFalhadas.length > 0 && (
                  <Text style={styles.linha}>
                    <Text style={styles.linhaKicker}>Tarefas mais falhadas: </Text>
                    {plano.plano.leituraDosDados.tarefasMaisFalhadas.join(', ')}
                  </Text>
                )}
                {plano.plano.leituraDosDados.diasMaisFracos.length > 0 && (
                  <Text style={styles.linha}>
                    <Text style={styles.linhaKicker}>Dias mais fracos: </Text>
                    {plano.plano.leituraDosDados.diasMaisFracos.join(', ')}
                  </Text>
                )}
              </View>

              <View style={styles.bloco}>
                <Text style={styles.kicker}>CAUSA PROVÁVEL</Text>
                <Text style={styles.paragrafo}>{plano.plano.causaProvavel}</Text>
              </View>

              <View style={styles.intencaoBloco}>
                <Text style={styles.intencaoKicker}>INTENÇÃO DA SEMANA</Text>
                <Text style={styles.intencaoTxt}>{plano.plano.intencaoSemana}</Text>
              </View>

              {plano.plano.ajustes.length > 0 && (
                <View style={styles.bloco}>
                  <Text style={styles.kicker}>AJUSTES</Text>
                  {plano.plano.ajustes.map((a) => {
                    const status = statusAjuste[a.id] ?? 'pendente';
                    return (
                      <View key={a.id} style={styles.ajusteCard}>
                        <Text style={styles.ajusteTipo}>{TIPO_LABEL[a.tipo]}</Text>
                        <Text style={styles.ajusteDesc}>{a.descricao}</Text>

                        {a.pausarTarefa && (
                          <View style={[styles.opPrev, styles.opPrevPausar]}>
                            <Text style={styles.opPrevKicker}>VAI PAUSAR</Text>
                            <Text style={styles.opPrevNome}>{a.pausarTarefa.nome}</Text>
                            <Text style={styles.opPrevMeta}>{a.pausarTarefa.motivo}</Text>
                          </View>
                        )}
                        {a.mudarTarefa && (
                          <View style={[styles.opPrev, styles.opPrevMudar]}>
                            <Text style={styles.opPrevKicker}>VAI MUDAR</Text>
                            <Text style={styles.opPrevNome}>{a.mudarTarefa.nome}</Text>
                            <Text style={styles.opPrevMeta}>
                              {a.mudarTarefa.novoHorario
                                ? `novo horário: ${a.mudarTarefa.novoHorario}`
                                : ''}
                              {a.mudarTarefa.novoHorario && a.mudarTarefa.novoAlvoCount
                                ? ' · '
                                : ''}
                              {a.mudarTarefa.novoAlvoCount
                                ? `nova frequência: ${a.mudarTarefa.novoAlvoCount}x`
                                : ''}
                            </Text>
                          </View>
                        )}
                        {a.criarTarefa && (
                          <View style={[styles.opPrev, styles.opPrevCriar]}>
                            <Text style={styles.opPrevKicker}>VAI CRIAR</Text>
                            <Text style={styles.opPrevNome}>{a.criarTarefa.nome}</Text>
                            <Text style={styles.opPrevMeta}>
                              {(CATEGORIA_LABEL[a.criarTarefa.areaSlug] ??
                                a.criarTarefa.areaSlug)}{' '}
                              · {FREQ_LABEL[a.criarTarefa.frequencia]}
                              {a.criarTarefa.alvoCount > 1 &&
                              a.criarTarefa.frequencia !== 'diaria'
                                ? ` ${a.criarTarefa.alvoCount}x`
                                : ''}
                              {a.criarTarefa.horarioSugerido
                                ? ` · ${a.criarTarefa.horarioSugerido}`
                                : ''}
                            </Text>
                          </View>
                        )}

                        <Text style={styles.justif}>{a.justificativa}</Text>

                        {status === 'pendente' && (
                          <View style={styles.btns}>
                            <Pressable
                              style={[styles.btnSec, styles.btnRecusar]}
                              onPress={() => recusarAjuste(a)}
                            >
                              <Text style={styles.btnRecusarTxt}>Recusar</Text>
                            </Pressable>
                            <Pressable
                              style={[styles.btnSec, styles.btnAceitar]}
                              onPress={() => aceitarAjuste(a)}
                            >
                              <Text style={styles.btnAceitarTxt}>Aceitar</Text>
                            </Pressable>
                          </View>
                        )}
                        {status === 'aceito' && (
                          <Text style={styles.tagAceita}>Aplicado.</Text>
                        )}
                        {status === 'recusado' && (
                          <Text style={styles.tagRecusada}>Recusado.</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {plano.plano.inegociaveisDaSemana.length > 0 && (
                <View style={styles.bloco}>
                  <Text style={styles.kicker}>INEGOCIÁVEIS DA SEMANA</Text>
                  <View style={styles.tagsLinha}>
                    {plano.plano.inegociaveisDaSemana.map((i, idx) => (
                      <View key={idx} style={styles.tagInegociavel}>
                        <Text style={styles.tagInegociavelTxt}>{i}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.mensagemBloco}>
                <Text style={styles.mensagemTxt}>{plano.plano.mensagemFinal}</Text>
              </View>

              <Pressable
                style={styles.botaoRegerar}
                onPress={() => {
                  setPlano(null);
                  setStatusAjuste({});
                }}
              >
                <Text style={styles.botaoRegerarTxt}>Regerar plano</Text>
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
  container: { paddingBottom: 100 },
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
  paragrafo: { color: tema.texto, fontSize: 15, lineHeight: 21 },
  linha: { color: tema.texto, fontSize: 13, lineHeight: 19, marginTop: 4 },
  linhaKicker: { color: tema.textoFraco, fontFamily: tema.fontFamily.textSemi },
  dica: { color: tema.textoFraco, fontSize: 12, lineHeight: 17, marginBottom: 8 },
  textarea: {
    minHeight: 80,
    color: tema.texto,
    fontSize: 15,
    lineHeight: 20,
    backgroundColor: tema.bgInput,
    borderRadius: 12,
    padding: 12,
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
  tagsLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: tema.bgInput,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
  },
  tagTxt: {
    color: tema.textoFraco,
    fontSize: 11,
    fontFamily: tema.fontFamily.textSemi,
    letterSpacing: 0.4,
  },
  intencaoBloco: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: tema.acento,
    borderRadius: 16,
    padding: 18,
  },
  intencaoKicker: {
    color: 'rgba(245,241,229,0.7)',
    fontSize: 11,
    fontFamily: tema.fontFamily.textBold,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  intencaoTxt: {
    color: '#F5F1E5',
    fontSize: 17,
    lineHeight: 23,
    fontFamily: tema.fontFamily.textBold,
  },
  ajusteCard: {
    backgroundColor: tema.bg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
  },
  ajusteTipo: {
    color: tema.textoFraco,
    fontSize: 11,
    fontFamily: tema.fontFamily.textBold,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  ajusteDesc: { color: tema.texto, fontSize: 14, lineHeight: 20, marginBottom: 10 },
  opPrev: {
    backgroundColor: tema.bgCard,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: tema.acento,
  },
  opPrevPausar: { borderLeftColor: tema.alerta },
  opPrevMudar: { borderLeftColor: tema.alerta },
  opPrevCriar: { borderLeftColor: tema.acento },
  opPrevKicker: {
    color: tema.textoFraco,
    fontSize: 10,
    fontFamily: tema.fontFamily.textBold,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  opPrevNome: {
    color: tema.texto,
    fontSize: 14,
    fontFamily: tema.fontFamily.textSemi,
  },
  opPrevMeta: { color: tema.textoFraco, fontSize: 12, marginTop: 2 },
  justif: {
    color: tema.textoFraco,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  btns: { flexDirection: 'row', gap: 8 },
  btnSec: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  btnAceitar: { backgroundColor: tema.acento },
  btnRecusar: { borderWidth: 1, borderColor: tema.bordaForte },
  btnAceitarTxt: { color: '#F5F1E5', fontFamily: tema.fontFamily.textBold, fontSize: 14 },
  btnRecusarTxt: { color: tema.texto, fontFamily: tema.fontFamily.textSemi, fontSize: 14 },
  tagAceita: { color: tema.sucesso, fontSize: 12, fontFamily: tema.fontFamily.textBold },
  tagRecusada: { color: tema.textoFraco, fontSize: 12 },
  tagInegociavel: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: tema.acento,
  },
  tagInegociavelTxt: {
    color: '#F5F1E5',
    fontSize: 12,
    fontFamily: tema.fontFamily.textBold,
  },
  mensagemBloco: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: tema.bgCard,
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: tema.perigo,
  },
  mensagemTxt: { color: tema.texto, fontSize: 15, lineHeight: 22 },
  botaoRegerar: {
    marginHorizontal: 16,
    marginTop: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botaoRegerarTxt: {
    color: tema.acento,
    fontSize: 14,
    fontFamily: tema.fontFamily.textSemi,
  },
});
