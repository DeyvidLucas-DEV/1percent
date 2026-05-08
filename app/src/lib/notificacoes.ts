import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function pedirPermissao(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const r = await Notifications.requestPermissionsAsync();
  return r.granted;
}

export async function agendarLembretesDiarios(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Manhã 07:00 — abertura do dia
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '1% — bom dia',
      body: 'Pequenas ações hoje. Veja seu checklist.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 7,
      minute: 0,
      repeats: true,
    } as any,
  });

  // Noite 21:30 — fechamento + reflexão
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Fim do dia',
      body: 'Marque o que fez. Responda a reflexão. 2 minutos.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 21,
      minute: 30,
      repeats: true,
    } as any,
  });
}

export type TarefaParaNotificar = {
  id: number;
  nome: string;
  horario: string; // "HH:MM"
  areaNome: string;
};

/**
 * Agenda 1 notificação diária por tarefa com horário definido.
 * Cancela TUDO antes (lembretes diários + tarefas) e reagenda do zero —
 * fluxo idempotente, sem precisar guardar mapping.
 */
export async function reagendarNotificacoesDeTarefas(tarefas: TarefaParaNotificar[]): Promise<void> {
  // Manda cancelar tudo e reagendar lembretes fixos
  await agendarLembretesDiarios();

  for (const t of tarefas) {
    const [h, m] = t.horario.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t.nome,
        body: `${t.areaNome} — agora`,
        data: { tarefaId: t.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: h,
        minute: m,
        repeats: true,
      } as any,
    });
  }
}

export async function notificarPosPulo(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ontem você pulou.',
      body: 'Hoje não pode pular. 1 tarefa de cada área obrigatória — só isso.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60,
      repeats: false,
    } as any,
  });
}
