export type FaixaCor = 'marrom' | 'vermelho' | 'amarelo' | 'verde' | 'azul';

// Paleta nova (light/terrosa) com ink (escuro) + soft (pastel).
// Veja screens/shared.jsx pro referencial visual.

export const CORES: Record<FaixaCor, string> = {
  marrom:   '#5C4A3A',
  vermelho: '#8C3A2A',
  amarelo:  '#8A6B1F',
  verde:    '#3F5F3F',
  azul:     '#1F3F5C',
};

export const CORES_SOFT: Record<FaixaCor, string> = {
  marrom:   '#C2B5A0',
  vermelho: '#D2A892',
  amarelo:  '#D4C088',
  verde:    '#B8C2A8',
  azul:     '#A8B5C2',
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

export function corSoftPorPercentual(p: number): string {
  return CORES_SOFT[faixaPorPercentual(p)];
}

export function rotuloPorPercentual(p: number): string {
  return ROTULOS[faixaPorPercentual(p)];
}
