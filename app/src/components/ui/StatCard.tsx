import { View, Text, StyleSheet } from 'react-native';
import { tema } from '../../lib/tema';

type Props = {
  label: string;
  value: string | number;
  sub?: string;
  corValor?: string;
};

export function StatCard({ label, value, sub, corValor }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <Text style={[styles.valor, corValor ? { color: corValor } : null]}>{value}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: tema.bgCard,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
  },
  label: {
    color: tema.textoFraco,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  valor: {
    color: tema.texto,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 6,
  },
  sub: {
    color: tema.textoFraco,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
