import { useCallback, useEffect, useMemo, useState } from 'react';
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
  payload: Record<string, any>;
};

type RespostaTrilha = { eventos: Evento[]; proximoCursor: string | null };

function rotuloDia(iso: string): string {
  const d = parseISO(iso);
  if (isToday(d)) return 'HOJE';
  if (isYesterday(d)) return 'ONTEM';
  return format(d, "EEEE, d 'de' MMM", { locale: ptBR }).toUpperCase();
}

function hora(iso: string): string {
  return format(parseISO(iso), 'HH:mm');
}

function truncar(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n).trimEnd() + '…';
}

// ─── Tipos de bloco narrativo ──────────────────────────────────────

type BlocoConversa = {
  kind: 'conversa';
  id: string;
  occurredAt: string;
  relato: string;
  episodio: { titulo: string; resumo: string } | null;
  fatosCriados: number;
  fatosReconfirmados: number;
  sugestoesAceitas: number;
  sugestoesRecusadas: number;
  sugestoesApresentadas: number;
};

type BlocoTarefas = {
  kind: 'tarefas';
  id: string;
  occurredAt: string;
  total: number;
  porStatus: { concluido: number; parcial: number; nao_feito: number; outros: number };
  amostra: { tarefaId: number | null; antes: string | null; depois: string | null; quando: string }[];
};

type BlocoPlano = {
  kind: 'plano';
  id: string;
  occurredAt: string;
  intencao: string;
  causaProvavel: string;
  intensidade: string | null;
  ajustes: number;
};

type BlocoMemoria = {
  kind: 'memoria';
  id: string;
  occurredAt: string;
  editados: number;
  apagados: number;
};

type Bloco = BlocoConversa | BlocoTarefas | BlocoPlano | BlocoMemoria;

