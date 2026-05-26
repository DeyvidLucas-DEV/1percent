// Paleta única do app. TODO hex/rgba mora aqui.
// Pra mudar a aparência do app, edite só este arquivo.
//
// O app é LIGHT por padrão, com viés violeta/lavanda/rosa.
// Cores-âncora vindas do design:
//   #6367FF  violeta vibrante (acento principal / signature)
//   #8494FF  azul lavanda médio
//   #C9BEFF  lilás claro
//   #FFDBFD  rosa pálido
//
// Organização:
//  base        - neutros crus (preto, branco, etc.)
//  light/dark  - paletas dos temas (app rodando em light por padrão)
//  faixas      - 5 faixas de performance (src/domain/cores.ts)
//  areas       - 10 áreas (src/domain/areasPaleta.ts)
//  intensidade - 4 cores das intensidades de tarefa (src/domain/intensidade.ts)
//  acentos     - cores específicas de UI (banners de cobrança/reativação,
//                glow sobre fundos destacados, sombras, etc.)

// ─── Base ────────────────────────────────────────────────────────────
export const base = {
  preto:        '#000000',
  pretoQuase:   '#13133B',
  branco:       '#FFFFFF',
  cinzaMedio:   '#6B6B85',
  cinzaEscuro:  '#13133B',
} as const;

// ─── Tema light (principal) ──────────────────────────────────────────
export const light = {
  bg:          '#F8F7FC',
  bgSoft:      '#F0EEFC',
  bgCard:      '#FFFFFF',
  bgInput:     '#F4F2FC',
  card:        '#FFFFFF',

  texto:       '#13133B',
  textoFraco:  '#6B6B85',
  ink:         '#13133B',
  weak:        '#6B6B85',

  // Bordas em rgba do violeta signature (99,103,255) com opacidades crescentes.
  borda5:      'rgba(99,103,255,0.04)',
  borda6:      'rgba(99,103,255,0.06)',
  borda8:      'rgba(99,103,255,0.08)',
  borda10:     'rgba(99,103,255,0.10)',
  borda12:     'rgba(99,103,255,0.14)',
  borda18:     'rgba(99,103,255,0.20)',

  acento:      '#6367FF',
  perigo:      '#E94560',
  sucesso:     '#4ECCA3',
  alerta:      '#FFC04B',

  // Texto sobre fundos do acento/ink/perigo (violeta/marinho/vermelho — todos
  // suficientemente escuros pra usar branco).
  acentoTexto: '#FFFFFF',
  inkTexto:    '#FFFFFF',
  perigoTexto: '#FFFFFF',
} as const;

// ─── Tema dark explícito (mantido como alias) ────────────────────────
// Hoje é idêntico ao "light". Quando o sistema dual for ligado, dá pra divergir.
export const dark = { ...light } as const;

// ─── Faixas de performance ───────────────────────────────────────────
// 5 faixas Estagnação → Excelência. Progressão clara: apagado → quente →
// frio saturado → violeta signature.
export const faixas = {
  ink: {
    marrom:   '#9B96B0',   // estagnação — cinza-violeta apagado
    vermelho: '#E94560',   // reação — vermelho-rosa
    amarelo:  '#FFC04B',   // movimento — âmbar
    verde:    '#4ECCA3',   // construção — menta frio
    azul:     '#6367FF',   // excelência — violeta signature
  },
  soft: {
    // Versões pálidas pra fundos de card.
    marrom:   '#E2DFEA',
    vermelho: '#FCD5DD',
    amarelo:  '#FFE9C2',
    verde:    '#C7EFE0',
    azul:     '#E0E1FF',
  },
} as const;

// ─── Áreas ───────────────────────────────────────────────────────────
// 10 áreas com cores distinguíveis dentro de uma família fria (violeta,
// rosa, azul, verde) pra coerência visual com a paleta base.
export const areas = {
  espiritual:      { ink: '#6367FF', soft: '#E0E1FF' },   // violeta signature
  saude_fisica:    { ink: '#5BCFB0', soft: '#C6F0E5' },   // verde menta
  familia:         { ink: '#FF7AAB', soft: '#FFD7E8' },   // rosa
  trabalho:        { ink: '#4D6FE3', soft: '#CFD8F5' },   // cobalto
  saude_emocional: { ink: '#A47DFF', soft: '#DCCEFF' },   // lavanda
  financas:        { ink: '#42B883', soft: '#BFE8D4' },   // verde finance
  ministerio:      { ink: '#7B5DD9', soft: '#D5C7F0' },   // roxo profundo
  amizades:        { ink: '#FFA07A', soft: '#FFD9C5' },   // pêssego
  crescimento:     { ink: '#4DABF7', soft: '#C5E2F8' },   // azul céu
  sabedoria:       { ink: '#5B6378', soft: '#C8CCD7' },   // ardósia
} as const;

export const areaFallback = { ink: '#5B6378', soft: '#C8CCD7' } as const;

// ─── Intensidade ─────────────────────────────────────────────────────
export const intensidade = {
  leve:          '#4ECCA3',   // menta frio
  moderada:      '#FFC04B',   // âmbar
  intensa:       '#E94560',   // vermelho-rosa
  desorganizada: '#A47DFF',   // lavanda
} as const;

// ─── Acentos de UI ───────────────────────────────────────────────────
// Cores específicas que aparecem inline nos componentes/telas.
// Agrupadas semanticamente pra facilitar troca.
export const acentos = {
  // Banner de cobrança (CobrancaBanner — sobre dark canvas seria escuro;
  // sobre light canvas vira rosa pálido com texto vermelho escuro)
  cobrancaBg:        '#FFE0E6',
  cobrancaBgClaro:   '#FFE0E6',
  cobrancaTextoClaro:'#C42847',

  // Banner de reativação (sólido vermelho-rosa — urgência alta)
  reativacaoBg:      '#E94560',
  reativacaoTag:     '#FFFFFF',

  // Texto/ícone sobre fundos destacados (cards destaque, tab bar, day pills).
  // Agora ink = marinho ESCURO, então fundos do acento são ESCUROS e
  // texto sobre vira CLARO/branco translúcido.
  textoSobreInkAlto: 'rgba(255,255,255,0.95)',
  textoSobreInkMed:  'rgba(255,255,255,0.80)',
  textoSobreInkBaixo:'rgba(255,255,255,0.70)',
  glowSobreInk:      'rgba(255,255,255,0.14)',
  iconeInativoSobreInk: 'rgba(255,255,255,0.55)',
  textoFracoSobreInk:   'rgba(255,255,255,0.75)',
  glowSobreInkSoft:  'rgba(255,255,255,0.18)',

  // Texto branco sobre vermelho de reativação
  textoSobreReativacao: 'rgba(255,255,255,0.88)',

  // Glow sutil sobre fundos pálidos (HabitCard dot wrap sobre soft)
  glowSobreSoft:     'rgba(255,255,255,0.60)',

  // Anel de fundo (MiniSemiRing) — translúcido escuro pra criar "buraco"
  ringFundoPreto:    'rgba(19,19,59,0.08)',

  // Sombra preta padrão
  sombra:            base.preto,

  // Dot separador (cinza-violeta)
  dotSeparador:      base.cinzaMedio,
} as const;
