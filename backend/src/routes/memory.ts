import { Hono } from 'hono';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, gte } from 'drizzle-orm';
import { db } from '../db/client.ts';
import { userDailyReadings, userMemoryFacts, userTrailEvents } from '../db/schema.ts';
import { exigirAuth } from '../auth/middleware.ts';

export const memoryRoutes = new Hono();
memoryRoutes.use('*', exigirAuth);

memoryRoutes.get('/facts', async (c) => {
  const userId = c.get('userId');
  const incluirInativos = c.req.query('all') === '1';
  const cond = incluirInativos
    ? eq(userMemoryFacts.userId, userId)
    : and(eq(userMemoryFacts.userId, userId), eq(userMemoryFacts.active, true));

  const linhas = await db
    .select()
    .from(userMemoryFacts)
    .where(cond)
    .orderBy(desc(userMemoryFacts.updatedAt));

  return c.json({ facts: linhas });
});

const patchBody = z.object({
  valor: z.string().min(1).optional(),
  confianca: z.enum(['baixa', 'media', 'alta']).optional(),
  active: z.boolean().optional(),
});

memoryRoutes.patch('/facts/:id', async (c) => {
  const userId = c.get('userId');
  const factId = c.req.param('id');
  const parsed = patchBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'bad_request', issues: parsed.error.issues }, 400);
  }
  if (Object.keys(parsed.data).length === 0) {
    return c.json({ error: 'sem_mudancas' }, 400);
  }

  const agora = new Date();
  const r = await db
    .update(userMemoryFacts)
    .set({ ...parsed.data, updatedAt: agora })
    .where(and(eq(userMemoryFacts.userId, userId), eq(userMemoryFacts.id, factId)))
    .returning({ id: userMemoryFacts.id });

  if (r.length === 0) return c.json({ error: 'nao_encontrado' }, 404);

  await db.insert(userTrailEvents).values({
    userId,
    id: randomUUID(),
    tipo: 'memory_fact_edited',
    occurredAt: agora,
    source: 'app',
    payloadJson: { factId, mudancas: parsed.data },
  }).onConflictDoNothing({ target: [userTrailEvents.userId, userTrailEvents.id] });

  return c.json({ ok: true });
});

// Leituras emocionais do usuário no período. Alimenta o gráfico de tendência
// em Insights. range=week → últimos 7 dias; range=month → últimos 30 dias.
// Filtro mandatório por userId do JWT — JAMAIS aceita user_id do client.
// Retorno ordenado por data asc pra renderização direta no chart.
memoryRoutes.get('/mood', async (c) => {
  const userId = c.get('userId');
  const range = c.req.query('range') === 'month' ? 'month' : 'week';
  const dias = range === 'month' ? 30 : 7;

  // Janela calculada em UTC e formatada como YYYY-MM-DD. Como a coluna `data`
  // já é local do usuário, filtramos lexicograficamente — ordem ISO bate com
  // ordem cronológica. Margem de 1 dia evita cortar relatos perto da fronteira.
  const limite = new Date();
  limite.setDate(limite.getDate() - dias);
  const dataMinima = limite.toISOString().slice(0, 10);

  const linhas = await db
    .select({
      data: userDailyReadings.data,
      humorScore: userDailyReadings.humorScore,
      humorRotulo: userDailyReadings.humorRotulo,
      sinalAlerta: userDailyReadings.sinalAlerta,
    })
    .from(userDailyReadings)
    .where(
      and(
        eq(userDailyReadings.userId, userId),
        gte(userDailyReadings.data, dataMinima)
      )
    )
    .orderBy(asc(userDailyReadings.data));

  return c.json({ range, readings: linhas });
});

// Soft delete: marca active=false. Mantém histórico, evita perder fonte (origemEventId).
memoryRoutes.delete('/facts/:id', async (c) => {
  const userId = c.get('userId');
  const factId = c.req.param('id');
  const agora = new Date();

  const r = await db
    .update(userMemoryFacts)
    .set({ active: false, updatedAt: agora })
    .where(and(eq(userMemoryFacts.userId, userId), eq(userMemoryFacts.id, factId)))
    .returning({ id: userMemoryFacts.id });

  if (r.length === 0) return c.json({ error: 'nao_encontrado' }, 404);

  await db.insert(userTrailEvents).values({
    userId,
    id: randomUUID(),
    tipo: 'memory_fact_deleted',
    occurredAt: agora,
    source: 'app',
    payloadJson: { factId },
  }).onConflictDoNothing({ target: [userTrailEvents.userId, userTrailEvents.id] });

  return c.body(null, 204);
});
