import { format, subDays, parseISO, differenceInCalendarDays } from 'date-fns';

export function hojeIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function agoraIso(): string {
  return new Date().toISOString();
}

export function diaIso(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function ultimosNDias(n: number, ate: string = hojeIso()): string[] {
  const fim = parseISO(ate);
  const dias: string[] = [];
  for (let i = 0; i < n; i++) {
    dias.push(diaIso(subDays(fim, i)));
  }
  return dias.reverse();
}

export function diasEntre(de: string, ate: string): number {
  return differenceInCalendarDays(parseISO(ate), parseISO(de));
}
