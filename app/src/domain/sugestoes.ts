import type { Frequencia, Tarefa } from '../db/types';

// Função pura conforme §7.2 da spec — validação de sugestão da IA.
// Não depende de SQLite, React ou provider de IA.

export type SugestaoTarefaIA = {
  areaSlug: string;
  nome: string;
  frequencia: Frequencia;
  alvoCount: number;
  pesoSugerido: 1 | 2 | 3;
  // OpenAI strict mode exige campos não-omitíveis. IA manda null quando não
  // houver janela viável. Aceitamos undefined também por compatibilidade.
  horarioSugerido?: string | null;
  justificativa: string;
};

export type ResultadoValidacaoSugestao =
  | {
      valida: true;
      tarefaNormalizada: {
        areaId: number;
        nome: string;
        frequencia: Frequencia;
        alvoCount: number;
        peso: 1 | 2 | 3;
        horario: string | null;
      };
    }
  | { valida: false; motivoRecusa: string };

const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

// Nomes vazios ou genéricos demais — exigem ação concreta.
const BLACKLIST_NOME = [
  /^ser\s/i,
  /^melhorar\s/i,
  /^ter\s+mais\s/i,
  /^cuidar\s+(d[ao]s?|de)/i,
  /^dar\s+atenção/i,
  /^focar(\s+mais)?$/i,
  /^prestar\s+atenção$/i,
];

function normalizarNome(nome: string): string {
  return nome.trim().replace(/\s+/g, ' ');
}

function nomeGenerico(nome: string): boolean {
  return BLACKLIST_NOME.some((re) => re.test(nome));
}

function similaridade(a: string, b: string): number {
  const norm = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '');
  const tokensA = new Set(norm(a).split(' ').filter(Boolean));
  const tokensB = new Set(norm(b).split(' ').filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let inter = 0;
  for (const t of tokensA) if (tokensB.has(t)) inter++;
  return inter / Math.min(tokensA.size, tokensB.size);
}

export function validarSugestaoTarefaIA(
  sugestao: SugestaoTarefaIA,
  ctx: {
    areasDisponiveis: { id: number; slug: string }[];
    tarefasExistentes: Tarefa[];
  }
): ResultadoValidacaoSugestao {
  const nome = normalizarNome(sugestao.nome);
  if (nome.length < 3) return { valida: false, motivoRecusa: 'nome muito curto' };
  if (nome.length > 120) return { valida: false, motivoRecusa: 'nome muito longo' };
  if (nomeGenerico(nome)) {
    return { valida: false, motivoRecusa: 'nome genérico — pede ação concreta' };
  }

  const area = ctx.areasDisponiveis.find((a) => a.slug === sugestao.areaSlug);
  if (!area) return { valida: false, motivoRecusa: `área "${sugestao.areaSlug}" não existe` };

  if (![1, 2, 3].includes(sugestao.pesoSugerido)) {
    return { valida: false, motivoRecusa: 'peso fora de 1..3' };
  }

  if (!Number.isInteger(sugestao.alvoCount) || sugestao.alvoCount < 1) {
    return { valida: false, motivoRecusa: 'alvoCount inválido' };
  }
  if (sugestao.frequencia === 'diaria' && sugestao.alvoCount !== 1) {
    return { valida: false, motivoRecusa: 'tarefa diária deve ter alvoCount=1' };
  }
  if (sugestao.frequencia === 'semanal' && sugestao.alvoCount > 7) {
    return { valida: false, motivoRecusa: 'semanal acima de 7' };
  }
  if (sugestao.frequencia === 'mensal' && sugestao.alvoCount > 30) {
    return { valida: false, motivoRecusa: 'mensal acima de 30' };
  }

  if (sugestao.horarioSugerido != null && !RE_HORA.test(sugestao.horarioSugerido)) {
    return { valida: false, motivoRecusa: 'horário não está em HH:MM' };
  }

  // Dedup com tarefas ativas existentes da mesma área.
  const tarefasMesmaArea = ctx.tarefasExistentes.filter(
    (t) => t.area_id === area.id && t.ativa === 1
  );
  const duplicada = tarefasMesmaArea.find((t) => similaridade(t.nome, nome) >= 0.8);
  if (duplicada) {
    return { valida: false, motivoRecusa: `parecida demais com "${duplicada.nome}"` };
  }

  return {
    valida: true,
    tarefaNormalizada: {
      areaId: area.id,
      nome,
      frequencia: sugestao.frequencia,
      alvoCount: sugestao.alvoCount,
      peso: sugestao.pesoSugerido,
      horario: sugestao.horarioSugerido ?? null,
    },
  };
}
