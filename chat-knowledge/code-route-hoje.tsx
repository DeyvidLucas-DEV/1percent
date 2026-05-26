import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tema } from '../../src/lib/tema';
import { useAppStore } from '../../src/store/appStore';
import { carregarDashboard, type DashboardData } from '../../src/domain/agregados';
import { paletaArea } from '../../src/domain/areasPaleta';
import { rotuloPorPercentual } from '../../src/domain/cores';
import { HomeHeader } from '../../src/components/ui/HomeHeader';
import { IconBtn } from '../../src/components/ui/IconBtn';
import { DayPills, type DiaPill } from '../../src/components/ui/DayPills';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { HabitCard, type HabitCardData, type HabitChartType } from '../../src/components/ui/HabitCard';
import { BigRing } from '../../src/components/ui/BigRing';
import { listarTarefasAtivas, execucoesDoDia } from '../../src/db/queries/tarefas';
import { execucoesEntre } from '../../src/db/queries/execucoes';
import { getUser } from '../../src/db/queries/users';
import { hojeIso, ultimosNDias } from '../../src/lib/datas';
import type { Tarefa, Execucao, User } from '../../src/db/types';

const DOW_PT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

function saudacaoPorHora(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function primeiroNome(nome: string): string {
  return nome.split(/\s+/)[0] ?? nome;
}

function gerarSemana(): DiaPill[] {
  const hoje = new Date();
  const dia = hoje.getDay();
  // Começa no domingo da semana atual.
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - dia);
  const dias: DiaPill[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    dias.push({
      dow: DOW_PT[i]!,
      num: String(d.getDate()).padStart(2, '0'),
      iso: d.toISOString().slice(0, 10),
    });
  }
  return dias;
}

const PESO_STATUS: Record<string, number> = {
  concluido: 1,
  parcial: 0.5,
  nao_feito: 0,
};

function tipoChartPraTarefa(tarefaId: number): HabitChartType {
  // Distribui pra ter variedade visual sem precisar de nova coluna no DB.
  return (['bars', 'wave', 'semi'] as const)[tarefaId % 3]!;
}

type DadosPorTarefa = {
  serie7d: number[];
  feitosNaSemana: number; // 0..7
};

function calcularSerie(tarefaId: number, exec7d: Execucao[], dias7d: string[]): DadosPorTarefa {
  const map = new Map<string, number>();
  for (const e of exec7d) {
    if (e.tarefa_id !== tarefaId) continue;
    map.set(e.data, PESO_STATUS[e.status] ?? 0);
  }
  const serie = dias7d.map(d => Math.round((map.get(d) ?? 0) * 10));
  const feitos = serie.filter(v => v >= 5).length;
  return { serie7d: serie, feitosNaSemana: feitos };
}

