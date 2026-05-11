// Defesa em profundidade: prompt diz pra IA não usar essas palavras, mas
// gpt-4o-mini reincide. Filtramos no servidor antes de devolver pro app.
// Recomendações que violam são logadas e descartadas — o app recebe só o
// que passou. Resultado pode vir com menos recs do que a IA propôs; ok.

// Palavras "raiz" em minúsculas, sem acento. O matcher faz normalização.
// Granularidade de palavra: usa \b pra evitar falso positivo em palavras
// maiores (ex: 'considere' vira raiz e bate; 'consideração' não bate).
const BANLIST_RAIZES = [
  'defina',
  'definir',
  'estabeleca',
  'estabelecer',
  'reserve',
  'reservar',
  'comprometa-se',
  'tente',
  'considere',
  'planeje',
  'procure',
  'busque',
  'talvez',
];

// Expressões compostas — match exato como substring (case/acento
// insensitive).
const BANLIST_FRASES = [
  'pense em',
  'que tal',
  'atividades juntos',
  'tempo de qualidade',
  'momento especial',
  'momento a sos',
  'momento juntos',
  'qualidade do tempo',
  'qualidade de vida',
  'horarios especificos',
];

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function escaparRegex(s: string): string {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// Retorna a primeira palavra/frase da banlist encontrada no texto, ou null
// se passou limpo. Quem chama loga + descarta.
export function violaBanlist(texto: string): string | null {
  const norm = normalizar(texto);
  for (const raiz of BANLIST_RAIZES) {
    const re = new RegExp(`\\b${escaparRegex(raiz)}\\b`);
    if (re.test(norm)) return raiz;
  }
  for (const frase of BANLIST_FRASES) {
    if (norm.includes(frase)) return frase;
  }
  return null;
}
