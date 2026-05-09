import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/client.ts';
import { userTrailEvents } from '../db/schema.ts';
import { exigirAuth } from '../auth/middleware.ts';

export const trailRoutes = new Hono();
trailRoutes.use('*', exigirAuth);

const eventoSchema = z.object({
  id: z.string().uuid(),
  tipo: z.string().min(1).max(64),
  occurred_at: z.string(),
  source: z.enum(['app', 'ai', 'sync', 'system']),
  area_id: z.number().int().nullable().optional(),
  tarefa_id: z.number().int().nullable().optional(),
  session_id: z.string().nullable().optional(),
  device_id: z.string().nullable().optional(),
  payload: z.record(z.unknown()).optional(),
  privacy_level: z.string().optional(),
});

const batchSchema = z.object({
  eventos: z.array(eventoSchema).min(1).max(500),
});

trailRoutes.post('/batch', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => null);
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'bad_request', issues: parsed.error.issues }, 400);
  }

  const linhas = parsed.data.eventos.map((e) => ({
    userId,
    id: e.id,
    tipo: e.tipo,
    occurredAt: new Date(e.occurred_at),
    source: e.source,
    areaId: e.area_id ?? null,
    tarefaId: e.tarefa_id ?? null,
    sessionId: e.session_id ?? null,
    deviceId: e.device_id ?? null,
    payloadJson: e.payload ?? {},
    privacyLevel: e.privacy_level ?? 'private',
  }));

  // Idempotência: ON CONFLICT DO NOTHING. Reenviar o mesmo evento é no-op.
  await db.insert(userTrailEvents).values(linhas).onConflictDoNothing({
    target: [userTrailEvents.userId, userTrailEvents.id],
  });

  return c.json({
    ok: true,
    serverNow: new Date().toISOString(),
    recebidos: linhas.length,
  });
});
