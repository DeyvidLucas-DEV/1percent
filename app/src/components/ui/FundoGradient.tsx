import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, RadialGradient, Rect, Circle } from 'react-native-svg';

type Props = {
  topo?: string;
  base?: string;
};

// Fundo gradient absoluto + blobs ambiente sutis pra dar profundidade.
// Usa SVG pra evitar dependência nativa de expo-linear-gradient.
export function FundoGradient({ topo = '#F8F7FC', base = '#F0EEFC' }: Props) {
  const { width, height } = useWindowDimensions();
  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={topo} stopOpacity={1} />
          <Stop offset="1" stopColor={base} stopOpacity={1} />
        </LinearGradient>
        {/* Blob lavanda canto sup-esquerdo */}
        <RadialGradient id="blobLavanda" cx="0%" cy="0%" r="60%" fx="0%" fy="0%">
          <Stop offset="0%" stopColor="#C9BEFF" stopOpacity={0.35} />
          <Stop offset="100%" stopColor="#C9BEFF" stopOpacity={0} />
        </RadialGradient>
        {/* Blob rosa canto inf-direito */}
        <RadialGradient id="blobRosa" cx="100%" cy="100%" r="55%" fx="100%" fy="100%">
          <Stop offset="0%" stopColor="#FFDBFD" stopOpacity={0.32} />
          <Stop offset="100%" stopColor="#FFDBFD" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#bgGrad)" />
      <Circle cx={width * 0.1} cy={height * 0.1} r={width * 0.6} fill="url(#blobLavanda)" />
      <Circle cx={width * 0.95} cy={height * 0.9} r={width * 0.55} fill="url(#blobRosa)" />
    </Svg>
  );
}
