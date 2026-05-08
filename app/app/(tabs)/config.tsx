import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tema } from '../../src/lib/tema';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { limparSessao } from '../../src/auth/sessao';
import { useAppStore } from '../../src/store/appStore';

export default function Config() {
  const router = useRouter();
  const setLogado = useAppStore(s => s.setLogado);

  async function sair() {
    Alert.alert('Sair', 'Você vai precisar logar novamente nesse aparelho.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await limparSessao();
          setLogado(null);
          router.replace('/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.bg} edges={['top']}>
      <PageHeader kicker="ajustes" title="Configurações" />
      <View style={styles.miolo}>
        <Text style={styles.placeholder}>Em construção. Próximo passo da reforma visual.</Text>
        <Pressable style={styles.botaoSair} onPress={sair}>
          <Text style={styles.botaoSairTxt}>Sair</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  miolo: { padding: 24 },
  placeholder: { color: tema.textoFraco, fontSize: 14, lineHeight: 22, marginBottom: 32 },
  botaoSair: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.perigo,
    borderRadius: 10,
  },
  botaoSairTxt: { color: tema.perigo, fontSize: 14, fontWeight: '600' },
});
