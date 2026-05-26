// Integração com Apple Calendar via expo-calendar (EventKit no iOS).
// Lê calendários existentes e cria/edita/deleta eventos no calendário escolhido.
//
// IMPORTANTE: expo-calendar é importado DINAMICAMENTE pra não crashar o app
// se o módulo nativo não estiver disponível.

import { Platform } from 'react-native';

export type CalendarioInfo = {
  id: string;
  titulo: string;
  fonte: string;
  permiteModificar: boolean;
  cor: string;
};

async function getCalendarModule() {
  try {
    return await import('expo-calendar');
  } catch {
    return null;
  }
}

export async function pedirPermissao(): Promise<boolean> {
  const Cal = await getCalendarModule();
  if (!Cal) return false;
  const r = await Cal.requestCalendarPermissionsAsync();
  return r.status === 'granted';
}

export async function listarCalendariosEscritaveis(): Promise<CalendarioInfo[]> {
  if (Platform.OS !== 'ios') return [];
  const Cal = await getCalendarModule();
  if (!Cal) return [];
  const todos = await Cal.getCalendarsAsync(Cal.EntityTypes.EVENT);
  return todos
    .filter((c) => c.allowsModifications)
    .map((c) => ({
      id: c.id,
      titulo: c.title,
      fonte: c.source?.name ?? 'Local',
      permiteModificar: c.allowsModifications,
      cor: c.color ?? '#6367FF',
    }));
}

export async function escolherCalendarioDefault(): Promise<CalendarioInfo | null> {
  const lista = await listarCalendariosEscritaveis();
  if (lista.length === 0) return null;
  const iCloud = lista.find((c) => c.fonte.toLowerCase().includes('icloud'));
  if (iCloud) return iCloud;
  return lista[0]!;
}

export async function criarEvento(
  calendarId: string,
  titulo: string,
  data: string,
  horario: string,
  duracaoMinutos = 30
): Promise<string | null> {
  try {
    const Cal = await getCalendarModule();
    if (!Cal) return null;
    const [hh, mm] = horario.split(':').map(Number);
    const inicio = new Date(`${data}T00:00:00`);
    inicio.setHours(hh ?? 0, mm ?? 0, 0, 0);
    const fim = new Date(inicio.getTime() + duracaoMinutos * 60 * 1000);
    const id = await Cal.createEventAsync(calendarId, {
      title: titulo,
      startDate: inicio,
      endDate: fim,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notes: 'Criado pelo 1%',
    });
    return id;
  } catch {
    return null;
  }
}

export async function atualizarEvento(
  eventId: string,
  titulo: string,
  data: string,
  horario: string,
  duracaoMinutos = 30
): Promise<boolean> {
  try {
    const Cal = await getCalendarModule();
    if (!Cal) return false;
    const [hh, mm] = horario.split(':').map(Number);
    const inicio = new Date(`${data}T00:00:00`);
    inicio.setHours(hh ?? 0, mm ?? 0, 0, 0);
    const fim = new Date(inicio.getTime() + duracaoMinutos * 60 * 1000);
    await Cal.updateEventAsync(eventId, {
      title: titulo,
      startDate: inicio,
      endDate: fim,
    });
    return true;
  } catch {
    return false;
  }
}

export async function apagarEvento(eventId: string): Promise<boolean> {
  try {
    const Cal = await getCalendarModule();
    if (!Cal) return false;
    await Cal.deleteEventAsync(eventId);
    return true;
  } catch {
    return false;
  }
}
