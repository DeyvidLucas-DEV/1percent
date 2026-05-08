export type FaixaCor = 'marrom' | 'vermelho' | 'amarelo' | 'verde' | 'azul';

export const CORES: Record<FaixaCor, string> = {
  marrom:   '#6B4F2A',
  vermelho: '#B5391C',
  amarelo:  '#C7A52E',
  verde:    '#2E8B57',
  azul:     '#1F6FB2',
};

export const ROTULOS: Record<FaixaCor, string> = {
  marrom:   'Estagnação',
  vermelho: 'Reação',
  amarelo:  'Movimento',
  verde:    'Construção',
  azul:     'Excelência',
};

export function faixaPorPercentual(p: number): FaixaCor {
  if (p <= 20) return 'marrom';
  if (p <= 40) return 'vermelho';
  if (p <= 60) return 'amarelo';
  if (p <= 80) return 'verde';
  return 'azul';
}

export function corPorPercentual(p: number): string {
  return CORES[faixaPorPercentual(p)];
}

export function rotuloPorPercentual(p: number): string {
  return ROTULOS[faixaPorPercentual(p)];
}
