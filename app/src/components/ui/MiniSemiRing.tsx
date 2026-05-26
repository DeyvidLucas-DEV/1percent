import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tema } from '../../lib/tema';
import { acentos } from '../../lib/paleta';

type Props = {
  pct: number;
  color: string;
  value: string | number;
  unit: string;
  size?: number;
};

export function MiniSemiRing({ pct, color, value, unit, size = 110 }: Props) {
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size - 12;
  const c = Math.PI * r;
  const offset = c * (1 - Math.min(pct, 100) / 100);
  const heightSvg = size / 1.6;

  return (
    <View style={{ width: size, height: heightSvg }}>
      <Svg width={size} height={heightSvg}>
        <Path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={acentos.ringFundoPreto}
          strokeWidth={9}
          strokeLinecap="round"
        />
        <Path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={styles.valor}>{value}</Text>
        <Text style={styles.unidade}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 14,
  },
  valor: {
    color: tema.ink,
    fontFamily: tema.fontFamily.display,
    fontSize: 22,
  },
  unidade: {
    color: tema.weak,
    fontSize: 10,
    fontFamily: tema.fontFamily.textBold,
    letterSpacing: 0.4,
    marginTop: 2,
  },
});
