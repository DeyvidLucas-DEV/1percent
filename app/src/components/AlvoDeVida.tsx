import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { tema } from '../lib/tema';
import { corPorPercentual } from '../domain/cores';
import type { ResumoArea } from '../domain/agregados';

type Props = {
  fatias: ResumoArea[];
  tamanho?: number;
  onTapArea?: (areaId: number) => void;
};

function arcPath(cx: number, cy: number, raio: number, inicio: number, fim: number): string {
  const x1 = cx + raio * Math.cos(inicio);
  const y1 = cy + raio * Math.sin(inicio);
  const x2 = cx + raio * Math.cos(fim);
  const y2 = cy + raio * Math.sin(fim);
  const largeArc = fim - inicio > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${raio} ${raio} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export function AlvoDeVida({ fatias, tamanho = 320, onTapArea }: Props) {
  const cx = tamanho / 2;
  const cy = tamanho / 2;
  const raioMax = tamanho / 2 - 8;
  const raioMin = 30;
  const total = fatias.length || 1;
  const passo = (Math.PI * 2) / total;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={tamanho} height={tamanho}>
        {/* fundo de anéis */}
        {[0.25, 0.5, 0.75, 1].map(f => (
          <Circle
            key={f}
            cx={cx}
            cy={cy}
            r={raioMin + (raioMax - raioMin) * f}
            stroke={tema.borda}
            strokeWidth={1}
            fill="none"
            strokeDasharray="3,4"
          />
        ))}

        {fatias.map((fatia, i) => {
          const inicio = -Math.PI / 2 + i * passo;
          const fim = inicio + passo;
          const raio = raioMin + ((raioMax - raioMin) * fatia.percentual7d) / 100;
          const corDesempenho = corPorPercentual(fatia.percentual7d);

          return (
            <G key={fatia.area.id}>
              {/* fatia preenchida — cor de desempenho */}
              <Path
                d={arcPath(cx, cy, raio, inicio, fim)}
                fill={corDesempenho}
                opacity={0.85}
              />
              {/* contorno da fatia — cor base da área */}
              <Path
                d={arcPath(cx, cy, raioMax, inicio, fim)}
                stroke={fatia.area.cor_base}
                strokeWidth={2}
                fill="none"
              />
            </G>
          );
        })}

        <Circle cx={cx} cy={cy} r={raioMin - 4} fill={tema.bg} stroke={tema.borda} />
      </Svg>

      <View style={styles.legenda}>
        {fatias.map(f => (
          <Pressable
            key={f.area.id}
            onPress={() => onTapArea?.(f.area.id)}
            style={styles.legItem}
          >
            <View style={[styles.bola, { backgroundColor: f.area.cor_base }]} />
            <Text style={styles.legNome} numberOfLines={1}>{f.area.nome}</Text>
            <Text style={[styles.legPct, { color: corPorPercentual(f.percentual7d) }]}>
              {f.percentual7d}%
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legenda: {
    width: '100%',
    marginTop: tema.espacamento.lg,
    gap: tema.espacamento.xs,
  },
  legItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: tema.espacamento.sm,
    backgroundColor: tema.bgCard,
    borderRadius: 8,
    gap: tema.espacamento.sm,
  },
  bola: { width: 12, height: 12, borderRadius: 6 },
  legNome: { color: tema.texto, fontSize: tema.fonte.corpo, flex: 1 },
  legPct: { fontSize: tema.fonte.corpo, fontWeight: '700' },
});
