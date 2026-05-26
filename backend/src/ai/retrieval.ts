import { sql } from 'drizzle-orm';
import { db } from '../db/client.ts';
import { gerarEmbedding } from './cliente.ts';

// Episódio recuperado para inclusão em prompt. Mantém só os campos que a
// IA precisa pra fazer referência cruzada — o ID volta pro app pra a tela
// "Eu lembrei disso" linkar de volta.
export type EpisodioRecuperado = {
  id: string;
  occurredAt: string;
  titulo: string;
  resumo: string;
  tags: string[];
  areaSlugs: string[];
  importanceScore: number;
  similaridade: number;
};

// uuid v1..v8. Default-deny: se o userId não bate com o formato esperado,
// recusa a query inteira em vez de devolver "todos" silenciosamente. Isso
// fecha qualquer caminho em que um bug de upstream pudesse passar string vazia
// ou um valor não-UUID, que então cairia em algum optimizador como NULL e
// vazaria dados de outras pessoas.
const RE_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function exigirUserIdValido(userId: unknown): string {
  if (typeof userId !== 'string' || !RE_UUID.test(userId)) {
    throw new Error(
      'retrievePersonalEpisodes: userId obrigatório e precisa ser UUID. ' +
        'Default-deny: query pessoal sem escopo de usuário é proibida.'
    );
  }
  return userId;
}

// Recupera os top-K episódios mais similares ao texto da query, filtrando
// por user_id. Limiar mínimo de similaridade (1 - distância cosseno) evita
// trazer episódio irrelevante quando não tem nada parecido — sem isso a IA
// começa a inventar conexões. 0.30 foi calibrado empiricamente pra openai
// text-embedding-3-small.
//
// IMPORTANTE: dado PESSOAL. user_id sempre filtrado e validado server-side.
// Para conhecimento compartilhado (livros, princípios), use
// retrieveSharedKnowledge — separação proposital para impossibilitar misturar
// os dois escopos por engano.
//
// Notação pgvector:
//   <=> é distância cosseno (0 = idêntico, 2 = oposto).
//   similaridade = 1 - <=>, no intervalo [-1, 1].
export async function retrievePersonalEpisodes(
  userId: string,
  textoQuery: string,
  opts: { k?: number; minSimilaridade?: number; excluirIds?: string[] } = {}
): Promise<EpisodioRecuperado[]> {
  const userIdSeguro = exigirUserIdValido(userId);
  const k = opts.k ?? 5;
  const minSim = opts.minSimilaridade ?? 0.3;
  const excluir = opts.excluirIds ?? [];

  let queryEmbedding: number[];
  try {
    queryEmbedding = await gerarEmbedding(textoQuery);
  } catch (e) {
    console.warn('[retrieval] falha ao gerar embedding da query — pulando RAG:', e);
    return [];
  }

  const vetorLiteral = `[${queryEmbedding.join(',')}]`;

  // Drizzle não tem DSL ergonômica pro <=>, então usamos sql template.
  // ::vector cast é necessário porque o parâmetro vai como text.
  const filtroExcluir =
    excluir.length > 0
      ? sql`AND id NOT IN (${sql.join(excluir.map((id) => sql`${id}`), sql`, `)})`
      : sql``;

  const linhas = await db.execute<{
    id: string;
    occurred_at: Date;
    titulo: string;
    resumo: string;
    tags: string[];
    area_slugs: string[];
    importance_score: number;
    similaridade: number;
  }>(sql`
    SELECT
      id,
      occurred_at,
      titulo,
      resumo,
      tags,
      area_slugs,
      importance_score,
      1 - (embedding <=> ${vetorLiteral}::vector) AS similaridade
    FROM user_memory_episodes
    WHERE user_id = ${userIdSeguro}::uuid
      AND active = true
      ${filtroExcluir}
      AND 1 - (embedding <=> ${vetorLiteral}::vector) >= ${minSim}
    ORDER BY embedding <=> ${vetorLiteral}::vector
    LIMIT ${k}
  `);

  const rows = (linhas as any).rows ?? linhas;
  return (rows as any[]).map((r) => ({
    id: r.id,
    occurredAt: new Date(r.occurred_at).toISOString(),
    titulo: r.titulo,
    resumo: r.resumo,
    tags: r.tags ?? [],
    areaSlugs: r.area_slugs ?? [],
    importanceScore: Number(r.importance_score),
    similaridade: Number(r.similaridade),
  }));
}

