import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { corPorPercentual, rotuloPorPercentual } from '../../domain/cores';

type Props = {
  pct: number;
  size?: number;
  stroke?: number;
  sublabel?: boolean;
};

export function BigRing({ pct, size = 232, stroke = 18, sublabel = true }: Props) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(pct, 100) / 100);
  const cor = corPorPercentual(pct);
  const rotulo = rotuloPorPercentual(pct);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={cx} cy={cx} r={r} fill="none" stroke="#23262E" strokeWidth={stroke} />
        <Circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={cor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <View style={styles.row}>
          <Text style={[styles.numero, { color: cor, fontSize: size * 0.31 }]}>{pct}</Text>
          <Text style={[styles.percent, { color: cor, fontSize: size * 0.14 }]}>%</Text>
        </View>
        {sublabel && (
          <Text style={[styles.label, { color: cor, fontSize: size * 0.065 }]}>
            {rotulo.toUpperCase()}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  numero: { fontWeight: '800', letterSpacing: -2, lineHeight: undefined },
  percent: { fontWeight: '700', marginLeft: 2, marginBottom: 4 },
  label: { marginTop: 8, fontWeight: '600', letterSpacing: 1.5 },
});
