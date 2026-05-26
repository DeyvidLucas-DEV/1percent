import { View, Text, StyleSheet } from 'react-native';
import { tema } from '../../lib/tema';

type Props = {
  greeting: string;
  name: string;
  right?: React.ReactNode;
};

export function HomeHeader({ greeting, name, right }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.name}>{name}</Text>
      </View>
      <View style={styles.actions}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 14,
  },
  greeting: {
    fontSize: 13,
    color: tema.weak,
    fontFamily: tema.fontFamily.textMedium,
  },
  name: {
    fontFamily: tema.fontFamily.display,
    fontSize: 22,
    color: tema.ink,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  actions: { flexDirection: 'row', gap: 10 },
});
