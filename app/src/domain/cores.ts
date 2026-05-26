// Faixas de performance. Hexes moram em src/lib/paleta.ts.
import { faixas } from '../lib/paleta';

export type FaixaCor = 'marrom' | 'vermelho' | 'amarelo' | 'verde' | 'azul';

export const CORES: Record<FaixaCor, string> = faixas.ink;
export const CORES_SOFT: Record<FaixaCor, string> = faixas.soft;

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
