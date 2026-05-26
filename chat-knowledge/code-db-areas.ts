import { getDb } from '../schema';
import type { Area } from '../types';
import { agoraIso, hojeIso } from '../../lib/datas';

export async function listarAreas(incluirPausadas = false): Promise<Area[]> {
  const db = await getDb();
  const hoje = hojeIso();
  const where = incluirPausadas
    ? '1=1'
    : `(ativa = 1 AND (paused_until IS NULL OR paused_until <= '${hoje}'))`;
  return db.getAllAsync<Area>(
    `SELECT * FROM areas WHERE ${where} ORDER BY ordem ASC`
  );
}

export async function listarTodasAreas(): Promise<Area[]> {
  const db = await getDb();
  return db.getAllAsync<Area>('SELECT * FROM areas ORDER BY ordem ASC');
}

export async function buscarAreaPorId(id: number): Promise<Area | null> {
  const db = await getDb();
  const r = await db.getFirstAsync<Area>(`SELECT * FROM areas WHERE id = ?`, [id]);
  return r ?? null;
}

export async function pausarArea(
  areaId: number,
  pausarAte: string,
  reason: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE areas SET ativa = 0, paused_until = ?, pause_reason = ? WHERE id = ?`,
    [pausarAte, reason, areaId]
  );
  await db.runAsync(
    `INSERT INTO eventos (data, tipo, payload_json, created_at) VALUES (?, 'area_pausada', ?, ?)`,
    [hojeIso(), JSON.stringify({ areaId, pausarAte, reason }), agoraIso()]
  );
}

export async function reativarArea(areaId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE areas SET ativa = 1, paused_until = NULL, pause_reason = NULL WHERE id = ?`,
    [areaId]
  );
}

export async function setPesoGlobal(areaId: number, peso: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE areas SET peso_global = ? WHERE id = ?`, [peso, areaId]);
}
