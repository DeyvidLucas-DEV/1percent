import Svg, { Circle, Path } from 'react-native-svg';
import { tema } from '../../lib/tema';
import { base } from '../../lib/paleta';

export type StatusVisual = 'open' | 'done' | 'half' | 'fail';

type Props = { status: StatusVisual; size?: number };

export function StatusGlyph({ status, size = 22 }: Props) {
  if (status === 'done') {
    return (
      <Svg width={size} height={size} viewBox="0 0 22 22">
        <Circle cx="11" cy="11" r="10" fill={tema.sucesso} />
        <Path
          d="M6 11.5 L9.5 15 L16 7.5"
          fill="none"
          stroke={base.branco}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (status === 'fail') {
    return (
      <Svg width={size} height={size} viewBox="0 0 22 22">
        <Circle cx="11" cy="11" r="10" fill="none" stroke={tema.perigo} strokeWidth={1.6} />
        <Path d="M7 7 L15 15 M15 7 L7 15" stroke={tema.perigo} strokeWidth="1.8" strokeLinecap="round" />
      </Svg>
    );
  }
  if (status === 'half') {
    return (
      <Svg width={size} height={size} viewBox="0 0 22 22">
        <Circle cx="11" cy="11" r="10" fill="none" stroke={tema.alerta} strokeWidth={1.6} />
        <Path d="M11 1 A10 10 0 0 1 11 21 Z" fill={tema.alerta} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22">
      <Circle cx="11" cy="11" r="10" fill="none" stroke={tema.textoFraco} strokeWidth={1.6} opacity={0.55} />
    </Svg>
  );
}
