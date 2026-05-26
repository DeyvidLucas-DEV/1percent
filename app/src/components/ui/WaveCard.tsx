import { View, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = {
  bg: string;
  children: React.ReactNode;
  style?: ViewStyle;
  /** Altura da onda no topo. */
  waveHeight?: number;
};

/**
 * Card com topo "ondulado" (3 lobos) — squircle wave.
 * O fundo do card é desenhado como SVG com path que cria a borda superior ondulada.
 */
export function WaveCard({ bg, children, style, waveHeight = 18 }: Props) {
  return (
    <View style={[styles.outer, style]}>
      <Svg
        width="100%"
        height={waveHeight}
        viewBox={`0 0 200 ${waveHeight}`}
        preserveAspectRatio="none"
        style={styles.wave}
      >
        <Path
          d={`M0 ${waveHeight} L0 ${waveHeight * 0.6} Q 16 0, 33 ${waveHeight * 0.6} Q 50 ${waveHeight * 1.3}, 66 ${waveHeight * 0.6} Q 83 0, 100 ${waveHeight * 0.6} Q 117 ${waveHeight * 1.3}, 133 ${waveHeight * 0.6} Q 150 0, 166 ${waveHeight * 0.6} Q 183 ${waveHeight * 1.3}, 200 ${waveHeight * 0.6} L200 ${waveHeight} Z`}
          fill={bg}
        />
      </Svg>
      <View style={[styles.body, { backgroundColor: bg }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  wave: {
    width: '100%',
  },
  body: {
    flex: 0,
    paddingTop: 0,
  },
});
