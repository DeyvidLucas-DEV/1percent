import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) console.warn('[ai] OPENAI_API_KEY não definida — chamadas de IA vão falhar');

export const MODELO_PADRAO = process.env.AI_MODEL || 'gpt-4o-mini';
export const PROVIDER = 'openai';

export const openai = new OpenAI({ apiKey: apiKey ?? '' });

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
