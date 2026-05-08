import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tema } from '../../src/lib/tema';
import { PageHeader } from '../../src/components/ui/PageHeader';

export default function Areas() {
  return (
    <SafeAreaView style={styles.bg} edges={['top']}>
      <PageHeader kicker="suas dimensões" title="Áreas" />
      <View style={styles.miolo}>
        <Text style={styles.placeholder}>Em construção. Próximo passo da reforma visual.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  miolo: { padding: 24 },
  placeholder: { color: tema.textoFraco, fontSize: 14, lineHeight: 22 },
});
