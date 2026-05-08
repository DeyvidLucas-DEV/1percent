import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq, gt, sql } from 'drizzle-orm';
import { db } from '../db/client.ts';
import {
  areas,
  tarefas,
  execucoes,
  reflexoesDiarias,
  autoavaliacaoInicial,
  eventos,
} from '../db/schema.ts';
import { exigirAuth } from '../auth/middleware.ts';

export const syncRoutes = new Hono();
syncRoutes.use('*', exigirAuth);

syncRoutes.get('/pull', async (c) => {
  const userId = c.get('userId');
  const since = c.req.query('since');
  const sinceDate = since ? new Date(since) : new Date(0);
  if (isNaN(sinceDate.getTime())) return c.json({ error: 'bad_since' }, 400);

  const filtro = (col: any) => and(eq(col, userId), gt(sql`updated_at`, sinceDate));

  const [a, t, e, r, ai, ev] = await Promise.all([
    db.select().from(areas).where(filtro(areas.userId)),
    db.select().from(tarefas).where(filtro(tarefas.userId)),
    db.select().from(execucoes).where(filtro(execucoes.userId)),
    db.select().from(reflexoesDiarias).where(filtro(reflexoesDiarias.userId)),
    db.select().from(autoavaliacaoInicial).where(filtro(autoavaliacaoInicial.userId)),
    db.select().from(eventos).where(filtro(eventos.userId)),
  ]);

  return c.json({
    serverNow: new Date().toISOString(),
    areas: a,
    tarefas: t,
    execucoes: e,
    reflexoes: r,
    autoavaliacao: ai,
    eventos: ev,
  });
});

const linhaBase = z.object({
  id: z.number().int(),
  updated_at: z.string(),
});

const pushBody = z.object({
  areas: z.array(linhaBase.extend({
    slug: z.string(),
    nome: z.string(),
    cor_base: z.string(),
    obrigatoria: z.number().int(),
    ordem: z.number().int(),
    ativa: z.number().int(),
    paused_until: z.string().nullable().optional(),
    pause_reason: z.string().nullable().optional(),
    peso_global: z.number(),
  })).optional(),
  tarefas: z.array(linhaBase.extend({
    area_id: z.number().int(),
    nome: z.string(),
    peso: z.number().int(),
    frequencia: z.string(),
    alvo_count: z.number().int(),
    ativa: z.number().int(),
    horario: z.string().nullable().optional(),
    created_at: z.string(),
  })).optional(),
  execucoes: z.array(linhaBase.extend({
    tarefa_id: z.number().int(),
    data: z.string(),
    status: z.string(),
    created_at: z.string(),
  })).optional(),
  reflexoes: z.array(linhaBase.extend({
    data: z.string(),
    pergunta: z.string(),
    resposta: z.string().nullable(),
    created_at: z.string(),
  })).optional(),
  autoavaliacao: z.array(z.object({
    area_id: z.number().int(),
    nota: z.number().int(),
    created_at: z.string(),
    updated_at: z.string(),
  })).optional(),
  eventos: z.array(linhaBase.extend({
    data: z.string(),
    tipo: z.string(),
    payload_json: z.string().nullable(),
    created_at: z.string(),
  })).optional(),
});

