import type { Execucao } from '../db/types';

export type FaixaMediocridade = 'limpo' | 'alerta' | 'cobranca' | 'cobranca_forte';

export const FAIXA_LABEL: Record<FaixaMediocridade, string> = {
  limpo: 'Limpo',
  alerta: 'Alerta leve',
  cobranca: 'Cobrança',
  cobranca_forte: 'Cobrança forte',
};

/**
 * Score de mediocridade (0..1) — quanto maior, mais "feito pela metade,
 * preso no morno". Janela = últimos 28 dias de execuções.
 */
export function scoreMediocridade(
  execucoes: Execucao[],
  percentuaisSemanais: number[]
): number {
  if (execucoes.length === 0) return 0;

  const total = execucoes.length;
  const taxaParcial = execucoes.filter(e => e.status === 'parcial').length / total;
  const taxaNaoFeito = execucoes.filter(e => e.status === 'nao_feito').length / total;

  let estagnacao = 0;
  if (percentuaisSemanais.length >= 3) {
    const media = percentuaisSemanais.reduce((a, b) => a + b, 0) / percentuaisSemanais.length;
    const desvio = Math.sqrt(
      percentuaisSemanais.reduce((s, v) => s + (v - media) ** 2, 0) /
        percentuaisSemanais.length
    );
    if (desvio < 5 && media >= 35 && media <= 65) estagnacao = 1;
  }

  return Math.min(1, taxaParcial * 0.5 + taxaNaoFeito * 0.3 + estagnacao * 0.2);
}

export function faixaMediocridade(score: number): FaixaMediocridade {
  if (score < 0.2) return 'limpo';
  if (score < 0.4) return 'alerta';
  if (score < 0.65) return 'cobranca';
  return 'cobranca_forte';
}

export function mensagemCobranca(faixa: FaixaMediocridade, diasPresos: number): string {
  switch (faixa) {
    case 'limpo':
      return '';
    case 'alerta':
      return 'Algumas tarefas estão ficando pela metade. O que ficou inacabado hoje?';
    case 'cobranca':
      return `Você está há ${diasPresos} dias preso entre 35% e 65%. Isso não é falha — é hábito. Hora de quebrar.`;
    case 'cobranca_forte':
      return 'Padrão consolidado de mediocridade. Reduza tarefas ou explique por escrito o que está travando. Sem isso, o app não vai te deixar passar batido.';
  }
}