// Constrói os blocos narrativos a partir dos eventos brutos. Mantém
// um mapa de cruzamento: cada daily_note_submitted ou weekly_plan_generated
// tem um conjunto de suggestion_presented que referenciam seu id via
// payload.fonteEventId. Os suggestion_accepted/rejected referenciam o
// recomendacaoId, que está em payload de cada presented.
function montarBlocos(eventos: Evento[]): { dia: string; blocos: Bloco[] }[] {
  // Indexa presented por fonteEventId
  const presentedPorFonte: Record<string, Evento[]> = {};
  for (const e of eventos) {
    if (e.tipo === 'suggestion_presented') {
      const fonte = String(e.payload?.fonteEventId ?? '');
      if (!fonte) continue;
      (presentedPorFonte[fonte] ||= []).push(e);
    }
  }

  // Indexa accepted/rejected por recomendacaoId
  const decisaoPorRec: Record<string, 'aceita' | 'recusada'> = {};
  for (const e of eventos) {
    if (e.tipo === 'suggestion_accepted' || e.tipo === 'suggestion_rejected') {
      const rid = String(e.payload?.recomendacaoId ?? '');
      if (!rid) continue;
      decisaoPorRec[rid] = e.tipo === 'suggestion_accepted' ? 'aceita' : 'recusada';
    }
  }

  // Agrupa por dia (yyyy-mm-dd)
  const porDia: Record<string, Bloco[]> = {};
  // Agrupadores volumosos: tarefas e memória agregam por dia
  const tarefasAgreg: Record<string, BlocoTarefas> = {};
  const memoriaAgreg: Record<string, BlocoMemoria> = {};

  for (const e of eventos) {
    const dia = e.occurredAt.slice(0, 10);

    if (e.tipo === 'daily_note_submitted') {
      const presented = presentedPorFonte[e.id] ?? [];
      let aceitas = 0, recusadas = 0;
      for (const p of presented) {
        const rid = String(p.payload?.recomendacaoId ?? '');
        const dec = decisaoPorRec[rid];
        if (dec === 'aceita') aceitas++;
        else if (dec === 'recusada') recusadas++;
      }
      const ep = e.payload?.episodio;
      const bloco: BlocoConversa = {
        kind: 'conversa',
        id: e.id,
        occurredAt: e.occurredAt,
        relato: String(e.payload?.relato ?? ''),
        episodio:
          ep && typeof ep === 'object'
            ? { titulo: String(ep.titulo ?? ''), resumo: String(ep.resumo ?? '') }
            : null,
        fatosCriados: Array.isArray(e.payload?.fatosCriados) ? e.payload.fatosCriados.length : 0,
        fatosReconfirmados: Array.isArray(e.payload?.fatosReconfirmados)
          ? e.payload.fatosReconfirmados.length
          : 0,
        sugestoesAceitas: aceitas,
        sugestoesRecusadas: recusadas,
        sugestoesApresentadas: presented.length,
      };
      (porDia[dia] ||= []).push(bloco);
      continue;
    }

    if (e.tipo === 'weekly_plan_generated') {
      const bloco: BlocoPlano = {
        kind: 'plano',
        id: e.id,
        occurredAt: e.occurredAt,
        intencao: String(e.payload?.intencaoSemana ?? 'Plano gerado.'),
        causaProvavel: String(e.payload?.causaProvavel ?? ''),
        intensidade: e.payload?.intensidade ? String(e.payload.intensidade) : null,
        ajustes: Number(e.payload?.ajustesCount ?? 0),
      };
      (porDia[dia] ||= []).push(bloco);
      continue;
    }

    if (e.tipo === 'task_status_changed') {
      let agreg = tarefasAgreg[dia];
      if (!agreg) {
        agreg = {
          kind: 'tarefas',
          id: `tarefas-${dia}`,
          occurredAt: e.occurredAt,
          total: 0,
          porStatus: { concluido: 0, parcial: 0, nao_feito: 0, outros: 0 },
          amostra: [],
        };
        tarefasAgreg[dia] = agreg;
        (porDia[dia] ||= []).push(agreg);
      }
      agreg.total++;
      const depois = e.payload?.statusDepois ? String(e.payload.statusDepois) : null;
      if (depois === 'concluido') agreg.porStatus.concluido++;
      else if (depois === 'parcial') agreg.porStatus.parcial++;
      else if (depois === 'nao_feito') agreg.porStatus.nao_feito++;
      else agreg.porStatus.outros++;
      if (agreg.amostra.length < 3) {
        agreg.amostra.push({
          tarefaId: e.tarefaId,
          antes: e.payload?.statusAntes ? String(e.payload.statusAntes) : null,
          depois,
          quando: e.occurredAt,
        });
      }
      // Mantém o horário do mais recente
      if (e.occurredAt > agreg.occurredAt) agreg.occurredAt = e.occurredAt;
      continue;
    }

    if (e.tipo === 'memory_fact_edited' || e.tipo === 'memory_fact_deleted') {
      let agreg = memoriaAgreg[dia];
      if (!agreg) {
        agreg = {
          kind: 'memoria',
          id: `memoria-${dia}`,
          occurredAt: e.occurredAt,
          editados: 0,
          apagados: 0,
        };
        memoriaAgreg[dia] = agreg;
        (porDia[dia] ||= []).push(agreg);
      }
      if (e.tipo === 'memory_fact_edited') agreg.editados++;
      else agreg.apagados++;
      if (e.occurredAt > agreg.occurredAt) agreg.occurredAt = e.occurredAt;
      continue;
    }
  }

  // Ordena blocos dentro do dia por occurredAt desc.
  return Object.entries(porDia)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([dia, blocos]) => ({
      dia,
      blocos: blocos.slice().sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1)),
    }));
}

// ─── Componentes de bloco ──────────────────────────────────────────

