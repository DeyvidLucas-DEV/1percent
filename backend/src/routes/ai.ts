import { Hono } from 'hono';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../db/client.ts';
import { userMemoryFacts, userTrailEvents } from '../db/schema.ts';
import { exigirAuth } from '../auth/middleware.ts';
import { reservarChamadaIa } from '../ai/rateLimit.ts';
import { gerarExtracaoMemoria, type ContextoDadosUsuario } from '../ai/dailyNote.ts';
import {
  gerarPlanoSemanal,
  type ContextoPlanoSemanal,
} from '../ai/weeklyPlan.ts';
import { custoCentavos, MODELO_PADRAO, PROVIDER } from '../ai/cliente.ts';

export const aiRoutes = new Hono();
aiRoutes.use('*', exigirAuth);

const dailyNoteBody = z.object({
  relato: z.string().min(20).max(8000),
  occurredAt: z.string().optional(),
  contextoDados: z
    .object({
      percentualGeral7d: z.number().optional(),
      areasFortes: z.array(z.string()).optional(),
      areasNegligenciadas: z.array(z.string()).optional(),
      tarefasMaisFalhadas: z.array(z.string()).optional(),
      tarefasAtivas: z
        .array(
          z.object({
            id: z.number().int(),
            areaSlug: z.string(),
            nome: z.string(),
            frequencia: z.enum(['diaria', 'semanal', 'mensal']),
            alvoCount: z.number().int(),
            peso: z.union([z.literal(1), z.literal(2), z.literal(3)]),
            horario: z.string().nullable(),
          })
        )
        .optional(),
      intensidade: z.enum(['leve', 'moderada', 'intensa', 'desorganizada']).optional(),
      cargaSemanal: z.number().optional(),
      horarioTrabalho: z
        .object({
          inicio: z.string(),
          fim: z.string(),
        })
        .nullable()
        .optional(),
    })
    .optional(),
});

aiRoutes.post('/daily-note', async (c) => {
  const userId = c.get('userId');
  const parsed = dailyNoteBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'bad_request', issues: parsed.error.issues }, 400);
  }

  const limite = await reservarChamadaIa(userId);
  if (!limite.permitido) {
    return c.json(
      {
        error: 'rate_limited',
        bucket: limite.bucket,
        max: limite.max,
        resetEm: limite.resetEm.toISOString(),
      },
      429
    );
  }

  let resultado;
  try {
    resultado = await gerarExtracaoMemoria({
      relatoUsuario: parsed.data.relato,
      contextoDados: parsed.data.contextoDados as ContextoDadosUsuario | undefined,
    });
  } catch (e) {
    console.error('[ai] falha em /daily-note', e);
    return c.json({ error: 'falha_ia', detail: String(e) }, 502);
  }

  const agora = new Date();
  const occurredAt = parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : agora;

  // 1) registra evento daily_note_submitted (origem do processamento).
  const dailyNoteEventId = randomUUID();
  await db.insert(userTrailEvents).values({
    userId,
    id: dailyNoteEventId,
    tipo: 'daily_note_submitted',
    occurredAt,
    source: 'ai',
    payloadJson: {
      relato: parsed.data.relato,
      tokensInput: resultado.tokensInput,
      tokensOutput: resultado.tokensOutput,
      custoCentavos: custoCentavos(resultado.tokensInput, resultado.tokensOutput, resultado.modelo),
      provider: PROVIDER,
      modelo: resultado.modelo,
    },
  }).onConflictDoNothing({ target: [userTrailEvents.userId, userTrailEvents.id] });

  // 2) upsert dos fatos candidatos (UNIQUE por user_id+categoria+chave).
  for (const fato of resultado.extracao.fatosCandidatos) {
    const existente = await db
      .select({ id: userMemoryFacts.id, confianca: userMemoryFacts.confianca })
      .from(userMemoryFacts)
      .where(
        and(
          eq(userMemoryFacts.userId, userId),
          eq(userMemoryFacts.categoria, fato.categoria),
          eq(userMemoryFacts.chave, fato.chave)
        )
      )
      .limit(1);

    if (existente[0]) {
      // Reconfirmação: sobe confiança? Por ora só atualiza last_confirmed_at.
      await db
        .update(userMemoryFacts)
        .set({
          valor: fato.valor,
          confianca: subirConfianca(existente[0].confianca, fato.confianca),
          lastConfirmedAt: agora,
          active: true,
          updatedAt: agora,
        })
        .where(
          and(
            eq(userMemoryFacts.userId, userId),
            eq(userMemoryFacts.id, existente[0].id)
          )
        );
    } else {
      await db.insert(userMemoryFacts).values({
        userId,
        id: randomUUID(),
        categoria: fato.categoria,
        chave: fato.chave,
        valor: fato.valor,
        confianca: fato.confianca,
        origemEventId: dailyNoteEventId,
        firstSeenAt: agora,
        lastConfirmedAt: agora,
        active: true,
        updatedAt: agora,
      });
    }
  }

  // 3) atribui id às recomendações (pra o app gerar suggestion_accepted/rejected
  //    com payload referenciando esse id) e grava suggestion_presented na trilha.
  const recomendacoesComId = resultado.extracao.recomendacoesImediatas.map((r) => ({
    id: randomUUID(),
    tipo: r.tipo,
    descricao: r.descricao,
    exigeConfirmacao: r.exigeConfirmacao,
    criarTarefa: r.criarTarefa,
    pausarTarefa: r.pausarTarefa,
  }));

  if (recomendacoesComId.length > 0) {
    await db.insert(userTrailEvents).values(
      recomendacoesComId.map((r) => ({
        userId,
        id: randomUUID(),
        tipo: 'suggestion_presented',
        occurredAt: agora,
        source: 'ai' as const,
        payloadJson: {
          recomendacaoId: r.id,
          tipo: r.tipo,
          descricao: r.descricao,
          fonteEventId: dailyNoteEventId,
        },
      }))
    ).onConflictDoNothing({ target: [userTrailEvents.userId, userTrailEvents.id] });
  }

  return c.json({
    eventId: dailyNoteEventId,
    extracao: resultado.extracao,
    recomendacoes: recomendacoesComId,
    tokensInput: resultado.tokensInput,
    tokensOutput: resultado.tokensOutput,
  });
});