// Alias de compatibilidade — callers existentes ainda usam o nome antigo.
// Remover quando todos migrarem pra retrievePersonalEpisodes.
export const retrieveEpisodios = retrievePersonalEpisodes;

// ───────────────────────────────────────────────────────────────────────
// CAMADA GLOBAL — conhecimento compartilhado (livros, princípios)
// ───────────────────────────────────────────────────────────────────────
// Escopo SEM user_id. Único tipo de retrieval que pode ser feito sem filtro
// por pessoa. NUNCA misturar com dado pessoal. Se algum dia houver
// recomendação personalizada baseada em conhecimento global + episódio
// pessoal, a junção é feita NO PROMPT (depois das duas buscas), nunca
// na query SQL.
//
// Tabela `shared_knowledge` ainda não existe — ver migração em
// backend/migrations/0001_shared_knowledge.sql (criar antes do primeiro uso).

export type ConhecimentoCompartilhado = {
  id: string;
  fonte: string;
  trecho: string;
  tags: string[];
  similaridade: number;
};

export async function retrieveSharedKnowledge(
  textoQuery: string,
  opts: { k?: number; minSimilaridade?: number } = {}
): Promise<ConhecimentoCompartilhado[]> {
  const k = opts.k ?? 3;
  const minSim = opts.minSimilaridade ?? 0.35;

  let queryEmbedding: number[];
  try {
    queryEmbedding = await gerarEmbedding(textoQuery);
  } catch (e) {
    console.warn('[retrieval/shared] falha ao gerar embedding — pulando:', e);
    return [];
  }
  const vetorLiteral = `[${queryEmbedding.join(',')}]`;

  // Try/catch porque a tabela pode não existir ainda — falha silenciosa em
  // vez de quebrar geração de daily-note/weekly-plan.
  try {
    const linhas = await db.execute<{
      id: string;
      fonte: string;
      trecho: string;
      tags: string[];
      similaridade: number;
    }>(sql`
      SELECT
        id,
        fonte,
        trecho,
        tags,
        1 - (embedding <=> ${vetorLiteral}::vector) AS similaridade
      FROM shared_knowledge
      WHERE 1 - (embedding <=> ${vetorLiteral}::vector) >= ${minSim}
      ORDER BY embedding <=> ${vetorLiteral}::vector
      LIMIT ${k}
    `);
    const rows = (linhas as any).rows ?? linhas;
    return (rows as any[]).map((r) => ({
      id: r.id,
      fonte: r.fonte,
      trecho: r.trecho,
      tags: r.tags ?? [],
      similaridade: Number(r.similaridade),
    }));
  } catch (e) {
    // Provavelmente a tabela ainda não foi criada. Loga uma vez e segue.
    console.warn('[retrieval/shared] tabela shared_knowledge indisponível:', e instanceof Error ? e.message : e);
    return [];
  }
}

// Formata episódios pra inclusão em prompt — prosa concisa, datas humanas,
// índice numerado pra IA referenciar.
export function formatarEpisodiosPraPrompt(episodios: EpisodioRecuperado[]): string {
  if (episodios.length === 0) return '';
  const linhas = episodios.map((ep, i) => {
    const data = ep.occurredAt.slice(0, 10);
    const tags = ep.tags.length > 0 ? ` [${ep.tags.join(', ')}]` : '';
    return `${i + 1}. ${data} — ${ep.titulo}${tags}\n   ${ep.resumo}`;
  });
  return [
    'EPISÓDIOS RELEVANTES DA HISTÓRIA DO USUÁRIO',
    '(recuperados por similaridade semântica do que ele relatou agora;',
    ' use só se o eco for óbvio, não force conexão)',
    '',
    ...linhas,
  ].join('\n');
}
