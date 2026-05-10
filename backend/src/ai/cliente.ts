import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) console.warn('[ai] OPENAI_API_KEY não definida — chamadas de IA vão falhar');

export const MODELO_PADRAO = process.env.AI_MODEL || 'gpt-4o-mini';
export const MODELO_EMBEDDING = process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small';
export const DIMENSAO_EMBEDDING = 1536;
export const PROVIDER = 'openai';

export const openai = new OpenAI({ apiKey: apiKey ?? '' });

// Gera embedding pra texto (chamada barata: ~$0.02/1M tokens). Trunca em
// ~30k caracteres pra evitar exceder o limite do modelo (8191 tokens
// teóricos). Em prática nossos textos têm 1-3k.
export async function gerarEmbedding(texto: string): Promise<number[]> {
  const t = texto.length > 30_000 ? texto.slice(0, 30_000) : texto;
  const r = await openai.embeddings.create({
    model: MODELO_EMBEDDING,
    input: t,
    dimensions: DIMENSAO_EMBEDDING,
  });
  const v = r.data[0]?.embedding;
  if (!v || v.length !== DIMENSAO_EMBEDDING) {
    throw new Error(`embedding com dimensão inesperada: ${v?.length}`);
  }
  return v;
}

// Custos em USD por 1M tokens (input/output):
// gpt-4o-mini: 0.15 / 0.60
// gpt-4o:      2.50 / 10.00
// gpt-4.1-mini:0.40 / 1.60
// Resultado em centavos de USD (inteiro arredondado pra cima).
export function custoCentavos(tokensInput: number, tokensOutput: number, modelo: string): number {
  let inP1M = 0.15;
  let outP1M = 0.6;
  if (modelo.startsWith('gpt-4o') && !modelo.includes('mini')) {
    inP1M = 2.5;
    outP1M = 10;
  } else if (modelo.startsWith('gpt-4.1-mini')) {
    inP1M = 0.4;
    outP1M = 1.6;
  }
  const total = (tokensInput / 1_000_000) * inP1M + (tokensOutput / 1_000_000) * outP1M;
  return Math.ceil(total * 100);
}
