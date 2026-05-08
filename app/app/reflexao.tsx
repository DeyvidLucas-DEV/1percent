import { useEffect, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { tema } from '../src/lib/tema';
import { Botao } from '../src/components/Botao';
import { perguntaDoDia } from '../src/domain/reflexoes';
import { hojeIso, agoraIso } from '../src/lib/datas';
import { getDb } from '../src/db/schema';

export default function Reflexao() {
  const router = useRouter();
  const hoje = hojeIso();
  const pergunta = perguntaDoDia(hoje);
  const [resposta, setResposta] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const r = await db.getFirstAsync<{ resposta: string | null }>(
        `SELECT resposta FROM reflexoes_diarias WHERE data = ?`,
        [hoje]
      );
      if (r?.resposta) setResposta(r.resposta);
    })();
  }, []);

  async function salvar() {
    if (!resposta.trim()) {
      Alert.alert('Vazio', 'Mesmo uma frase serve. Não precisa ser perfeito.');
      return;
    }
    setSalvando(true);
    try {
      const db = await getDb();
      await db.runAsync(
        `INSERT INTO reflexoes_diarias (data, pergunta, resposta, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(data) DO UPDATE SET resposta = excluded.resposta`,
        [hoje, pergunta, resposta.trim(), agoraIso()]
      );
      router.back();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.container}>
      <Text style={styles.data}>Hoje · {hoje}</Text>
      <Text style={styles.pergunta}>{pergunta}</Text>

      <TextInput
        value={resposta}
        onChangeText={setResposta}
        placeholder="Resposta curta..."
        placeholderTextColor={tema.textoFraco}
        multiline
        style={styles.textarea}
        autoFocus
      />

      <View style={{ height: tema.espacamento.lg }} />
      <Botao titulo="Salvar reflexão" onPress={salvar} carregando={salvando} />
      <View style={{ height: tema.espacamento.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { padding: tema.espacamento.lg },
  data: { color: tema.textoFraco, fontSize: tema.fonte.pequeno, letterSpacing: 1, marginBottom: tema.espacamento.sm },
  pergunta: {
    color: tema.texto,
    fontSize: tema.fonte.titulo,
    fontWeight: '600',
    lineHeight: 36,
    marginBottom: tema.espacamento.lg,
  },
  textarea: {
    backgroundColor: tema.bgInput,
    color: tema.texto,
    borderRadius: tema.raio,
    padding: tema.espacamento.md,
    minHeight: 160,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: tema.borda,
    fontSize: tema.fonte.corpo,
  },
});