function CardConversa({ b }: { b: BlocoConversa }) {
  const [expandido, setExpandido] = useState(false);
  const relato = b.relato;
  const corto = truncar(relato, 180);
  const podeExpandir = relato.length > 180;

  return (
    <View style={styles.card}>
      <View style={styles.cardTopo}>
        <View style={[styles.iconeWrap, { backgroundColor: tema.bgInput }]}>
          <Ionicons name="chatbubbles-outline" size={18} color={tema.acento} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitulo}>Conversa com IA</Text>
          <Text style={styles.cardHora}>{hora(b.occurredAt)}</Text>
        </View>
      </View>

      {b.episodio?.titulo ? (
        <Text style={styles.episodioTitulo}>{b.episodio.titulo}</Text>
      ) : null}

      {relato ? (
        <Pressable onPress={() => podeExpandir && setExpandido((v) => !v)}>
          <Text style={styles.relato}>{expandido ? relato : corto}</Text>
          {podeExpandir ? (
            <Text style={styles.expandir}>{expandido ? 'recolher' : 'ler tudo'}</Text>
          ) : null}
        </Pressable>
      ) : null}

      <View style={styles.pillsLinha}>
        {b.sugestoesApresentadas > 0 ? (
          <Pill
            icone="bulb-outline"
            cor={tema.alerta}
            texto={`${b.sugestoesApresentadas} sugestão${b.sugestoesApresentadas > 1 ? 'ões' : ''}`}
          />
        ) : null}
        {b.sugestoesAceitas > 0 ? (
          <Pill icone="checkmark-done-outline" cor={tema.sucesso} texto={`${b.sugestoesAceitas} aceita${b.sugestoesAceitas > 1 ? 's' : ''}`} />
        ) : null}
        {b.sugestoesRecusadas > 0 ? (
          <Pill icone="close-outline" cor={tema.textoFraco} texto={`${b.sugestoesRecusadas} recusada${b.sugestoesRecusadas > 1 ? 's' : ''}`} />
        ) : null}
        {b.fatosCriados > 0 ? (
          <Pill icone="library-outline" cor={tema.acento} texto={`${b.fatosCriados} fato${b.fatosCriados > 1 ? 's' : ''} novo${b.fatosCriados > 1 ? 's' : ''}`} />
        ) : null}
        {b.fatosReconfirmados > 0 ? (
          <Pill icone="refresh-outline" cor={tema.textoFraco} texto={`${b.fatosReconfirmados} reconfirmado${b.fatosReconfirmados > 1 ? 's' : ''}`} />
        ) : null}
      </View>
    </View>
  );
}

function CardTarefas({ b }: { b: BlocoTarefas }) {
  const partes: string[] = [];
  if (b.porStatus.concluido) partes.push(`${b.porStatus.concluido} concluída${b.porStatus.concluido > 1 ? 's' : ''}`);
  if (b.porStatus.parcial) partes.push(`${b.porStatus.parcial} parcial`);
  if (b.porStatus.nao_feito) partes.push(`${b.porStatus.nao_feito} não feita${b.porStatus.nao_feito > 1 ? 's' : ''}`);
  if (b.porStatus.outros) partes.push(`${b.porStatus.outros} outro${b.porStatus.outros > 1 ? 's' : ''}`);

  return (
    <View style={styles.card}>
      <View style={styles.cardTopo}>
        <View style={[styles.iconeWrap, { backgroundColor: tema.bgInput }]}>
          <Ionicons name="checkmark-circle-outline" size={18} color={tema.acento} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitulo}>Tarefas marcadas ({b.total})</Text>
          <Text style={styles.cardHora}>até {hora(b.occurredAt)}</Text>
        </View>
      </View>
      <Text style={styles.relato}>{partes.join(' · ')}</Text>
    </View>
  );
}

function CardPlano({ b }: { b: BlocoPlano }) {
  return (
    <View style={[styles.card, styles.cardDestaque]}>
      <View style={styles.cardTopo}>
        <View style={[styles.iconeWrap, { backgroundColor: 'rgba(245,241,229,0.12)' }]}>
          <Ionicons name="calendar-outline" size={18} color="#F5F1E5" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitulo, styles.cardTituloDestaque]}>Plano semanal</Text>
          <Text style={[styles.cardHora, styles.cardHoraDestaque]}>{hora(b.occurredAt)}</Text>
        </View>
      </View>
      <Text style={[styles.relato, styles.relatoDestaque]}>{b.intencao}</Text>
      <View style={styles.pillsLinha}>
        {b.intensidade ? (
          <Pill icone="pulse-outline" cor="#F5F1E5" texto={b.intensidade} destaque />
        ) : null}
        {b.ajustes > 0 ? (
          <Pill icone="construct-outline" cor="#F5F1E5" texto={`${b.ajustes} ajuste${b.ajustes > 1 ? 's' : ''}`} destaque />
        ) : null}
      </View>
    </View>
  );
}

