import { getDb } from '../schema';
import type { Reflexao } from '../types';

export async function listarReflexoes(limite = 10): Promise<Reflexao[]> {
  const db = await getDb();
  return db.getAllAsync<Reflexao>(
    `SELECT * FROM reflexoes_diarias
     WHERE resposta IS NOT NULL AND TRIM(resposta) <> ''
     ORDER BY data DESC LIMIT ?`,
    [limite]
  );
}
