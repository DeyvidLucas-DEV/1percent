import { getDb } from '../db/schema';
import { reagendarNotificacoesDeTarefas, type TarefaParaNotificar } from './notificacoes';

export async function reagendarTudo(): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: number; nome: string; horario: string; area_nome: string }>(
    `SELECT t.id, t.nome, t.horario, a.nome AS area_nome
     FROM tarefas t
     JOIN areas a ON a.id = t.area_id
     WHERE t.ativa = 1
       AND a.ativa = 1
       AND t.horario IS NOT NULL
       AND t.horario <> ''`
  );
  const lista: TarefaParaNotificar[] = rows.map(r => ({
    id: r.id,
    nome: r.nome,
    horario: r.horario,
    areaNome: r.area_nome,
  }));
  await reagendarNotificacoesDeTarefas(lista);
}
