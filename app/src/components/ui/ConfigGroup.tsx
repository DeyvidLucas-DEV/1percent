import { View, Text, StyleSheet } from 'react-native';
import { tema } from '../../lib/tema';

type Props = {
  label?: string;
  children: React.ReactNode;
};

export function ConfigGroup({ label, children }: Props) {
  return (
    <View style={styles.grupo}>
      {label && <Text style={styles.label}>{label.toUpperCase()}</Text>}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { marginBottom: 22 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: tema.textoFraco,
    letterSpacing: 1.2,
    paddingHorizontal: 28,
    paddingBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: tema.bgCard,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
    overflow: 'hidden',
  },
});
