import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { corPorPercentual } from '../../domain/cores';
import { tema } from '../../lib/tema';
import { base } from '../../lib/paleta';

type Props = { pct: number; size?: number; stroke?: number };

export function MiniRing({ pct, size = 56, stroke = 5 }: Props) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(pct, 100) / 100);
  const cor = corPorPercentual(pct);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={cx} cy={cx} r={r} fill="none" stroke={base.cinzaEscuro} strokeWidth={stroke} />
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
        <Text style={styles.label}>{pct}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { color: tema.texto, fontSize: 13, fontWeight: '700' },
});
