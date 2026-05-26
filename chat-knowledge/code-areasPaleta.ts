// Paleta visual nova (terrosa light) por slug de área.
// O DB tem `cor_base` legado — esse arquivo é a fonte da verdade visual.

export type PaletaArea = { ink: string; soft: string };

export const PALETA_AREAS: Record<string, PaletaArea> = {
  espiritual:    { ink: '#3D3A52', soft: '#BDB8C2' },
  saude_fisica:  { ink: '#3F5F3F', soft: '#B8C2A8' },
  familia:       { ink: '#8C3A2A', soft: '#D2A892' },
  trabalho:      { ink: '#1F3F5C', soft: '#A8B5C2' },
  saude_emocional:{ ink: '#8A6B1F', soft: '#D4C088' },
  financas:      { ink: '#2F5547', soft: '#A8BFB0' },
  ministerio:    { ink: '#4A3050', soft: '#B8A8B8' },
  amizades:      { ink: '#1F5F58', soft: '#A8C2BC' },
  crescimento:   { ink: '#2D4A6B', soft: '#A8BACE' },
  sabedoria:     { ink: '#3A3F45', soft: '#B5B8BC' },
};

const FALLBACK: PaletaArea = { ink: '#3A3F45', soft: '#B5B8BC' };

export function paletaArea(slug: string | undefined | null): PaletaArea {
  if (!slug) return FALLBACK;
  return PALETA_AREAS[slug] ?? FALLBACK;
}
