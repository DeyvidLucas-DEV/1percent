import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tema } from '../../lib/tema';

export type PillVariant = 'neutro' | 'alerta' | 'sucesso' | 'acento';

type Props = {
  icone: keyof typeof Ionicons.glyphMap;
  texto: string;
  destaque?: string;
  variante?: PillVariant;
  style?: StyleProp<ViewStyle>;
};

const COR_ICONE: Record<PillVariant, string> = {
  neutro: tema.weak,
  alerta: tema.alerta,
  sucesso: tema.sucesso,
  acento: tema.acento,
};

export function PillStatus({
  icone,
  texto,
  destaque,
  variante = 'neutro',
  style,
}: Props) {
  return (
    <View style={[styles.pill, style]}>
      <Ionicons name={icone} size={14} color={COR_ICONE[variante]} />
      {destaque && <Text style={[styles.destaque, { color: COR_ICONE[variante] }]}>{destaque}</Text>}
      <Text style={styles.texto} numberOfLines={1}>
        {texto}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: tema.card,
    borderWidth: 1,
    borderColor: tema.borda,
    alignSelf: 'center',
  },
  destaque: {
    fontSize: 12,
    fontFamily: tema.fontFamily.textBold,
  },
  texto: {
    fontSize: 12,
    color: tema.ink,
    fontFamily: tema.fontFamily.textMedium,
  },
});
