import { View, Text, StyleSheet } from 'react-native';
import { tema } from '../../lib/tema';

type Props = {
  kicker?: string;
  title: string;
  right?: React.ReactNode;
};

export function PageHeader({ kicker, title, right }: Props) {
  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        {kicker && <Text style={styles.kicker}>{kicker.toUpperCase()}</Text>}
        <Text style={styles.titulo}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: tema.textoFraco,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '800',
    color: tema.texto,
    letterSpacing: -0.6,
    marginTop: 4,
    lineHeight: 34,
  },
});
