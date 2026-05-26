// Análise semanal determinística. Sem IA — regras simples + templates.
// Regenera quando passou 3+ dias desde a última geração. Cache em SQLite.

import { getDb } from '../db/schema';
import { listarAreas } from '../db/queries/areas';
import { listarTarefasAtivas } from '../db/queries/tarefas';
import { execucoesEntre } from '../db/queries/execucoes';
import { percentualArea, percentualGeral } from './percentual';
import { agoraIso, hojeIso, ultimosNDias, diasEntre } from '../lib/datas';
import type { Area, Tarefa, Execucao } from '../db/types';

export type DestaqueAnalise =
  | 'queda'         // área caiu vs janela anterior
  | 'sequencia'     // sequência consistente
  | 'desequilibrio' // 1 área puxando muito o resto pra baixo
  | 'consistente'   // tudo estável (boa OU ruim)
  | null;

export type AnaliseSemanal = {
  geradaEm: string;     // ISO datetime
  destaque: DestaqueAnalise;
  observacoes: string[]; // 1 a 2 frases curtas
};

const DIAS_VALIDADE = 3;

export async function obterAnalise(): Promise<AnaliseSemanal> {
  const cache = await carregarCache();
  if (cache && diasEntre(cache.geradaEm.slice(0, 10), hojeIso()) < DIAS_VALIDADE) {
    return cache;
  }
  const nova = await gerarAnalise();
  await salvarCache(nova);
  return nova;
}

async function carregarCache(): Promise<AnaliseSemanal | null> {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{
      gerada_em: string;
      destaque: DestaqueAnalise | null;
      observacoes_json: string;
    }>(`SELECT gerada_em, destaque, observacoes_json FROM analise_semanal_cache WHERE id = 1`);
    if (!row) return null;
    return {
      geradaEm: row.gerada_em,
      destaque: row.destaque,
      observacoes: JSON.parse(row.observacoes_json),
    };
  } catch {
    return null;
  }
}

async function salvarCache(a: AnaliseSemanal): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO analise_semanal_cache (id, gerada_em, destaque, observacoes_json)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       gerada_em = excluded.gerada_em,
       destaque = excluded.destaque,
       observacoes_json = excluded.observacoes_json`,
    [a.geradaEm, a.destaque, JSON.stringify(a.observacoes)]
  );
}

// ─── Geração ────────────────────────────────────────────────────────

async function gerarAnalise(): Promise<AnaliseSemanal> {
  const hoje = hojeIso();
  const dias7 = ultimosNDias(7);
  const dias14 = ultimosNDias(14);
  const dias7Anterior = dias14.slice(0, 7); // 14 dias atrás até 8 dias atrás

  const areas = await listarAreas(false);
  const tarefas = await listarTarefasAtivas();
  const exec14 = await execucoesEntre(dias14[0]!, hoje);

  const exec7 = exec14.filter((e) => dias7.includes(e.data));
  const exec7Ant = exec14.filter((e) => dias7Anterior.includes(e.data));

  // Caso vazio: sem dado suficiente
  if (tarefas.length === 0 || areas.length === 0) {
    return {
      geradaEm: agoraIso(),
      destaque: null,
      observacoes: ['Sem dado suficiente. Marca tarefas por uns dias e volta.'],
    };
  }

  const observacoes: string[] = [];
  let destaque: DestaqueAnalise = null;

  // ─── Análise 1: queda por área (7d vs 7d anteriores) ───
  const pctPorArea7d = pctAreas(areas, tarefas, exec7, 7);
  const pctPorArea7dAnt = pctAreas(areas, tarefas, exec7Ant, 7);

  let maiorQueda: { area: Area; queda: number } | null = null;
  for (const a of areas) {
    const at = pctPorArea7d.get(a.id) ?? 0;
    const ant = pctPorArea7dAnt.get(a.id) ?? 0;
    const queda = ant - at;
    if (queda >= 25 && (!maiorQueda || queda > maiorQueda.queda)) {
      maiorQueda = { area: a, queda };
    }
  }
  if (maiorQueda) {
    observacoes.push(
      `${maiorQueda.area.nome} caiu ${Math.round(maiorQueda.queda)} pontos em 7 dias.`
    );
    destaque = 'queda';
  }

  // ─── Análise 2: desequilíbrio (1 área no chão, resto no verde) ───
  const noChao = Array.from(pctPorArea7d.entries()).filter(([_, p]) => p < 30);
  const noVerde = Array.from(pctPorArea7d.entries()).filter(([_, p]) => p >= 60);
  if (noChao.length === 1 && noVerde.length >= 3 && !maiorQueda) {
    const idArea = noChao[0]![0];
    const area = areas.find((a) => a.id === idArea);
    if (area) {
      observacoes.push(
        `${noVerde.length} áreas no verde mas ${area.nome} ficou em ${Math.round(noChao[0]![1])}%. Desequilíbrio.`
      );
      destaque = 'desequilibrio';
    }
  }

  // ─── Análise 3: sequência consistente ───
  // Conta quantos dos últimos 7 dias tiveram pelo menos 50%
  const pctPorDia7d = new Map<string, number>();
  for (const dia of dias7) {
    const execDia = exec7.filter((e) => e.data === dia);
    const p = percentualGeral(
      areas.map((a) => {
        const tArea = tarefas.filter((t) => t.area_id === a.id);
        const eArea = execDia.filter((e) => tArea.some((t) => t.id === e.tarefa_id));
        return {
          areaId: a.id,
          pesoGlobal: a.peso_global,
          percentual: percentualArea(tArea, eArea, 1),
        };
      })
    );
    pctPorDia7d.set(dia, p);
  }
  const diasNoVerde = Array.from(pctPorDia7d.values()).filter((p) => p >= 50).length;

  if (diasNoVerde >= 5 && observacoes.length === 0) {
    observacoes.push(`${diasNoVerde} dos últimos 7 dias acima de 50%. Sustenta.`);
    destaque = 'sequencia';
  }

  // ─── Análise 4: parcial demais (sintoma de fingimento) ───
  const totalExec = exec7.length;
  const parciais = exec7.filter((e) => e.status === 'parcial').length;
  if (totalExec >= 10 && parciais / totalExec > 0.4) {
    observacoes.push(
      `${Math.round((parciais / totalExec) * 100)}% das marcações foram parciais. Decide ou para.`
    );
    if (!destaque) destaque = 'desequilibrio';
  }

  // ─── Fallback: tudo morno, mas tem dado ───
  if (observacoes.length === 0) {
    const mediaPct = Math.round(
      Array.from(pctPorDia7d.values()).reduce((s, p) => s + p, 0) / 7
    );
    if (mediaPct >= 50) {
      observacoes.push(`Média de ${mediaPct}% nos últimos 7 dias. Estável.`);
      destaque = 'consistente';
    } else {
      observacoes.push(
        `Semana fraca. Média de ${mediaPct}%. Foca em 1 área pra recuperar.`
      );
      destaque = 'consistente';
    }
  }

  return {
    geradaEm: agoraIso(),
    destaque,
    observacoes: observacoes.slice(0, 2),
  };
}

// Helper: percentual médio por área no período
function pctAreas(
  areas: Area[],
  tarefas: Tarefa[],
  exec: Execucao[],
  numDias: number
): Map<number, number> {
  const m = new Map<number, number>();
  for (const a of areas) {
    const tArea = tarefas.filter((t) => t.area_id === a.id);
    const eArea = exec.filter((e) => tArea.some((t) => t.id === e.tarefa_id));
    m.set(a.id, percentualArea(tArea, eArea, numDias));
  }
  return m;
}
