import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { tema } from '../src/lib/tema';
import { Botao } from '../src/components/Botao';
import { loginGoogle } from '../src/auth/google';
import { useAppStore } from '../src/store/appStore';

export default function Login() {
  const router = useRouter();
  const setLogado = useAppStore(s => s.setLogado);
  const [carregando, setCarregando] = useState(false);

  async function entrarGoogle() {
    setCarregando(true);
    try {
      const { userUuid } = await loginGoogle();
      setLogado(userUuid);
      router.replace('/');
    } catch (e: any) {
      const detalhe = e?.payload?.detail ?? e?.payload?.error ?? '';
      Alert.alert('Erro', `${e?.message ?? e}\n\n${detalhe}`);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.bg}>
      <View style={styles.miolo}>
        <Text style={styles.titulo}>1%</Text>
        <Text style={styles.subtitulo}>Resultado é consequência.{'\n'}Processo é decisão.</Text>

        <View style={styles.botoes}>
          <Botao
            titulo="Continuar com Google"
            onPress={entrarGoogle}
            carregando={carregando}
          />
        </View>

        <Text style={styles.rodape}>
          Seus dados são seus. Login serve só pra manter sincronizado entre seus aparelhos.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  miolo: {
    flex: 1,
    paddingHorizontal: tema.espacamento.lg,
    justifyContent: 'center',
  },
  titulo: {
    color: tema.texto,
    fontSize: 96,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: tema.espacamento.md,
  },
  subtitulo: {
    color: tema.textoFraco,
    fontSize: tema.fonte.corpo,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: tema.espacamento.xl,
  },
  botoes: { gap: tema.espacamento.md, marginBottom: tema.espacamento.xl },
  rodape: {
    color: tema.textoFraco,
    fontSize: tema.fonte.pequeno,
    textAlign: 'center',
    paddingHorizontal: tema.espacamento.lg,
  },
});
