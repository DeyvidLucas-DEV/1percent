// Paleta visual por slug de área. Hexes moram em src/lib/paleta.ts.
// O DB tem `cor_base` mas a fonte da verdade visual é a paleta.

import { areas, areaFallback } from '../lib/paleta';

export type PaletaArea = { ink: string; soft: string };

export const PALETA_AREAS: Record<string, PaletaArea> = areas;

export function paletaArea(slug: string | undefined | null): PaletaArea {
  if (!slug) return areaFallback;
  return PALETA_AREAS[slug] ?? areaFallback;
}