syncRoutes.post('/push', async (c) => {
  const userId = c.get('userId');
  const parsed = pushBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'bad_request', issues: parsed.error.issues }, 400);
  const body = parsed.data;

  await db.transaction(async (tx) => {
    if (body.areas) {
      for (const a of body.areas) {
        await tx
          .insert(areas)
          .values({
            id: a.id,
            userId,
            slug: a.slug,
            nome: a.nome,
            corBase: a.cor_base,
            obrigatoria: a.obrigatoria,
            ordem: a.ordem,
            ativa: a.ativa,
            pausedUntil: a.paused_until ?? null,
            pauseReason: a.pause_reason ?? null,
            pesoGlobal: a.peso_global,
            updatedAt: new Date(a.updated_at),
          })
          .onConflictDoUpdate({
            target: [areas.userId, areas.id],
            set: {
              slug: a.slug,
              nome: a.nome,
              corBase: a.cor_base,
              obrigatoria: a.obrigatoria,
              ordem: a.ordem,
              ativa: a.ativa,
              pausedUntil: a.paused_until ?? null,
              pauseReason: a.pause_reason ?? null,
              pesoGlobal: a.peso_global,
              updatedAt: new Date(a.updated_at),
            },
            setWhere: sql`${areas.updatedAt} < ${new Date(a.updated_at)}`,
          });
      }
    }

    if (body.tarefas) {
      for (const t of body.tarefas) {
        await tx
          .insert(tarefas)
          .values({
            id: t.id,
            userId,
            areaId: t.area_id,
            nome: t.nome,
            peso: t.peso,
            frequencia: t.frequencia,
            alvoCount: t.alvo_count,
            ativa: t.ativa,
            horario: t.horario ?? null,
            createdAt: new Date(t.created_at),
            updatedAt: new Date(t.updated_at),
          })
          .onConflictDoUpdate({
            target: [tarefas.userId, tarefas.id],
            set: {
              areaId: t.area_id,
              nome: t.nome,
              peso: t.peso,
              frequencia: t.frequencia,
              alvoCount: t.alvo_count,
              ativa: t.ativa,
              horario: t.horario ?? null,
              updatedAt: new Date(t.updated_at),
            },
            setWhere: sql`${tarefas.updatedAt} < ${new Date(t.updated_at)}`,
          });
      }
    }

    if (body.execucoes) {
      for (const e of body.execucoes) {
        await tx
          .insert(execucoes)
          .values({
            id: e.id,
            userId,
            tarefaId: e.tarefa_id,
            data: e.data,
            status: e.status,
            createdAt: new Date(e.created_at),
            updatedAt: new Date(e.updated_at),
          })
          .onConflictDoUpdate({
            target: [execucoes.userId, execucoes.id],
            set: {
              tarefaId: e.tarefa_id,
              data: e.data,
              status: e.status,
              updatedAt: new Date(e.updated_at),
            },
            setWhere: sql`${execucoes.updatedAt} < ${new Date(e.updated_at)}`,
          });
      }
    }

    if (body.reflexoes) {
      for (const r of body.reflexoes) {
        await tx
          .insert(reflexoesDiarias)
          .values({
            id: r.id,
            userId,
            data: r.data,
            pergunta: r.pergunta,
            resposta: r.resposta,
            createdAt: new Date(r.created_at),
            updatedAt: new Date(r.updated_at),
          })
          .onConflictDoUpdate({
            target: [reflexoesDiarias.userId, reflexoesDiarias.id],
            set: {
              data: r.data,
              pergunta: r.pergunta,
              resposta: r.resposta,
              updatedAt: new Date(r.updated_at),
            },
            setWhere: sql`${reflexoesDiarias.updatedAt} < ${new Date(r.updated_at)}`,
          });
      }
    }

    if (body.autoavaliacao) {
      for (const ai of body.autoavaliacao) {
        await tx
          .insert(autoavaliacaoInicial)
          .values({
            areaId: ai.area_id,
            userId,
            nota: ai.nota,
            createdAt: new Date(ai.created_at),
            updatedAt: new Date(ai.updated_at),
          })
          .onConflictDoUpdate({
            target: [autoavaliacaoInicial.userId, autoavaliacaoInicial.areaId],
            set: { nota: ai.nota, updatedAt: new Date(ai.updated_at) },
            setWhere: sql`${autoavaliacaoInicial.updatedAt} < ${new Date(ai.updated_at)}`,
          });
      }
    }

    if (body.eventos) {
      for (const ev of body.eventos) {
        await tx
          .insert(eventos)
          .values({
            id: ev.id,
            userId,
            data: ev.data,
            tipo: ev.tipo,
            payloadJson: ev.payload_json,
            createdAt: new Date(ev.created_at),
            updatedAt: new Date(ev.updated_at),
          })
          .onConflictDoUpdate({
            target: [eventos.userId, eventos.id],
            set: {
              data: ev.data,
              tipo: ev.tipo,
              payloadJson: ev.payload_json,
              updatedAt: new Date(ev.updated_at),
            },
            setWhere: sql`${eventos.updatedAt} < ${new Date(ev.updated_at)}`,
          });
      }
    }
  });

  return c.json({ ok: true, serverNow: new Date().toISOString() });
});
