import { getDb } from '../db/schema';
import { listarAreas } from '../db/queries/areas';
import { listarTarefasAtivas } from '../db/queries/tarefas';
import { execucoesEntre } from '../db/queries/execucoes';
import { getUser } from '../db/queries/users';
import { percentualArea, percentualGeral } from './percentual';
import { hojeIso, ultimosNDias } from '../lib/datas';
import { streakAtual, diasPuladosConsecutivos } from './streak';
import { classificarIntensidade, type Intensidade } from './intensidade';
import { scoreMediocridade, faixaMediocridade, type FaixaMediocridade } from './mediocridade';
import type { Area, Tarefa, Execucao } from '../db/types';

export type ResumoArea = {
  area: Area;
  percentualHoje: number;
  percentual7d: number;
  tarefas: Tarefa[];
};

export type DashboardData = {
  porArea: ResumoArea[];
  percentualHoje: number;
  percentualGeral: number;
  streak: number;
  diasPulados: number;
  execucoesHoje: number;
  intensidade: Intensidade;
  mediocridade: { score: number; faixa: FaixaMediocridade };
  percPorDia: { data: string; pct: number }[];
  mediaMes: number;
};

export async function carregarDashboard(): Promise<DashboardData> {
  const hoje = hojeIso();
  const dias7 = ultimosNDias(7);
  const dias28 = ultimosNDias(28);

  const areas = await listarAreas(false);
  const tarefas = await listarTarefasAtivas();
  const user = await getUser();
  const onboardedDia = user?.onboarded_at ? user.onboarded_at.slice(0, 10) : undefined;

  const exec7 = await execucoesEntre(dias7[0], hoje);
  const exec28 = await execucoesEntre(dias28[0], hoje);
  const execHoje = exec7.filter(e => e.data === hoje);

  // Janela de 7d se adapta ao tempo desde o onboarding — usuário com 1 dia de uso
  // não pode ser penalizado pelos 6 dias anteriores que ele nem tinha o app.
  const dias7Validos = onboardedDia
    ? Math.min(7, dias7.filter(d => d >= onboardedDia).length)
    : 7;
  const exec7Validas = onboardedDia ? exec7.filter(e => e.data >= onboardedDia) : exec7;

  const porArea: ResumoArea[] = areas.map(area => {
    const tarefasArea = tarefas.filter(t => t.area_id === area.id);
    const execHojeArea = execHoje.filter(e =>
      tarefasArea.some(t => t.id === e.tarefa_id)
    );
    const exec7Area = exec7Validas.filter(e =>
      tarefasArea.some(t => t.id === e.tarefa_id)
    );
    return {
      area,
      tarefas: tarefasArea,
      percentualHoje: percentualArea(tarefasArea, execHojeArea, 1),
      percentual7d: percentualArea(tarefasArea, exec7Area, Math.max(1, dias7Validos)),
    };
  });

  const percHoje = percentualGeral(
    porArea.map(p => ({
      areaId: p.area.id,
      pesoGlobal: p.area.peso_global,
      percentual: p.percentualHoje,
    }))
  );

  const percGeral = percentualGeral(
    porArea.map(p => ({
      areaId: p.area.id,
      pesoGlobal: p.area.peso_global,
      percentual: p.percentual7d,
    }))
  );

  // mapa data → % do dia (pra streak)
  const percPorDia = new Map<string, number>();
  for (const dia of dias28) {
    const execDia = exec28.filter(e => e.data === dia);
    const p = percentualGeral(
      areas.map(a => {
        const tArea = tarefas.filter(t => t.area_id === a.id);
        const eArea = execDia.filter(e => tArea.some(t => t.id === e.tarefa_id));
        return {
          areaId: a.id,
          pesoGlobal: a.peso_global,
          percentual: percentualArea(tArea, eArea, 1),
        };
      })
    );
    percPorDia.set(dia, p);
  }

  const streak = streakAtual(percPorDia);
  const diasPulados = diasPuladosConsecutivos(percPorDia, onboardedDia);

  // % semanais pra mediocridade
  const percSemanais: number[] = [];
  for (let semana = 0; semana < 4; semana++) {
    const fimIdx = dias28.length - 1 - semana * 7;
    const inicioIdx = Math.max(0, fimIdx - 6);
    if (fimIdx < 0) break;
    const periodo = dias28.slice(inicioIdx, fimIdx + 1);
    const execSemana = exec28.filter(e => periodo.includes(e.data));
    const p = percentualGeral(
      areas.map(a => {
        const tArea = tarefas.filter(t => t.area_id === a.id);
        const eArea = execSemana.filter(e => tArea.some(t => t.id === e.tarefa_id));
        return {
          areaId: a.id,
          pesoGlobal: a.peso_global,
          percentual: percentualArea(tArea, eArea, periodo.length),
        };
      })
    );
    percSemanais.push(p);
  }

  const score = scoreMediocridade(exec28, percSemanais);
  const intensidade = classificarIntensidade(tarefas, exec28);

  // Só inclui dias desde o onboarding — antes disso o usuário não tinha dado, mostrar 0%
  // distorce a média e enche o calendário/gráfico de marrom enganoso.
  const dias28Visiveis = onboardedDia ? dias28.filter(d => d >= onboardedDia) : dias28;
  const percPorDiaArr = dias28Visiveis.map(d => ({ data: d, pct: percPorDia.get(d) ?? 0 }));
  const mediaMes = percPorDiaArr.length
    ? Math.round(percPorDiaArr.reduce((s, x) => s + x.pct, 0) / percPorDiaArr.length)
    : 0;

  return {
    porArea,
    percentualHoje: percHoje,
    percentualGeral: percGeral,
    streak,
    diasPulados,
    execucoesHoje: execHoje.length,
    intensidade,
    mediocridade: { score, faixa: faixaMediocridade(score) },
    percPorDia: percPorDiaArr,
    mediaMes,
  };
}
