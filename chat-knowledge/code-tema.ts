// Sistema de tema dual. `tema` = light por padrão.
// Pra dark, importe `temaDark` ou use o hook `useTema()` (futuro).

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
  bg:        '#E8E2D2',
  bgSoft:    '#EEE8D8',
  bgCard:    '#F5F1E5',
  bgInput:   '#EEE8D8',
  card:      '#F5F1E5',
  // texto
  texto:     '#1A1916',
  textoFraco:'#6F6A5E',
  ink:       '#1A1916',
  weak:      '#6F6A5E',
  // bordas
  borda:     'rgba(26,25,22,0.10)',
  bordaForte:'rgba(26,25,22,0.18)',
  // ações
  acento:    '#1A1916',
  perigo:    '#8C2E22',
  sucesso:   '#3F5F3F',
  alerta:    '#8A6B1F',
  espacamento,
  raio:      14,
  fonte,
  fontFamily,
};

export const temaDark = {
  modo: 'dark' as const,
  bg:        '#0E0F12',
  bgSoft:    '#15171C',
  bgCard:    '#1A1C21',
  bgInput:   '#23262E',
  card:      '#1A1C21',
  texto:     '#ECECEC',
  textoFraco:'#9095A0',
  ink:       '#ECECEC',
  weak:      '#9095A0',
  borda:     '#2C2F38',
  bordaForte:'#3A3D48',
  acento:    '#1F6FB2',
  perigo:    '#C0392B',
  sucesso:   '#2E8B57',
  alerta:    '#E1A93B',
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
