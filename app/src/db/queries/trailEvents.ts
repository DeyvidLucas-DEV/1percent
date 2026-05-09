import * as Crypto from 'expo-crypto';
import { getDb } from '../schema';
import { agoraIso } from '../../lib/datas';
import { getDeviceId, getSessionId } from '../../lib/deviceId';

// Eventos da spec §3 da v3. Outros tipos podem ser adicionados sem mudar schema:
// o tipo é TEXT livre e o payload é JSON.
export type TipoEventoTrilha =
  | 'task_status_changed'
  | 'daily_note_submitted'
  | 'voice_note_transcribed'
  | 'suggestion_presented'
  | 'suggestion_accepted'
  | 'suggestion_rejected'
  | 'weekly_plan_generated'
  | 'stressor_reported'
  | 'memory_fact_edited'
  | 'memory_fact_deleted';

export type SourceEvento = 'app' | 'ai' | 'sync' | 'system';

export type EventoTrilha = {
  id: string;
  tipo: string;
  occurred_at: string;
  source: string;
  area_id: number | null;
  tarefa_id: number | null;
  session_id: string | null;
  device_id: string | null;
  payload_json: string;
  privacy_level: string;
  synced_at: string | null;
  created_at: string;
};

export async function inserirEvento(dados: {
  tipo: TipoEventoTrilha | string;
  source?: SourceEvento;
  areaId?: number | null;
  tarefaId?: number | null;
  payload?: Record<string, unknown>;
  occurredAt?: string;
  privacyLevel?: 'private' | 'shared_with_ai';
}): Promise<string> {
  const db = await getDb();
  const id = Crypto.randomUUID();
  const agora = agoraIso();
  const deviceId = await getDeviceId();
  const sessionId = getSessionId();

  await db.runAsync(
    `INSERT INTO user_trail_events
      (id, tipo, occurred_at, source, area_id, tarefa_id, session_id, device_id,
       payload_json, privacy_level, synced_at, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,NULL,?)`,
    [
      id,
      dados.tipo,
      dados.occurredAt ?? agora,
      dados.source ?? 'app',
      dados.areaId ?? null,
      dados.tarefaId ?? null,
      sessionId,
      deviceId,
      JSON.stringify(dados.payload ?? {}),
      dados.privacyLevel ?? 'private',
      agora,
    ]
  );
  return id;
}

export async function listarEventosPendentes(limite = 100): Promise<EventoTrilha[]> {
  const db = await getDb();
  return db.getAllAsync<EventoTrilha>(
    `SELECT * FROM user_trail_events
     WHERE synced_at IS NULL
     ORDER BY occurred_at ASC
     LIMIT ?`,
    [limite]
  );
}

export async function marcarSincronizados(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE user_trail_events SET synced_at = ? WHERE id IN (${placeholders})`,
    [agoraIso(), ...ids]
  );
}

export async function contarEventosPendentes(): Promise<number> {
  const db = await getDb();
  const r = await db.getFirstAsync<{ n: number }>(
    `SELECT count(*) as n FROM user_trail_events WHERE synced_at IS NULL`
  );
  return r?.n ?? 0;
}
