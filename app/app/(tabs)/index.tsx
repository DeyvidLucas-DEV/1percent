import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { tema } from '../../src/lib/tema';
import { useAppStore } from '../../src/store/appStore';
import { carregarDashboard, type DashboardData } from '../../src/domain/agregados';
import { CalendarioSemanal } from '../../src/components/ui/CalendarioSemanal';
import { TarefaListItem } from '../../src/components/ui/TarefaListItem';
import { TarefaTimelineItem } from '../../src/components/ui/TarefaTimelineItem';
import { MarcadorAgora } from '../../src/components/ui/MarcadorAgora';
import { IconBtn } from '../../src/components/ui/IconBtn';
import { FundoGradient } from '../../src/components/ui/FundoGradient';
import { BarraProgressoHoje } from '../../src/components/ui/BarraProgressoHoje';
import { PillStatus } from '../../src/components/ui/PillStatus';
import { calcularBanner } from '../../src/domain/bannerContextual';
import { obterClima, iconePorCodigo, type Clima } from '../../src/lib/clima';
import {
  listarExecucoesDoDia,
  marcarExecucao,
  removerExecucao,
  type TarefaComExecucao,
  type StatusVisualTarefa,
} from '../../src/db/queries/tarefas';
import { getUser } from '../../src/db/queries/users';
import { listarAreas } from '../../src/db/queries/areas';
import { hojeIso } from '../../src/lib/datas';
import type { Area, User, StatusExecucao } from '../../src/db/types';

