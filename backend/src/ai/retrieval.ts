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

// Recupera os top-K episódios mais similares ao texto da query, filtrando
// por user_id. Limiar mínimo de similaridade (1 - distância cosseno) evita
// trazer episódio irrelevante quando não tem nada parecido — sem isso a IA
// começa a inventar conexões. 0.30 foi calibrado empiricamente pra openai
// text-embedding-3-small.
//
// Notação pgvector:
//   <=> é distância cosseno (0 = idêntico, 2 = oposto).
//   similaridade = 1 - <=>, no intervalo [-1, 1].
export async function retrieveEpisodios(
  userId: string,
  textoQuery: string,
  opts: { k?: number; minSimilaridade?: number; excluirIds?: string[] } = {}
): Promise<EpisodioRecuperado[]> {
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
    WHERE user_id = ${userId}
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