export default function Hoje() {
  const router = useRouter();
  const inicializado = useAppStore(s => s.inicializado);
  const onboarded = useAppStore(s => s.onboarded);
  const [data, setData] = useState<DashboardData | null>(null);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [exec7d, setExec7d] = useState<Execucao[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [refresh, setRefresh] = useState(false);

  const semana = useMemo(() => gerarSemana(), []);
  const hojeIdx = useMemo(() => {
    const today = hojeIso();
    return semana.findIndex(d => d.iso === today);
  }, [semana]);

  const carregar = useCallback(async () => {
    if (!onboarded) return;
    const dias = ultimosNDias(7);
    const [d, ts, ex, u] = await Promise.all([
      carregarDashboard(),
      listarTarefasAtivas(),
      execucoesEntre(dias[0]!, hojeIso()),
      getUser(),
    ]);
    setData(d);
    setTarefas(ts);
    setExec7d(ex);
    setUser(u);
  }, [onboarded]);

  useEffect(() => { if (inicializado && onboarded) carregar(); }, [inicializado, onboarded, carregar]);
  useFocusEffect(useCallback(() => { if (inicializado && onboarded) carregar(); }, [inicializado, onboarded, carregar]));

  // Trava de reativação após 2+ dias pulados
  useEffect(() => {
    if (data && data.diasPulados >= 2 && data.execucoesHoje === 0) {
      router.replace('/reativacao');
    }
  }, [data]);

  if (!inicializado || !onboarded || !data) {
    return <SafeAreaView style={styles.bg} edges={['top']} />;
  }

  const dias7d = ultimosNDias(7);
  const slugDeArea = new Map<number, string>();
  for (const a of data.porArea) slugDeArea.set(a.area.id, a.area.slug);

  // Pega até 6 tarefas pra grid (priorizando peso 3 → 1)
  const tarefasOrdenadas = [...tarefas].sort((a, b) => b.peso - a.peso);
  const tarefasPraGrid = tarefasOrdenadas.slice(0, 6);

  const habits: HabitCardData[] = tarefasPraGrid.map(t => {
    const slug = slugDeArea.get(t.area_id) ?? 'sabedoria';
    const tipo = tipoChartPraTarefa(t.id);
    const { serie7d, feitosNaSemana } = calcularSerie(t.id, exec7d, dias7d);
    if (tipo === 'semi') {
      const pct = Math.round((feitosNaSemana / 7) * 100);
      return {
        title: t.nome,
        areaSlug: slug,
        type: 'semi',
        value: feitosNaSemana,
        unit: '/ 7 dias',
        pct,
      };
    }
    return {
      title: t.nome,
      areaSlug: slug,
      type: tipo,
      value: feitosNaSemana,
      unit: '/ 7d',
      data: serie7d,
    };
  });

  const greeting =
    data.diasPulados >= 1 ? 'Cadê você' : saudacaoPorHora();
  const nome = user ? primeiroNome(user.nome) : '';

  const mostrarBanner = data.mediocridade.faixa !== 'limpo';

  // Texto contextual no card resumo
  const areasNoVerde = data.porArea.filter(p => p.percentualHoje >= 60).length;
  const totalAreas = data.porArea.length;
  const tom =
    data.percentualHoje >= 60
      ? `${areasNoVerde} de ${totalAreas} áreas no verde. Streak: ${data.streak}d.`
      : data.percentualHoje >= 30
      ? `Meio do caminho. ${totalAreas - areasNoVerde} áreas ainda fracas.`
      : `${data.execucoesHoje} de ${tarefas.length} tarefas marcadas. Mexe.`;

  return (
    <SafeAreaView style={styles.bg} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refresh}
            onRefresh={async () => { setRefresh(true); await carregar(); setRefresh(false); }}
            tintColor={tema.ink}
          />
        }
      >
        <HomeHeader
          greeting={greeting}
          name={nome || '—'}
          right={
            <>
              <IconBtn icon="search-outline" />
              <IconBtn icon="notifications-outline" />
            </>
          }
        />

        <View style={styles.daysWrap}>
          <DayPills
            days={semana}
            selected={hojeIdx >= 0 ? hojeIdx : 0}
            onSelect={idx => {
              const dia = semana[idx];
              if (!dia?.iso) return;
              router.push(`/dia/${dia.iso}`);
            }}
          />
        </View>

        {mostrarBanner && (
          <View style={styles.bannerWrap}>
            <View style={styles.banner}>
              <Text style={styles.bannerTag}>MEDIOCRIDADE SUBINDO</Text>
              <Text style={styles.bannerTxt}>
                {data.mediocridade.faixa === 'cobranca_forte'
                  ? 'Padrão consolidado de não-fazer. Quebra agora.'
                  : 'Você está marcando parcial demais. Decide ou para.'}
              </Text>
            </View>
          </View>
        )}

        <SectionHeader
          title={'Destaques\nde hoje'}
          action="Todas"
          onAction={() => router.push('/checklist')}
        />

        <View style={styles.grid}>
          {habits.map((h, i) => (
            <View key={i} style={styles.gridItem}>
              <HabitCard habit={h} onPress={() => router.push('/checklist')} />
            </View>
          ))}
        </View>

        <View style={styles.resumoWrap}>
          <View style={styles.resumo}>
            <BigRing pct={data.percentualHoje} size={120} stroke={14} sublabel={false} />
            <View style={{ flex: 1 }}>
              <Text style={styles.resumoTitulo}>
                {rotuloPorPercentual(data.percentualHoje)}
              </Text>
              <Text style={styles.resumoTxt}>{tom}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { paddingBottom: 130 },
  daysWrap: { paddingHorizontal: 16, paddingBottom: 22 },
  bannerWrap: { paddingHorizontal: 16, paddingBottom: 14 },
  banner: {
    backgroundColor: '#F2D8D2',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: tema.bordaForte,
  },
  bannerTag: {
    fontSize: 11,
    fontFamily: tema.fontFamily.textBold,
    color: '#8B3328',
    letterSpacing: 1,
    marginBottom: 4,
  },
  bannerTxt: {
    fontSize: 13,
    color: tema.ink,
    lineHeight: 18,
    fontFamily: tema.fontFamily.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  gridItem: { width: '48%' },
  resumoWrap: { paddingHorizontal: 16, paddingTop: 24 },
  resumo: {
    backgroundColor: tema.card,
    borderRadius: 28,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    borderWidth: 1,
    borderColor: tema.borda,
  },
  resumoTitulo: {
    fontFamily: tema.fontFamily.display,
    fontSize: 18,
    color: tema.ink,
    letterSpacing: -0.3,
  },
  resumoTxt: {
    marginTop: 4,
    fontSize: 13,
    color: tema.weak,
    lineHeight: 18,
    fontFamily: tema.fontFamily.text,
  },
});
