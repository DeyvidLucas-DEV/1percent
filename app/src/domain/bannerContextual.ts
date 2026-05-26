// Banner contextual da Home. Escolhe 1 modo entre vários com base em estado +
// hora. Cada modo tem texto curto e tom próprio.

import { perguntaDoDia } from './reflexoes';
import { hojeIso } from '../lib/datas';
import type { DashboardData } from './agregados';
import type { TarefaComExecucao } from '../db/queries/tarefas';

export type ModoBanner = 'cobranca' | 'atraso' | 'acolhimento' | 'reflexao';
export type TomBanner = 'cobranca' | 'acolhimento' | 'neutro';

export type Banner = {
  modo: ModoBanner;
  tag: string;       // chip pequeno no topo (ex: "COBRANÇA", "REFLEXÃO")
  texto: string;     // 1-2 frases
  tom: TomBanner;
};

type Contexto = {
  dashboard: DashboardData;
  tarefas: TarefaComExecucao[];
  hora: number; // 0-23
  // TODO: quando sync de mood do backend rolar, adicionar:
  // sinalAlertaRecente: boolean;
};

export function calcularBanner(ctx: Contexto): Banner {
  // 1. Acolhimento — TODO: depende de sync de user_daily_readings do backend
  // pro app. Por enquanto desligado. Quando ligar, vai antes da cobrança:
  // if (ctx.sinalAlertaRecente) return acolhimento();

  // 2. Cobrança — mediocridade alta domina
  if (ctx.dashboard.mediocridade.faixa === 'cobranca_forte') {
    return {
      modo: 'cobranca',
      tag: 'COBRANÇA',
      texto: 'Padrão de não-fazer consolidado. Quebra agora — uma tarefa.',
      tom: 'cobranca',
    };
  }
  if (ctx.dashboard.mediocridade.faixa === 'cobranca') {
    return {
      modo: 'cobranca',
      tag: 'COBRANÇA',
      texto: 'Você marca parcial demais. Decide ou para — meio termo não vira hábito.',
      tom: 'cobranca',
    };
  }
  if (ctx.dashboard.mediocridade.faixa === 'alerta') {
    return {
      modo: 'cobranca',
      tag: 'ALERTA',
      texto: 'Algumas tarefas ficando pela metade. O que ficou inacabado hoje?',
      tom: 'cobranca',
    };
  }

  // 3. Atraso — depois das 21h se ainda tem tarefas vazias
  const vazias = ctx.tarefas.filter((t) => t.status === 'open');
  if (ctx.hora >= 21 && vazias.length >= 3) {
    return {
      modo: 'atraso',
      tag: 'ATRASO',
      texto: `${ctx.hora}h e ${vazias.length} ${vazias.length === 1 ? 'tarefa' : 'tarefas'} sem marcar. Tempo curto.`,
      tom: 'cobranca',
    };
  }

  // 4. Reflexão — fallback, pergunta rotativa do dia
  const pergunta = perguntaDoDia(hojeIso());
  return {
    modo: 'reflexao',
    tag: 'REFLEXÃO',
    texto: pergunta,
    tom: 'neutro',
  };
}
