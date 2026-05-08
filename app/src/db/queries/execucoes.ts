import { getDb } from '../schema';
import type { Execucao } from '../types';

export async function execucoesEntre(
  dataInicio: string,
  dataFim: string
): Promise<Execucao[]> {
  const db = await getDb();
  return db.getAllAsync<Execucao>(
    `SELECT * FROM execucoes WHERE data BETWEEN ? AND ? ORDER BY data ASC`,
    [dataInicio, dataFim]
  );
}

export async function execucoesPorArea(
  areaId: number,
  dataInicio: string,
  dataFim: string
): Promise<Execucao[]> {
  const db = await getDb();
  return db.getAllAsync<Execucao>(
    `SELECT e.* FROM execucoes e
     JOIN tarefas t ON t.id = e.tarefa_id
     WHERE t.area_id = ? AND e.data BETWEEN ? AND ?
     ORDER BY e.data ASC`,
    [areaId, dataInicio, dataFim]
  );
}
