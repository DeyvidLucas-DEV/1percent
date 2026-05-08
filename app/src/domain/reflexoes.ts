const POOL = [
  'O que ficou pela metade hoje? Por quê?',
  'Qual área você ignorou hoje?',
  'Se amanhã você só pudesse fazer 3 coisas, quais seriam?',
  'O que te tirou do foco hoje?',
  'Qual hábito está te levando pro alvo? E qual está te afastando?',
  'Em que você foi 1% melhor hoje?',
  'Qual decisão de hoje seu eu de daqui 1 ano vai agradecer?',
];

export function perguntaDoDia(data: string): string {
  // data formato YYYY-MM-DD; usa o dia juliano simples como índice
  const t = new Date(data).getTime();
  const dia = Math.floor(t / 86_400_000);
  return POOL[Math.abs(dia) % POOL.length];
}
