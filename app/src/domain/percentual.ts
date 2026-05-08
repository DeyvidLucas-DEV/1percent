import type { Tarefa, Execucao, StatusExecucao } from '../db/types';

const PESO_STATUS: Record<StatusExecucao, number> = {
  concluido: 1.0,
  parcial: 0.5,
  nao_feito: 0.0,
};

/**
 * Quantas vezes a tarefa "deveria aparecer" em uma janela de N dias.
 * - diária: N
 * - semanal: alvo_count * (N/7)
 * - mensal: alvo_count * (N/30)
 */
function ocorrenciasNaJanela(t: Tarefa, dias: number): number {
  switch (t.frequencia) {
    case 'diaria':
      return dias;
    case 'semanal':
      return (t.alvo_count * dias) / 7;
    case 'mensal':
      return (t.alvo_count * dias) / 30;
  }
}

/**
 * Calcula % de uma área dado um set de tarefas e execuções já filtradas no período.
 */
export function percentualArea(
  tarefas: Tarefa[],
  execucoesPeriodo: Execucao[],
  diasNaJanela: number
): number {
  if (tarefas.length === 0) return 0;

  let pesoEsperado = 0;
  let pesoRealizado = 0;

  for (const t of tarefas) {
    const ocorrencias = ocorrenciasNaJanela(t, diasNaJanela);
    pesoEsperado += t.peso * ocorrencias;
  }

  for (const e of execucoesPeriodo) {
    const t = tarefas.find(x => x.id === e.tarefa_id);
    if (!t) continue;
    pesoRealizado += t.peso * PESO_STATUS[e.status];
  }

  if (pesoEsperado === 0) return 0;
  const pct = (pesoRealizado / pesoEsperado) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

/**
 * % geral do "Alvo de Vida" — média ponderada das áreas pelo peso_global.
 */
export function percentualGeral(
  porArea: { areaId: number; pesoGlobal: number; percentual: number }[]
): number {
  const ativas = porArea.filter(a => a.percentual !== null && a.percentual !== undefined);
  if (ativas.length === 0) return 0;
  const numerador = ativas.reduce((s, a) => s + a.pesoGlobal * a.percentual, 0);
  const denominador = ativas.reduce((s, a) => s + a.pesoGlobal, 0);
  return Math.round(numerador / denominador);
}