const ORDEM_CONFIANCA: Record<string, number> = { baixa: 1, media: 2, alta: 3 };
function subirConfianca(antiga: string, nova: string): string {
  const a = ORDEM_CONFIANCA[antiga] ?? 2;
  const n = ORDEM_CONFIANCA[nova] ?? 2;
  // Reconfirmar nunca derruba — sobe um nível quando a nova ≥ antiga.
  return n >= a && a < 3 ? Object.keys(ORDEM_CONFIANCA).find((k) => ORDEM_CONFIANCA[k] === a + 1)! : antiga;
}

// ─── /weekly-plan ──────────────────────────────────────────────────

const weeklyPlanBody = z.object({
  intencaoDeclarada: z.string().max(500).optional(),
  contextoDados: z
    .object({
      percentualGeral7d: z.number().optional(),
      areasFortes: z.array(z.string()).optional(),
      areasNegligenciadas: z.array(z.string()).optional(),
      tarefasMaisFalhadas: z.array(z.string()).optional(),
      tarefasAtivas: z
        .array(
          z.object({
            id: z.number().int(),
            areaSlug: z.string(),
            nome: z.string(),
            frequencia: z.enum(['diaria', 'semanal', 'mensal']),
            alvoCount: z.number().int(),
            peso: z.union([z.literal(1), z.literal(2), z.literal(3)]),
            horario: z.string().nullable(),
          })
        )
        .optional(),
      intensidade: z.enum(['leve', 'moderada', 'intensa', 'desorganizada']).optional(),
      cargaSemanal: z.number().optional(),
      horarioTrabalho: z
        .object({ inicio: z.string(), fim: z.string() })
        .nullable()
        .optional(),
    })
    .optional(),
});

