import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tema } from '../../src/lib/tema';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { getUser, salvarHorarioTrabalho } from '../../src/db/queries/users';

const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function HorarioTrabalho() {
  const router = useRouter();
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const u = await getUser();
      if (!alive) return;
      setInicio(u?.horario_trabalho_inicio ?? '');
      setFim(u?.horario_trabalho_fim ?? '');
      setCarregando(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const salvar = useCallback(
    async (limpar = false) => {
      if (!limpar) {
        if (!RE_HORA.test(inicio)) {
          Alert.alert('Início inválido', 'Use o formato HH:MM (ex: 09:00).');
          return;
        }
        if (!RE_HORA.test(fim)) {
          Alert.alert('Fim inválido', 'Use o formato HH:MM (ex: 18:00).');
          return;
        }
        if (inicio >= fim) {
          Alert.alert('Horários trocados', 'O fim precisa ser depois do início.');
          return;
        }
      }
      setSalvando(true);
      try {
        await salvarHorarioTrabalho(
          limpar ? null : inicio,
          limpar ? null : fim
        );
        router.back();
      } catch (e: any) {
        Alert.alert('Erro', String(e?.message ?? e));
      } finally {
        setSalvando(false);
      }
    },
    [inicio, fim, router]
  );

  if (carregando) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <SafeAreaView style={styles.bg} edges={['top']}>
          <ActivityIndicator color={tema.texto} style={{ marginTop: 60 }} />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <SafeAreaView style={styles.bg} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <PageHeader kicker="CONFIGURAÇÕES" title="Horário de trabalho" />
          <Text style={styles.sub}>
            Quando preenchido, a IA evita propor tarefas dentro dessa janela em dias úteis. Se
            deixar vazio, ela infere pela densidade de tarefas existentes.
          </Text>

          <View style={styles.bloco}>
            <View style={styles.linha}>
              <Text style={styles.label}>Início</Text>
              <TextInput
                style={styles.input}
                placeholder="09:00"
                placeholderTextColor={tema.textoFraco}
                value={inicio}
                onChangeText={setInicio}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                editable={!salvando}
              />
            </View>
            <View style={[styles.linha, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Fim</Text>
              <TextInput
                style={styles.input}
                placeholder="18:00"
                placeholderTextColor={tema.textoFraco}
                value={fim}
                onChangeText={setFim}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                editable={!salvando}
              />
            </View>
          </View>

          <Pressable
            style={[styles.botaoSalvar, salvando && { opacity: 0.6 }]}
            onPress={() => salvar(false)}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color="#F5F1E5" />
            ) : (
              <Text style={styles.botaoSalvarTxt}>Salvar</Text>
            )}
          </Pressable>

          {(inicio || fim) && (
            <Pressable
              style={styles.botaoLimpar}
              onPress={() => salvar(true)}
              disabled={salvando}
            >
              <Text style={styles.botaoLimparTxt}>Limpar (deixar IA inferir)</Text>
            </Pressable>
          )}

          <Text style={styles.aviso}>
            Esse dado fica só no seu device — não sincroniza com a nuvem.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { paddingBottom: 60 },
  sub: {
    paddingHorizontal: 24,
    color: tema.textoFraco,
    fontSize: 14,
    lineHeight: 20,
    marginTop: -4,
    marginBottom: 8,
  },
  bloco: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: tema.bgCard,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tema.borda,
  },
  label: {
    color: tema.texto,
    fontSize: 15,
    fontFamily: tema.fontFamily.textSemi,
    flex: 1,
  },
  input: {
    color: tema.texto,
    fontSize: 16,
    backgroundColor: tema.bgInput,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 90,
    textAlign: 'center',
    fontFamily: tema.fontFamily.textSemi,
  },
  botaoSalvar: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: tema.acento,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  botaoSalvarTxt: {
    color: '#F5F1E5',
    fontFamily: tema.fontFamily.textBold,
    fontSize: 16,
  },
  botaoLimpar: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoLimparTxt: {
    color: tema.textoFraco,
    fontSize: 13,
    fontFamily: tema.fontFamily.textSemi,
  },
  aviso: {
    paddingHorizontal: 24,
    marginTop: 14,
    fontSize: 12,
    color: tema.textoFraco,
    textAlign: 'center',
  },
});
