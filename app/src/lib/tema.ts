// Sistema de tema dual. `tema` = light por padrão.
// Pra dark, importe `temaDark` ou use o hook `useTema()` (futuro).
//
// As COR cruas moram em `./paleta.ts`. Este arquivo só compõe tokens
// semânticos (bg/texto/borda/ações) + spacing/raio/fonte.

import { light, dark } from './paleta';

const espacamento = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
const fonte = { titulo: 28, subtitulo: 20, corpo: 16, pequeno: 13 };
const fontFamily = {
  display: 'BricolageGrotesque_700Bold',
  displayMedium: 'BricolageGrotesque_500Medium',
  text: 'Inter_400Regular',
  textMedium: 'Inter_500Medium',
  textSemi: 'Inter_600SemiBold',
  textBold: 'Inter_700Bold',
};

export const temaLight = {
  modo: 'light' as const,
  // base
  bg:         light.bg,
  bgSoft:     light.bgSoft,
  bgCard:     light.bgCard,
  bgInput:    light.bgInput,
  card:       light.card,
  // texto
  texto:      light.texto,
  textoFraco: light.textoFraco,
  ink:        light.ink,
  weak:       light.weak,
  // bordas
  borda:      light.borda10,
  bordaForte: light.borda18,
  // ações
  acento:     light.acento,
  perigo:     light.perigo,
  sucesso:    light.sucesso,
  alerta:     light.alerta,
  // texto sobre fundos escuros (acento/ink/perigo) — no light o acento é #1A1916,
  // se reusarmos tema.texto aqui fica preto no preto. Sempre usar estes tokens
  // quando o background for tema.acento, tema.ink ou tema.perigo.
  acentoTexto: light.acentoTexto,
  inkTexto:    light.inkTexto,
  perigoTexto: light.perigoTexto,
  espacamento,
  raio:      14,
  fonte,
  fontFamily,
};

export const temaDark = {
  modo: 'dark' as const,
  bg:         dark.bg,
  bgSoft:     dark.bgSoft,
  bgCard:     dark.bgCard,
  bgInput:    dark.bgInput,
  card:       dark.card,
  texto:      dark.texto,
  textoFraco: dark.textoFraco,
  ink:        dark.ink,
  weak:       dark.weak,
  borda:      dark.borda10,
  bordaForte: dark.borda18,
  acento:     dark.acento,
  perigo:     dark.perigo,
  sucesso:    dark.sucesso,
  alerta:     dark.alerta,
  acentoTexto: dark.acentoTexto,
  inkTexto:    dark.inkTexto,
  perigoTexto: dark.perigoTexto,
  espacamento,
  raio:      14,
  fonte,
  fontFamily,
};

export type Tema = typeof temaLight;

// Default export: light. Quando o sistema dual for ligado em Configurações,
// componentes novos vão usar `useTema()`. Componentes antigos continuam usando
// este import direto = light.
export const tema: Tema = temaLight;
