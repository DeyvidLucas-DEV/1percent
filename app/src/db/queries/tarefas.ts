import { getDb } from '../schema';
import type { Tarefa, Execucao, StatusExecucao } from '../types';
import { agoraIso, hojeIso } from '../../lib/datas';
import { parseISO, getDay } from 'date-fns';
import { inserirEvento } from './trailEvents';

export async function listarTarefasAtivas(): Promise<Tarefa[]> {
  const db = await getDb();
  return db.getAllAsync<Tarefa>(
    `SELECT t.* FROM tarefas t
     JOIN areas a ON a.id = t.area_id
     WHERE t.ativa = 1 AND a.ativa = 1
     ORDER BY a.ordem, t.peso DESC`
  );
}

/**
 * Tarefas que devem aparecer no checklist de uma data específica.
 * - diárias: aparecem todo dia
 * - semanais: aparecem todos os dias da semana até o alvo_count ser cumprido
 * - mensais: aparecem todos os dias do mês até o alvo_count ser cumprido
 */
export async function tarefasDoDia(data: string = hojeIso()): Promise<Tarefa[]> {
  const todas = await listarTarefasAtivas();
  // Por simplicidade no MVP, mostramos todas as tarefas ativas. O usuário marca
  // só o que se aplica. Filtragem mais inteligente vem em v2.
  return todas;
}

export async function execucoesDoDia(data: string = hojeIso()): Promise<Execucao[]> {
  const db = await getDb();
  return db.getAllAsync<Execucao>(
    `SELECT * FROM execucoes WHERE data = ?`,
    [data]
  );
}

export type StatusVisualTarefa = 'open' | 'done' | 'half' | 'fail';
export type TarefaComExecucao = Tarefa & { status: StatusVisualTarefa };

const STATUS_MAP: Record<StatusExecucao, StatusVisualTarefa> = {
  concluido: 'done',
  parcial: 'half',
  nao_feito: 'fail',
};

export async function listarExecucoesDoDia(data: string = hojeIso()): Promise<TarefaComExecucao[]> {
  const tarefas = await listarTarefasAtivas();
  const execs = await execucoesDoDia(data);
  const byTarefa = new Map<number, StatusExecucao>();
  for (const e of execs) byTarefa.set(e.tarefa_id, e.status);
  return tarefas.map(t => ({ ...t, status: byTarefa.has(t.id) ? STATUS_MAP[byTarefa.get(t.id)!] : 'open' }));
}

export async function marcarExecucao(
  tarefaId: number,
  status: StatusExecucao,
  data: string = hojeIso()
): Promise<void> {
  const db = await getDb();
  const now = agoraIso();

  // Lê status anterior pra alimentar o evento da trilha. Não bloqueia se falhar.
  const anterior = await db
    .getFirstAsync<{ status: StatusExecucao }>(
      `SELECT status FROM execucoes WHERE tarefa_id = ? AND data = ?`,
      [tarefaId, data]
    )
    .catch(() => null);

  await db.runAsync(
    `INSERT INTO execucoes (tarefa_id, data, status, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(tarefa_id, data) DO UPDATE SET status = excluded.status`,
    [tarefaId, data, status, now]
  );

  // No-op silencioso se falhar — não pode quebrar o checklist.
  registrarEventoMudanca(tarefaId, anterior?.status ?? null, status, data).catch(() => {});
}

export async function removerExecucao(
  tarefaId: number,
  data: string = hojeIso()
): Promise<void> {
  const db = await getDb();
  const anterior = await db
    .getFirstAsync<{ status: StatusExecucao }>(
      `SELECT status FROM execucoes WHERE tarefa_id = ? AND data = ?`,
      [tarefaId, data]
    )
    .catch(() => null);

  await db.runAsync(
    `DELETE FROM execucoes WHERE tarefa_id = ? AND data = ?`,
    [tarefaId, data]
  );

  if (anterior?.status) {
    registrarEventoMudanca(tarefaId, anterior.status, null, data).catch(() => {});
  }
}

async function registrarEventoMudanca(
  tarefaId: number,
  statusAntes: StatusExecucao | null,
  statusDepois: StatusExecucao | null,
  data: string
): Promise<void> {
  const db = await getDb();
  const t = await db.getFirstAsync<{ area_id: number }>(
    `SELECT area_id FROM tarefas WHERE id = ?`,
    [tarefaId]
  );
  if (!t) return;
  await inserirEvento({
    tipo: 'task_status_changed',
    source: 'app',
    areaId: t.area_id,
    tarefaId,
    payload: { statusAntes, statusDepois, dataExecucao: data },
  });
}

export async function criarTarefa(dados: {
  areaId: number;
  nome: string;
  peso: 1 | 2 | 3;
  frequencia: 'diaria' | 'semanal' | 'mensal';
  alvoCount: number;
  horario: string | null;
}): Promise<number> {
  const db = await getDb();
  const r = await db.runAsync(
    `INSERT INTO tarefas (area_id, nome, peso, frequencia, alvo_count, ativa, created_at, horario)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    [dados.areaId, dados.nome, dados.peso, dados.frequencia, dados.alvoCount, agoraIso(), dados.horario]
  );
  return r.lastInsertRowId as number;
}

export async function buscarTarefaPorId(id: number): Promise<Tarefa | null> {
  const db = await getDb();
  const r = await db.getFirstAsync<Tarefa>(`SELECT * FROM tarefas WHERE id = ?`, [id]);
  return r ?? null;
}

export async function atualizarTarefa(id: number, dados: {
  nome: string;
  peso: 1 | 2 | 3;
  frequencia: 'diaria' | 'semanal' | 'mensal';
  alvoCount: number;
  horario: string | null;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE tarefas
     SET nome = ?, peso = ?, frequencia = ?, alvo_count = ?, horario = ?
     WHERE id = ?`,
    [dados.nome, dados.peso, dados.frequencia, dados.alvoCount, dados.horario, id]
  );
}

export async function inativarTarefa(tarefaId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE tarefas SET ativa = 0 WHERE id = ?`, [tarefaId]);
}

export async function reativarTarefa(tarefaId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE tarefas SET ativa = 1 WHERE id = ?`, [tarefaId]);
}
