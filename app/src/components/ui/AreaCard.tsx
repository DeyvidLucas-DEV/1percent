import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tema } from '../../lib/tema';
import { MiniRing } from './MiniRing';

type Props = {
  nome: string;
  corBase: string;
  pctDia: number;
  pct7d: number;
  pausada?: boolean;
  onPress?: () => void;
};

export function AreaCard({ nome, corBase, pctDia, pct7d, pausada, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pausada && { opacity: 0.45 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.faixa, { backgroundColor: corBase }]} />
      <View style={styles.miolo}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.nome} numberOfLines={1}>
            {nome}
          </Text>
          {pausada ? (
            <Text style={styles.pausada}>PAUSADA</Text>
          ) : (
            <View style={styles.subRow}>
              <Text style={styles.sub}>{pctDia}% dia</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.sub}>{pct7d}% 7d</Text>
            </View>
          )}
        </View>
        {!pausada && <MiniRing pct={pctDia} />}
        <Svg width={8} height={14} viewBox="0 0 8 14" style={{ marginLeft: 4 }}>
          <Path
            d="M1 1 L7 7 L1 13"
            fill="none"
            stroke={tema.textoFraco}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.5}
          />
        </Svg>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: tema.bgCard,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
    overflow: 'hidden',
  },
  faixa: { width: 4 },
  miolo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  nome: { color: tema.texto, fontSize: 16, fontWeight: '600' },
  subRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  sub: { color: tema.textoFraco, fontSize: 12 },
  dot: { color: '#5A5E6A', fontSize: 12 },
  pausada: {
    color: tema.alerta,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 4,
  },
});
