import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tema } from '../../src/lib/tema';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { api, ApiError } from '../../src/lib/api';

type Fato = {
  userId: string;
  id: string;
  categoria: string;
  chave: string;
  valor: string;
  confianca: 'baixa' | 'media' | 'alta';
  origemEventId: string | null;
  firstSeenAt: string;
  lastConfirmedAt: string | null;
  active: boolean;
  updatedAt: string;
};

type RespostaListaFatos = { facts: Fato[] };

const CATEGORIA_LABEL: Record<string, string> = {
  rotina: 'Rotina',
  familia: 'Família',
  trabalho: 'Trabalho',
  financas: 'Finanças',
  espiritual: 'Espiritual',
  saude_fisica: 'Saúde física',
  saude_emocional: 'Saúde emocional',
  amizades: 'Amizades',
  crescimento: 'Crescimento',
  sabedoria: 'Sabedoria',
};

export default function Memoria() {
  const [fatos, setFatos] = useState<Fato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valorEditado, setValorEditado] = useState('');

  const carregar = useCallback(async () => {
    try {
      const r = await api.get<RespostaListaFatos>('/memory/facts');
      setFatos(r.facts);
    } catch (e) {
      if (e instanceof ApiError) {
        Alert.alert('Erro', `Não consegui carregar (status ${e.status}).`);
      } else {
        Alert.alert('Sem conexão', 'Tente novamente quando estiver online.');
      }
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvarEdicao(fato: Fato) {
    const novo = valorEditado.trim();
    if (novo.length < 1) return;
    try {
      await api.patch(`/memory/facts/${fato.id}`, { valor: novo });
      setFatos((fs) => fs.map((f) => (f.id === fato.id ? { ...f, valor: novo } : f)));
      setEditandoId(null);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
    }
  }

  async function apagar(fato: Fato) {
    Alert.alert(
      'Apagar fato',
      'Esse fato vai sumir das próximas recomendações. Confirmar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.del(`/memory/facts/${fato.id}`);
              setFatos((fs) => fs.filter((f) => f.id !== fato.id));
            } catch {
              Alert.alert('Erro', 'Não foi possível apagar.');
            }
          },
        },
      ]
    );
  }

  const fatosPorCategoria = fatos.reduce<Record<string, Fato[]>>((acc, f) => {
    (acc[f.categoria] ||= []).push(f);
    return acc;
  }, {});

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <SafeAreaView style={styles.bg} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refresh}
              tintColor={tema.texto}
              onRefresh={async () => {
                setRefresh(true);
                await carregar();
                setRefresh(false);
              }}
            />
          }
        >
          <PageHeader kicker="O QUE O 1% APRENDEU" title="Sua trilha" />
          <Text style={styles.sub}>
            Esses são os padrões que o app extraiu dos seus relatos. Edite se estiver errado.
            Apague o que mudou.
          </Text>

          {carregando ? (
            <ActivityIndicator color={tema.texto} style={{ marginTop: 40 }} />
          ) : fatos.length === 0 ? (
            <View style={styles.vazio}>
              <Text style={styles.vazioTxt}>
                Nada aprendido ainda. Conta como foi o dia em "Ajustar" pra começar.
              </Text>
            </View>
          ) : (
            Object.entries(fatosPorCategoria).map(([cat, items]) => (
              <View key={cat} style={styles.bloco}>
                <Text style={styles.kicker}>
                  {(CATEGORIA_LABEL[cat] ?? cat).toUpperCase()}
                </Text>
                {items.map((f) => (
                  <View key={f.id} style={styles.fato}>
                    {editandoId === f.id ? (
                      <>
                        <TextInput
                          style={styles.input}
                          value={valorEditado}
                          onChangeText={setValorEditado}
                          multiline
                          autoFocus
                        />
                        <View style={styles.btnsLinha}>
                          <Pressable
                            style={[styles.btnSec, styles.btnRecusar]}
                            onPress={() => setEditandoId(null)}
                          >
                            <Text style={styles.btnRecusarTxt}>Cancelar</Text>
                          </Pressable>
                          <Pressable
                            style={[styles.btnSec, styles.btnAceitar]}
                            onPress={() => salvarEdicao(f)}
                          >
                            <Text style={styles.btnAceitarTxt}>Salvar</Text>
                          </Pressable>
                        </View>
                      </>
                    ) : (
                      <>
                        <Text style={styles.valor}>{f.valor}</Text>
                        <View style={styles.linhaMeta}>
                          <View style={styles.confiancaPill}>
                            <Text style={styles.confiancaPillTxt}>{f.confianca}</Text>
                          </View>
                          <View style={{ flex: 1 }} />
                          <Pressable
                            onPress={() => {
                              setValorEditado(f.valor);
                              setEditandoId(f.id);
                            }}
                            hitSlop={8}
                            style={styles.acaoBtn}
                          >
                            <Ionicons name="pencil-outline" size={16} color={tema.textoFraco} />
                          </Pressable>
                          <Pressable onPress={() => apagar(f)} hitSlop={8} style={styles.acaoBtn}>
                            <Ionicons name="trash-outline" size={16} color={tema.perigo} />
                          </Pressable>
                        </View>
                      </>
                    )}
                  </View>
                ))}
              </View>
            ))
          )}
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
  vazio: {
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  vazioTxt: {
    color: tema.textoFraco,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bloco: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: tema.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
  },
  kicker: {
    fontSize: 11,
    fontFamily: tema.fontFamily.textBold,
    letterSpacing: 1.2,
    color: tema.textoFraco,
    marginBottom: 10,
  },
  fato: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tema.borda,
  },
  valor: {
    color: tema.texto,
    fontSize: 14,
    lineHeight: 20,
  },
  linhaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 14,
  },
  confiancaPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: tema.bgInput,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
  },
  confiancaPillTxt: {
    color: tema.textoFraco,
    fontSize: 10,
    fontFamily: tema.fontFamily.textSemi,
    letterSpacing: 0.4,
  },
  acaoBtn: { padding: 4 },
  input: {
    minHeight: 60,
    color: tema.texto,
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: tema.bgInput,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  btnsLinha: { flexDirection: 'row', gap: 8, marginTop: 8 },
  btnSec: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  btnAceitar: { backgroundColor: tema.acento },
  btnRecusar: { borderWidth: 1, borderColor: tema.bordaForte },
  btnAceitarTxt: { color: '#F5F1E5', fontFamily: tema.fontFamily.textBold, fontSize: 14 },
  btnRecusarTxt: { color: tema.texto, fontFamily: tema.fontFamily.textSemi, fontSize: 14 },
});
