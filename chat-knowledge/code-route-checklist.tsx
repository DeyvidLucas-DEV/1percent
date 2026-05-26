import { useEffect, useState, useCallback } from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { tema } from '../src/lib/tema';
import { listarAreas } from '../src/db/queries/areas';
import { listarTarefasAtivas, execucoesDoDia, marcarExecucao, removerExecucao } from '../src/db/queries/tarefas';
import { hojeIso } from '../src/lib/datas';
import { feedbackStatus } from '../src/lib/haptics';
import { PunchOnChange } from '../src/components/ui/PunchOnChange';
import type { Area, Tarefa, StatusExecucao } from '../src/db/types';

type LinhaTarefa = Tarefa & { status: StatusExecucao | null };

export default function Checklist() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [tarefas, setTarefas] = useState<LinhaTarefa[]>([]);

  async function carregar() {
    const a = await listarAreas(false);
    const t = await listarTarefasAtivas();
    const e = await execucoesDoDia(hojeIso());
    const map = new Map(e.map(x => [x.tarefa_id, x.status]));
    setAreas(a);
    setTarefas(t.map(x => ({ ...x, status: map.get(x.id) ?? null })));
  }

  useFocusEffect(useCallback(() => { carregar(); }, []));

  async function ciclar(t: LinhaTarefa) {
    // null → concluido → parcial → nao_feito → null
    const proximo: StatusExecucao | null =
      t.status === null      ? 'concluido' :
      t.status === 'concluido' ? 'parcial' :
      t.status === 'parcial'   ? 'nao_feito' :
                                 null;
    // Otimismo: muda local primeiro pra animação e haptic dispararem antes do DB.
    feedbackStatus(proximo);
    setTarefas(prev => prev.map(x => x.id === t.id ? { ...x, status: proximo } : x));
    if (proximo === null) {
      await removerExecucao(t.id, hojeIso());
    } else {
      await marcarExecucao(t.id, proximo, hojeIso());
    }
  }

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.container}>
      {areas.map(area => {
        const ta = tarefas.filter(t => t.area_id === area.id);
        if (ta.length === 0) return null;
        return (
          <View key={area.id} style={styles.bloco}>
            <View style={[styles.areaHeader, { borderLeftColor: area.cor_base }]}>
              <Text style={styles.areaNome}>{area.nome}</Text>
            </View>
            {ta.map(t => (
              <Pressable
                key={t.id}
                onPress={() => ciclar(t)}
                style={[
                  styles.tarefa,
                  t.status === 'concluido' && styles.tarefaConcluida,
                  t.status === 'parcial'   && styles.tarefaParcial,
                  t.status === 'nao_feito' && styles.tarefaNao,
                ]}
              >
                <PunchOnChange trigger={t.status}>
                  <View style={[styles.checkbox, statusEstilo(t.status)]}>
                    <Text style={styles.checkTxt}>{statusIcone(t.status)}</Text>
                  </View>
                </PunchOnChange>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tarefaNome}>{t.nome}</Text>
                  <Text style={styles.tarefaSub}>
                    Peso {t.peso} · {labelFreq(t)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        );
      })}
      <View style={styles.legenda}>
        <Text style={styles.legendaTxt}>Toque pra ciclar: vazio → ✓ feito → ◐ parcial → ✗ não feito → vazio</Text>
      </View>
      <View style={{ height: tema.espacamento.xl }} />
    </ScrollView>
  );
}

function statusIcone(s: StatusExecucao | null): string {
  if (s === 'concluido') return '✓';
  if (s === 'parcial')   return '◐';
  if (s === 'nao_feito') return '✗';
  return '';
}

function statusEstilo(s: StatusExecucao | null) {
  if (s === 'concluido') return { backgroundColor: tema.sucesso, borderColor: tema.sucesso };
  if (s === 'parcial')   return { backgroundColor: tema.alerta, borderColor: tema.alerta };
  if (s === 'nao_feito') return { backgroundColor: tema.perigo, borderColor: tema.perigo };
  return {};
}

function labelFreq(t: Tarefa): string {
  if (t.frequencia === 'diaria') return 'diária';
  if (t.frequencia === 'semanal') return `${t.alvo_count}x/semana`;
  return `${t.alvo_count}x/mês`;
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { padding: tema.espacamento.md },
  bloco: { marginBottom: tema.espacamento.md },
  areaHeader: {
    borderLeftWidth: 4,
    paddingLeft: tema.espacamento.sm,
    marginBottom: tema.espacamento.sm,
  },
  areaNome: { color: tema.texto, fontSize: tema.fonte.subtitulo, fontWeight: '700' },
  tarefa: {
    backgroundColor: tema.bgCard,
    borderRadius: tema.raio,
    padding: tema.espacamento.md,
    marginBottom: tema.espacamento.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tema.espacamento.md,
  },
  tarefaConcluida: { opacity: 0.85 },
  tarefaParcial: {},
  tarefaNao: { opacity: 0.65 },
  checkbox: {
    width: 30, height: 30, borderRadius: 8,
    borderWidth: 2, borderColor: tema.borda,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: tema.bgInput,
  },
  checkTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  tarefaNome: { color: tema.texto, fontSize: tema.fonte.corpo },
  tarefaSub: { color: tema.textoFraco, fontSize: 12, marginTop: 2 },
  legenda: { marginTop: tema.espacamento.md, padding: tema.espacamento.sm },
  legendaTxt: { color: tema.textoFraco, fontSize: 12, textAlign: 'center' },
});
