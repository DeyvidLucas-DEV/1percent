import { useCallback, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, useWindowDimensions, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polyline, Line as SvgLine, Circle as SvgCircle, Rect } from 'react-native-svg';
import { tema } from '../../src/lib/tema';
import { base } from '../../src/lib/paleta';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { useAppStore } from '../../src/store/appStore';
import { carregarDashboard, type DashboardData } from '../../src/domain/agregados';
import { CORES, corPorPercentual, faixaPorPercentual, rotuloPorPercentual } from '../../src/domain/cores';
import { listarReflexoes } from '../../src/db/queries/reflexoes';
import type { Reflexao } from '../../src/db/types';

const MESES_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DOWS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function formatarData(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES_PT[m - 1]}`;
}

function MonthLineChart({ data, width, height = 180 }: { data: { pct: number }[]; width: number; height: number }) {
  if (data.length === 0) return null;
  const max = 100;
  const padTop = 10;
  const padBottom = 10;
  const usableH = height - padTop - padBottom;
  const step = data.length > 1 ? width / (data.length - 1) : width;

  const pts = data
    .map((v, i) => `${i * step},${height - padBottom - (v.pct / max) * usableH}`)
    .join(' ');

  const ultimo = data[data.length - 1];

  return (
    <Svg width={width} height={height}>
      {/* faixas coloridas no fundo */}
      {([20, 40, 60, 80, 100] as const).map((th, i) => {
        const colors = [CORES.marrom, CORES.vermelho, CORES.amarelo, CORES.verde, CORES.azul];
        const prev = i === 0 ? 0 : [20, 40, 60, 80][i - 1]!;
        const yTop = height - padBottom - (th / max) * usableH;
        const h = ((th - prev) / max) * usableH;
        return <Rect key={i} x={0} y={yTop} width={width} height={h} fill={colors[i]} opacity={0.06} />;
      })}
      <SvgLine
        x1={0}
        y1={height / 2 - 5}
        x2={width}
        y2={height / 2 - 5}
        stroke={tema.borda}
        strokeWidth={0.5}
        strokeDasharray="3 3"
      />
      <Polyline
        points={pts}
        fill="none"
        stroke={tema.texto}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {ultimo && (
        <SvgCircle
          cx={(data.length - 1) * step}
          cy={height - padBottom - (ultimo.pct / max) * usableH}
          r={3.5}
          fill={corPorPercentual(ultimo.pct)}
        />
      )}
    </Svg>
  );
}

function CalendarGrid({ data, onTap }: { data: { data: string; pct: number }[]; onTap?: (iso: string) => void }) {
  if (data.length === 0) return null;
  // Determina offset com base no dia da semana do primeiro dia
  const primeiro = new Date(data[0]!.data + 'T00:00:00');
  const offset = primeiro.getDay();
  const cells: ({ data: string; pct: number } | null)[] = [
    ...Array(offset).fill(null),
    ...data,
  ];

  return (
    <View>
      <View style={styles.calRow}>
        {DOWS.map((d, i) => (
          <Text key={i} style={styles.calDow}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.calGrid}>
        {cells.map((c, i) => {
          if (!c) return <View key={i} style={styles.calCellEmpty} />;
          const cor = corPorPercentual(c.pct);
          return (
            <Pressable
              key={i}
              onPress={() => onTap?.(c.data)}
              style={[styles.calCell, { backgroundColor: cor, opacity: c.pct === 0 ? 0.35 : 0.9 }]}
            >
              <Text style={styles.calCellTxt}>{c.pct}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function Insights() {
  const router = useRouter();
  const onboarded = useAppStore(s => s.onboarded);
  const [data, setData] = useState<DashboardData | null>(null);
  const [reflexoes, setReflexoes] = useState<Reflexao[]>([]);
  const [refresh, setRefresh] = useState(false);
  const { width } = useWindowDimensions();

  const carregar = useCallback(async () => {
    if (!onboarded) return;
    const [d, refs] = await Promise.all([carregarDashboard(), listarReflexoes(5)]);
    setData(d);
    setReflexoes(refs);
  }, [onboarded]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  if (!data) return <SafeAreaView style={styles.bg} edges={['top']} />;

  const corMedia = corPorPercentual(data.mediaMes);
  const labelMedia = rotuloPorPercentual(data.mediaMes);

  const ordenadas = [...data.porArea].sort((a, b) => b.percentual7d - a.percentual7d);
  const top3 = ordenadas.slice(0, 3);
  const bottom3 = ordenadas.slice(-3).reverse();

  const cardWidth = width - 32; // 16 padding cada lado
  const chartWidth = cardWidth - 32; // 16 padding interno cada lado

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
        <PageHeader
          kicker={data.percPorDia.length >= 28 ? 'últimos 28 dias' : `${data.percPorDia.length} ${data.percPorDia.length === 1 ? 'dia' : 'dias'} de dado`}
          title="Insights"
        />

        {/* Card 1 — Mês */}
        <View style={styles.cardWrap}>
          <View style={styles.card}>
            <View style={styles.cardCabecalho}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardKicker}>MÉDIA DO MÊS</Text>
                <View style={styles.mediaRow}>
                  <Text style={[styles.mediaNum, { color: corMedia }]}>{data.mediaMes}</Text>
                  <Text style={[styles.mediaPct, { color: corMedia }]}>%</Text>
                  <Text style={[styles.mediaLabel, { color: corMedia }]}>{labelMedia.toUpperCase()}</Text>
                </View>
              </View>
            </View>
            <MonthLineChart data={data.percPorDia} width={chartWidth} height={170} />
          </View>
        </View>

        {/* Card 2 — Calendário */}
        <View style={styles.cardWrap}>
          <View style={styles.card}>
            <Text style={styles.cardKicker}>CALENDÁRIO</Text>
            <View style={{ marginTop: 12 }}>
              <CalendarGrid data={data.percPorDia} onTap={iso => router.push(`/dia/${iso}`)} />
            </View>
            <View style={styles.legendaFaixas}>
              {([
                ['Estagn', CORES.marrom],
                ['Reaç', CORES.vermelho],
                ['Movim', CORES.amarelo],
                ['Const', CORES.verde],
                ['Excel', CORES.azul],
              ] as const).map(([l, c]) => (
                <View key={l} style={styles.legendaFaixaItem}>
                  <View style={[styles.legendaQuadrado, { backgroundColor: c }]} />
                  <Text style={styles.legendaTxt}>{l}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Card 3 — Top/Bottom 3 */}
        <View style={styles.cardWrap}>
          <View style={styles.card}>
            <Text style={styles.cardKicker}>ÁREAS</Text>
            <View style={styles.topBotRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.topBotTitulo, { color: tema.sucesso }]}>TOP 3</Text>
                {top3.map(p => (
                  <View key={p.area.id} style={styles.topBotItem}>
                    <View style={[styles.topBotBarra, { backgroundColor: p.area.cor_base }]} />
                    <Text style={styles.topBotNome} numberOfLines={1}>{p.area.nome}</Text>
                    <Text style={[styles.topBotPct, { color: corPorPercentual(p.percentual7d) }]}>
                      {p.percentual7d}%
                    </Text>
                  </View>
                ))}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.topBotTitulo, { color: tema.perigo }]}>BOTTOM 3</Text>
                {bottom3.map(p => (
                  <View key={p.area.id} style={styles.topBotItem}>
                    <View style={[styles.topBotBarra, { backgroundColor: p.area.cor_base }]} />
                    <Text style={styles.topBotNome} numberOfLines={1}>{p.area.nome}</Text>
                    <Text style={[styles.topBotPct, { color: corPorPercentual(p.percentual7d) }]}>
                      {p.percentual7d}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Card 5 — Reflexões anteriores */}
        <View style={styles.cardWrap}>
          <View style={styles.card}>
            <Text style={styles.cardKicker}>REFLEXÕES ANTERIORES</Text>
            <View style={{ marginTop: 12 }}>
              {reflexoes.length === 0 && (
                <Text style={styles.semDado}>
                  Nenhuma reflexão respondida ainda. Cada dia, uma pergunta nova.
                </Text>
              )}
              {reflexoes.map((r, i) => (
                <View
                  key={r.id}
                  style={[
                    styles.reflexao,
                    i < reflexoes.length - 1 && styles.reflexaoDivisor,
                  ]}
                >
                  <Text style={styles.reflexaoData}>{formatarData(r.data).toUpperCase()}</Text>
                  <Text style={styles.reflexaoPergunta}>{r.pergunta}</Text>
                  <Text style={styles.reflexaoResposta}>{r.resposta}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { paddingBottom: 30 },
  cardWrap: { paddingHorizontal: 16, marginTop: 12 },
  card: {
    backgroundColor: tema.bgCard,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
    padding: 16,
  },
  cardCabecalho: { flexDirection: 'row', alignItems: 'flex-start' },
  cardKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: tema.textoFraco,
  },
  mediaRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4, flexWrap: 'wrap' },
  mediaNum: { fontSize: 28, fontWeight: '800' },
  mediaPct: { fontSize: 16, fontWeight: '800', marginLeft: 1, marginBottom: 2 },
  mediaLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginLeft: 8, marginBottom: 4 },
  // Calendário
  calRow: { flexDirection: 'row', marginBottom: 8 },
  calDow: { flex: 1, fontSize: 10, fontWeight: '600', color: tema.textoFraco, textAlign: 'center' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  calCellEmpty: { width: `${100 / 7}%`, aspectRatio: 1 },
  calCellTxt: { color: base.pretoQuase, fontSize: 10, fontWeight: '700' },
  legendaFaixas: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, flexWrap: 'wrap' },
  legendaFaixaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 4 },
  legendaQuadrado: { width: 10, height: 10, borderRadius: 2 },
  legendaTxt: { fontSize: 10, color: tema.textoFraco },
  // Top/Bottom
  topBotRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  topBotTitulo: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8 },
  topBotItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  topBotBarra: { width: 6, height: 18, borderRadius: 1 },
  topBotNome: { flex: 1, fontSize: 12, color: tema.texto },
  topBotPct: { fontSize: 12, fontWeight: '700' },
  // Reflexões
  semDado: { color: tema.textoFraco, fontSize: 13, lineHeight: 18 },
  reflexao: { paddingBottom: 12, marginBottom: 12 },
  reflexaoDivisor: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tema.borda,
  },
  reflexaoData: {
    fontSize: 11,
    fontWeight: '600',
    color: tema.textoFraco,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  reflexaoPergunta: { fontSize: 13, fontWeight: '600', color: tema.texto, marginBottom: 4 },
  reflexaoResposta: { fontSize: 13, color: tema.textoFraco, lineHeight: 18 },
});
