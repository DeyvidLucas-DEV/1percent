import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { tema } from '../../lib/tema';

type Props = {
  titulo?: string;
  mensagem: string;
};

export function CobrancaBanner({ titulo = 'Mediocridade subindo', mensagem }: Props) {
  return (
    <View style={styles.box}>
      <View style={styles.tagRow}>
        <Svg width={12} height={12} viewBox="0 0 12 12">
          <Path d="M6 1 L11 10 H1 Z" fill="none" stroke={tema.perigo} strokeWidth={1.4} />
          <Path d="M6 4.5 V7" stroke={tema.perigo} strokeWidth={1.4} strokeLinecap="round" />
          <Circle cx={6} cy={8.5} r={0.7} fill={tema.perigo} />
        </Svg>
        <Text style={styles.tag}>{titulo.toUpperCase()}</Text>
      </View>
      <Text style={styles.mensagem}>{mensagem}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginHorizontal: 20,
    marginBottom: 18,
    backgroundColor: '#3A1411',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.perigo,
    borderRadius: 14,
    padding: 14,
  },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: tema.perigo,
  },
  mensagem: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '500',
    color: tema.texto,
    lineHeight: 20,
  },
});
