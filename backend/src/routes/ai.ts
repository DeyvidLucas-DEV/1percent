import { Hono } from 'hono';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../db/client.ts';
import { userMemoryEpisodes, userMemoryFacts, userTrailEvents } from '../db/schema.ts';
import { exigirAuth } from '../auth/middleware.ts';
import { reservarChamadaIa } from '../ai/rateLimit.ts';
import { gerarExtracaoMemoria, type ContextoDadosUsuario } from '../ai/dailyNote.ts';
import {
  gerarPlanoSemanal,
  type ContextoPlanoSemanal,
} from '../ai/weeklyPlan.ts';
import { custoCentavos, gerarEmbedding, MODELO_PADRAO, PROVIDER } from '../ai/cliente.ts';
import { formatarEpisodiosPraPrompt, retrieveEpisodios } from '../ai/retrieval.ts';

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

  // Retrieval: busca episódios passados do mesmo usuário com tema parecido
  // (~$0.000004 por chamada, totalmente desprezível). Falha silenciosa: se
  // o embedding ou a query der erro, gera daily-note sem RAG.
  const episodiosLembrados = await retrieveEpisodios(userId, parsed.data.relato, {
    k: 5,
    minSimilaridade: 0.3,
  });
  const blocoHistorico = formatarEpisodiosPraPrompt(episodiosLembrados);

  let resultado;
  try {
    resultado = await gerarExtracaoMemoria({
      relatoUsuario: parsed.data.relato,
      contextoDados: parsed.data.contextoDados as ContextoDadosUsuario | undefined,
      episodiosRelevantes: blocoHistorico || undefined,
    });
  } catch (e) {
    console.error('[ai] falha em /daily-note', e);
    return c.json({ error: 'falha_ia', detail: String(e) }, 502);
  }

  const agora = new Date();
  const occurredAt = parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : agora;
  const dailyNoteEventId = randomUUID();

  // 1) upsert dos fatos candidatos. Coleta listas pra incluir no payload do
  //    daily_note_submitted — assim a tela Trilha mostra "X fatos aprendidos"
  //    sem precisar de outra rota.
  type FatoResumo = { categoria: string; chave: string; valor: string; confianca: string };
  const fatosCriados: FatoResumo[] = [];
  const fatosReconfirmados: FatoResumo[] = [];

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
      const novaConfianca = subirConfianca(existente[0].confianca, fato.confianca);
      await db
        .update(userMemoryFacts)
        .set({
          valor: fato.valor,
          confianca: novaConfianca,
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
      fatosReconfirmados.push({
        categoria: fato.categoria,
        chave: fato.chave,
        valor: fato.valor,
        confianca: novaConfianca,
      });
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
      fatosCriados.push({
        categoria: fato.categoria,
        chave: fato.chave,
        valor: fato.valor,
        confianca: fato.confianca,
      });
    }
  }

  // 2) grava o evento daily_note_submitted com payload enriquecido (relato
  //    + listas de fatos criados/reconfirmados + episódio). A tela Trilha lê
  //    isso direto e renderiza o bloco "Conversa com IA" sem rota extra.
  await db
    .insert(userTrailEvents)
    .values({
      userId,
      id: dailyNoteEventId,
      tipo: 'daily_note_submitted',
      occurredAt,
      source: 'app',
      payloadJson: {
        relato: parsed.data.relato,
        episodio: resultado.extracao.episodio,
        eventosClassificados: resultado.extracao.eventosClassificados,
        fatosCriados,
        fatosReconfirmados,
        tokensInput: resultado.tokensInput,
        tokensOutput: resultado.tokensOutput,
        custoCentavos: custoCentavos(
          resultado.tokensInput,
          resultado.tokensOutput,
          resultado.modelo
        ),
        provider: PROVIDER,
        modelo: resultado.modelo,
      },
    })
    .onConflictDoNothing({ target: [userTrailEvents.userId, userTrailEvents.id] });

  // 2.5) Persiste episódio com embedding pra retrieval futuro. Só grava se a IA
  //      considerou que o dia tem peso narrativo (episodio !== null). Falha aqui
  //      não derruba a resposta — RAG é incremental.
  let episodioPersistidoId: string | null = null;
  const ep = resultado.extracao.episodio;
  const tag = dailyNoteEventId.slice(0, 8);
  console.log(
    `[ai] daily-note ${tag}: retrieve achou ${episodiosLembrados.length} episódios | ` +
      `ia decidiu episodio=${ep ? `"${ep.titulo}" importance=${ep.importanceScore}` : 'null'}`
  );
  if (ep) {
    try {
      const textoEmbedding = [
        ep.titulo,
        ep.resumo,
        ep.tags.join(' '),
        ep.areaSlugs.join(' '),
        parsed.data.relato,
      ]
        .filter(Boolean)
        .join('\n');
      const embedding = await gerarEmbedding(textoEmbedding);
      const novoId = randomUUID();
      await db
        .insert(userMemoryEpisodes)
        .values({
          userId,
          id: novoId,
          sourceEventId: dailyNoteEventId,
          occurredAt,
          titulo: ep.titulo,
          resumo: ep.resumo,
          tags: ep.tags,
          areaSlugs: ep.areaSlugs,
          importanceScore: ep.importanceScore,
          embedding,
          active: true,
        })
        .onConflictDoNothing({ target: [userMemoryEpisodes.userId, userMemoryEpisodes.id] });
      episodioPersistidoId = novoId;
      console.log(`[ai] daily-note ${tag}: episodio persistido id=${novoId.slice(0, 8)}`);
    } catch (e) {
      console.error(`[ai] daily-note ${tag}: FALHA ao persistir episodio:`, e);
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
    episodiosLembrados: episodiosLembrados.map((e) => ({
      id: e.id,
      occurredAt: e.occurredAt,
      titulo: e.titulo,
      resumo: e.resumo,
      similaridade: e.similaridade,
    })),
    episodioPersistidoId,
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

  // Retrieval pra plano semanal: query é a concat dos últimos relatos +
  // intenção declarada — busca episódios passados que ecoam o momento atual.
  const queryRetrieval = [
    parsed.data.intencaoDeclarada ?? '',
    ...ultimosRelatos.map((r) => r.resumo),
  ]
    .filter(Boolean)
    .join('\n\n');
  const episodiosLembrados = queryRetrieval
    ? await retrieveEpisodios(userId, queryRetrieval, { k: 6, minSimilaridade: 0.28 })
    : [];
  const blocoHistorico = formatarEpisodiosPraPrompt(episodiosLembrados);

  const ctx: ContextoPlanoSemanal = {
    contextoDados: parsed.data.contextoDados,
    fatos: fatosRaw,
    historicoSugestoes,
    ultimosRelatos,
    intencaoDeclarada: parsed.data.intencaoDeclarada,
    episodiosRelevantes: blocoHistorico || undefined,
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
    episodiosLembrados: episodiosLembrados.map((e) => ({
      id: e.id,
      occurredAt: e.occurredAt,
      titulo: e.titulo,
      resumo: e.resumo,
      similaridade: e.similaridade,
    })),
    tokensInput: resultado.tokensInput,
    tokensOutput: resultado.tokensOutput,
  });
});
