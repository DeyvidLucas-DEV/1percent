import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  runOnJS,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { tema } from '../../lib/tema';
import { corPorPercentual, rotuloPorPercentual } from '../../domain/cores';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  pct: number;
  size?: number;
  stroke?: number;
  sublabel?: boolean;
  color?: string;
};

const DUR = 700;

export function BigRing({ pct, size = 220, stroke = 22, sublabel = true, color }: Props) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const c = 2 * Math.PI * r;
  const strokeColor = color ?? corPorPercentual(pct);
  const rotulo = rotuloPorPercentual(pct);

  const progress = useSharedValue(pct);
  const [display, setDisplay] = useState(pct);

  useEffect(() => {
    progress.value = withTiming(pct, {
      duration: DUR,
      easing: Easing.out(Easing.cubic),
    });
  }, [pct, progress]);

  useAnimatedReaction(
    () => Math.round(progress.value),
    (cur, prev) => {
      if (prev === null || cur !== prev) runOnJS(setDisplay)(cur);
    }
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: c * (1 - Math.min(progress.value, 100) / 100),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(27,26,23,0.06)" strokeWidth={stroke} />
        <AnimatedCircle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <View style={styles.row}>
          <Text style={[styles.numero, { fontSize: size * 0.32 }]}>{display}</Text>
          <Text style={[styles.percent, { fontSize: size * 0.13 }]}>%</Text>
        </View>
        {sublabel && (
          <Text style={[styles.label, { fontSize: size * 0.06 }]}>
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
  numero: {
    color: tema.ink,
    fontFamily: tema.fontFamily.display,
    letterSpacing: -2,
  },
  percent: {
    color: tema.weak,
    fontFamily: tema.fontFamily.display,
    marginLeft: 2,
    marginBottom: 6,
  },
  label: {
    color: tema.weak,
    fontFamily: tema.fontFamily.textBold,
    marginTop: 8,
    letterSpacing: 1,
  },
});
