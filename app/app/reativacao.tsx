import { useEffect, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { tema } from '../src/lib/tema';
import { Botao } from '../src/components/Botao';
import { listarTarefasAtivas, marcarExecucao } from '../src/db/queries/tarefas';
import { listarAreas } from '../src/db/queries/areas';
import { hojeIso, agoraIso } from '../src/lib/datas';
import { getDb } from '../src/db/schema';
import { carregarDashboard } from '../src/domain/agregados';
import type { Tarefa, Area } from '../src/db/types';

export default function Reativacao() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [marcadas, setMarcadas] = useState<Set<number>>(new Set());
  const [explicacao, setExplicacao] = useState('');
  const [diasPulados, setDiasPulados] = useState(0);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      const [a, t, d] = await Promise.all([
        listarAreas(false),
        listarTarefasAtivas(),
        carregarDashboard(),
      ]);
      setAreas(a);
      setTarefas(t);
      setDiasPulados(d.diasPulados);
    })();
  }, []);

  // se obrigatório fazer 1 de cada área quando dias pulados >= 3
  const exigeUmaPorArea = diasPulados >= 3;
  const obrigatorias = areas.filter(a => a.obrigatoria);

  const idsObrigMarcadas = new Set(
    Array.from(marcadas).map(id => tarefas.find(t => t.id === id)?.area_id).filter(Boolean) as number[]
  );

  function liberouSair(): boolean {
    if (marcadas.size === 0) return false;
    if (exigeUmaPorArea) {
      return obrigatorias.every(a => idsObrigMarcadas.has(a.id));
    }
    return true;
  }

  async function desbloquear() {
    if (!liberouSair()) {
      Alert.alert(
        'Ainda não',
        exigeUmaPorArea
          ? 'Marque pelo menos 1 tarefa de cada área obrigatória.'
          : 'Marque pelo menos 1 tarefa concluída agora.'
      );
      return;
    }
    setSalvando(true);
    try {
      const db = await getDb();
      for (const tid of marcadas) {
        await marcarExecucao(tid, 'concluido', hojeIso());
      }
      await db.runAsync(
        `INSERT INTO eventos (data, tipo, payload_json, created_at) VALUES (?, 'reativacao', ?, ?)`,
        [hojeIso(), JSON.stringify({ diasPulados, explicacao, tarefasMarcadas: Array.from(marcadas) }), agoraIso()]
      );
      router.replace('/');
    } finally {
      setSalvando(false);
    }
  }

  function toggle(tid: number) {
    const novo = new Set(marcadas);
    if (novo.has(tid)) novo.delete(tid);
    else novo.add(tid);
    setMarcadas(novo);
  }

  const tomDireto = diasPulados >= 3;

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.container}>
      <View style={styles.alertBox}>
        <Text style={styles.alertTag}>REATIVAÇÃO</Text>
        <Text style={styles.alertTitulo}>
          {diasPulados} {diasPulados === 1 ? 'dia' : 'dias'} sem cumprir o mínimo.
        </Text>
        <Text style={styles.alertTxt}>
          {tomDireto
            ? 'Sem rodeio: você abandonou. Pra voltar, marca 1 tarefa de cada área obrigatória, agora.'
            : 'Voltar é a única coisa que importa. Não é sobre intensidade — é sobre presença. Marca pelo menos 1 tarefa pra desbloquear.'}
        </Text>
      </View>

      <Text style={styles.label}>O que aconteceu? (opcional, mas ajuda)</Text>
      <TextInput
        value={explicacao}
        onChangeText={setExplicacao}
        placeholder="Escreve em uma frase..."
        placeholderTextColor={tema.textoFraco}
        multiline
        style={styles.textarea}
      />

      <Text style={[styles.label, { marginTop: tema.espacamento.lg }]}>
        {tomDireto ? 'Marca 1 de cada área obrigatória' : 'Marca 1+ tarefa concluída agora'}
      </Text>

      {areas.map(a => {
        const t = tarefas.filter(t => t.area_id === a.id);
        if (t.length === 0) return null;
        const obrigatoria = a.obrigatoria;
        const cumprida = idsObrigMarcadas.has(a.id);
        return (
          <View key={a.id} style={styles.bloco}>
            <Text style={[
              styles.areaNome,
              { color: a.cor_base },
              (tomDireto && !!obrigatoria && !cumprida) ? { color: tema.perigo } : null,
            ]}>
              {a.nome} {tomDireto && !!obrigatoria ? (cumprida ? '✓' : '· obrigatória') : ''}
            </Text>
            {t.map(x => {
              const sel = marcadas.has(x.id);
              return (
                <View key={x.id} style={[styles.tar, sel && { borderColor: tema.sucesso }]}>
                  <Text style={styles.tarNome} onPress={() => toggle(x.id)}>
                    {sel ? '✓ ' : '○ '} {x.nome}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      })}

      <View style={{ height: tema.espacamento.lg }} />
      <Botao
        titulo={liberouSair() ? 'Desbloquear e voltar' : 'Ainda bloqueado'}
        onPress={desbloquear}
        disabled={!liberouSair()}
        carregando={salvando}
      />
      <View style={{ height: tema.espacamento.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { padding: tema.espacamento.lg },
  alertBox: {
    backgroundColor: '#3a1a1a',
    borderRadius: tema.raio,
    padding: tema.espacamento.md,
    marginBottom: tema.espacamento.lg,
    borderLeftWidth: 4,
    borderLeftColor: tema.perigo,
  },
  alertTag: { color: tema.perigo, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  alertTitulo: { color: tema.texto, fontSize: tema.fonte.subtitulo, fontWeight: '700', marginBottom: tema.espacamento.sm },
  alertTxt: { color: tema.texto, fontSize: tema.fonte.corpo, lineHeight: 22 },
  label: { color: tema.textoFraco, fontSize: tema.fonte.pequeno, marginBottom: tema.espacamento.sm },
  textarea: {
    backgroundColor: tema.bgInput,
    color: tema.texto,
    borderRadius: tema.raio,
    padding: tema.espacamento.md,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: tema.borda,
  },
  bloco: { marginBottom: tema.espacamento.md },
  areaNome: { fontSize: tema.fonte.corpo, fontWeight: '700', marginBottom: tema.espacamento.sm },
  tar: {
    backgroundColor: tema.bgCard,
    borderRadius: tema.raio,
    paddingVertical: 10,
    paddingHorizontal: tema.espacamento.md,
    marginBottom: tema.espacamento.xs,
    borderWidth: 1,
    borderColor: tema.borda,
  },
  tarNome: { color: tema.texto, fontSize: tema.fonte.corpo },
});
