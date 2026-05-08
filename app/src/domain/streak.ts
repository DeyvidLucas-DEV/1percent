import { hojeIso, ultimosNDias } from '../lib/datas';

const LIMIAR_DIA_VALIDO = 50;

export function streakAtual(percentualPorDia: Map<string, number>): number {
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    const p = percentualPorDia.get(iso);
    if (p === undefined || p < LIMIAR_DIA_VALIDO) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
    if (streak > 3650) break; // safety
  }
  return streak;
}

export function diasPuladosConsecutivos(
  percentualPorDia: Map<string, number>,
  inicioIso?: string
): number {
  // conta dias consecutivos com p<50, terminando em ontem.
  // não conta dias antes de `inicioIso` (data do onboarding) — usuário novo começa em 0.
  let pulados = 0;
  let cursor = new Date();
  cursor.setDate(cursor.getDate() - 1); // começa em ontem
  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (inicioIso && iso < inicioIso) break;
    const p = percentualPorDia.get(iso);
    if (p === undefined || p < LIMIAR_DIA_VALIDO) {
      pulados++;
    } else {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
    if (pulados > 30) break;
  }
  return pulados;
}

const MILESTONES = [3, 7, 14, 30, 60, 100, 365];

export function ehMilestone(streak: number): boolean {
  return MILESTONES.includes(streak);
}

export function proximoMilestone(streak: number): number | null {
  return MILESTONES.find(m => m > streak) ?? null;
}
