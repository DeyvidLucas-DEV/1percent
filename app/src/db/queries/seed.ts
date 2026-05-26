import { getDb } from '../schema';
import { listarTarefasAtivas, marcarExecucao } from './tarefas';
import { ultimosNDias } from '../../lib/datas';
import type { StatusExecucao } from '../types';

// Distribuição realista enviesada pra "concluido" pra os gráficos parecerem vivos
// sem mascarar o tom honesto (quase 1/4 fica parcial/nao_feito).
const PESOS_STATUS: { status: StatusExecucao | null; peso: number }[] = [
  { status: 'concluido', peso: 50 },
  { status: 'parcial',   peso: 25 },
  { status: 'nao_feito', peso: 15 },
  { status: null,        peso: 10 },
];

function sortearStatus(): StatusExecucao | null {
  const total = PESOS_STATUS.reduce((s, x) => s + x.peso, 0);
  let r = Math.random() * total;
  for (const x of PESOS_STATUS) {
    r -= x.peso;
    if (r <= 0) return x.status;
  }
  return PESOS_STATUS[0]!.status;
}

export async function popularUltimos30Dias(): Promise<{ inseridos: number; dias: number; tarefas: number }> {
  const tarefas = await listarTarefasAtivas();
  if (tarefas.length === 0) return { inseridos: 0, dias: 0, tarefas: 0 };
  const dias = ultimosNDias(30);
  let inseridos = 0;
  for (const data of dias) {
    for (const t of tarefas) {
      const status = sortearStatus();
      if (!status) continue;
      await marcarExecucao(t.id, status, data);
      inseridos++;
    }
  }
  return { inseridos, dias: dias.length, tarefas: tarefas.length };
}

export async function limparExecucoes(): Promise<number> {
  const db = await getDb();
  const r = await db.runAsync(`DELETE FROM execucoes`);
  return r.changes ?? 0;
}
