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
    paddingTop: 12,
    paddingBottom: 8,
  },
  kicker: {
    fontSize: 11,
    fontFamily: tema.fontFamily.textBold,
    letterSpacing: 1.2,
    color: tema.weak,
  },
  titulo: {
    fontSize: 36,
    fontFamily: tema.fontFamily.display,
    color: tema.ink,
    letterSpacing: -0.8,
    marginTop: 6,
    lineHeight: 38,
  },
});