function CardMemoria({ b }: { b: BlocoMemoria }) {
  const partes: string[] = [];
  if (b.editados) partes.push(`${b.editados} editado${b.editados > 1 ? 's' : ''}`);
  if (b.apagados) partes.push(`${b.apagados} apagado${b.apagados > 1 ? 's' : ''}`);
  return (
    <View style={styles.card}>
      <View style={styles.cardTopo}>
        <View style={[styles.iconeWrap, { backgroundColor: tema.bgInput }]}>
          <Ionicons name="create-outline" size={18} color={tema.alerta} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitulo}>Memória atualizada</Text>
          <Text style={styles.cardHora}>até {hora(b.occurredAt)}</Text>
        </View>
      </View>
      <Text style={styles.relato}>{partes.join(' · ')}</Text>
    </View>
  );
}

function Pill({
  icone,
  cor,
  texto,
  destaque,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  cor: string;
  texto: string;
  destaque?: boolean;
}) {
  return (
    <View
      style={[
        styles.pill,
        destaque && { backgroundColor: 'rgba(245,241,229,0.12)', borderColor: 'transparent' },
      ]}
    >
      <Ionicons name={icone} size={12} color={cor} />
      <Text style={[styles.pillTxt, destaque && { color: '#F5F1E5' }]}>{texto}</Text>
    </View>
  );
}

// ─── Tela ──────────────────────────────────────────────────────────

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
          ? `?cursor=${encodeURIComponent(cursorAtual)}&limit=80`
          : '?limit=80';
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

  const dias = useMemo(() => montarBlocos(eventos), [eventos]);

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
            Suas conversas com a IA, tarefas marcadas, planos e o que o app aprendeu. Mais recente em cima.
          </Text>

          {carregando ? (
            <ActivityIndicator color={tema.texto} style={{ marginTop: 60 }} />
          ) : dias.length === 0 ? (
            <View style={styles.vazio}>
              <Text style={styles.vazioTxt}>
                Nada por aqui ainda. Conte um dia, marque uma tarefa ou gere um plano.
              </Text>
            </View>
          ) : (
            dias.map((g) => (
              <View key={g.dia} style={{ paddingHorizontal: 16, marginTop: 18 }}>
                <Text style={styles.kicker}>{rotuloDia(g.dia)}</Text>
                {g.blocos.map((b) => {
                  if (b.kind === 'conversa') return <CardConversa key={b.id} b={b} />;
                  if (b.kind === 'tarefas') return <CardTarefas key={b.id} b={b} />;
                  if (b.kind === 'plano') return <CardPlano key={b.id} b={b} />;
                  return <CardMemoria key={b.id} b={b} />;
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
    marginBottom: 4,
  },
  kicker: {
    fontSize: 11,
    fontFamily: tema.fontFamily.textBold,
    letterSpacing: 1.2,
    color: tema.textoFraco,
    paddingTop: 4,
    paddingBottom: 8,
  },
  vazio: { paddingHorizontal: 24, paddingTop: 60, alignItems: 'center' },
  vazioTxt: {
    color: tema.textoFraco,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: tema.bgCard,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
  },
  cardDestaque: {
    backgroundColor: tema.acento,
    borderColor: tema.acento,
  },
  cardTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconeWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitulo: {
    color: tema.texto,
    fontSize: 14,
    fontFamily: tema.fontFamily.textBold,
  },
  cardTituloDestaque: { color: '#F5F1E5' },
  cardHora: {
    color: tema.textoFraco,
    fontSize: 11,
    fontFamily: tema.fontFamily.text,
    marginTop: 1,
  },
  cardHoraDestaque: { color: 'rgba(245,241,229,0.7)' },
  episodioTitulo: {
    color: tema.texto,
    fontSize: 13,
    fontFamily: tema.fontFamily.textBold,
    marginBottom: 4,
  },
  relato: {
    color: tema.textoFraco,
    fontSize: 13,
    lineHeight: 19,
  },
  relatoDestaque: { color: 'rgba(245,241,229,0.92)' },
  expandir: {
    color: tema.acento,
    fontSize: 12,
    fontFamily: tema.fontFamily.textBold,
    marginTop: 4,
  },
  pillsLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: tema.bgInput,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
  },
  pillTxt: {
    color: tema.texto,
    fontSize: 11,
    fontFamily: tema.fontFamily.textBold,
  },
});
