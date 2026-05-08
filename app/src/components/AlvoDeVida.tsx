import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Line } from 'react-native-svg';
import { tema } from '../lib/tema';
import { corPorPercentual, rotuloPorPercentual } from '../domain/cores';
import type { ResumoArea } from '../domain/agregados';

type Props = {
  fatias: ResumoArea[];
  tamanho?: number;
  totalPct: number;
};

function fatiaPath(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  a0: number,
  a1: number
): string {
  const x0i = cx + Math.cos(a0) * rIn;
  const y0i = cy + Math.sin(a0) * rIn;
  const x0o = cx + Math.cos(a0) * rOut;
  const y0o = cy + Math.sin(a0) * rOut;
  const x1o = cx + Math.cos(a1) * rOut;
  const y1o = cy + Math.sin(a1) * rOut;
  const x1i = cx + Math.cos(a1) * rIn;
  const y1i = cy + Math.sin(a1) * rIn;
  const largeArc = a1 - a0 > Math.PI ? 1 : 0;
  return [
    `M ${x0i} ${y0i}`,
    `L ${x0o} ${y0o}`,
    `A ${rOut} ${rOut} 0 ${largeArc} 1 ${x1o} ${y1o}`,
    `L ${x1i} ${y1i}`,
    `A ${rIn} ${rIn} 0 ${largeArc} 0 ${x0i} ${y0i}`,
    'Z',
  ].join(' ');
}

function arcoExterno(
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number
): string {
  const x0 = cx + Math.cos(a0) * r;
  const y0 = cy + Math.sin(a0) * r;
  const x1 = cx + Math.cos(a1) * r;
  const y1 = cy + Math.sin(a1) * r;
  const largeArc = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1}`;
}

export function AlvoDeVida({ fatias, tamanho = 320, totalPct }: Props) {
  const cx = tamanho / 2;
  const cy = tamanho / 2;
  const rOut = tamanho / 2 - 8;
  const rIn = 30;
  const total = fatias.length || 1;
  const passo = (Math.PI * 2) / total;
  const corTotal = corPorPercentual(totalPct);
  const labelTotal = rotuloPorPercentual(totalPct);

  return (
    <View style={{ width: tamanho, height: tamanho }}>
      <Svg width={tamanho} height={tamanho}>
        {/* anéis-guia (faixas de fundo) */}
        {[0.25, 0.5, 0.75, 1].map(f => (
          <Circle
            key={f}
            cx={cx}
            cy={cy}
            r={rIn + (rOut - rIn) * f}
            stroke={tema.borda}
            strokeWidth={0.5}
            strokeDasharray="3,4"
            fill="none"
          />
        ))}

        {fatias.map((fatia, i) => {
          const a0 = -Math.PI / 2 + i * passo;
          const a1 = a0 + passo;
          const pct = fatia.percentual7d;
          const rFill = rIn + ((rOut - rIn) * Math.min(pct, 100)) / 100;
          const corFill = corPorPercentual(pct);

          return (
            <G key={fatia.area.id}>
              <Path
                d={fatiaPath(cx, cy, rIn, rFill, a0, a1)}
                fill={corFill}
                opacity={0.95}
              />
              <Path
                d={arcoExterno(cx, cy, rOut, a0, a1)}
                fill="none"
                stroke={fatia.area.cor_base}
                strokeWidth={3}
                strokeLinecap="butt"
              />
              <Line
                x1={cx + Math.cos(a0) * rIn}
                y1={cy + Math.sin(a0) * rIn}
                x2={cx + Math.cos(a0) * rOut}
                y2={cy + Math.sin(a0) * rOut}
                stroke={tema.bg}
                strokeWidth={1}
              />
            </G>
          );
        })}

        {/* furo central */}
        <Circle cx={cx} cy={cy} r={rIn - 2} fill={tema.bg} />
        <Circle
          cx={cx}
          cy={cy}
          r={rIn - 2}
          fill="none"
          stroke={tema.borda}
          strokeWidth={0.5}
        />
      </Svg>

      <View style={[StyleSheet.absoluteFill, styles.centro]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalNum, { color: corTotal }]}>{totalPct}</Text>
          <Text style={[styles.totalPercent, { color: corTotal }]}>%</Text>
        </View>
        <Text style={[styles.totalLabel, { color: corTotal }]}>{labelTotal.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center' },
  totalRow: { flexDirection: 'row', alignItems: 'flex-end' },
  totalNum: { fontSize: 28, fontWeight: '800', lineHeight: 30, letterSpacing: -1 },
  totalPercent: { fontSize: 13, fontWeight: '700', marginLeft: 2, marginBottom: 2 },
  totalLabel: { marginTop: 2, fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
});
