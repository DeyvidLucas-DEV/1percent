import { getDb } from '../schema';

export async function getLastPullAt(): Promise<string | null> {
  const db = await getDb();
  const r = await db.getFirstAsync<{ last_pull_at: string | null }>(
    `SELECT last_pull_at FROM sync_state WHERE id = 1`
  );
  return r?.last_pull_at ?? null;
}

export async function setLastPullAt(iso: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE sync_state SET last_pull_at = ? WHERE id = 1`, [iso]);
}
