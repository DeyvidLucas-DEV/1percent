import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tema } from '../../src/lib/tema';
import { Botao } from '../../src/components/Botao';
import {
  buscarTarefaPorId,
  criarTarefa,
  atualizarTarefa,
  inativarTarefa,
  reativarTarefa,
} from '../../src/db/queries/tarefas';
import { buscarAreaPorId } from '../../src/db/queries/areas';
import type { Frequencia, Tarefa, Area } from '../../src/db/types';

const PESO_OPCOES: { valor: 1 | 2 | 3; label: string }[] = [
  { valor: 1, label: '1 — leve' },
  { valor: 2, label: '2 — médio' },
  { valor: 3, label: '3 — pesado' },
];

const FREQ_OPCOES: { valor: Frequencia; label: string }[] = [
  { valor: 'diaria', label: 'Diária' },
  { valor: 'semanal', label: 'Semanal' },
  { valor: 'mensal', label: 'Mensal' },
];

function validarHorario(s: string): boolean {
  if (!s) return true;
  return /^\d{2}:\d{2}$/.test(s) && Number(s.slice(0, 2)) < 24 && Number(s.slice(3, 5)) < 60;
}

export default function EditorTarefa() {
  const router = useRouter();
  const { id, area } = useLocalSearchParams<{ id: string; area?: string }>();
  const ehNovo = id === 'novo';
  const tarefaId = ehNovo ? null : Number(id);
  const areaIdInicial = area ? Number(area) : null;

  const [tarefa, setTarefa] = useState<Tarefa | null>(null);
  const [areaInfo, setAreaInfo] = useState<Area | null>(null);
  const [nome, setNome] = useState('');
  const [peso, setPeso] = useState<1 | 2 | 3>(1);
  const [frequencia, setFrequencia] = useState<Frequencia>('diaria');
  const [alvoCount, setAlvoCount] = useState('1');
  const [horario, setHorario] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      if (ehNovo && areaIdInicial) {
        setAreaInfo(await buscarAreaPorId(areaIdInicial));
      } else if (tarefaId) {
        const t = await buscarTarefaPorId(tarefaId);
        if (t) {
          setTarefa(t);
          setNome(t.nome);
          setPeso(t.peso);
          setFrequencia(t.frequencia);
          setAlvoCount(String(t.alvo_count));
          setHorario(t.horario ?? '');
          setAreaInfo(await buscarAreaPorId(t.area_id));
        }
      }
    })();
  }, [ehNovo, tarefaId, areaIdInicial]);

  async function salvar() {
    if (!nome.trim()) {
      Alert.alert('Falta o nome', 'Toda tarefa precisa de nome.');
      return;
    }
    if (!validarHorario(horario)) {
      Alert.alert('Horário inválido', 'Use o formato HH:MM (ex: 06:30) ou deixe vazio.');
      return;
    }
    const alvo = Number(alvoCount) || 1;
    if (alvo < 1) {
      Alert.alert('Alvo inválido', 'Quantas vezes na semana/mês?');
      return;
    }

    setSalvando(true);
    try {
      const horarioFinal = horario.trim() === '' ? null : horario.trim();
      if (ehNovo) {
        const aId = areaIdInicial;
        if (!aId) throw new Error('area_id ausente');
        await criarTarefa({ areaId: aId, nome: nome.trim(), peso, frequencia, alvoCount: alvo, horario: horarioFinal });
      } else if (tarefaId) {
        await atualizarTarefa(tarefaId, { nome: nome.trim(), peso, frequencia, alvoCount: alvo, horario: horarioFinal });
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', String(e?.message ?? e));
    } finally {
      setSalvando(false);
    }
  }

  function desativar() {
    if (!tarefaId) return;
    Alert.alert(
      'Desativar tarefa',
      'A tarefa some das listas. Os dados antigos ficam pra estatísticas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            await inativarTarefa(tarefaId);
            router.back();
          },
        },
      ]
    );
  }

  async function reativar() {
    if (!tarefaId) return;
    await reativarTarefa(tarefaId);
    setTarefa(prev => (prev ? { ...prev, ativa: 1 } : prev));
  }

  return (
    <>
      <Stack.Screen options={{ title: ehNovo ? 'Nova tarefa' : 'Editar tarefa' }} />
      <SafeAreaView style={styles.bg} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          {areaInfo && (
            <View style={styles.areaTag}>
              <View style={[styles.areaDot, { backgroundColor: areaInfo.cor_base }]} />
              <Text style={styles.areaNome}>{areaInfo.nome}</Text>
            </View>
          )}

          <Text style={styles.label}>NOME</Text>
          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Ex: Treino, Devocional, Conferir saldo..."
            placeholderTextColor={tema.textoFraco}
            style={styles.input}
            autoFocus={ehNovo}
          />

          <Text style={styles.label}>PESO</Text>
          <View style={styles.segRow}>
            {PESO_OPCOES.map(opc => (
              <Pressable
                key={opc.valor}
                onPress={() => setPeso(opc.valor)}
                style={[styles.segBtn, peso === opc.valor && styles.segBtnAtivo]}
              >
                <Text style={[styles.segTxt, peso === opc.valor && styles.segTxtAtivo]}>
                  {opc.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>FREQUÊNCIA</Text>
          <View style={styles.segRow}>
            {FREQ_OPCOES.map(opc => (
              <Pressable
                key={opc.valor}
                onPress={() => setFrequencia(opc.valor)}
                style={[styles.segBtn, frequencia === opc.valor && styles.segBtnAtivo]}
              >
                <Text style={[styles.segTxt, frequencia === opc.valor && styles.segTxtAtivo]}>
                  {opc.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {frequencia !== 'diaria' && (
            <>
              <Text style={styles.label}>QUANTAS VEZES POR {frequencia === 'semanal' ? 'SEMANA' : 'MÊS'}</Text>
              <TextInput
                value={alvoCount}
                onChangeText={setAlvoCount}
                keyboardType="number-pad"
                style={styles.input}
                maxLength={2}
              />
            </>
          )}

          <Text style={styles.label}>HORÁRIO (OPCIONAL)</Text>
          <TextInput
            value={horario}
            onChangeText={setHorario}
            placeholder="HH:MM (ex: 06:30) — deixe vazio se não tiver hora fixa"
            placeholderTextColor={tema.textoFraco}
            style={styles.input}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
          <Text style={styles.dica}>
            Se preencher, a tarefa aparece no horário no Hoje e fica marcada como atrasada se passar.
          </Text>

          <View style={{ height: 24 }} />
          <Botao titulo={ehNovo ? 'Criar' : 'Salvar'} onPress={salvar} carregando={salvando} />

          {!ehNovo && tarefa && (
            <View style={{ marginTop: 12 }}>
              {tarefa.ativa ? (
                <Pressable style={styles.botaoSec} onPress={desativar}>
                  <Text style={styles.botaoSecTxt}>Desativar tarefa</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.botaoSec} onPress={reativar}>
                  <Text style={[styles.botaoSecTxt, { color: tema.sucesso }]}>Reativar tarefa</Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { padding: 20 },
  areaTag: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  areaDot: { width: 10, height: 10, borderRadius: 2 },
  areaNome: { color: tema.textoFraco, fontSize: 13, fontWeight: '600' },
  label: {
    color: tema.textoFraco,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: tema.bgInput,
    color: tema.texto,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
  },
  segRow: { flexDirection: 'row', gap: 8 },
  segBtn: {
    flex: 1,
    backgroundColor: tema.bgInput,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
  },
  segBtnAtivo: { backgroundColor: tema.acento, borderColor: tema.acento },
  segTxt: { color: tema.textoFraco, fontSize: 13, fontWeight: '600' },
  segTxtAtivo: { color: '#fff' },
  dica: { color: tema.textoFraco, fontSize: 12, marginTop: 6, lineHeight: 18 },
  botaoSec: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  botaoSecTxt: { color: tema.perigo, fontSize: 14, fontWeight: '600' },
});
