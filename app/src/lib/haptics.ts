import * as Haptics from 'expo-haptics';
import type { StatusExecucao } from '../db/types';

// Tom: cada status tem peso tátil diferente. Concluir é commit (médio).
// Parcial é meio-termo (leve). Não-feito é honesto, não punitivo (warning sutil).
// Limpar é só seleção.
export function feedbackStatus(proximo: StatusExecucao | null): void {
  if (proximo === 'concluido') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    return;
  }
  if (proximo === 'parcial') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    return;
  }
  if (proximo === 'nao_feito') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    return;
  }
  Haptics.selectionAsync();
}

export function feedbackToque(): void {
  Haptics.selectionAsync();
}
