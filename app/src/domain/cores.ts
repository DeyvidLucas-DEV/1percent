export type FaixaCor = 'marrom' | 'vermelho' | 'amarelo' | 'verde' | 'azul';

export const CORES: Record<FaixaCor, string> = {
  marrom:   '#6B4423',
  vermelho: '#C0392B',
  amarelo:  '#E1A93B',
  verde:    '#2E8B57',
  azul:     '#1F6FB2',
};

export const ROTULOS: Record<FaixaCor, string> = {
  marrom:   'Crítico',
  vermelho: 'Baixo',
  amarelo:  'Oscilando',
  verde:    'Consistente',
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