function saudacaoPorHora(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function primeiroNome(nome: string): string {
  return nome.split(/\s+/)[0] ?? nome;
}

function dateToIso(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function proximoStatus(atual: StatusVisualTarefa): StatusExecucao | null {
  if (atual === 'open') return 'concluido';
  if (atual === 'done') return 'parcial';
  if (atual === 'half') return 'nao_feito';
  return null;
}

function compararHorario(a: TarefaComExecucao, b: TarefaComExecucao): number {
  if (a.horario && b.horario) return a.horario.localeCompare(b.horario);
  if (a.horario && !b.horario) return -1;
  if (!a.horario && b.horario) return 1;
  return 0;
}

function minutosAte(horario: string): number {
  const [hh, mm] = horario.split(':').map(Number);
  const agora = new Date();
  const alvo = new Date();
  alvo.setHours(hh!, mm!, 0, 0);
  const diff = alvo.getTime() - agora.getTime();
  return Math.round(diff / 60000);
}

function formatarRestante(min: number): string {
  if (min < 0) return 'atrasada';
  if (min < 60) return `em ${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `em ${h}h` : `em ${h}h${m}`;
}

export default function Hoje() {
  const router = useRouter();
  const inicializado = useAppStore((s) => s.inicializado);
  const onboarded = useAppStore((s) => s.onboarded);
  const [dataSel, setDataSel] = useState<Date>(() => new Date());
  const [tarefas, setTarefas] = useState<TarefaComExecucao[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [clima, setClima] = useState<Clima | null>(null);
  const [refresh, setRefresh] = useState(false);
  const ultimaData = useRef<string | null>(null);

  const dataIso = dateToIso(dataSel);
  const ehHoje = dataIso === hojeIso();
  const deveAnimar = ultimaData.current !== dataIso;

  const carregar = useCallback(async () => {
    if (!onboarded) return;
    const [ts, as, d, u, cli] = await Promise.all([
      listarExecucoesDoDia(dataIso),
      listarAreas(false),
      carregarDashboard(),
      getUser(),
      obterClima().catch(() => null),
    ]);
    setTarefas(ts);
    setAreas(as);
    setDashboard(d);
    setUser(u);
    setClima(cli);
    ultimaData.current = dataIso;
  }, [onboarded, dataIso]);

  useEffect(() => {
    if (inicializado && onboarded) carregar();
  }, [inicializado, onboarded, carregar]);

  useFocusEffect(
    useCallback(() => {
      if (inicializado && onboarded) carregar();
    }, [inicializado, onboarded, carregar])
  );

  useEffect(() => {
    if (ehHoje && dashboard && dashboard.diasPulados >= 2 && dashboard.execucoesHoje === 0) {
      router.replace('/reativacao');
    }
  }, [dashboard, ehHoje, router]);

  const slugDeArea = useMemo(() => {
    const m = new Map<number, string>();
    for (const a of areas) m.set(a.id, a.slug);
    return m;
  }, [areas]);

  const { ordenadas, comHorario, semHorario, pctDia, prioridadesPendentes } = useMemo(() => {
    const ord = [...tarefas].sort(compararHorario);
    const com = ord.filter((t) => !!t.horario);
    const sem = ord.filter((t) => !t.horario);
    const totalPeso = tarefas.reduce((s, t) => s + t.peso, 0);
    const feitoPeso = tarefas.reduce((s, t) => {
      if (t.status === 'done') return s + t.peso;
      if (t.status === 'half') return s + t.peso * 0.5;
      return s;
    }, 0);
    const pct = totalPeso === 0 ? 0 : Math.round((feitoPeso / totalPeso) * 100);
    const prio = tarefas.filter((t) => t.peso === 3 && t.status !== 'done').length;
    return {
      ordenadas: ord,
      comHorario: com,
      semHorario: sem,
      pctDia: pct,
      prioridadesPendentes: prio,
    };
  }, [tarefas]);

  // Próxima tarefa com horário ainda não feita (pra pill de status)
  const proximaTarefa = useMemo(() => {
    if (!ehHoje) return null;
    return ordenadas.find(
      (t) => t.horario && (t.status === 'open' || t.status === 'half') && minutosAte(t.horario) >= 0
    );
  }, [ordenadas, ehHoje]);

  // Montar timeline com marcador "AGORA" inserido na posição certa
  const horaAgora = useMemo(() => format(new Date(), 'HH:mm'), [refresh, ultimaData.current]);
  const timelineItems = useMemo(() => {
    type Item =
      | { tipo: 'tarefa'; tarefa: TarefaComExecucao; idx: number }
      | { tipo: 'agora'; hora: string };
    const items: Item[] = [];
    let inseriuAgora = false;
    for (let i = 0; i < comHorario.length; i++) {
      const t = comHorario[i]!;
      if (ehHoje && !inseriuAgora && t.horario! > horaAgora) {
        items.push({ tipo: 'agora', hora: horaAgora });
        inseriuAgora = true;
      }
      items.push({ tipo: 'tarefa', tarefa: t, idx: i });
    }
    if (ehHoje && !inseriuAgora && comHorario.length > 0) {
      items.push({ tipo: 'agora', hora: horaAgora });
    }
    return items;
  }, [comHorario, ehHoje, horaAgora]);

  async function toggleTarefa(t: TarefaComExecucao) {
    const proximo = proximoStatus(t.status);
    if (proximo === null) {
      await removerExecucao(t.id, dataIso);
    } else {
      await marcarExecucao(t.id, proximo, dataIso);
    }
    await carregar();
  }

  if (!inicializado || !onboarded) {
    return <SafeAreaView style={styles.bg} edges={['top']} />;
  }

  const greeting = ehHoje ? saudacaoPorHora() : null;
  const nome = ehHoje ? (user ? primeiroNome(user.nome) : '—') : null;
  const diaNum = format(dataSel, 'd');
  const diaSemana = format(dataSel, 'EEEE', { locale: ptBR });
  const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);

  const banner =
    ehHoje && dashboard
      ? calcularBanner({ dashboard, tarefas, hora: new Date().getHours() })
      : null;

  const totalTarefas = tarefas.length;
  const feitas = tarefas.filter((t) => t.status === 'done').length;
  const restantes = totalTarefas - feitas;

  // Banner contextual condensado pra virar pill (texto curto)
  const bannerPill =
    banner && banner.modo !== 'reflexao'
      ? {
          icone:
            banner.modo === 'cobranca'
              ? ('warning-outline' as const)
              : banner.modo === 'atraso'
              ? ('time-outline' as const)
              : ('heart-outline' as const),
          texto: banner.texto.split(/(?<=[.!?])\s+/)[0] ?? banner.texto,
          variante: banner.tom === 'cobranca' ? ('alerta' as const) : ('neutro' as const),
        }
      : null;

  return (
    <SafeAreaView style={styles.bg} edges={['top']}>
      <FundoGradient />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refresh}
            onRefresh={async () => {
              setRefresh(true);
              await carregar();
              setRefresh(false);
            }}
            tintColor={tema.ink}
          />
        }
      >
        {/* Header: dia grande esq · ícones dir */}
        <View style={styles.headerRow}>
          <View style={styles.headerEsq}>
            <Text style={styles.headerDiaNum}>{diaNum} </Text>
            <Text style={styles.headerDiaSemana}>{diaSemanaCap}</Text>
          </View>
          <View style={styles.headerActions}>
            <IconBtn icon="notifications-outline" />
          </View>
        </View>

        {/* Calendário (mantém expansível) */}
        <CalendarioSemanal selecionado={dataSel} onSelect={setDataSel} />

        {/* Barra de progresso pílula */}
        <BarraProgressoHoje pct={pctDia} label={ehHoje ? 'Hoje' : 'Dia'} />

        {/* Frase expressiva fluida com ícones inline */}
        <View style={styles.fraseWrap}>
          {greeting && (
            <View style={styles.fraseLabelLinha}>
              <Text style={styles.fraseLabel}>
                {greeting}, <Text style={styles.fraseLabelNome}>{nome}.</Text>
              </Text>
              {clima && (
                <View style={styles.climaInline}>
                  <Ionicons
                    name={iconePorCodigo(clima.codigo)}
                    size={14}
                    color={tema.weak}
                  />
                  <Text style={styles.climaTxt}>
                    {clima.temperatura}° {clima.cidade}
                  </Text>
                </View>
              )}
            </View>
          )}
          {totalTarefas > 0 ? (
            <View style={styles.frase}>
              <Text style={styles.fraseTxtFraco}>Você tem </Text>
              {prioridadesPendentes > 0 && (
                <>
                  <Ionicons
                    name="flame"
                    size={26}
                    color={tema.perigo}
                    style={styles.fraseIcon}
                  />
                  <Text style={styles.fraseTxtForte}>
                    {' '}
                    {prioridadesPendentes}{' '}
                    {prioridadesPendentes === 1 ? 'prioridade' : 'prioridades'}
                  </Text>
                  <Text style={styles.fraseTxtFraco}>, </Text>
                </>
              )}
              <Ionicons
                name="albums-outline"
                size={26}
                color={tema.ink}
                style={styles.fraseIcon}
              />
              <Text style={styles.fraseTxtForte}>
                {' '}
                {totalTarefas} {totalTarefas === 1 ? 'tarefa' : 'tarefas'}
              </Text>
              {feitas > 0 && (
                <>
                  <Text style={styles.fraseTxtFraco}> e </Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={26}
                    color={tema.sucesso}
                    style={styles.fraseIcon}
                  />
                  <Text style={styles.fraseTxtForte}>
                    {' '}
                    {feitas} {feitas === 1 ? 'feita' : 'feitas'}
                  </Text>
                </>
              )}
              <Text style={styles.fraseTxtFraco}> hoje.</Text>
            </View>
          ) : (
            <View style={styles.frase}>
              <Text style={styles.fraseTxtFraco}>Nenhuma tarefa pra hoje.</Text>
            </View>
          )}
        </View>

        {/* Pills de status */}
        {(proximaTarefa || bannerPill) && (
          <View style={styles.pillsRow}>
            {proximaTarefa && (
              <PillStatus
                icone="time-outline"
                destaque={proximaTarefa.horario ?? undefined}
                texto={`${proximaTarefa.nome} · ${formatarRestante(minutosAte(proximaTarefa.horario!))}`}
                variante="acento"
              />
            )}
            {bannerPill && (
              <PillStatus
                icone={bannerPill.icone}
                texto={bannerPill.texto}
                variante={bannerPill.variante}
              />
            )}
          </View>
        )}

        {/* Seção tarefas com horário (timeline) */}
        {comHorario.length > 0 && (
          <View style={styles.secao}>
            <View style={styles.secaoCab}>
              <Text style={styles.secaoTitulo}>Tarefas</Text>
              <Text style={styles.secaoContador}>
                {feitas}/{totalTarefas}
              </Text>
            </View>
            <View style={styles.timelineLista}>
              {timelineItems.map((it, idx) => {
                if (it.tipo === 'agora') {
                  return <MarcadorAgora key={`agora-${idx}`} hora={it.hora} />;
                }
                const t = it.tarefa;
                const passou = ehHoje && t.horario! <= horaAgora;
                const ehProxima = ehHoje && proximaTarefa?.id === t.id;
                return (
                  <Animated.View
                    key={t.id}
                    entering={deveAnimar ? FadeInDown.delay(idx * 24).duration(220) : undefined}
                  >
                    <TarefaTimelineItem
                      nome={t.nome}
                      horario={t.horario!}
                      slugArea={slugDeArea.get(t.area_id) ?? 'sabedoria'}
                      status={t.status}
                      ehPrimeiro={it.idx === 0}
                      ehUltimo={it.idx === comHorario.length - 1}
                      passou={passou}
                      proxima={ehProxima}
                      onToggle={() => toggleTarefa(t)}
                      onPress={() => router.push(`/tarefa/${t.id}`)}
                    />
                  </Animated.View>
                );
              })}
            </View>
          </View>
        )}

        {/* Seção sem horário (cards simples) */}
        {semHorario.length > 0 && (
          <View style={styles.secao}>
            <Text style={styles.secaoSubTitulo}>Qualquer horário</Text>
            <View style={styles.listaCards}>
              {semHorario.map((t, idx) => (
                <Animated.View
                  key={t.id}
                  entering={
                    deveAnimar
                      ? FadeInDown.delay((comHorario.length + idx) * 24).duration(220)
                      : undefined
                  }
                  style={styles.tarefaCard}
                >
                  <TarefaListItem
                    nome={t.nome}
                    slugArea={slugDeArea.get(t.area_id) ?? 'sabedoria'}
                    status={t.status}
                    onToggle={() => toggleTarefa(t)}
                    onPress={() => router.push(`/tarefa/${t.id}`)}
                  />
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        {totalTarefas === 0 && (
          <View style={styles.vazio}>
            <Text style={styles.vazioTxt}>
              {ehHoje ? 'Nada pra hoje. Toca no + pra adicionar.' : 'Nenhuma tarefa nesse dia.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { paddingBottom: 130 },

  // Header: dia grande esq · ícones dir
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
  },
  headerEsq: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  headerDiaNum: {
    fontSize: 30,
    fontFamily: tema.fontFamily.display,
    color: tema.ink,
    letterSpacing: -1,
  },
  headerDiaSemana: {
    fontSize: 22,
    fontFamily: tema.fontFamily.displayMedium,
    color: tema.weak,
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },

  // Frase expressiva fluida
  fraseWrap: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 4,
  },
  fraseLabelLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  fraseLabel: {
    fontSize: 14,
    fontFamily: tema.fontFamily.text,
    color: tema.weak,
    flexShrink: 1,
  },
  fraseLabelNome: {
    color: tema.ink,
    fontFamily: tema.fontFamily.textBold,
  },
  climaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  climaTxt: {
    fontSize: 12,
    color: tema.weak,
    fontFamily: tema.fontFamily.textMedium,
  },
  frase: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  fraseTxtForte: {
    fontSize: 24,
    fontFamily: tema.fontFamily.display,
    color: tema.ink,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  fraseTxtFraco: {
    fontSize: 24,
    fontFamily: tema.fontFamily.displayMedium,
    color: tema.weak,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  fraseIcon: {
    marginRight: -2,
  },

  // Pills de status
  pillsRow: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // Seção tarefas
  secao: {
    marginTop: 18,
  },
  secaoCab: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  secaoTitulo: {
    fontSize: 18,
    fontFamily: tema.fontFamily.display,
    color: tema.ink,
    letterSpacing: -0.3,
  },
  secaoContador: {
    fontSize: 12,
    color: tema.weak,
    fontFamily: tema.fontFamily.textSemi,
  },
  secaoSubTitulo: {
    fontSize: 11,
    fontFamily: tema.fontFamily.textBold,
    color: tema.weak,
    letterSpacing: 1.4,
    paddingHorizontal: 24,
    paddingBottom: 10,
    paddingTop: 4,
  },
  timelineLista: {
    paddingHorizontal: 12,
  },
  listaCards: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tarefaCard: {
    backgroundColor: tema.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: tema.borda,
    overflow: 'hidden',
  },

  // Vazio
  vazio: {
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  vazioTxt: {
    color: tema.weak,
    fontSize: 14,
    textAlign: 'center',
  },
});
