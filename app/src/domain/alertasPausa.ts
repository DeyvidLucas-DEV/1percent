/**
 * Mensagens mostradas ao tentar pausar uma área opcional.
 * Baseadas em estudos longitudinais (Harvard Adult Development) e princípios
 * bíblicos referenciados em Provérbios e Eclesiastes.
 */
export const ALERTAS_PAUSA: Record<string, string> = {
  ministerio:
    'Pausar Ministério por 6 meses pode parecer alívio, mas Eclesiastes 11:6 lembra: "Plante de manhã e à tarde não recolha a sua mão". Quem deixa de servir, esfria. Quer mesmo pausar?',
  amizades:
    'Estudos longitudinais de Harvard sobre desenvolvimento adulto mostram que qualidade de relacionamentos prevê saúde e longevidade mais que dieta ou exercício. Pausar amizades por 6 meses isola — e isolamento é fator de risco. Quer mesmo pausar?',
  crescimento:
    'Quem para de aprender, para de crescer. "O homem sábio ouve mais e aumenta o saber" (Pv 1:5). Em 6 meses sem leitura/estudo, sua tomada de decisão fica refém apenas da experiência atual. Quer mesmo pausar?',
  sabedoria:
    '"Onde não há conselho fracassam os projetos, mas com a multidão de conselheiros se firmam" (Pv 15:22). Pausar Sabedoria te deixa decidindo sozinho — e ângulos cegos viram problemas reais. Quer mesmo pausar?',
};

export function alertaPausa(slug: string): string {
  return ALERTAS_PAUSA[slug] ?? 'Tem certeza que quer pausar essa área?';
}
