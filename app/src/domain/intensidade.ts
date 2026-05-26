import type { Tarefa, Execucao } from '../db/types';
import { intensidade as INT_CORES } from '../lib/paleta';

export type Intensidade = 'leve' | 'moderada' | 'intensa' | 'desorganizada';

export const INTENSIDADE_ROTULO: Record<Intensidade, string> = {
  leve: 'Leve',
  moderada: 'Moderada',
  intensa: 'Intensa',
  desorganizada: 'Desorganizada',
};

export const INTENSIDADE_COR: Record<Intensidade, string> = INT_CORES;

function cargaSemanal(tarefas: Tarefa[]): number {
  return tarefas.reduce((s, t) => {
    if (t.frequencia === 'diaria') return s + t.peso * 7;
    if (t.frequencia === 'semanal') return s + t.peso * t.alvo_count;
    return s + (t.peso * t.alvo_count) / 4; // mensal aproximado
  }, 0);
}

function tarefasAtivasPorDia(tarefas: Tarefa[]): number {
  return tarefas.reduce((s, t) => {
    if (t.frequencia === 'diaria') return s + 1;
    if (t.frequencia === 'semanal') return s + t.alvo_count / 7;
    return s + t.alvo_count / 30;
  }, 0);
}

/**
 * Coeficiente de variação das execuções por dia.
 * CV alto (>0.6) = vida desorganizada (picos e vales sem padrão).
 */
function coeficienteVariacao(execucoesPorDia: Map<string, number>): number {
  const valores = Array.from(execucoesPorDia.values());
  if (valores.length < 7) return 0;
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  if (media === 0) return 0;
  const variancia =
    valores.reduce((s, v) => s + (v - media) ** 2, 0) / valores.length;
  const desvio = Math.sqrt(variancia);
  return desvio / media;
}

export function classificarIntensidade(
  tarefas: Tarefa[],
  execucoesUltimos28d: Execucao[]
): Intensidade {
  const carga = cargaSemanal(tarefas);
  const tarPorDia = tarefasAtivasPorDia(tarefas);

  const porDia = new Map<string, number>();
  for (const e of execucoesUltimos28d) {
    porDia.set(e.data, (porDia.get(e.data) ?? 0) + 1);
  }
  const cv = coeficienteVariacao(porDia);

  if (cv > 0.6 && porDia.size >= 14) return 'desorganizada';

  if (carga >= 70 || tarPorDia >= 10) return 'intensa';
  if (carga < 30 || tarPorDia < 4) return 'leve';
  return 'moderada';
}