aiRoutes.post('/weekly-plan', async (c) => {
  const userId = c.get('userId');
  const parsed = weeklyPlanBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'bad_request', issues: parsed.error.issues }, 400);
  }

  const limite = await reservarChamadaIa(userId);
  if (!limite.permitido) {
    return c.json(
      {
        error: 'rate_limited',
        bucket: limite.bucket,
        max: limite.max,
        resetEm: limite.resetEm.toISOString(),
      },
      429
    );
  }

  // Coleta automática do histórico no banco — o app não precisa enviar.
  const [fatosRaw, sugestoesRaw, relatosRaw] = await Promise.all([
    db
      .select({
        categoria: userMemoryFacts.categoria,
        chave: userMemoryFacts.chave,
        valor: userMemoryFacts.valor,
        confianca: userMemoryFacts.confianca,
      })
      .from(userMemoryFacts)
      .where(and(eq(userMemoryFacts.userId, userId), eq(userMemoryFacts.active, true)))
      .limit(40),
    db
      .select({
        tipo: userTrailEvents.tipo,
        payloadJson: userTrailEvents.payloadJson,
        occurredAt: userTrailEvents.occurredAt,
      })
      .from(userTrailEvents)
      .where(
        and(
          eq(userTrailEvents.userId, userId),
          sql`${userTrailEvents.tipo} IN ('suggestion_accepted', 'suggestion_rejected')`
        )
      )
      .orderBy(desc(userTrailEvents.occurredAt))
      .limit(15),
    db
      .select({
        payloadJson: userTrailEvents.payloadJson,
        occurredAt: userTrailEvents.occurredAt,
      })
      .from(userTrailEvents)
      .where(
        and(
          eq(userTrailEvents.userId, userId),
          eq(userTrailEvents.tipo, 'daily_note_submitted')
        )
      )
      .orderBy(desc(userTrailEvents.occurredAt))
      .limit(5),
  ]);

  const historicoSugestoes = sugestoesRaw.map((s) => {
    const p = (s.payloadJson ?? {}) as Record<string, unknown>;
    return {
      tipo: String(p.tipo ?? ''),
      descricao: String(p.descricao ?? ''),
      status: (s.tipo === 'suggestion_accepted' ? 'aceita' : 'recusada') as
        | 'aceita'
        | 'recusada',
      quandoIso: s.occurredAt.toISOString().slice(0, 10),
    };
  });

  const ultimosRelatos = relatosRaw.map((r) => {
    const p = (r.payloadJson ?? {}) as Record<string, unknown>;
    const relato = String(p.relato ?? '');
    // Resumo simples: primeiras 200 chars. A IA pondera o que importa.
    const resumo = relato.length > 200 ? relato.slice(0, 200) + '...' : relato;
    return { resumo, quandoIso: r.occurredAt.toISOString().slice(0, 10) };
  });

  const ctx: ContextoPlanoSemanal = {
    contextoDados: parsed.data.contextoDados,
    fatos: fatosRaw,
    historicoSugestoes,
    ultimosRelatos,
    intencaoDeclarada: parsed.data.intencaoDeclarada,
  };

  let resultado;
  try {
    resultado = await gerarPlanoSemanal(ctx);
  } catch (e) {
    console.error('[ai] falha em /weekly-plan', e);
    return c.json({ error: 'falha_ia', detail: String(e) }, 502);
  }

  const agora = new Date();
  const planoEventId = randomUUID();

  // Atribui UUID a cada ajuste pra app referenciar nos suggestion_accepted/rejected.
  const ajustesComId = resultado.plano.ajustes.map((a) => ({
    id: randomUUID(),
    ...a,
  }));

  // Registra evento weekly_plan_generated na trilha.
  await db
    .insert(userTrailEvents)
    .values({
      userId,
      id: planoEventId,
      tipo: 'weekly_plan_generated',
      occurredAt: agora,
      source: 'ai',
      payloadJson: {
        intencaoSemana: resultado.plano.intencaoSemana,
        causaProvavel: resultado.plano.causaProvavel,
        intensidade: resultado.plano.leituraDosDados.intensidade,
        ajustesCount: ajustesComId.length,
        tokensInput: resultado.tokensInput,
        tokensOutput: resultado.tokensOutput,
        custoCentavos: custoCentavos(resultado.tokensInput, resultado.tokensOutput, resultado.modelo),
        provider: PROVIDER,
        modelo: resultado.modelo,
      },
    })
    .onConflictDoNothing({ target: [userTrailEvents.userId, userTrailEvents.id] });

  // Cada ajuste vira um suggestion_presented na trilha (pra cruzar depois).
  if (ajustesComId.length > 0) {
    await db
      .insert(userTrailEvents)
      .values(
        ajustesComId.map((a) => ({
          userId,
          id: randomUUID(),
          tipo: 'suggestion_presented',
          occurredAt: agora,
          source: 'ai' as const,
          payloadJson: {
            recomendacaoId: a.id,
            tipo: a.tipo,
            descricao: a.descricao,
            fonteEventId: planoEventId,
            origem: 'weekly_plan',
          },
        }))
      )
      .onConflictDoNothing({ target: [userTrailEvents.userId, userTrailEvents.id] });
  }

  return c.json({
    eventId: planoEventId,
    plano: {
      ...resultado.plano,
      ajustes: ajustesComId,
    },
    tokensInput: resultado.tokensInput,
    tokensOutput: resultado.tokensOutput,
  });
});
